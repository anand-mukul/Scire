import { Logger } from "@/lib/logger";

export class AudioAnalysisService {
    private static instance: AudioAnalysisService;
    private audioContext: AudioContext | null = null;
    private userAnalyser: AnalyserNode | null = null;
    private aiAnalyser: AnalyserNode | null = null;
    private userSource: MediaStreamAudioSourceNode | null = null;
    private aiSource: AudioNode | null = null;

    private userVolume: number = 0;
    private aiVolume: number = 0;

    private constructor() { }

    public static getInstance(): AudioAnalysisService {
        if (!AudioAnalysisService.instance) {
            AudioAnalysisService.instance = new AudioAnalysisService();
        }
        return AudioAnalysisService.instance;
    }

    public getContext(): AudioContext {
        if (!this.audioContext) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            this.audioContext = new AudioContextClass({ sampleRate: 16000 });
        }
        if (this.audioContext!.state === 'suspended') {
            this.audioContext!.resume();
        }
        return this.audioContext!;
    }

    public connectMicrophone(stream: MediaStream) {
        try {
            const ctx = this.getContext();

            // Cleanup old connections
            if (this.userSource) {
                this.userSource.disconnect();
            }
            if (this.userAnalyser) {
                this.userAnalyser.disconnect();
            }

            this.userSource = ctx.createMediaStreamSource(stream);
            this.userAnalyser = ctx.createAnalyser();
            this.userAnalyser.fftSize = 256;
            this.userAnalyser.smoothingTimeConstant = 0.5;

            this.userSource.connect(this.userAnalyser);
            Logger.log('AudioAnalysis: Microphone connected');
        } catch (e) {
            Logger.error('AudioAnalysis: Failed to connect mic', e);
        }
    }

    // Connects an AI audio source (e.g., from TTS player buffer source)
    public connectAISource(sourceNode: AudioNode) {
        try {
            const ctx = this.getContext();

            // We assume the sourceNode is created by the caller (TTSPlayer) using our context
            // or a context we can connect to. Ideally, TTSPlayer should use THIS context.
            // If contexts differ, we can't easily connect nodes. 
            // For simplicity, TTSPlayer should request context from this service.

            if (!this.aiAnalyser) {
                this.aiAnalyser = ctx.createAnalyser();
                this.aiAnalyser.fftSize = 256;
                this.aiAnalyser.smoothingTimeConstant = 0.5;
                this.aiAnalyser.connect(ctx.destination); // Connect analyser to output so we hear it
            }

            // Connect the source to the analyser (which is connected to destination)
            sourceNode.connect(this.aiAnalyser);
        } catch (e) {
            Logger.error('AudioAnalysis: Failed to connect AI source', e);
        }
    }

    public getLevels(): { user: number; ai: number } {
        this.userVolume = this.getVolume(this.userAnalyser);
        this.aiVolume = this.getVolume(this.aiAnalyser);
        return { user: this.userVolume, ai: this.aiVolume };
    }

    private getVolume(analyser: AnalyserNode | null): number {
        if (!analyser) return 0;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
            sum += dataArray[i];
        }
        // Normalize to 0-1 range roughly
        const average = sum / dataArray.length;
        return Math.min(1, average / 128);
    }
}
