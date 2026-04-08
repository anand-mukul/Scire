"use client";

import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useSessionStore } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { audioManager } from '@/services/audioManager';

interface SessionContextValue {
    startSession: () => void;
    endSession: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

interface SessionProviderProps {
    sessionId: string;
    token: string;
    children: React.ReactNode;
}

export function SessionProvider({ sessionId, token, children }: SessionProviderProps) {
    const initialized = useRef(false);

    // Auto-connect on mount
    useEffect(() => {
        if (!initialized.current && sessionId && token) {
            initialized.current = true;

            // 1. Connect WS
            const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:8000/api/v1/ws';
            const fullUrl = `${wsUrl}/session/${sessionId}`;
            vivaWebSocket.connect(fullUrl, token);

            // 2. Setup Audio (Mic is usually user-triggered, but we can pre-init)

            return () => {
                vivaWebSocket.disconnect();
                audioManager.stopRecording();
            };
        }
    }, [sessionId, token]);

    // Mic Management based on FSM & Speaking Status
    const isAgentSpeaking = useSessionStore(s => s.isAgentSpeaking);
    const fsmState = useSessionStore(s => s.fsmState);
    const isMicActive = useSessionStore(s => s.isMicActive);

    useEffect(() => {
        // Mic Management moved to MediaManager to centralize stream ownership
        // and avoid race conditions between automatic SessionProvider logic 
        // and MediaManager's getUserMedia stream acquisition.
    }, []);


    const startSession = () => {
        // Trigger explicit start if needed, or just let auto-connect work
        // vivaWebSocket.send({ type: 'SESSION_START' }); // Type string works
        // Or if MessageType enum is available? New client uses string literals mostly.
        vivaWebSocket.send({ type: 'SESSION_START' });
    };

    const endSession = () => {
        vivaWebSocket.disconnect();
    };

    return (
        <SessionContext.Provider value={{ startSession, endSession }}>
            {children}
        </SessionContext.Provider>
    );
}

export const useSession = () => {
    const context = useContext(SessionContext);
    if (!context) throw new Error("useSession must be used within SessionProvider");
    return context;
};
