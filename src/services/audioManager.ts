import { vivaWebSocket } from '@/lib/network/websocket-client';
import { useSessionStore } from '@/lib/store/session-store';
import { Logger } from '@/lib/logger';

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private nextStartTime: number = 0;

    private isProcessorLoaded = false;
    private isRecording = false;

    constructor() {
        // Subscribe to store for barge-in checks
        useSessionStore.subscribe((state, prevState) => {
            if (prevState.isAgentSpeaking && !state.isAgentSpeaking) {
                this.clearPlaybackQueue();
            }
        });

        // NOTE: Audio playback is handled by TTSPlayer component.
        // AudioManager is only responsible for mic recording and transmission.

        // Listen for Voice Degradation
        window.addEventListener('viva:voice_unavailable', () => {
            Logger.warn("AudioManager: Voice service unavailable. Stopping audio.");
            this.stopRecording();
            this.clearPlaybackQueue();
            this.isRecording = false;
        });
    }

    async initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
                sampleRate: 16000
            });
        }

        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        // Load the AudioWorklet processor from a static file (CSP-compliant)
        if (!this.isProcessorLoaded) {
            try {
                await this.audioContext.audioWorklet.addModule('/recorder-processor.js');
                this.isProcessorLoaded = true;
            } catch (e) {
                Logger.error('Failed to load AudioWorklet:', e);
            }
        }
    }

    async setStream(stream: MediaStream) {
        if (this.mediaStream === stream) return;

        this.mediaStream = stream;
        Logger.log("AudioManager: Stream set externally");

        // Pre-connect the worklet so it's ready when recording starts
        await this.ensureWorkletConnected();
    }

    /**
     * Ensures the AudioWorkletNode is created and connected exactly once.
     * Subsequent calls are no-ops if already connected.
     */
    private async ensureWorkletConnected() {
        if (this.workletNode) return; // Already connected
        await this.initialize();
        if (!this.audioContext || !this.mediaStream) return;

        try {
            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-processor');

            this.workletNode.port.onmessage = (event) => {
                // Gate: only send audio when actively recording and mic is active
                if (!this.isRecording) return;

                const state = useSessionStore.getState();
                if (!state.isMicActive) return;
                // NOTE: We intentionally do NOT check isAgentSpeaking here.
                // Stopping audio during TTS kills the Deepgram WebSocket (no audio = connection death).
                // Echo filtering is handled server-side in websocket.py (stream_manager.is_speaking).

                this.analyzeVolume(event.data);

                const pcm16 = this.floatTo16BitPCM(event.data);
                vivaWebSocket.sendAudioChunk(pcm16.buffer as ArrayBuffer);
            };

            source.connect(this.workletNode);
            // Do NOT connect worklet to destination to avoid self-hear
            Logger.log("AudioManager: Worklet connected (persistent)");
        } catch (e) {
            Logger.error('AudioManager: Worklet connection error:', e);
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        // Ensure worklet is ready (no-op if already connected)
        await this.ensureWorkletConnected();

        this.isRecording = true;
        useSessionStore.getState().setUserVolume(0);
        Logger.log("AudioManager: Recording started (flag toggled)");
    }

    stopRecording() {
        // Just toggle the flag — keep the worklet connected to avoid
        // reinitialization delays that cause silence gaps.
        if (!this.isRecording) return;

        this.isRecording = false;
        useSessionStore.getState().setUserVolume(0);
        Logger.log("AudioManager: Recording stopped (flag toggled)");
    }

    /**
     * Full teardown — call ONLY on component unmount.
     * Releases stream tracks, closes AudioContext, and destroys the worklet.
     */
    cleanup() {
        this.isRecording = false;

        if (this.workletNode) {
            this.workletNode.port.onmessage = null;
            this.workletNode.disconnect();
            this.workletNode = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
        this.isProcessorLoaded = false;
    }



    private async playAudioChunk(base64Data: string) {
        if (!this.audioContext) return;
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
        }

        try {
            // OpenAI PCM is raw 16-bit signed integer, 24kHz, mono (usually)
            // 1. Decode Base64 to binary string
            // 1. Decode Base64
            const binaryString = window.atob(base64Data);
            const len = binaryString.length;

            if (len % 2 !== 0) {
                Logger.warn("AudioManager: Received odd byte length chunk. Truncating last byte.");
            }

            // 2. Convert to Int16Array (Alignment Safe)
            const int16Count = Math.floor(len / 2);
            const int16Array = new Int16Array(int16Count);

            for (let i = 0; i < int16Count; i++) {
                const low = binaryString.charCodeAt(i * 2);
                const high = binaryString.charCodeAt(i * 2 + 1);
                // Little Endian
                const s = (high << 8) | low;
                int16Array[i] = s >= 0x8000 ? s - 0x10000 : s;
            }

            // 3. Float32 Conversion
            const float32Array = new Float32Array(int16Count);
            for (let i = 0; i < int16Count; i++) {
                float32Array[i] = int16Array[i] / 32768.0;
            }

            // 4. Create Buffer (24kHz)
            const pcmSampleRate = 24000;
            const audioBuffer = this.audioContext.createBuffer(1, int16Count, pcmSampleRate);
            audioBuffer.copyToChannel(float32Array, 0);

            // 5. Scheduling & Drift Correction
            const now = this.audioContext.currentTime;

            // If nextStartTime is in the past (lag), reset to now. 
            // Also adds tiny buffer (10ms) to prevent jitter gaps
            if (this.nextStartTime < now) {
                this.nextStartTime = now + 0.01;
            }

            const startTime = this.nextStartTime;

            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.audioContext.destination);

            source.start(startTime);

            this.nextStartTime = startTime + audioBuffer.duration;

            // Log for debugging
            // Logger.log(`AudioChunk: ${int16Count} samples. Play at ${startTime.toFixed(3)} (Now: ${now.toFixed(3)}). ContextState: ${this.audioContext.state}`);

            // Safety check for stuck state
            if (this.audioContext.state === 'suspended') {
                Logger.warn("AudioContext still suspended after resume attempt!");
                this.audioContext.resume();
            }


        } catch (e) {
            Logger.error('Audio Playback Error:', e);
        }
    }

    public clearPlaybackQueue() {
        if (this.audioContext) {
            this.nextStartTime = this.audioContext.currentTime;
        }
    }

    private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }

    private analyzeVolume(data: Float32Array) {
        // RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        const rms = Math.sqrt(sum / data.length);
        // Update Store (throttled ideally)
        // normalized 0-1
        const vol = Math.min(1, rms * 5);
        useSessionStore.getState().setUserVolume(vol);
    }
}

export const audioManager = new AudioManager();
