import { useEffect, useCallback, useRef } from 'react';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Logger } from '@/lib/logger';
import { integrityService } from '@/services/integrityService';

export const useExamIntegrity = (sessionId: string | null) => {
    const connectionState = useSessionStore((state) => state.connectionState);
    const examSettings = useSessionStore((state) => state.examSettings);
    const violation = useSessionStore((state) => state.violation);
    const setViolationState = useSessionStore((state) => state.setViolationState);
    const decrementViolationTimer = useSessionStore((state) => state.decrementViolationTimer);
    const setFsmState = useSessionStore((state) => state.setFsmState);

    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // --- Violation Handlers ---

    const triggerViolation = useCallback((type: 'FULLSCREEN' | 'TAB_SWITCH', reason: string) => {
        if (!sessionId || connectionState !== 'CONNECTED') return;

        // If already in warning state, do nothing (timer continues)
        if (useSessionStore.getState().violation.isWarning) return;

        const currentFsm = useSessionStore.getState().fsmState;
        if (currentFsm === DialogueState.END || currentFsm === DialogueState.TERMINATED) return;

        Logger.warn(`Integrity Alert: ${reason}`);

        // Start Grace Period (10s)
        setViolationState(true, type, 10);
        toast.error("Warning: Integrity Violation Detected", {
            description: "Return to the exam immediately to avoid termination.",
            duration: 5000,
        });

        // Notify Backend with full metrics
        const metrics = integrityService.getMetrics();
        vivaWebSocket.send({
            type: 'integrity_snapshot',
            data: {
                ...metrics,
                reason: reason,
                severity: 'medium',
            }
        });

    }, [sessionId, connectionState, setViolationState]);

    const resolveViolation = useCallback(() => {
        if (useSessionStore.getState().violation.isWarning) {
            Logger.log('Integrity Restored');
            setViolationState(false, null, 0);
            toast.success("Exam Session Restored");
        }
    }, [setViolationState]);

    const terminateSession = useCallback(async () => {
        if (!sessionId) return;

        const currentFsm = useSessionStore.getState().fsmState;
        if (currentFsm === DialogueState.END || currentFsm === DialogueState.TERMINATED) {
            Logger.log("Integrity Violation: Session already finished, ignoring termination.");
            return;
        }

        Logger.error('Integrity Violation: Terminating Session');

        // Clear timer
        if (timerRef.current) clearInterval(timerRef.current);

        setFsmState(DialogueState.TERMINATED);
        setViolationState(false, null, 0);

        try {
            await api.sessions.terminate(sessionId, "Integrity Violation: Violation Timer Expired");
            toast.error("Session Terminated", {
                description: "You failed to resolve the integrity violation in time.",
                duration: Infinity,
            });
            router.push('/student');
        } catch (err) {
            Logger.error('Failed to terminate session:', err);
        }

    }, [sessionId, setFsmState, setViolationState, router]);


    // --- Event Listeners ---

    const handleFullscreenChange = useCallback(() => {
        // If we lost fullscreen, trigger violation
        if (!document.fullscreenElement) {
            triggerViolation('FULLSCREEN', 'fullscreen_exit');
        } else {
            // If we regained fullscreen, checks if that solves it
            // Note: If the violation was TAB_SWITCH, restoring fullscreen might not be enough if tab is still hidden?
            // Actually usually fullscreen implies focus.
            resolveViolation();
        }
    }, [triggerViolation, resolveViolation]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            triggerViolation('TAB_SWITCH', 'tab_switch_focus_lost');
        } else {
            // Note: We only resolve TAB_SWITCH if we are also in fullscreen (if required)
            if (!examSettings.require_fullscreen || document.fullscreenElement) {
                resolveViolation();
            }
        }
    }, [triggerViolation, resolveViolation, examSettings.require_fullscreen]);

    useEffect(() => {
        const handleFocus = () => { if (!document.hidden) resolveViolation(); };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('blur', handleVisibilityChange);
        window.addEventListener('focus', handleFocus);
        document.addEventListener('fullscreenchange', handleFullscreenChange);

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('blur', handleVisibilityChange);
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
        };
    }, [handleVisibilityChange, handleFullscreenChange, resolveViolation]);

    // --- Periodic Integrity Snapshots ---
    useEffect(() => {
        if (connectionState === 'CONNECTED' && sessionId) {
            // Send metrics every 60s so backend can track tab_switches over time
            integrityService.startPeriodicSnapshots(
                (data) => vivaWebSocket.send(data),
                60000
            );
        }
        return () => {
            integrityService.stopPeriodicSnapshots();
        };
    }, [connectionState, sessionId]);


    // --- Timer Logic ---

    useEffect(() => {
        if (violation.isWarning) {
            timerRef.current = setInterval(() => {
                decrementViolationTimer();
            }, 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [violation.isWarning, decrementViolationTimer]);

    // Check for Expiry
    useEffect(() => {
        if (violation.isWarning && violation.remainingSeconds <= 0) {
            // Time's up
            terminateSession();
        }
    }, [violation.isWarning, violation.remainingSeconds, terminateSession]);


    // --- Helper ---

    const requestFullscreen = useCallback(async () => {
        try {
            if (!document.fullscreenElement) {
                await document.documentElement.requestFullscreen();
            }
        } catch (err) {
            Logger.error('Error attempting to enable full-screen mode:', err);
        }
    }, []);

    return { requestFullscreen };
};
