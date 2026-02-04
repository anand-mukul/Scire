'use client';

import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
    stream: MediaStream | null;
    isListening: boolean;
    className?: string;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ stream, isListening, className }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        if (!stream || !isListening || !canvasRef.current) return;

        // Initialize Audio Context via Service (Shared)
        import('@/services/AudioAnalysisService').then(({ AudioAnalysisService }) => {
            const service = AudioAnalysisService.getInstance();
            const audioCtx = service.getContext();
            audioContextRef.current = audioCtx;

            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64;
            analyserRef.current = analyser;

            // Safe to create multiple sources from same stream in same context
            const source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            const canvas = canvasRef.current;
            if (!canvas) return;
            const ctx = canvas.getContext('2d');
            if (!ctx) return;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const draw = () => {
                animationFrameRef.current = requestAnimationFrame(draw);
                analyser.getByteFrequencyData(dataArray);

                ctx.clearRect(0, 0, canvas.width, canvas.height);

                const center = canvas.width / 2;
                const barWidth = 6;
                const gap = 4;

                // Visualizer Data Mapping
                const visualizerData = [
                    dataArray[6],
                    dataArray[4],
                    dataArray[2],
                    dataArray[4],
                    dataArray[6]
                ];

                visualizerData.forEach((value, i) => {
                    const normalized = value / 255;
                    const height = Math.max(4, normalized * 40);
                    const x = center + (i - 2) * (barWidth + gap);

                    ctx.fillStyle = `rgba(59, 130, 246, ${0.5 + normalized * 0.5})`;
                    const y = (canvas.height - height) / 2;

                    ctx.beginPath();
                    // Check if roundRect is supported, else rect (TypeScript might complain)
                    if (ctx.roundRect) {
                        ctx.roundRect(x - barWidth / 2, y, barWidth, height, 10);
                    } else {
                        ctx.rect(x - barWidth / 2, y, barWidth, height);
                    }
                    ctx.fill();
                });
            };

            draw();
        });

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (sourceRef.current) sourceRef.current.disconnect();
            if (analyserRef.current) analyserRef.current.disconnect();
            // DO NOT close the shared audio context
            // if (audioContextRef.current) audioContextRef.current.close(); 
        };
    }, [stream, isListening]);

    if (!isListening) return null;

    return (
        <canvas
            ref={canvasRef}
            width={100}
            height={60}
            className={className}
        />
    );
};
