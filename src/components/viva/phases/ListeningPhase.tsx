'use client';

import React from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { Mic } from 'lucide-react';

export const ListeningPhase = () => {
    const currentPartial = useSessionStore((state) => state.currentPartialTranscript);
    const isMicActive = useSessionStore((state) => state.isMicActive);
    const fsmState = useSessionStore((state) => state.fsmState);
    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);

    const getStatusText = () => {
        if (isAgentSpeaking) return 'AI is speaking...';
        switch (fsmState) {
            case DialogueState.EVALUATION: return 'Evaluating your answer...';
            case DialogueState.TRANSFER: return 'Moving to next question...';
            case DialogueState.SCAFFOLD: return 'Preparing a hint...';
            default: return 'Listening...';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center w-full py-4 space-y-4 animate-in fade-in duration-300">
            {/* Real-time partial transcript */}
            <div className="w-full max-w-2xl min-h-[60px] flex items-center justify-center text-center px-4">
                {currentPartial ? (
                    <p className="text-lg md:text-xl text-foreground font-medium leading-relaxed animate-in fade-in duration-200">
                        {currentPartial}
                        <span className="inline-block w-0.5 h-5 bg-primary ml-1 animate-pulse align-middle rounded-full" />
                    </p>
                ) : (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-muted-foreground text-sm tracking-wide">
                            {getStatusText()}
                        </p>
                        {/* Subtle listening indicator */}
                        {isMicActive && fsmState === DialogueState.LISTENING && !isAgentSpeaking && (
                            <div className="flex items-center gap-2 text-xs text-primary/70 bg-primary/5 px-3 py-1.5 rounded-full border border-primary/10">
                                <Mic className="w-3 h-3" />
                                <span>Speak your answer</span>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
