'use client';

import React from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { TranscriptSpeaker } from '@/types/backend';
import { toast } from 'sonner';
import { CalibrationPhase } from '@/components/viva/phases/CalibrationPhase';
import { QuestionPhase } from '@/components/viva/phases/QuestionPhase';
import { ListeningPhase } from '@/components/viva/phases/ListeningPhase';
import { EvaluationPhase } from '@/components/viva/phases/EvaluationPhase';
import { TTSPlayer } from '@/components/viva/TTSPlayer';
import { useExamIntegrity } from '@/hooks/use-exam-integrity';
import { LogOut, CheckCircle, Maximize, Timer as TimerIcon, AlertTriangle, WifiOff, Monitor } from 'lucide-react';
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
import AIOrb from '../visuals/AIOrb';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/network/api';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { TranscriptSheet } from './TranscriptSheet';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { cn } from '@/lib/utils';


// Placeholder for Auth phase
const AuthPhase = () => <div className="text-center p-8 text-neutral-400 animate-pulse">Authenticating Secure Session...</div>;

// Proper End Phase with completion summary
const EndPhase: React.FC = () => {
    const transcripts = useSessionStore((state) => state.transcripts);
    const fsmState = useSessionStore((state) => state.fsmState);
    const examSettings = useSessionStore((state) => state.examSettings);
    const router = useRouter();

    const isTerminated = fsmState === DialogueState.TERMINATED;
    // Use the actual questions_asked from exam flow, not transcript count
    // Counting ASSISTANT transcripts is wrong — it includes calibration, scaffolds, system messages
    const totalConfigured = examSettings?.number_of_questions || 0;
    const questionCount = Math.min(
        transcripts.filter(t =>
            t.speaker === TranscriptSpeaker.ASSISTANT &&
            t.text.length > 30 &&
            !t.text.startsWith('Welcome to the exam') &&
            !t.text.startsWith("The exam is now complete") &&
            !t.text.startsWith("I didn't hear you")
        ).length,
        totalConfigured
    );

    return (
        <div className="text-center space-y-4 py-4">
            <div className={cn(
                "inline-flex items-center justify-center w-16 h-16 rounded-full mb-2",
                isTerminated
                    ? "bg-destructive/10 text-destructive"
                    : "bg-emerald-500/10 text-emerald-400"
            )}>
                {isTerminated ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle className="w-8 h-8" />}
            </div>

            <h2 className="text-2xl font-bold text-foreground">
                {isTerminated ? 'Session Terminated' : 'Session Completed'}
            </h2>

            <p className="text-muted-foreground max-w-md mx-auto">
                {isTerminated
                    ? 'Your session was terminated due to an integrity violation. Contact your instructor for details.'
                    : 'Your responses have been submitted for grading. Results will be available once reviewed.'}
            </p>

            {!isTerminated && questionCount > 0 && (
                <div className="flex justify-center gap-6 text-sm text-muted-foreground mt-4">
                    <div className="bg-muted/40 px-4 py-2 rounded-lg border border-border">
                        <span className="font-mono font-bold text-foreground text-lg">{questionCount}</span>
                        <span className="ml-2">Questions Answered</span>
                    </div>
                </div>
            )}

            <Button
                onClick={() => router.push('/student')}
                variant="outline"
                className="mt-6 border-border hover:bg-muted text-foreground"
            >
                Return to Dashboard
            </Button>
        </div>
    );
};

// Mobile detection — block exam on mobile/tablet
const useIsMobile = () => {
    const [isMobile, setIsMobile] = React.useState(false);

    React.useEffect(() => {
        const check = () => {
            const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
            const isNarrow = window.innerWidth < 768;
            const isCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
            setIsMobile((hasTouchScreen && isNarrow) || (isCoarsePointer && isNarrow));
        };
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    return isMobile;
};

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
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
            <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm font-medium bg-muted/40 px-3 py-1 rounded-full border border-border">
                <TimerIcon className="w-3 h-3 text-primary" />
                {timeLeft}
            </div>
            <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                    className="h-full bg-primary transition-all duration-1000 ease-linear rounded-full"
                    style={{ width: `${percent}%` }}
                />
            </div>
        </div>
    );
};

// Get status badge text and color based on FSM state
const getStatusBadge = (fsmState: DialogueState, isAgentSpeaking: boolean) => {
    if (isAgentSpeaking) return { text: 'AI SPEAKING', color: 'border-blue-500/50 text-blue-400', dotColor: 'bg-blue-500 animate-pulse' };

    switch (fsmState) {
        case DialogueState.LISTENING:
            return { text: 'LISTENING', color: 'border-emerald-500/50 text-emerald-400', dotColor: 'bg-emerald-500 animate-pulse' };
        case DialogueState.EVALUATION:
        case DialogueState.SCAFFOLD:
            return { text: 'PROCESSING', color: 'border-amber-500/50 text-amber-400', dotColor: 'bg-amber-500 animate-pulse' };
        case DialogueState.CALIBRATION:
            return { text: 'CALIBRATING', color: 'border-purple-500/50 text-purple-400', dotColor: 'bg-purple-500 animate-pulse' };
        case DialogueState.QUESTION:
        case DialogueState.TRANSFER:
            return { text: 'QUESTION', color: 'border-cyan-500/50 text-cyan-400', dotColor: 'bg-cyan-500' };
        case DialogueState.END:
            return { text: 'COMPLETED', color: 'border-neutral-500/50 text-neutral-400', dotColor: 'bg-neutral-500' };
        case DialogueState.TERMINATED:
            return { text: 'TERMINATED', color: 'border-red-500/50 text-red-400', dotColor: 'bg-red-500' };
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

    // Handle Leave Session — sends abandon signal to backend
    const handleLeaveSession = async () => {
        if (sessionId) {
            try {
                // Send leave signal through WS so backend marks session as ABANDONED
                vivaWebSocket.send({ type: 'session_leave' });
            } catch {
                // If WS send fails, that's fine — backend will auto-abandon on disconnect
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
            try {
                await api.sessions.end(sessionId);
                vivaWebSocket.disconnect(false); // Disconnect but keep state
                toast.success("Exam Submitted Successfully");
                // Auto-redirect to history after short delay
                setTimeout(() => {
                    router.push('/student/history');
                }, 2000);
            } catch (err: any) {
                if (err.message?.includes("completed") || err.message?.includes("finished")) {
                    // Already completed — treat as success
                } else {
                    console.error("Submission failed:", err);
                    toast.error("Submission Error. Please try again.");
                }
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const renderPhase = () => {
        switch (fsmState) {
            case DialogueState.AUTH: return <AuthPhase />;
            case DialogueState.CALIBRATION: return <CalibrationPhase stream={audioStream} />;
            case DialogueState.QUESTION:
            case DialogueState.TRANSFER: return <QuestionPhase />;
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
                {/* Fullscreen Alert Overlay (Initial) */}
                {examSettings.require_fullscreen && !isFullscreen && fsmState !== DialogueState.AUTH && fsmState !== DialogueState.END && !violation.isWarning && (
                    <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
                        <div className="flex flex-col items-center space-y-6 max-w-md text-center animate-in zoom-in-95 duration-300">
                            <div className="p-4 bg-neutral-900 rounded-full border border-neutral-800 shadow-2xl">
                                <Maximize className="w-8 h-8 text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground mb-2">Fullscreen Required</h2>
                                <p className="text-muted-foreground leading-relaxed">
                                    This exam session requires fullscreen mode for integrity. Please enable it to proceed with the assessment.
                                </p>
                            </div>
                            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20" onClick={requestFullscreen}>
                                Enter Fullscreen
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
                <header className={cn("flex justify-between items-center px-6 py-4 z-50 bg-gradient-to-b from-black/80 to-transparent", isVoiceUnavailable && "mt-8")}>
                    {/* Left: Exit */}
                    <AlertDialog>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-full transition-colors">
                                        <LogOut className="w-5 h-5" />
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

                    {/* Center: Timer */}
                    <div className="flex items-start gap-8">
                        <div className="hidden md:flex items-center gap-4">
                            <ExamTimer expiryTime={expiryTime} />
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border border-neutral-800 text-xs font-mono transition-colors ${statusBadge.color}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusBadge.dotColor}`} />
                            {statusBadge.text}
                        </div>

                        <TranscriptSheet transcripts={transcripts} />

                        {/* Submit with Confirmation */}
                        <AlertDialog>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            size="sm"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-0"
                                            disabled={isSubmitting || fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED}
                                        >
                                            <span className="hidden sm:inline mr-2">Submit</span>
                                            <CheckCircle className="w-4 h-4" />
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
                    {/* AI Orb - Center Stage */}
                    <div className="flex-1 flex items-center justify-center relative z-10 -mt-10">
                        <div className="w-[80vw] max-w-[400px] aspect-square relative cursor-default">
                            <AIOrb />
                        </div>
                    </div>

                    {/* Dynamic Phase Content (Captions/Inputs) */}
                    <div className="relative z-20 w-full max-w-3xl mx-auto px-6 pb-12 min-h-[120px] flex items-center justify-center">
                        <div className="w-full backdrop-blur-sm bg-black/40 rounded-2xl p-6 border border-white/5 shadow-2xl transition-all duration-300">
                            {renderPhase()}
                        </div>
                    </div>
                </main>

                {/* Functional Components */}
                <TTSPlayer />
                <MediaManager onStreamReady={setAudioStream} />

            </div>
        </TooltipProvider>
    );
};
