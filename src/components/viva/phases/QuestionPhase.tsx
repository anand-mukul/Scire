'use client';

import React from 'react';
import { useSessionStore } from '@/lib/store/session-store';

export const QuestionPhase = () => {
    const isAudioPlaying = useSessionStore((state) => state.isAudioPlaying);

    return (
        <div className="flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-500 w-full py-4">
            {isAudioPlaying ? (
                <>
                    <p className="text-muted-foreground text-sm uppercase tracking-widest font-medium">
                        Listen carefully
                    </p>
                    <div className="flex gap-2 h-10 items-center">
                        <div className="w-1.5 bg-primary rounded-full animate-[bounce_0.8s_infinite] h-4"></div>
                        <div className="w-1.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_0.15s] h-7"></div>
                        <div className="w-1.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_0.3s] h-10"></div>
                        <div className="w-1.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_0.45s] h-6"></div>
                        <div className="w-1.5 bg-primary rounded-full animate-[bounce_0.8s_infinite_0.6s] h-3"></div>
                    </div>
                </>
            ) : (
                <p className="text-muted-foreground text-sm animate-pulse">
                    Preparing question...
                </p>
            )}
        </div>
    );
};
