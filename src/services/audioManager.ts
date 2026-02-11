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
            // Edge edge: Agent stopped speaking (or was interrupted)
            if (prevState.isAgentSpeaking && !state.isAgentSpeaking) {
                this.clearPlaybackQueue();
            }
        });

        // Listen for raw audio chunks via Event Bus (bridged by WebSocketClient)
        window.addEventListener('viva:audio_chunk', ((e: CustomEvent) => {
            this.playAudioChunk(e.detail);
        }) as EventListener);

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

        // Load Worklet (Inline for simplicity, or external file)
        // We will assume `recorderProcessor.js` exists in public or use a Blob.
        if (!this.isProcessorLoaded) {
            const processorCode = `
                class RecorderProcessor extends AudioWorkletProcessor {
                    _remainder = 0;
                    BUFFER_SIZE = 2048;
                    _buffer = new Float32Array(2048);
                    _bufferIdx = 0;
                    
                    constructor() {
                        super();
                        this.targetSampleRate = 16000;
                        console.log("RecorderProcessor: Initialized. Context SampleRate:", sampleRate);
                    }

                    process(inputs, outputs, parameters) {
                        const input = inputs[0];
                        if (input && input.length > 0) {
                            const inputChannel = input[0];
                            const currentRate = sampleRate;
                            const ratio = currentRate / this.targetSampleRate;
                            
                            let inputIndex = this._remainder;

                            // Always process through buffer to ensure consistent chunk size
                            while (inputIndex < inputChannel.length) {
                                this._buffer[this._bufferIdx++] = inputChannel[Math.floor(inputIndex)];
                                
                                if (this._bufferIdx >= this.BUFFER_SIZE) {
                                    this.port.postMessage(this._buffer.slice());
                                    this._bufferIdx = 0;
                                }
                                
                                inputIndex += ratio;
                            }

                            this._remainder = inputIndex - inputChannel.length;
                        }
                        return true;
                    }
                }
                registerProcessor('recorder-processor', RecorderProcessor);
            `;
            const blob = new Blob([processorCode], { type: 'application/javascript' });
            const url = URL.createObjectURL(blob);

            try {
                await this.audioContext.audioWorklet.addModule(url);
                this.isProcessorLoaded = true;
            } catch (e) {
                Logger.error('Failed to load AudioWorklet:', e);
            }
        }
    }

    async setStream(stream: MediaStream) {
        if (this.mediaStream === stream) return;

        // Stop previous stream if it was internal (but we are moving to external management)
        // this.stopRecording(); 

        this.mediaStream = stream;
        Logger.log("AudioManager: Stream set externally");

        // If we were supposed to be recording, restart with new stream
        if (this.isRecording) {
            this.startRecording();
        }
    }

    async startRecording() {
        if (this.isRecording) return; // Prevent duplicate starts
        await this.initialize();
        if (!this.audioContext) return;

        try {
            if (!this.mediaStream) {
                Logger.log("AudioManager: No stream available, requesting...");
                this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            // prevent multiple source connections
            if (this.workletNode) return;

            const source = this.audioContext.createMediaStreamSource(this.mediaStream);

            this.workletNode = new AudioWorkletNode(this.audioContext, 'recorder-processor');

            this.workletNode.port.onmessage = (event) => {
                // event.data is Float32Array
                // Check if we should send (Muted? Agent Speaking?)
                const state = useSessionStore.getState();
                if (state.isAgentSpeaking || !state.isMicActive) return;

                // Simple VAD / Volume Monitor
                this.analyzeVolume(event.data);

                // Convert to Int16
                const pcm16 = this.floatTo16BitPCM(event.data);
                vivaWebSocket.sendAudioChunk(pcm16.buffer as ArrayBuffer);
            };

            source.connect(this.workletNode);
            // Do NOT connect worklet to destination to avoid self-hear
            // source.disconnect(); // Not needed if we just don't connect to destination

            this.isRecording = true;
            useSessionStore.getState().setUserVolume(0);
        } catch (e) {
            Logger.error('Mic Access Error:', e);
            useSessionStore.getState().setError('Microphone access denied');
        }
    }

    stopRecording() {
        // DO NOT stop MediaStream tracks here — MediaManager owns the stream lifecycle.
        // Only disconnect the worklet to stop sending audio data.

        if (this.workletNode) {
            this.workletNode.port.onmessage = null;
            this.workletNode.disconnect();
            this.workletNode = null;
        }

        this.isRecording = false;
        useSessionStore.getState().setUserVolume(0);
    }

    /**
     * Full teardown — call ONLY on component unmount.
     * Releases stream tracks, closes AudioContext, and stops recording.
     */
    cleanup() {
        this.stopRecording();
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(t => t.stop());
            this.mediaStream = null;
        }
        if (this.audioContext && this.audioContext.state !== 'closed') {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    private handleMessage(msg: any) {
        // Legacy stub if needed, but we use event listeners now
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
