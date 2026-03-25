'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { VivaOrchestrator } from '@/components/viva/VivaOrchestrator';
import { useSessionStore } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { api } from '@/lib/network/api';
import { getAccessToken } from '@/lib/auth-token';
import { useAuth } from '@/contexts/AuthContext';

export default function SessionPage() {
    const params = useParams();
    const sessionId = params.id as string;
    const setSessionInfo = useSessionStore((state) => state.setSessionInfo);
    const resetSession = useSessionStore((state) => state.resetSession);
    const setError = useSessionStore((state) => state.setError);
    const { isLoading: authLoading } = useAuth();

    useEffect(() => {
        // Wait for AuthContext to finish its initial silentRefresh
        // before trying to read the in-memory token
        if (authLoading) return;

        const initSession = async () => {
            if (sessionId) {
                try {
                    // Fetch real session details
                    // If the access_token cookie is expired, the 401 interceptor
                    // in api.ts will automatically call /auth/refresh and populate
                    // the in-memory token via setAccessToken().
                    const sessionData = await api.sessions.getStatus(sessionId);

                    setSessionInfo(
                        sessionId,
                        sessionData.exam_id || sessionData.exam?.id || 'unknown-exam',
                        sessionData.student_id || sessionData.student?.id || 'unknown-student'
                    );

                    useSessionStore.getState().setOnboardingStatus(!!sessionData.onboarding_accepted);

                    // The 401 interceptor should have populated the in-memory token
                    // during the API call above. Read it directly.
                    const token = getAccessToken();

                    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/api/v1/ws/session';

                    if (token) {
                        vivaWebSocket.connect(`${wsUrl}/${sessionId}`, token);
                    } else {
                        // Token is genuinely unavailable — redirect to login
                        console.error('No auth token found after successful API call - please re-login');
                        setError('Authentication expired. Please log in again.');
                    }
                } catch (error: unknown) {
                    console.error('Failed to initialize session:', error);
                    const msg = error instanceof Error ? error.message : 'Failed to initialize session. Please try again.';
                    setError(msg);
                }
            }
        };

        initSession();

        return () => {
            vivaWebSocket.disconnect();
            resetSession();
        };
    }, [sessionId, setSessionInfo, resetSession, authLoading]);

    return (
        <div className="h-full flex flex-col bg-background">
            <VivaOrchestrator />
        </div>
    );
}

