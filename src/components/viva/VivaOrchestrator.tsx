'use client';

import React from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { toast } from 'sonner';
import { CalibrationPhase } from '@/components/viva/phases/CalibrationPhase';
import { QuestionPhase } from '@/components/viva/phases/QuestionPhase';
import { ListeningPhase } from '@/components/viva/phases/ListeningPhase';
import { EvaluationPhase } from '@/components/viva/phases/EvaluationPhase';
import { TTSPlayer } from '@/components/viva/TTSPlayer';
import { useExamIntegrity } from '@/hooks/use-exam-integrity';
import { Loader2, LogOut, CheckCircle, Maximize, Mic, Timer as TimerIcon } from 'lucide-react';
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
import { TranscriptDrawer } from './TranscriptDrawer';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { cn } from '@/lib/utils';


// Placeholder Components for Phases
const AuthPhase = () => <div className="text-center p-8 text-neutral-400 animate-pulse">Authenticating Secure Session...</div>;
const EndPhase = () => <div className="text-center p-8 text-xl font-bold text-neutral-200">Session Completed</div>;

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

            // Dynamic duration from settings (default 15 mins if missing)
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
            // Calculate percentage based on Remaining / Total
            // Note: This assumes we start at 'total'. If we join late, valid behavior is showing remaining portion of Total.
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

    // Local state for degradation notice
    const [isVoiceUnavailable, setIsVoiceUnavailable] = React.useState(false);

    const expiryTime = useSessionStore((state) => state.expiryTime);
    const examSettings = useSessionStore((state) => state.examSettings);

    const { requestFullscreen } = useExamIntegrity(sessionId);
    const router = useRouter();

    const [longConnect, setLongConnect] = React.useState(false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    // Capture the stream from MediaManager via a callback mechanism or shared state?
    // Using a ref or context would be better, but for now we can pass a setter to MediaManager?
    // Actually, MediaManager is rendered here. We can pass a prop `onStreamReady`.
    // Let's modify MediaManager to accept this prop.

    // Question Timer (60s default)
    const [questionTimeLeft, setQuestionTimeLeft] = React.useState<number>(60);
    const [currentQuestionIndex, setCurrentQuestionIndex] = React.useState<number>(0);

    React.useEffect(() => {
        if (fsmState === DialogueState.QUESTION) {
            setQuestionTimeLeft(60);
            setCurrentQuestionIndex(prev => prev + 1);
        }
    }, [fsmState]);

    React.useEffect(() => {
        if (fsmState !== DialogueState.LISTENING && fsmState !== DialogueState.QUESTION) return;

        const interval = setInterval(() => {
            setQuestionTimeLeft((prev) => {
                if (prev <= 0) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, [fsmState]);

    // Strict Mode Enforcement
    React.useEffect(() => {
        const checkFullscreen = () => {
            const isFS = !!document.fullscreenElement;
            setIsFullscreen(isFS);
            if (examSettings.strict_mode && !isFS && connectionState === 'CONNECTED') {
                // Aggressively request or warn
                // We can't requestFullscreen without user gesture, so we rely on the overlay to block interaction
            }
        };
        const handleVoiceUnavailable = () => setIsVoiceUnavailable(true);

        document.addEventListener('fullscreenchange', checkFullscreen);
        window.addEventListener('viva:voice_unavailable', handleVoiceUnavailable);

        // Auto-fullscreen on mount if requirements met
        if (connectionState === 'CONNECTED' && examSettings.strict_mode && !document.fullscreenElement) {
            // Try once, might fail
            requestFullscreen().catch(() => { });
        }

        // Strict Mode interval check
        const integrityInterval = setInterval(() => {
            if (examSettings.strict_mode && connectionState === 'CONNECTED' && !document.fullscreenElement) {
                setIsFullscreen(false); // Trigger overlay
            }
        }, 2000);

        return () => {
            document.removeEventListener('fullscreenchange', checkFullscreen);
            window.removeEventListener('viva:voice_unavailable', handleVoiceUnavailable);
            clearInterval(integrityInterval);
        };
    }, [connectionState, examSettings.strict_mode, requestFullscreen]);

    React.useEffect(() => {
        let timer: NodeJS.Timeout;
        if (connectionState === 'CONNECTING') {
            timer = setTimeout(() => setLongConnect(true), 15000);
        } else {
            setLongConnect(false);
        }
        return () => clearTimeout(timer);
    }, [connectionState]);

    // Handle Finish
    const handleFinish = async () => {
        if (fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) return;

        if (sessionId) {
            // Optimistic update
            setFsmState(DialogueState.END);
            try {
                await api.sessions.end(sessionId);
                toast.success("Exam Submitted Successfully");
                router.push('/student');
            } catch (err: any) {
                // Ignore "already completed" errors as success
                if (err.message?.includes("completed") || err.message?.includes("finished")) {
                    router.push('/student');
                } else {
                    console.error("Submission failed:", err);
                    toast.error("Submission Error. Please try again.");
                    // Revert state if critical failure?
                    // setFsmState(DialogueState.EVALUATION); 
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
            case DialogueState.LISTENING:
            case DialogueState.EVALUATION:
            case DialogueState.SCAFFOLD:
                return <ListeningPhase />;
            case DialogueState.END:
            case DialogueState.TERMINATED: return <EndPhase />;
            default: return <div className="text-red-500">Unknown State: {fsmState}</div>;
        }
    };

    // --- Loading / Error States ---
    if (connectionState === 'FAILED' || error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-6 text-center p-8 relative overflow-hidden">
                <AmbientGlow />
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
                <AmbientGlow />
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

    // --- Main UI ---
    return (
        <TooltipProvider>
            <div className={cn(
                "flex flex-col h-screen w-full bg-background overflow-hidden relative selection:bg-primary/30 transition-colors duration-500",
                violation.isWarning ? 'border-[8px] border-destructive' : ''
            )}>
                <AmbientGlow />
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

                {/* --- Top Bar --- */}
                <header className="flex justify-between items-center px-6 py-4 z-50 bg-gradient-to-b from-black/80 to-transparent">
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
                                    Your progress will be saved, but the session will be marked as interrupted. Are you sure you want to leave?
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel className="bg-muted border-border text-foreground hover:bg-muted/80">Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => router.push('/student')} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground border-none">
                                    Leave Session
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    {/* Center: Timer & Status */}
                    <div className="flex items-start gap-8">
                        {/* Total Exam Timer */}
                        <div className="hidden md:flex items-center gap-4">
                            <ExamTimer expiryTime={expiryTime} />
                        </div>

                        {/* Current Question Timer */}
                        <div className="hidden md:flex items-center gap-4">
                            <div className="flex flex-col items-center gap-1 min-w-[100px]">
                                <div className="flex items-center gap-2 text-muted-foreground font-mono text-sm font-medium bg-muted/40 px-3 py-1 rounded-full border border-border">
                                    <TimerIcon className={`w-3 h-3 ${questionTimeLeft < 10 ? 'text-destructive animate-pulse' : 'text-primary'}`} />
                                    {Math.floor(questionTimeLeft / 60).toString().padStart(2, '0')}:{(questionTimeLeft % 60).toString().padStart(2, '0')}
                                </div>
                                <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-linear rounded-full ${questionTimeLeft < 10 ? 'bg-destructive' : 'bg-primary'}`}
                                        style={{ width: `${(questionTimeLeft / 60) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/50 border border-neutral-800 text-xs font-mono transition-colors ${fsmState === DialogueState.LISTENING ? 'border-emerald-500/50 text-emerald-400' : 'text-neutral-500'
                            }`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${fsmState === DialogueState.LISTENING ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`} />
                            {fsmState === DialogueState.LISTENING ? 'LISTENING' : 'AI SPEAKING'}
                        </div>

                        <TranscriptDrawer transcripts={transcripts} />

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button
                                    size="sm"
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 border-0"
                                    onClick={handleFinish}
                                >
                                    <span className="hidden sm:inline mr-2">Submit</span>
                                    <CheckCircle className="w-4 h-4" />
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                                <p>Finish & Submit Exam</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                </header>

                {/* --- Main Content --- */}
                <main className="flex-1 flex flex-col relative z-0">


                    {/* AI Orb - Center Stage */}
                    <div className="flex-1 flex items-center justify-center relative z-10 -mt-10">
                        <div className="w-[80vw] max-w-[400px] aspect-square relative hover:scale-105 transition-transform duration-700 ease-out cursor-default">
                            <div className="absolute inset-0 bg-blue-500/5 rounded-full blur-3xl transform scale-150 pointer-events-none" />
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
                {/* Pass onStreamReady to capture the stream for the visualizer */}
                <MediaManager onStreamReady={setAudioStream} />

            </div>
        </TooltipProvider>
    );
};
