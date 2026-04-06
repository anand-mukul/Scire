'use client';

import React from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { TranscriptSpeaker } from '@/types/backend';
import { toast } from 'sonner';
import { CalibrationPhase } from '@/components/viva/phases/CalibrationPhase';
import { QuestionPhase } from '@/components/viva/phases/QuestionPhase';
import { ListeningPhase } from '@/components/viva/phases/ListeningPhase';
import { ThinkPhase } from '@/components/viva/phases/ThinkPhase';
import { EvaluationPhase } from '@/components/viva/phases/EvaluationPhase';
import { TTSPlayer } from '@/components/viva/TTSPlayer';
import { useExamIntegrity } from '@/hooks/use-exam-integrity';
import { LogOut, CheckCircle, Maximize, Timer as TimerIcon, AlertTriangle, WifiOff, Monitor, Mic, MicOff, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { MediaManager } from '@/components/viva/MediaManager';
import { audioManager } from '@/services/audioManager';
import AIOrb from '../visuals/AIOrb';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/network/api';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { TranscriptSheet } from './TranscriptSheet';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { cn } from '@/lib/utils';
import { StudentToolbar } from './StudentToolbar';


// Push-to-Talk Mic Toolbar — Fixed at bottom center
const MicToolbar = () => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const isMicUnmuted = useSessionStore((state) => state.isMicUnmuted);
    const setMicUnmuted = useSessionStore((state) => state.setMicUnmuted);
    const userVolume = useSessionStore((state) => state.userVolume);
    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);

    // Mic button is ONLY enabled during THINK, LISTENING, and SCAFFOLD phases
    const canToggle = [
        DialogueState.THINK,
        DialogueState.LISTENING,
        DialogueState.SCAFFOLD,
        DialogueState.CALIBRATION,
    ].includes(fsmState) && !isAgentSpeaking;

    const handleMicToggle = async () => {
        if (!canToggle) return;

        // Initialize AudioContext on user gesture (solves autoplay policy)
        try {
            await audioManager.initialize();
        } catch {
            // Already initialized or error — proceed
        }

        setMicUnmuted(!isMicUnmuted);
    };

    // Visual volume ring scale (0.0 - 1.0 → 1.0 - 1.4)
    const volumeScale = isMicUnmuted ? 1 + (userVolume * 0.4) : 1;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[80] animate-in slide-in-from-bottom fade-in duration-500">
            <div className="flex items-center bg-black/80 backdrop-blur-xl border border-white/10 rounded-full p-2 shadow-2xl">
                <button
                    onClick={handleMicToggle}
                    disabled={!canToggle}
                    className={cn(
                        "relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black",
                        canToggle ? "cursor-pointer" : "cursor-not-allowed opacity-40",
                        isMicUnmuted
                            ? "bg-emerald-500 hover:bg-emerald-400 text-white shadow-lg shadow-emerald-500/40 focus:ring-emerald-500"
                            : "bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 focus:ring-neutral-500",
                        canToggle && !isMicUnmuted && "animate-pulse"
                    )}
                >
                    {/* Volume ring */}
                    {isMicUnmuted && (
                        <div
                            className="absolute inset-0 rounded-full border-2 border-emerald-400/50 transition-transform duration-150 ease-out"
                            style={{ transform: `scale(${volumeScale})` }}
                        />
                    )}
                    {isMicUnmuted ? (
                        <Mic className="w-6 h-6 relative z-10" />
                    ) : (
                        <MicOff className="w-6 h-6 relative z-10" />
                    )}
                </button>
            </div>
        </div>
    );
};

// Interactive Auth Phase — Acts as user interaction gateway to start AudioContext
const AuthPhase = () => {
    const handleStart = async () => {
        try {
            await audioManager.initialize();
            vivaWebSocket.startSession();
        } catch (error) {
            console.error("Failed to initialize audio:", error);
            toast.error("Failed to access microphone. Please ensure permissions are granted.");
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center animate-in fade-in duration-500">
            <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">Microphone Check</h2>
                <p className="text-muted-foreground text-sm max-w-[280px] mx-auto leading-relaxed">
                    Please test your microphone to ensure your audio is clear before starting the exam.
                </p>
            </div>
            <Button 
                size="lg" 
                onClick={handleStart} 
                className="mt-6 rounded-full px-8 shadow-md hover:-translate-y-0.5 transition-transform"
            >
                <Mic className="mr-2 h-4 w-4" />
                Test Mic & Join
            </Button>
        </div>
    );
};

// Proper End Phase with completion summary
const EndPhase: React.FC = () => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const examSettings = useSessionStore((state) => state.examSettings);
    const router = useRouter();

    const isTerminated = fsmState === DialogueState.TERMINATED;
    const totalConfigured = examSettings?.number_of_questions || 0;
    const questionsAsked = useSessionStore((state) => state.questionsAsked);
    const questionCount = Math.min(questionsAsked, totalConfigured);

    return (
        <div className="text-center space-y-6 py-8 animate-in zoom-in-95 duration-700 ease-out">
            <div className="relative inline-flex items-center justify-center">
                <div className={cn(
                    "absolute inset-0 rounded-full opacity-20 blur-2xl",
                    isTerminated ? "bg-red-500" : "bg-emerald-500"
                )} />
                <div className={cn(
                    "relative z-10 w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-2xl",
                    isTerminated
                        ? "bg-red-950/50 border-red-500/50 text-red-400"
                        : "bg-emerald-950/50 border-emerald-500/50 text-emerald-400"
                )}>
                    {isTerminated ? <AlertTriangle className="w-12 h-12" /> : <CheckCircle className="w-12 h-12" />}
                </div>
            </div>

            <div className="space-y-2">
                <h2 className="text-4xl font-extrabold tracking-tight text-foreground bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                    {isTerminated ? 'Session Terminated' : 'Session Completed'}
                </h2>

                <p className="text-muted-foreground/80 max-w-md mx-auto text-lg">
                    {isTerminated
                        ? 'Your session was terminated due to an integrity violation. Contact your instructor for details.'
                        : 'Your responses have been successfully submitted for grading. Results will wrap up shortly.'}
                </p>
            </div>

            {!isTerminated && questionCount > 0 && (
                <div className="flex justify-center gap-6 text-sm mt-8 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                    <div className="bg-muted/30 px-6 py-4 rounded-2xl border border-white/5 shadow-inner">
                        <span className="block text-3xl font-mono font-black text-foreground mb-1">{questionCount}</span>
                        <span className="text-muted-foreground font-medium tracking-wide uppercase text-xs">Questions Answered</span>
                    </div>
                </div>
            )}

            <Button
                onClick={() => router.push('/student/history')}
                variant="outline"
                className="mt-8 border-white/10 hover:bg-white/5 hover:text-white rounded-full px-8 py-6 shadow-xl transition-all hover:scale-105 active:scale-95"
            >
                Return to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
        </div>
    );
};

// Mobile detection — block exam on mobile/tablet
const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const check = () => {
            const isNarrow = window.innerWidth < 768;
            const isCoarsePointer = window.matchMedia('(any-pointer: coarse)').matches;
            setIsMobile(isCoarsePointer && isNarrow);
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return isMobile;
};

// Exam duration timer (overall session timer)
const ExamTimer: React.FC<{ expiryTime: string | null }> = ({ expiryTime }) => {
    const [timeLeft, setTimeLeft] = React.useState<string>("00:00");
    const [percent, setPercent] = React.useState(100);
    const settings = useSessionStore((state) => state.examSettings);

    React.useEffect(() => {
        if (!expiryTime) return;

        const interval = setInterval(() => {
            const now = new Date().getTime();
            const expiry = new Date(expiryTime).getTime();
            const diff = expiry - now;

            const durationMinutes = settings?.duration_minutes || 15;
            const total = durationMinutes * 60 * 1000;

            if (diff <= 0) {
                setTimeLeft("00:00");
                setPercent(0);
                return;
            }

            const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const s = Math.floor((diff % (1000 * 60)) / 1000);
            setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
            setPercent(Math.max(0, (diff / total) * 100));
        }, 1000);

        return () => clearInterval(interval);
    }, [expiryTime, settings]);

    if (!expiryTime) return null;

    return (
        <div className="flex items-center gap-2 font-mono text-sm font-medium bg-muted/40 px-3 py-1.5 rounded-full border border-border text-muted-foreground">
            <TimerIcon className="w-3.5 h-3.5 text-primary" />
            <span>{timeLeft}</span>
            <div className="w-12 h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className={cn(
                        "h-full transition-all duration-1000 ease-linear rounded-full",
                        percent < 20 ? "bg-red-500" : "bg-primary"
                    )}
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// Phase elapsed timer — shows how long current phase has been active, or countdown for THINK
const PhaseTimer: React.FC<{ fsmState: DialogueState }> = ({ fsmState }) => {
    const [elapsed, setElapsed] = React.useState(0);
    const [timeLeft, setTimeLeft] = React.useState(15);

    React.useEffect(() => {
        setElapsed(0);
        setTimeLeft(15);
        
        if (fsmState === DialogueState.THINK) {
            const timer = setInterval(() => {
                setTimeLeft(prev => Math.max(0, prev - 1));
            }, 1000);
            return () => clearInterval(timer);
        } else {
            const timer = setInterval(() => {
                setElapsed(prev => prev + 1);
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [fsmState]);

    // Don't show for non-interactive phases
    if (fsmState === DialogueState.AUTH || fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) {
        return null;
    }

    if (fsmState === DialogueState.THINK) {
        return (
            <div className="flex items-center ml-2 gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-full border border-yellow-500/20">
                <div className="w-12 h-1.5 bg-yellow-950/50 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-yellow-400 transition-all duration-1000 ease-linear rounded-full" 
                        style={{ width: `${(timeLeft / 15) * 100}%` }} 
                    />
                </div>
            </div>
        );
    }

    return (
        <span className="text-muted-foreground/50 font-mono text-xs tabular-nums ml-1">
            {elapsed}s
        </span>
    );
};

// Get status badge text and color based on FSM state
const getStatusBadge = (fsmState: DialogueState, isAgentSpeaking: boolean) => {
    if (isAgentSpeaking) return { text: 'AI SPEAKING', color: 'border-blue-500/30 text-blue-400', dotColor: 'bg-blue-500 animate-pulse' };

    switch (fsmState) {
        case DialogueState.LISTENING:
            return { text: 'LISTENING', color: 'border-emerald-500/30 text-emerald-400', dotColor: 'bg-emerald-500 animate-pulse' };
        case DialogueState.THINK:
            return { text: 'THINK', color: 'border-yellow-500/30 text-yellow-400', dotColor: 'bg-yellow-500 animate-pulse' };
        case DialogueState.EVALUATION:
        case DialogueState.SCAFFOLD:
            return { text: 'PROCESSING', color: 'border-amber-500/30 text-amber-400', dotColor: 'bg-amber-500 animate-pulse' };
        case DialogueState.CALIBRATION:
            return { text: 'CALIBRATING', color: 'border-purple-500/30 text-purple-400', dotColor: 'bg-purple-500 animate-pulse' };
        case DialogueState.QUESTION:
        case DialogueState.TRANSFER:
            return { text: 'QUESTION', color: 'border-cyan-500/30 text-cyan-400', dotColor: 'bg-cyan-500' };
        case DialogueState.END:
            return { text: 'COMPLETED', color: 'border-neutral-500/30 text-neutral-400', dotColor: 'bg-neutral-500' };
        case DialogueState.TERMINATED:
            return { text: 'TERMINATED', color: 'border-red-500/30 text-red-400', dotColor: 'bg-red-500' };
        default:
            return { text: fsmState?.toUpperCase() || 'IDLE', color: 'text-neutral-500', dotColor: 'bg-neutral-600' };
    }
};

export const VivaOrchestrator: React.FC = () => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const connectionState = useSessionStore((state) => state.connectionState);
    const error = useSessionStore((state) => state.error);
    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);
    const sessionId = useSessionStore((state) => state.sessionId);
    const transcripts = useSessionStore((state) => state.transcripts);
    const setFsmState = useSessionStore((state) => state.setFsmState);
    const violation = useSessionStore((state) => state.violation);
    const questionsAsked = useSessionStore((state) => state.questionsAsked);

    // Audio stream for visualizer
    const [audioStream, setAudioStream] = React.useState<MediaStream | null>(null);

    // Voice degradation state
    const [isVoiceUnavailable, setIsVoiceUnavailable] = React.useState(false);

    const expiryTime = useSessionStore((state) => state.expiryTime);
    const examSettings = useSessionStore((state) => state.examSettings);

    const { requestFullscreen } = useExamIntegrity(sessionId);
    const router = useRouter();
    const isMobile = useIsMobile();

    const [longConnect, setLongConnect] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [needsResumeInteraction, setNeedsResumeInteraction] = React.useState(false);
    
    const userVolume = useSessionStore((state) => state.userVolume);
    const isMicActive = useSessionStore((state) => state.isMicActive);
    const [isMicDead, setIsMicDead] = React.useState(false);

    // Dead Mic Detection
    React.useEffect(() => {
        let timeout: NodeJS.Timeout;
        // If mic is supposed to be on, agent isn't speaking, and we detect absolute 0 volume for 12 seconds
        if (isMicActive && !isAgentSpeaking && userVolume === 0) {
            timeout = setTimeout(() => setIsMicDead(true), 12000);
        } else {
            setIsMicDead(false);
        }
        return () => clearTimeout(timeout);
    }, [isMicActive, isAgentSpeaking, userVolume]);

    // Derive question info
    const totalQuestions = examSettings?.number_of_questions || 0;

    // Get the last question text for persistent subtitle
    const lastQuestionText = React.useMemo(() => {
        const lastAssistant = [...transcripts].reverse().find(t => t.speaker === TranscriptSpeaker.ASSISTANT);
        return lastAssistant?.text || null;
    }, [transcripts]);

    // Show question subtitle in QUESTION, LISTENING, EVALUATION, SCAFFOLD phases
    const showQuestionSubtitle = [
        DialogueState.QUESTION,
        DialogueState.THINK,
        DialogueState.LISTENING,
        DialogueState.EVALUATION,
        DialogueState.SCAFFOLD,
    ].includes(fsmState) && lastQuestionText && questionsAsked > 0;

    // Strict Mode Enforcement
    React.useEffect(() => {
        const checkFullscreen = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);
        };
        const handleVoiceUnavailable = () => setIsVoiceUnavailable(true);

        document.addEventListener('fullscreenchange', checkFullscreen);
        window.addEventListener('viva:voice_unavailable', handleVoiceUnavailable);

        const integrityInterval = setInterval(() => {
            if (examSettings.strict_mode && connectionState === 'CONNECTED' && !document.fullscreenElement) {
                setIsFullscreen(false);
            }
        }, 2000);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            window.removeEventListener('viva:voice_unavailable', handleVoiceUnavailable);
            clearInterval(integrityInterval);
        };
    }, [connectionState, examSettings.strict_mode]);

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (connectionState === 'CONNECTING') {
            timer = setTimeout(() => setLongConnect(true), 15000);
        } else {
            setLongConnect(false);
        }
        return () => clearTimeout(timer);
    }, [connectionState]);

    // Reconnection Gateway Logic
    React.useEffect(() => {
        if (
            connectionState === 'CONNECTED' &&
            fsmState !== DialogueState.AUTH &&
            fsmState !== DialogueState.END &&
            fsmState !== DialogueState.TERMINATED
        ) {
            // Check if audioManager needs user gesture to start
            if (!audioManager.isInitialized()) {
                setNeedsResumeInteraction(true);
            }
        }
    }, [connectionState, fsmState]);

    const handleResumeConnection = async () => {
        try {
            await audioManager.initialize();
            
            // If the exam requires fullscreen, also request it
            if (examSettings.require_fullscreen) {
                await requestFullscreen();
            }

            setNeedsResumeInteraction(false);
            
            // Un-suspend TTS player logic if needed or notify backend
            vivaWebSocket.send({ type: 'session_resume' });
        } catch (err) {
            toast.error('Failed to initialize session. Please check your microphone permissions.');
        }
    };

    // Handle Leave Session — sends abandon signal to backend
    const handleLeaveSession = async () => {
        // Stop all audio playback
        window.dispatchEvent(new CustomEvent('viva:stop_audio'));
        if (sessionId) {
            try {
                vivaWebSocket.send({ type: 'session_leave' });
            } catch {
                // If WS send fails, backend will auto-abandon on disconnect
            }
        }
        router.push('/student');
    };

    // Handle Submit — ends session properly with grading trigger
    const handleFinish = async () => {
        if (fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) return;
        if (isSubmitting) return;

        if (sessionId) {
            setIsSubmitting(true);
            setFsmState(DialogueState.END);
            // Stop all audio playback immediately
            window.dispatchEvent(new CustomEvent('viva:stop_audio'));
            try {
                await api.sessions.end(sessionId);
                // Full shutdown: disconnect WS and reset state
                vivaWebSocket.disconnect(false);
                useSessionStore.getState().resetSession();
                toast.success("Exam Submitted Successfully");
                // Immediate redirect to history
                router.push('/student/history');
            } catch (err: any) {
                if (err.message?.includes("completed") || err.message?.includes("finished")) {
                    // Already completed — still redirect
                    router.push('/student/history');
                } else {
                    console.error("Submission failed:", err);
                    toast.error("Submission Error. Please try again.");
                    setIsSubmitting(false);
                }
            }
        }
    };

    const renderPhase = () => {
        switch (fsmState) {
            case DialogueState.AUTH: return <AuthPhase />;
            case DialogueState.CALIBRATION: return <CalibrationPhase stream={audioStream} />;
            case DialogueState.QUESTION:
            case DialogueState.TRANSFER: return <QuestionPhase />;
            case DialogueState.THINK: return <ThinkPhase />;
            case DialogueState.LISTENING:
            case DialogueState.EVALUATION:
            case DialogueState.SCAFFOLD:
                return <ListeningPhase />;
            case DialogueState.END:
            case DialogueState.TERMINATED: return <EndPhase />;
            default: return <div className="text-red-500">Unknown State: {fsmState}</div>;
        }
    };

    // --- Mobile Block ---
    if (isMobile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 text-center p-8 bg-background">
                <div className="p-4 rounded-full bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/50">
                    <Monitor className="h-8 w-8" />
                </div>
                <div className="space-y-2">
                    <h3 className="text-xl font-bold text-foreground">Desktop Required</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        Exam sessions require a desktop or laptop computer with a camera and microphone. Please open this link on a compatible device.
                    </p>
                </div>
                <Button onClick={() => router.push('/student')} variant="outline" className="border-border hover:bg-muted text-foreground">
                    Return to Dashboard
                </Button>
            </div>
        );
    }

    // --- Loading / Error States ---
    if (connectionState === 'FAILED' || error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center p-8 relative overflow-hidden">
                <div className="p-4 rounded-full bg-destructive/10 text-destructive ring-1 ring-destructive/50 relative z-10">
                    <LogOut className="h-8 w-8" />
                </div>
                <div className="space-y-2 relative z-10">
                    <h3 className="text-xl font-bold text-destructive">Connection Failed</h3>
                    <p className="text-muted-foreground max-w-sm mx-auto">
                        {error || "Unable to establish a secure connection to the proctor server."}
                    </p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline" className="border-border hover:bg-muted text-foreground relative z-10">
                    Retry Connection
                </Button>
            </div>
        );
    }

    if (connectionState === 'IDLE' || connectionState === 'CONNECTING') {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen space-y-6 animate-in fade-in duration-700 relative overflow-hidden bg-background">
                <PremiumLoader text="Establishing Secure Session..." />

                <p className="text-sm text-muted-foreground relative z-10">Verifying integrity headers...</p>

                {longConnect && (
                    <div className="p-3 bg-muted/50 border border-border rounded-lg text-xs text-muted-foreground max-w-xs text-center relative z-10">
                        Wait time is longer than usual. Please check your firewall settings.
                    </div>
                )}
            </div>
        );
    }

    const statusBadge = getStatusBadge(fsmState, isAgentSpeaking);

    // --- Main UI ---
    return (
        <TooltipProvider>
            <div className={cn(
                "flex flex-col h-screen w-full bg-background overflow-hidden relative selection:bg-primary/30 transition-colors duration-500",
                violation.isWarning ? 'border-[8px] border-destructive' : ''
            )}>
                {/* Fullscreen Alert Overlay (Initial & Reconnect) */}
                {examSettings.require_fullscreen && (!isFullscreen || needsResumeInteraction) && fsmState !== DialogueState.AUTH && fsmState !== DialogueState.END && fsmState !== DialogueState.TERMINATED && !violation.isWarning && (
                    <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="flex flex-col items-center space-y-6 max-w-md text-center animate-in zoom-in-95 duration-300">
                            <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800 shadow-2xl">
                                <Maximize className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Resume Session</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    Your session requires fullscreen mode and microphone access to proceed. Click below to resume your assessment.
                                </p>
                            </div>
                            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={handleResumeConnection}>
                                Enter Fullscreen & Resume
                            </Button>
                        </div>
                    </div>
                )}

                {/* Resume Exam Component (If fullscreen is NOT required, but audio still needs gesture) */}
                {!examSettings.require_fullscreen && needsResumeInteraction && fsmState !== DialogueState.AUTH && fsmState !== DialogueState.END && fsmState !== DialogueState.TERMINATED && !violation.isWarning && (
                    <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                         <div className="flex flex-col items-center space-y-6 max-w-md text-center animate-in zoom-in-95 duration-300">
                            <div className="p-4 bg-emerald-900/40 rounded-full border border-emerald-800 shadow-2xl">
                                <Monitor className="w-8 h-8 text-emerald-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Resume Session</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    You have reconnected successfully. Click below to resume your assessment.
                                </p>
                            </div>
                            <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" onClick={handleResumeConnection}>
                                <Mic className="w-4 h-4 mr-2" /> Resume Exam
                            </Button>
                        </div>
                    </div>
                )}

                {/* Integrity Violation Warning Overlay (Highest Priority) */}
                {violation.isWarning && (
                    <div className="absolute inset-0 z-[150] bg-red-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                        <div className="relative mb-8">
                            <div className="absolute inset-0 animate-ping rounded-full bg-red-500/30 duration-1000" />
                            <div className="relative bg-black/50 border-4 border-red-500 rounded-full w-40 h-40 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.5)]">
                                <span className="text-6xl font-mono font-bold text-white tabular-nums tracking-tighter">
                                    {violation.remainingSeconds}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-4 max-w-md">
                            <h2 className="text-3xl font-bold text-white tracking-tight uppercase">Integrity Violation</h2>
                            <p className="text-red-200 text-lg leading-relaxed">
                                You have exited the secure environment. Return immediately to avoid automatic session termination.
                            </p>
                        </div>

                        <Button
                            size="lg"
                            onClick={requestFullscreen}
                            className="mt-10 bg-white text-red-600 hover:bg-neutral-100 font-bold text-lg px-8 py-6 h-auto shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:scale-105 transition-all w-full max-w-xs"
                        >
                            RETURN TO EXAM
                        </Button>
                    </div>
                )}

                {/* Voice Degradation Banner */}
                {isVoiceUnavailable && (
                    <div className="absolute top-0 left-0 right-0 z-[90] bg-amber-900/90 border-b border-amber-700 px-4 py-2 flex items-center justify-center gap-2 text-sm text-amber-200 animate-in slide-in-from-top duration-300">
                        <WifiOff className="w-4 h-4" />
                        <span>Voice service unavailable — switched to text-only mode</span>
                    </div>
                )}

                {/* --- Top Bar --- */}
                <header className={cn("flex justify-between items-center px-6 py-3 z-50 bg-gradient-to-b from-black/60 to-transparent", isVoiceUnavailable && "mt-8")}>
                    {/* Left: Exit */}
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors h-9 w-9">
                                        <LogOut className="w-4 h-4" />
                                    </Button>
                                </AlertDialogTrigger>
                            </TooltipTrigger>
                            <TooltipContent side="right">
                                <p>Leave Exam</p>
                            </TooltipContent>
                        </Tooltip>
                        <AlertDialogContent className="bg-card/95 border-border text-foreground backdrop-blur-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="text-foreground">Leave Exam Session?</AlertDialogTitle>
                                <AlertDialogDescription className="text-muted-foreground">
                                    Your session will be marked as <strong>abandoned</strong>. Your progress up to this point is saved, but you may not be able to resume. Are you sure?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleLeaveSession} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none">
                                    Leave Session
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Center: Timer + Question Counter */}
                    <div className="flex items-center gap-3">
                        <ExamTimer expiryTime={expiryTime} />

                        {/* Question Number — always visible when exam has questions */}
                        {totalQuestions > 0 && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border text-xs font-mono text-muted-foreground">
                                <span className="text-foreground font-bold">Q{questionsAsked || '-'}</span>
                                <span>/</span>
                                <span>{totalQuestions}</span>
                            </div>
                        )}
                    </div>

                    {/* Right: Status + Phase Timer + Transcript + Submit */}
                    <div className="flex items-center gap-2">
                        {/* Status Badge with Phase Timer */}
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border text-xs font-mono transition-colors ${statusBadge.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                            <span>{statusBadge.text}</span>
                            <PhaseTimer fsmState={fsmState} />
                        </div>

                        <TranscriptSheet transcripts={transcripts} />

                        {/* Submit with Confirmation */}
                        <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-0 h-8 px-3 text-xs"
                                            disabled={isSubmitting || fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED}
                                        >
                                            <span className="hidden sm:inline mr-1.5">Submit</span>
                                            <CheckCircle className="w-3.5 h-3.5" />
                                        </Button>
                                    </AlertDialogTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="left">
                                    <p>Finish & Submit Exam</p>
                                </TooltipContent>
                            </Tooltip>
                            <AlertDialogContent className="bg-card/95 border-border text-foreground backdrop-blur-xl">
                                <AlertDialogHeader>
                                    <AlertDialogTitle className="text-foreground">Submit Exam?</AlertDialogTitle>
                                    <AlertDialogDescription className="text-muted-foreground">
                                        This will end your exam session and submit all responses for grading. This action cannot be undone.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">Continue Exam</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleFinish} className="bg-emerald-600 hover:bg-emerald-500 text-white border-none">
                                        {isSubmitting ? 'Submitting...' : 'Submit & Finish'}
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </div>
                </header>

                {/* --- Main Content --- */}
                <main className="flex-1 flex flex-col relative z-0">
                    {/* Global Mic Warning */}
                    {isMicDead && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top fade-in duration-300 pointer-events-none">
                            <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/30 text-destructive px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
                                <AlertTriangle className="w-4 h-4 animate-pulse" />
                                <span className="text-sm font-medium">No audio detected. Please check your microphone or browser permissions.</span>
                            </div>
                        </div>
                    )}

                    <div className="max-w-7xl mx-auto px-4 h-full flex flex-col py-6 relative z-10">
                    {/* AI Orb - Center Stage */}
                    <div className="flex-1 flex items-center justify-center relative z-10 -mt-6">
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-[70vw] max-w-[350px] aspect-square relative cursor-default">
                                <AIOrb />
                            </div>

                            {/* Persistent Question Subtitle — visible across QUESTION → LISTENING → EVALUATION */}
                            {showQuestionSubtitle && (
                                <div className="max-w-2xl px-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <p className="text-base md:text-lg text-foreground/80 font-medium leading-relaxed italic">
                                        &quot;{lastQuestionText}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dynamic Phase Content (Captions/Inputs) — minimal bottom area */}
                    <div className="relative z-20 w-full max-w-2xl mx-auto px-6 pb-28 min-h-[80px] flex items-center justify-center">
                        <div className="w-full">
                            {renderPhase()}
                        </div>
                    </div>
                </div>
            </main>

                {/* Functional Components */}
                <TTSPlayer />
                <MediaManager onStreamReady={setAudioStream} />

                {/* Push-to-Talk Mic Toolbar — Fixed bottom center */}
                {fsmState !== DialogueState.AUTH && fsmState !== DialogueState.END && fsmState !== DialogueState.TERMINATED && (
                    <>
                        <StudentToolbar />
                        <MicToolbar />
                    </>
                )}

            </div>
        </TooltipProvider>
    );
};
