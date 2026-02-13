import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { Logger } from '@/lib/logger';
import { TranscriptSpeaker } from '@/types/backend';

type WebSocketMessage =
    | { type: 'state_update'; state: DialogueState }
    | { type: 'transcript'; text: string; is_final: boolean; role: 'STUDENT' | 'ASSISTANT' | 'SYSTEM'; timestamp: string }
    | { type: 'audio_chunk'; data: string } // base64
    | { type: 'ping' }
    | { type: 'pong' }
    | { type: 'heartbeat'; timestamp: string }
    | { type: 'agent_speaking'; status: boolean }
    | { type: 'integrity_snapshot'; data: any }
    | { type: 'integrity_alert'; reason: string; severity: string; violation_type: string; remaining_seconds: number }
    | { type: 'session_start' }
    | { type: 'session_leave' }
    | { type: 'session_metadata'; expiry_time: string | null; settings: Record<string, any> }
    | { type: 'interrupt' }
    | { type: 'error'; code: string; message: string };

const WS_CODES = {
    NORMAL: 1000,
    ABNORMAL: 1006,
    POLICY_VIOLATION: 1008,
    INVALID_SESSION: 4001,
    SESSION_ENDED: 4002,
    ROLE_FORBIDDEN: 4003,
};

const ERROR_CODES = {
    VOICE_UNAVAILABLE: 'VOICE_UNAVAILABLE',
};

class VivaWebSocketClient {
    private ws: WebSocket | null = null;
    private url: string | null = null;
    private token: string | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10; // Increased for queueing scenarios
    private pingInterval: NodeJS.Timeout | null = null;
    private explicitClose = false;
    private isConnecting = false;
    private messageQueue: (string | ArrayBuffer)[] = [];
    private connectionTimeout: NodeJS.Timeout | null = null;

    connect(url: string, token: string) {
        if (
            (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) &&
            this.url === url &&
            this.token === token
        ) {
            Logger.log("VivaWS: Ignoring duplicate connect call");
            return;
        }

        if (this.ws || this.isConnecting) {
            this.disconnect(false);
        }

        this.url = url;
        this.token = token;
        this.messageQueue = [];

        if (!this.url || !this.token) {
            Logger.error("VivaWS: Missing URL or Token");
            useSessionStore.getState().setError("Configuration Error");
            return;
        }

        this.explicitClose = false;
        this.isConnecting = true;
        useSessionStore.getState().setConnectionState('CONNECTING');

        try {
            Logger.log("VivaWS: Initiating Secure Connection...");

            // Auth via httpOnly cookie (access_token) — sent automatically with WS handshake.
            // No longer exposing JWT in the URL query string (security risk: visible in logs/proxies).
            this.ws = new WebSocket(this.url);

            this.setupListeners();

            // Safety timeout: If onopen doesn't fire in 30s, treat as failure
            // Safety timeout: Should be shorter for initial connection to fail fast
            const timeoutDuration = this.reconnectAttempts === 0 ? 10000 : 30000;

            this.connectionTimeout = setTimeout(() => {
                if (this.isConnecting) {
                    Logger.error(`VivaWS: Connection timed out after ${timeoutDuration}ms`);
                    this.isConnecting = false;
                    this.ws?.close();
                    this.handleReconnect(true); // Force reconnect
                }
            }, timeoutDuration);

        } catch (e) {
            Logger.error("VivaWS: Creation Failed", e);
            this.isConnecting = false;
            this.handleConnectionFailure();
        }

        // Cleanup on Lifecycle Events
        window.removeEventListener('beforeunload', this.lifecycleCleanup);
        window.addEventListener('beforeunload', this.lifecycleCleanup);
    }

    private lifecycleCleanup = () => {
        this.disconnect(true);
    };

    private setupListeners() {
        if (!this.ws) return;

        this.ws.onopen = () => {
            Logger.log('VivaWS: Connected');
            this.isConnecting = false;
            if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

            useSessionStore.getState().setConnectionState('CONNECTED');
            useSessionStore.getState().setError(null); // Clear errors
            this.reconnectAttempts = 0;
            this.startHeartbeat();

            this.send({ type: 'session_start' });
            this.flushQueue();
        };

        this.ws.onclose = (event) => {
            if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

            if (this.isConnecting) {
                this.isConnecting = false;
            }

            Logger.log(`VivaWS: Closed ${event.code} - ${event.reason}`);
            this.stopHeartbeat();
            this.ws = null;

            if (this.explicitClose) {
                useSessionStore.getState().setConnectionState('DISCONNECTED');
                return;
            }

            // Handle Admission/RateLimit Rejections (1008)
            // Backend sends "System busy" or "Rate limit" in reason
            if (event.code === WS_CODES.POLICY_VIOLATION) {
                const reason = event.reason.toLowerCase();
                if (reason.includes("busy") || reason.includes("rate limit") || reason.includes("capacity")) {
                    Logger.warn(`VivaWS: Admission/Rate Limit (${event.reason}). Queuing retry...`);
                    useSessionStore.getState().setError(`Server busy: ${event.reason}. Retrying...`);
                    // We treat this as a non-terminal error and retry
                    this.handleReconnect(false);
                    return;
                } else {
                    // All other policy violations (e.g. Tenant Mismatch, IP Ban) are terminal
                    Logger.error(`VivaWS: Policy Violation (${event.reason}). Terminating.`);
                    useSessionStore.getState().setError(event.reason || "Connection Policy Violation");
                    useSessionStore.getState().setConnectionState('FAILED');
                    return;
                }
            }

            if (event.code === WS_CODES.NORMAL) {
                useSessionStore.getState().setConnectionState('DISCONNECTED');
            } else if (this.isTerminalError(event.code)) {
                Logger.warn(`VivaWS: Terminal Error ${event.code}. No reconnect.`);
                useSessionStore.getState().setError(event.reason || "Connection Rejected");
                useSessionStore.getState().setConnectionState('FAILED');
            } else {
                this.handleReconnect(false);
            }
        };

        this.ws.onerror = (error) => {
            Logger.error('VivaWS: Error', error);
        };

        this.ws.onmessage = (event) => {
            try {
                const message: WebSocketMessage = JSON.parse(event.data);
                this.handleMessage(message);
            } catch (e) {
                Logger.error('VivaWS: Parse Error', e);
            }
        };
    }

    private isTerminalError(code: number): boolean {
        return (
            code === WS_CODES.INVALID_SESSION ||  // 4001
            code === WS_CODES.SESSION_ENDED ||    // 4002
            code === WS_CODES.ROLE_FORBIDDEN      // 4003
            // Note: 1008 is now conditionally handled in onclose
        );
    }

    private handleReconnect(isTimeout: boolean) {
        if (this.explicitClose) return;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            useSessionStore.getState().setConnectionState('RECONNECTING');

            // Exponential backoff
            // Base 1s, Max 15s. Jitter logic could be added but simple exp is fine.
            let baseDelay = 1000 * Math.pow(1.5, this.reconnectAttempts);
            const delay = Math.min(baseDelay, 15000);

            this.reconnectAttempts++;

            Logger.log(`VivaWS: Reconnecting in ${delay}ms (Attempt ${this.reconnectAttempts})`);

            setTimeout(() => {
                if (!this.explicitClose && this.url && this.token) {
                    this.connect(this.url, this.token);
                }
            }, delay);
        } else {
            Logger.error("VivaWS: Max Reconnects Exceeded");
            useSessionStore.getState().setError("Unable to connect. Server might be at capacity.");
            useSessionStore.getState().setConnectionState('FAILED');
        }
    }

    private handleConnectionFailure() {
        useSessionStore.getState().setError("Failed to establish connection");
        useSessionStore.getState().setConnectionState('FAILED');
    }

    private handleMessage(message: WebSocketMessage) {
        const store = useSessionStore.getState();

        switch (message.type) {
            case 'state_update':
                if (Object.values(DialogueState).includes(message.state)) {
                    store.setFsmState(message.state);
                }
                break;

            case 'transcript':
                if (message.is_final) {
                    store.addTranscript({
                        text: message.text,
                        speaker: message.role as TranscriptSpeaker,
                        timestamp: message.timestamp,
                        is_final: true,
                    });
                } else {
                    store.updatePartialTranscript(message.text);
                }
                break;

            case 'audio_chunk':
                // 1. Dispatch event for legacy/other listeners
                const audioEvent = new CustomEvent('viva:audio_chunk', { detail: message.data });
                window.dispatchEvent(audioEvent);

                // 2. Calculate Volume (RMS) for Orb
                try {
                    const binaryString = window.atob(message.data);
                    const length = binaryString.length;
                    // It's Int16 PCM (2 bytes per sample)
                    const sampleCount = length / 2;
                    let sum = 0;
                    const step = 4;
                    let counted = 0;

                    for (let i = 0; i < sampleCount; i += step) {
                        // Little endian decoding
                        const low = binaryString.charCodeAt(i * 2);
                        const high = binaryString.charCodeAt(i * 2 + 1);
                        const s = (high << 8) | low;
                        // Convert to signed 16-bit
                        const signed = s >= 0x8000 ? s - 0x10000 : s;
                        // Normalize to 0-1
                        const n = signed / 32768.0;
                        sum += n * n;
                        counted++;
                    }

                    if (counted > 0) {
                        const rms = Math.sqrt(sum / counted);
                        store.setAgentVolume(Math.min(rms * 5, 1));
                    }
                } catch (e) {
                    Logger.error("Audio RMS error", e);
                }
                break;

            case 'agent_speaking':
                store.setAudioStatus(message.status);
                if (!message.status) store.setAgentVolume(0); // Reset volume when stop speaking
                break;

            case 'session_metadata':
                store.setSessionMetadata(message.expiry_time, message.settings);
                break;

            case 'ping':
                this.send({ type: 'pong' });
                break;

            case 'integrity_alert':
                // Trigger warning modal
                store.setViolationState(
                    true,
                    message.violation_type as any,
                    message.remaining_seconds || 10
                );
                break;

            case 'error':
                // Handle specific backend error messages that might not be close codes
                if (message.code === ERROR_CODES.VOICE_UNAVAILABLE) {
                    Logger.warn(`VivaWS: ${message.message}`);
                    store.setAudioStatus(false);
                    store.setError(`${message.message} Switched to text-only mode.`);
                    window.dispatchEvent(new CustomEvent('viva:voice_unavailable'));
                } else {
                    Logger.error(`VivaWS Error [${message.code}]: ${message.message}`);
                    store.setError(message.message);
                }
                break;
        }
    }

    send(data: unknown) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.messageQueue.push(JSON.stringify(data));
        }
    }

    sendAudioChunk(chunk: ArrayBuffer) {
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(chunk);
        } else {
            // Cap queue size to prevent memory overflow during extended disconnects
            if (this.messageQueue.length < 100) {
                this.messageQueue.push(chunk);
            }
        }
    }

    private flushQueue() {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        while (this.messageQueue.length > 0) {
            const msg = this.messageQueue.shift();
            if (msg) this.ws.send(msg);
        }
    }

    sendIntegritySnapshot(data: { timestamp: string; data: string }) {
        this.send({
            type: 'integrity_snapshot',
            data: data
        });
    }

    private startHeartbeat() {
        this.stopHeartbeat();
        this.pingInterval = setInterval(() => {
            this.send({ type: 'ping' });
        }, 10000);
    }

    private stopHeartbeat() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    disconnect(clearSession = true) {
        this.explicitClose = true;
        this.stopHeartbeat();
        this.isConnecting = false;
        if (this.connectionTimeout) clearTimeout(this.connectionTimeout);

        window.removeEventListener('beforeunload', this.lifecycleCleanup);

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (clearSession) {
            this.url = null;
            this.token = null;
            useSessionStore.getState().setConnectionState('DISCONNECTED');
        }
    }
}

export const vivaWebSocket = new VivaWebSocketClient();
