'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { Mic, MicOff, AudioLines } from 'lucide-react';

export const ListeningPhase = () => {
    const currentPartial = useSessionStore((state) => state.currentPartialTranscript);
    const isMicActive = useSessionStore((state) => state.isMicActive);
    const isMicUnmuted = useSessionStore((state) => state.isMicUnmuted);
    const fsmState = useSessionStore((state) => state.fsmState);
    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);
    const userVolume = useSessionStore((state) => state.userVolume);

    // Track the last shown text to persist it during silence
    const [displayText, setDisplayText] = useState('');

    useEffect(() => {
        if (currentPartial && currentPartial.trim()) {
            setDisplayText(currentPartial);
        }
    }, [currentPartial]);

    // Reset when entering a new listening phase
    useEffect(() => {
        if (fsmState === DialogueState.LISTENING) {
            setDisplayText('');
        }
    }, [fsmState]);

    const getStatusText = () => {
        if (isAgentSpeaking) return 'AI is speaking...';
        switch (fsmState) {
            case DialogueState.EVALUATION: return 'Evaluating your answer...';
            case DialogueState.TRANSFER: return 'Moving to next question...';
            case DialogueState.SCAFFOLD: return 'Preparing a hint...';
            default: return null; // Don't show text for listening — show mic indicator instead
        }
    };

    const statusText = getStatusText();

    // Volume bars animation (3 bars)
    const volumeBars = [
        Math.min(userVolume * 1.2, 1),
        Math.min(userVolume * 1.5, 1),
        Math.min(userVolume * 0.8, 1),
    ];

    return (
        <div className="flex flex-col items-center justify-center w-full py-4 space-y-4 animate-in fade-in duration-300">
            {/* Real-time partial transcript (live caption style) */}
            <div className="w-full max-w-2xl min-h-[80px] flex items-center justify-center text-center px-4">
                {(currentPartial || displayText) ? (
                    <div className="relative">
                        {/* Live transcript text */}
                        <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed animate-in fade-in duration-200">
                            {currentPartial || displayText}
                            {/* Blinking cursor only when actively receiving */}
                            {currentPartial && (
                                <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse align-middle rounded-full" />
                            )}
                        </p>
                        {/* Live indicator badge */}
                        {currentPartial && (
                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-widest text-emerald-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                LIVE
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        {statusText ? (
                            <p className="text-muted-foreground text-sm tracking-wide">
                                {statusText}
                            </p>
                        ) : (
                            <>
                                {/* Mic status indicator */}
                                {isMicUnmuted ? (
                                    <div className="flex flex-col items-center gap-3">
                                        {/* Active listening indicator with volume bars */}
                                        <div className="flex items-center gap-1">
                                            {volumeBars.map((vol, i) => (
                                                <div
                                                    key={i}
                                                    className="w-1 bg-emerald-400 rounded-full transition-all duration-100 ease-out"
                                                    style={{
                                                        height: `${Math.max(8, vol * 28)}px`,
                                                        opacity: 0.4 + vol * 0.6,
                                                    }}
                                                />
                                            ))}
                                            <Mic className="w-4 h-4 text-emerald-400 mx-1.5" />
                                            {[...volumeBars].reverse().map((vol, i) => (
                                                <div
                                                    key={`r-${i}`}
                                                    className="w-1 bg-emerald-400 rounded-full transition-all duration-100 ease-out"
                                                    style={{
                                                        height: `${Math.max(8, vol * 28)}px`,
                                                        opacity: 0.4 + vol * 0.6,
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-emerald-400/80 text-xs font-medium tracking-wide">
                                            Listening... speak your answer
                                        </p>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-2.5">
                                        <div className="flex items-center gap-2 text-amber-400/80 bg-amber-400/5 px-4 py-2.5 rounded-xl border border-amber-400/15">
                                            <MicOff className="w-4 h-4" />
                                            <span className="text-sm font-medium">Mic is muted</span>
                                        </div>
                                        <p className="text-muted-foreground/60 text-xs">
                                            Click the mic button below to start speaking
                                        </p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
