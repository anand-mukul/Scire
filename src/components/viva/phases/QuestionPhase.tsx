'use client';

import React from 'react';
import { useSessionStore } from '@/lib/store/session-store';
import { TranscriptSpeaker } from '@/types/backend';

export const QuestionPhase = () => {
    const transcripts = useSessionStore((state) => state.transcripts);
    const isAudioPlaying = useSessionStore((state) => state.isAudioPlaying);

    // Get the latest assistant message
    const lastQuestion = [...transcripts].reverse().find(t => t.speaker === TranscriptSpeaker.ASSISTANT)?.text || "Preparing next question...";

    // Reset timer when question changes
    const [timeLeft, setTimeLeft] = React.useState(90);

    React.useEffect(() => {
        setTimeLeft(90);
        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, [lastQuestion]);

    const progress = ((90 - timeLeft) / 90) * 100;
    const radius = 40;
    const stroke = 4;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 relative w-full">

            {/* Question Container with Circular Timer Background */}
            <div className="relative flex flex-col items-center justify-center gap-8">

                {/* Timer Ring with Digital Count */}
                <div className="relative flex items-center justify-center">
                    {/* SVG Timer Ring */}
                    <div className="transform -rotate-90">
                        <svg
                            height={radius * 2}
                            width={radius * 2}
                        >
                            <circle
                                stroke="currentColor"
                                fill="transparent"
                                strokeWidth={stroke}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className="text-muted-foreground/20"
                            />
                            <circle
                                stroke="currentColor"
                                fill="transparent"
                                strokeWidth={stroke}
                                strokeDasharray={circumference + ' ' + circumference}
                                style={{ strokeDashoffset }}
                                r={normalizedRadius}
                                cx={radius}
                                cy={radius}
                                className={`text-primary transition-all duration-1000 ease-linear ${timeLeft <= 10 ? 'text-red-500' : ''}`}
                            />
                        </svg>
                    </div>
                    {/* Digital Number */}
                    <div className={`absolute inset-0 flex items-center justify-center text-4xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-primary'}`}>
                        {timeLeft}
                    </div>
                </div>

                <h2 className="text-2xl md:text-3xl font-serif text-center font-medium leading-relaxed tracking-wide text-foreground/90 max-w-2xl relative z-10">
                    &quot;{lastQuestion}&quot;
                </h2>
            </div>

            {isAudioPlaying && (
                <div className="flex gap-1 h-4 items-end">
                    <div className="w-1 bg-primary animate-[bounce_1s_infinite] h-2"></div>
                    <div className="w-1 bg-primary animate-[bounce_1s_infinite_0.2s] h-4"></div>
                    <div className="w-1 bg-primary animate-[bounce_1s_infinite_0.4s] h-3"></div>
                </div>
            )}

            {/* Student Mic Visualizer - Only shows when NOT playing audio (active listening) */}
            {!isAudioPlaying && (
                <div className="flex gap-1 h-8 items-end justify-center w-full max-w-[100px] absolute bottom-8 opacity-50 hover:opacity-100 transition-opacity">
                    <MicVisualizer />
                </div>
            )}
        </div>
    );
};

// Extracted to avoid re-rendering entire component on volume change
const MicVisualizer = () => {
    const level = useSessionStore((state) => state.userVolume);
    // Use fixed seed or index for variation to avoid hydration mismatch
    return (
        <>
            {Array.from({ length: 5 }).map((_, i) => {
                // Simple pseudo-random based on index to be deterministic
                const variation = 0.5 + (i % 3) * 0.2;
                const height = Math.max(10, level * 100 * variation);
                return (
                    <div
                        key={i}
                        className="w-1.5 bg-emerald-500 rounded-full transition-all duration-75"
                        style={{ height: `${height}%` }}
                    />
                );
            })}
        </>
    );
};
