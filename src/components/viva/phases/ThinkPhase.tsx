'use client';

import React from 'react';
import { Brain, Mic } from 'lucide-react';

export const ThinkPhase = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full py-12 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            {/* Status area */}
            <div className="flex flex-col items-center gap-6 text-center">
                {/* Thinking indicator */}
                <div className="flex items-center gap-3 bg-primary/10 px-6 py-3 rounded-2xl border border-primary/20 backdrop-blur-sm shadow-lg shadow-primary/5">
                    <Brain className="w-5 h-5 text-primary animate-pulse" />
                    <span className="text-base font-semibold text-primary tracking-wide">
                        Take a moment to think
                    </span>
                </div>

                {/* Mic hint */}
                <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400/90 font-medium">
                    <Mic className="w-4 h-4 animate-pulse relative -top-px" />
                    <span>Click the microphone below when ready</span>
                </div>
            </div>
        </div>
    );
};
