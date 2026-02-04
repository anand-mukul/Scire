'use client';

import React from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';

export const ListeningPhase = () => {
    const currentPartial = useSessionStore((state) => state.currentPartialTranscript);
    const isMicActive = useSessionStore((state) => state.isMicActive);
    const fsmState = useSessionStore((state) => state.fsmState);

    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);

    const getStatusText = () => {
        if (isAgentSpeaking) return 'Speaking...';

        switch (fsmState) {
            case DialogueState.EVALUATION: return 'Processing...';
            case DialogueState.TRANSFER: return 'Preparing next question...';
            case DialogueState.AUTH: return 'Authenticating...';
            case DialogueState.CALIBRATION: return 'Calibrating...';
            default: return 'Listening...';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 space-y-4 w-full animate-in fade-in duration-500">

            <div className="w-full max-w-2xl min-h-[100px] flex items-center justify-center text-center">
                {currentPartial ? (
                    <p className="text-xl md:text-2xl text-foreground font-medium">
                        {currentPartial}
                        <span className="inline-block w-2 h-6 bg-primary ml-1 animate-pulse align-middle" />
                    </p>
                ) : (
                    <div className="flex flex-col items-center gap-2">
                        <p className="text-muted-foreground text-lg italic animate-pulse">
                            {getStatusText()}
                        </p>
                        <div className="flex gap-1 h-3 items-center">
                            <div className="w-1 bg-primary/50 animate-[pulse_1s_infinite] h-full"></div>
                            <div className="w-1 bg-primary/50 animate-[pulse_1s_infinite_0.3s] h-2/3"></div>
                            <div className="w-1 bg-primary/50 animate-[pulse_1s_infinite_0.5s] h-full"></div>
                        </div>
                    </div>
                )}
            </div>

            {isMicActive && fsmState === DialogueState.LISTENING && (
                <div className="text-xs text-muted-foreground uppercase tracking-widest bg-muted px-2 py-1 rounded-full border border-primary/20">
                    Microphone Active & Streaming
                </div>
            )}
        </div>
    );
};
