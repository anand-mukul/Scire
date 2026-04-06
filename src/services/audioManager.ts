import { vivaWebSocket } from '@/lib/network/websocket-client';
import { useSessionStore } from '@/lib/store/session-store';
import { Logger } from '@/lib/logger';

export class AudioManager {
    private audioContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private workletNode: AudioWorkletNode | null = null;
    private mediaStreamSource: MediaStreamAudioSourceNode | null = null;
    private isProcessorLoaded = false;
    private isRecording = false;

    constructor() {
        // NOTE: Audio playback is handled by TTSPlayer component.
        // AudioManager is only responsible for mic recording and transmission.

        // Listen for Voice Degradation
        window.addEventListener('viva:voice_unavailable', () => {
            Logger.warn("AudioManager: Voice service unavailable. Stopping audio.");
            this.stopRecording();
            this.isRecording = false;
        });
    }

    public isInitialized(): boolean {
        return this.audioContext !== null && this.audioContext.state === 'running';
    }

    async initialize() {
        if (!this.audioContext) {
            // Use the browser's native sample rate (usually 44100 or 48000).
            // DO NOT force sampleRate: 16000 — many browsers/hardware silently
            // output all-zero buffers when forced to a non-native sample rate.
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }

        if (this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (e) {
                Logger.error('AudioContext resume failed:', e);
            }
        }

        // Load the AudioWorklet processor from a static file (CSP-compliant)
        if (!this.isProcessorLoaded && this.audioContext) {
            try {
                await this.audioContext.audioWorklet.addModule('/recorder-processor.js');
                this.isProcessorLoaded = true;
            } catch (e) {
                Logger.error('Failed to load AudioWorklet:', e);
            }
        }

        // If initialize() successfully placed the context into 'running', connect the graph proactively
        if (this.audioContext && this.audioContext.state === 'running' && this.mediaStream) {
            this.setupAudioGraph();
        }
    }

    async setStream(stream: MediaStream) {
        if (this.mediaStream === stream) return;

        this.mediaStream = stream;

        // Try initializing, but if we don't have a user gesture, the context stays suspended.
        // The graph will be constructed later during AuthPhase initialization.
        await this.initialize();
    }

    /**
     * Builds the MediaStreamSource and AudioWorkletNode graph.
     * MUST ONLY be called when audioContext.state === 'running' to avoid silent stream bug.
     */
    private setupAudioGraph() {
        if (this.workletNode) return; // Already connected
        if (!this.audioContext || this.audioContext.state !== 'running' || !this.mediaStream || !this.isProcessorLoaded) {
            Logger.warn("AudioManager: setupAudioGraph aborted. Context state:", this.audioContext?.state);
            return;
        }

        try {
            // Create source ONLY when explicitly running
            this.mediaStreamSource = this.audioContext.createMediaStreamSource(this.mediaStream);
            this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-processor');

            this.workletNode.port.onmessage = (event) => {
                // Gate: only send audio when actively recording and mic is active
                if (!this.isRecording) return;

                const state = useSessionStore.getState();
                if (!state.isMicActive) return;
                // Push-to-talk gate: only transmit audio when user has explicitly unmuted
                if (!state.isMicUnmuted) return;
                
                // Track how often we process a chunk
                const data = event.data as Float32Array;

                const rms = this.analyzeVolume(data);

                // Data is already 16kHz from the AudioWorklet (recorder-processor.js)
                // — send directly without redundant main-thread resampling
                const pcm16 = this.floatTo16BitPCM(data);
                vivaWebSocket.sendAudioChunk(pcm16.buffer as ArrayBuffer);
            };

            this.mediaStreamSource.connect(this.workletNode);
            // Do NOT connect worklet to destination to avoid self-hear
        } catch (e) {
            Logger.error('AudioManager: Worklet connection error:', e);
        }
    }

    async startRecording() {
        if (this.isRecording) return;

        // If recording is requested but graph isn't set up yet, initialize & setup
        if (!this.workletNode) {
             await this.initialize();
             this.setupAudioGraph();
        }

        // If it's STILL not setup because the context is somehow suspended, warn explicitly
        if (!this.workletNode) {
             Logger.warn("AudioManager: Cannot start recording. AudioGraph couldn't be initialized ( likely missing user gesture ).");
             return;
        }

        this.isRecording = true;
        useSessionStore.getState().setUserVolume(0);
    }

    stopRecording() {
        // Just toggle the flag — keep the worklet connected to avoid
        // reinitialization delays that cause silence gaps.
        if (!this.isRecording) return;

        this.isRecording = false;
        useSessionStore.getState().setUserVolume(0);
    }

    /**
     * Full teardown — call ONLY on component unmount.
     * Releases stream tracks, closes AudioContext, and destroys the worklet/sources.
     */
    cleanup() {
        this.isRecording = false;

        if (this.workletNode) {
            this.workletNode.port.onmessage = null;
            this.workletNode.disconnect();
            this.workletNode = null;
        }
        
        if (this.mediaStreamSource) {
            this.mediaStreamSource.disconnect();
            this.mediaStreamSource = null;
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

    private floatTo16BitPCM(float32Array: Float32Array): Int16Array {
        const int16Array = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
            let s = Math.max(-1, Math.min(1, float32Array[i]));
            int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }
        return int16Array;
    }



    private analyzeVolume(data: Float32Array): number {
        // RMS
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        let rms = 0;
        if (data.length > 0) {
            rms = Math.sqrt(sum / data.length);
        }
        // Update Store (throttled ideally)
        // normalized 0-1
        const vol = Math.min(1, rms * 5);
        useSessionStore.getState().setUserVolume(vol);
        return rms;
    }
}

export const audioManager = new AudioManager();
