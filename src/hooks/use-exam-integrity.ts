import { useEffect, useCallback, useRef } from 'react';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Logger } from '@/lib/logger';
import { integrityService } from '@/services/integrityService';

// Narrowed type that matches what the session store accepts (excludes 'UNKNOWN')
type ViolationType = 'FULLSCREEN' | 'TAB_SWITCH' | 'FACE_MISSING' | 'GAZE_DEVIATION' | 'COPY_ATTEMPT';

const GRACE_PERIOD_SECONDS = 15; // Give 15s to return (up from 10)

export const useExamIntegrity = (sessionId: string | null) => {
    const connectionState = useSessionStore((state) => state.connectionState);
    const examSettings = useSessionStore((state) => state.examSettings);
    const violation = useSessionStore((state) => state.violation);
    const setViolationState = useSessionStore((state) => state.setViolationState);
    const decrementViolationTimer = useSessionStore((state) => state.decrementViolationTimer);
    const incrementStrike = useSessionStore((state) => state.incrementStrike);
    const setFsmState = useSessionStore((state) => state.setFsmState);

    const router = useRouter();
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Derive strict mode and max strikes from exam settings
    const strictMode = examSettings?.strict_mode ?? false;
    const maxStrikes = examSettings?.max_tab_switches ?? 3;

    // ═══════════════════════════════════════════════════════════════
    // Violation Handlers (Phase 3: 3-Strike System)
    // ═══════════════════════════════════════════════════════════════

    const triggerViolation = useCallback((type: ViolationType, reason: string) => {
        if (!sessionId || connectionState !== 'CONNECTED') return;

        // If already in warning state, do nothing (timer continues)
        if (useSessionStore.getState().violation.isWarning) return;

        const currentFsm = useSessionStore.getState().fsmState;
        if (currentFsm === DialogueState.END || currentFsm === DialogueState.TERMINATED) return;

        Logger.warn(`Integrity Alert: ${reason} (type: ${type})`);

        // Start Grace Period
        setViolationState(true, type, GRACE_PERIOD_SECONDS);

        const currentStrikes = useSessionStore.getState().violation.strikes;
        const maxStrikesVal = useSessionStore.getState().violation.maxStrikes;
        const strikesRemaining = maxStrikesVal - currentStrikes;

        toast.error("⚠️ Integrity Violation Detected", {
            description: `Return to the exam immediately. ${strikesRemaining} strike${strikesRemaining !== 1 ? 's' : ''} remaining before termination.`,
            duration: 7000,
        });

        // Notify Backend with full metrics
        const metrics = integrityService.getMetrics();
        vivaWebSocket.send({
            type: 'integrity_snapshot',
            data: {
                ...metrics,
                reason: reason,
                violation_type: type,
                severity: currentStrikes >= maxStrikesVal - 1 ? 'high' : 'medium',
            }
        });

    }, [sessionId, connectionState, setViolationState]);

    const resolveViolation = useCallback(() => {
        if (useSessionStore.getState().violation.isWarning) {
            Logger.log('Integrity Restored — violation resolved before grace period expired.');
            setViolationState(false, null, 0);
            toast.success("Exam Session Restored", {
                description: "Please stay focused on your exam.",
                duration: 3000,
            });
        }
    }, [setViolationState]);

    /**
     * Called when the grace period timer expires.
     * Increments the strike counter. On final strike, terminate.
     */
    const handleGracePeriodExpiry = useCallback(async () => {
        if (!sessionId) return;

        const currentFsm = useSessionStore.getState().fsmState;
        if (currentFsm === DialogueState.END || currentFsm === DialogueState.TERMINATED) {
            Logger.log("Session already finished, ignoring strike.");
            return;
        }

        // Increment and get the new count
        const newStrikeCount = incrementStrike();
        const maxStrikesVal = useSessionStore.getState().violation.maxStrikes;

        // Clear warning state (the grace period is over)
        setViolationState(false, null, 0);

        if (newStrikeCount >= maxStrikesVal) {
            // FINAL STRIKE — TERMINATE
            Logger.error(`Integrity Violation: ${newStrikeCount}/${maxStrikesVal} strikes — Terminating Session`);

            if (timerRef.current) clearInterval(timerRef.current);

            setFsmState(DialogueState.TERMINATED);

            try {
                await api.sessions.terminate(sessionId, `Integrity Violation: ${newStrikeCount} strikes exceeded maximum (${maxStrikesVal})`);
                toast.error("Session Terminated", {
                    description: `You exceeded the maximum allowed violations (${maxStrikesVal} strikes).`,
                    duration: Infinity,
                });
                router.push('/student');
            } catch (err) {
                Logger.error('Failed to terminate session:', err);
            }
        } else {
            // NOT the final strike — warn but allow continuation
            const remaining = maxStrikesVal - newStrikeCount;
            Logger.warn(`Strike ${newStrikeCount}/${maxStrikesVal} recorded. ${remaining} remaining.`);
            toast.warning(`Strike ${newStrikeCount} of ${maxStrikesVal}`, {
                description: `You have ${remaining} strike${remaining !== 1 ? 's' : ''} left before your exam is terminated.`,
                duration: 10000,
            });
        }

    }, [sessionId, incrementStrike, setViolationState, setFsmState, router]);


    // ═══════════════════════════════════════════════════════════════
    // Event Listeners (Fullscreen + Tab visibility)
    // ═══════════════════════════════════════════════════════════════

    const handleFullscreenChange = useCallback(() => {
        if (!document.fullscreenElement) {
            triggerViolation('FULLSCREEN', 'fullscreen_exit');
        } else {
            resolveViolation();
        }
    }, [triggerViolation, resolveViolation]);

    const handleVisibilityChange = useCallback(() => {
        if (document.hidden) {
            triggerViolation('TAB_SWITCH', 'tab_switch_focus_lost');
        } else {
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


    // ═══════════════════════════════════════════════════════════════
    // Phase 1: Browser Lockdown activation (based on strict_mode)
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (connectionState === 'CONNECTED' && sessionId && strictMode) {
            integrityService.activateLockdown();
        }
        return () => {
            integrityService.deactivateLockdown();
        };
    }, [connectionState, sessionId, strictMode]);


    // ═══════════════════════════════════════════════════════════════
    // Phase 2: Wire gaze violation callback
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (connectionState === 'CONNECTED' && sessionId) {
            integrityService.setGazeViolationCallback(
                (type: ViolationType, reason: string) => {
                    triggerViolation(type, reason);
                }
            );
        }
        return () => {
            integrityService.setGazeViolationCallback(null as any);
        };
    }, [connectionState, sessionId, triggerViolation]);


    // ═══════════════════════════════════════════════════════════════
    // Periodic Integrity Snapshots
    // ═══════════════════════════════════════════════════════════════

    useEffect(() => {
        if (connectionState === 'CONNECTED' && sessionId) {
            // Send metrics every 60s so backend can track violations over time
            integrityService.startPeriodicSnapshots(
                (data) => vivaWebSocket.send(data),
                60000
            );
        }
        return () => {
            integrityService.stopPeriodicSnapshots();
        };
    }, [connectionState, sessionId]);


    // ═══════════════════════════════════════════════════════════════
    // Timer Logic (Phase 3 integration)
    // ═══════════════════════════════════════════════════════════════

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

    // Check for Grace Period Expiry → increment strike (not immediate termination)
    useEffect(() => {
        if (violation.isWarning && violation.remainingSeconds <= 0) {
            handleGracePeriodExpiry();
        }
    }, [violation.isWarning, violation.remainingSeconds, handleGracePeriodExpiry]);


    // ═══════════════════════════════════════════════════════════════
    // Helper
    // ═══════════════════════════════════════════════════════════════

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
