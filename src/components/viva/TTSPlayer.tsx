'use client';

import { useEffect, useRef } from 'react';
import { useSessionStore } from '@/lib/store/session-store';

export const TTSPlayer = () => {
    const audioContextRef = useRef<AudioContext | null>(null);
    const nextStartTimeRef = useRef<number>(0);
    const isAudioPlaying = useSessionStore((state) => state.isAudioPlaying);
    const setAudioStatus = useSessionStore((state) => state.setAudioStatus);

    useEffect(() => {
        const handleAudioChunk = async (event: Event) => {
            const customEvent = event as CustomEvent;
            const base64Data = customEvent.detail;

            if (!base64Data) return;

            try {
                // Ensure AudioAnalysisService is loaded
                const { AudioAnalysisService } = await import('@/services/AudioAnalysisService');
                const service = AudioAnalysisService.getInstance();
                const ctx = service.getContext();

                if (!ctx) return;
                audioContextRef.current = ctx;

                // Convert base64 to ArrayBuffer (Optimized)
                const binaryString = window.atob(base64Data);
                const len = binaryString.length;
                if (len === 0) return;

                if (len % 2 !== 0) {
                    console.warn("TTSPlayer: Received odd-length audio chunk, padding...");
                    // This creates a copy, unavoidable if odd.
                    // But standard PCM16 should be even.
                }

                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) {
                    bytes[i] = binaryString.charCodeAt(i);
                }
                const arrayBuffer = bytes.buffer;

                // --- PCM 24kHz Decoding ---
                const int16Array = new Int16Array(arrayBuffer);
                const float32Array = new Float32Array(int16Array.length);
                for (let i = 0; i < int16Array.length; i++) {
                    float32Array[i] = int16Array[i] / 32768.0;
                }

                // Create Buffer (Output Format: Mono, 24000Hz)
                const audioBuffer = ctx.createBuffer(1, float32Array.length, 24000);
                audioBuffer.getChannelData(0).set(float32Array);

                // Schedule playback
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;

                // Connect to Analysis Service for Visuals (Siri Orb Reactivity)
                service.connectAISource(source);

                const currentTime = ctx.currentTime;
                const startTime = Math.max(currentTime, nextStartTimeRef.current);

                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;

                if (!isAudioPlaying) setAudioStatus(true);

                source.onended = () => {
                    if (ctx.currentTime >= nextStartTimeRef.current - 0.1) {
                        setAudioStatus(false);
                    }
                };

            } catch (error) {
                console.error("Error playing PCM audio chunk", error);
            }
        };

        window.addEventListener('viva:audio_chunk', handleAudioChunk);

        return () => {
            window.removeEventListener('viva:audio_chunk', handleAudioChunk);
            // DO NOT close the singleton context here. 
            // It belongs to AudioAnalysisService.
            audioContextRef.current = null;
        };
    }, [isAudioPlaying, setAudioStatus]);

    return null; // Headless component
};
