'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VivaOrchestrator } from '@/components/viva/VivaOrchestrator';
import { useSessionStore } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { api } from '@/lib/network/api';
import { getAccessToken } from '@/lib/auth-token';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const setSessionInfo = useSessionStore((state) => state.setSessionInfo);
    const resetSession = useSessionStore((state) => state.resetSession);

    useEffect(() => {
        const initSession = async () => {
            if (sessionId) {
                try {
                    // Fetch real session details
                    const sessionData = await api.sessions.getStatus(sessionId);

                    setSessionInfo(
                        sessionId,
                        sessionData.exam_id || sessionData.exam?.id || 'unknown-exam',
                        sessionData.student_id || sessionData.student?.id || 'unknown-student'
                    );

                    useSessionStore.getState().setOnboardingStatus(!!sessionData.onboarding_accepted);

                    // Connect WS with secure in-memory token (not localStorage!)
                    const token = getAccessToken();
                    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/session';

                    if (token) {
                        vivaWebSocket.connect(`${wsUrl}/${sessionId}`, token);
                    } else {
                        console.error('No auth token found - please re-login');
                    }
                } catch (error) {
                    console.error('Failed to initialize session:', error);
                }
            }
        };

        initSession();

        return () => {
            vivaWebSocket.disconnect();
            resetSession();
        };
    }, [sessionId, setSessionInfo, resetSession]);

    return (
        <div className="h-full flex flex-col bg-background">
            <VivaOrchestrator />
        </div>
    );
}
