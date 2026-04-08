'use client';

import React, { Suspense } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { useSystemCheck, SystemStatus } from '@/hooks/use-system-check';
import { Trophy, Clock, Search, Lock, ShieldAlert, Sparkles, Zap, Flag, XCircle, Loader2, ArrowRight, PlayCircle, Repeat, FileText, Calendar, HelpCircle, Activity, CheckCircle, AlertCircle, RefreshCw, BookOpen } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { VivaSession, SessionStatus, Exam, ExamStatus } from '@/types/backend';
import { useMySessions, useExams } from '@/hooks/use-dashboard-data';
import { formatToLocalDateTime } from '@/lib/date-utils';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/network/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface StudentSession extends VivaSession {
    exam_title?: string;
    score?: number;
    final_score?: number;
}

const StatusBadge = ({ status, label, index = 0 }: { status: SystemStatus, label: string, index?: number }) => {
    const staggerStyle = { '--stagger-delay': `${index * 100 + 200}ms` } as React.CSSProperties;

    if (status === 'checking') {
        return (
            <div className="slide-up-stagger flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border transition-all duration-500"
                style={staggerStyle}>
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    {label}
                </div>
                <span className="text-xs font-mono text-muted-foreground animate-pulse">CHECKING</span>
            </div>
        );
    }

    if (status === 'ready') {
        return (
            <div className="slide-up-stagger flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 transition-all duration-500"
                style={staggerStyle}>
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <span className="check-pop inline-flex" style={staggerStyle}>
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </span>
                    {label}
                </div>
                <span className="check-pop text-xs font-bold font-mono text-emerald-500 lg:text-emerald-400" style={staggerStyle}>READY</span>
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="slide-up-stagger flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 transition-all duration-500"
                style={staggerStyle}>
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    {label}
                </div>
                <span className="text-xs font-bold font-mono text-destructive">DENIED</span>
            </div>
        );
    }

    return (
        <div className="slide-up-stagger flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20 transition-all duration-500"
            style={staggerStyle}>
            <div className="flex items-center gap-3 text-sm text-foreground">
                <AlertCircle className="w-4 h-4 text-destructive" />
                {label}
            </div>
            <span className="text-xs font-bold font-mono text-destructive">ERROR</span>
        </div>
    );
}

export default function StudentDashboardPage() {
    return (
        <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
            <StudentDashboard />
        </Suspense>
    );
}

function StudentDashboard() {
    const { data: sessions, isLoading } = useMySessions();
    const { data: exams, isLoading: isLoadingExams } = useExams();
    const queryClient = useQueryClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const defaultTab = searchParams.get('tab') || 'active';
    const [sessionToTerminate, setSessionToTerminate] = React.useState<string | null>(null);
    const [codeError, setCodeError] = React.useState<string | null>(null);
    const [joiningExamId, setJoiningExamId] = React.useState<string | null>(null);
    const { status, checkSystem } = useSystemCheck();

    const joinMutation = useMutation({
        mutationFn: api.exams.join,
        onSuccess: (session) => {
            toast.success('Joined exam successfully!');
            queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            router.push(`/student/exam/${(session as any).id}/onboarding`);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to join exam');
        },
        onSettled: () => {
            setJoiningExamId(null);
        },
    });

    const terminateMutation = useMutation({
        mutationFn: api.sessions.end,
        onSuccess: () => {
            toast.success('Session terminated successfully');
            queryClient.invalidateQueries({ queryKey: ['my-sessions'] });
            setSessionToTerminate(null);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to terminate session');
        }
    });

    const handleTerminate = () => {
        if (sessionToTerminate) {
            terminateMutation.mutate(sessionToTerminate);
        }
    };

    const handleReport = (sessionId: string) => {
        toast.info(`Reporting for session ${sessionId.slice(0, 8)} is coming soon.`);
    };

    const allSessions = (sessions || []) as StudentSession[];
    const now = new Date();

    // Check if a session's exam is currently expired
    const isSessionExpired = (s: StudentSession) => {
        if (!s.exam?.end_time) return false;
        return now > new Date(s.exam.end_time);
    };

    const activeSessions = allSessions.filter(
        s => (s.status === SessionStatus.IN_PROGRESS || s.status === SessionStatus.PENDING) && !isSessionExpired(s)
    );

    const historySessions = allSessions.filter(
        s => s.status === SessionStatus.COMPLETED || s.status === SessionStatus.TERMINATED || s.status === SessionStatus.ABANDONED ||
            ((s.status === SessionStatus.IN_PROGRESS || s.status === SessionStatus.PENDING) && isSessionExpired(s))
    );

    const availableExams = React.useMemo(() => {
        const now = new Date();
        const publishedExams = ((exams || []) as Exam[]).filter(
            e => {
                const isActive = e.status === ExamStatus.PUBLISHED || e.status === ExamStatus.ACTIVE;
                if (!isActive) return false;

                if (e.end_time) {
                    const endTime = new Date(e.end_time);
                    if (now > endTime) return false;
                }
                return true;
            }
        );
        return publishedExams.map(exam => {
            const sessionsForExam = allSessions.filter(s => s.exam_id === exam.id);
            const attemptCount = sessionsForExam.length;
            const attemptsLeft = exam.max_attempts - attemptCount;
            const isNew = attemptCount === 0;
            return { exam, attemptCount, attemptsLeft, isNew };
        }).filter(e => e.attemptsLeft > 0);
    }, [exams, allSessions]);

    // Derived overall status
    const isSystemReady = status.microphone === 'ready' && status.camera === 'ready' && status.network === 'ready';

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <AlertDialog open={!!sessionToTerminate} onOpenChange={(open) => !open && setSessionToTerminate(null)}>
                <AlertDialogContent className="bg-popover border-border text-popover-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Terminate Session?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to end this session early? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border hover:bg-accent hover:text-accent-foreground">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleTerminate}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={terminateMutation.isPending}
                        >
                            {terminateMutation.isPending ? 'Terminating...' : 'Terminate Session'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <PageHeader
                title="Student Portal"
                description="Calm, focused, and ready for your viva."
            />

            <div className="grid gap-8 md:grid-cols-12 items-start">
                {/* Join Exam Section */}
                <div className="md:col-span-12 lg:col-span-8">
                    <Card className="h-full flex flex-col justify-between p-8 md:p-10 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                        <div>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="bg-primary/10 p-3 rounded-2xl w-fit border border-primary/20">
                                    <Zap className="text-primary w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-foreground">Join Exam Session</h2>
                                    <p className="text-muted-foreground text-base mt-1">Enter the 8-character code provided by your examiner.</p>
                                </div>
                            </div>

                            <form aria-label="Join exam session" onSubmit={(e) => {
                                e.preventDefault();
                                const form = e.target as HTMLFormElement;
                                const input = form.elements.namedItem('examCode') as HTMLInputElement;
                                const code = input.value.trim();
                                if (!code) {
                                    setCodeError('Please enter an exam code.');
                                    return;
                                }
                                if (code.length < 4) {
                                    setCodeError('Exam code must be at least 4 characters.');
                                    return;
                                }
                                setCodeError(null);
                                router.push(`/student/join?code=${code}`);
                            }} className="mt-8 space-y-6">
                                <div className="relative max-w-lg">
                                    <Input
                                        name="examCode"
                                        placeholder="EXAM-CODE"
                                        className={`bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground/50 text-center font-mono text-2xl tracking-[0.2em] uppercase h-16 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all ${codeError ? 'border-destructive focus:border-destructive' : ''}`}
                                        maxLength={10}
                                        autoComplete="off"
                                        aria-describedby="exam-code-hint"
                                        aria-invalid={!!codeError}
                                        onChange={() => codeError && setCodeError(null)}
                                    />
                                    {codeError && (
                                        <p role="alert" className="text-sm text-destructive font-medium mt-2">{codeError}</p>
                                    )}
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button type="submit" className="w-full max-w-lg h-12 text-base font-semibold">
                                        Verify & Join Exam
                                    </Button>
                                    <p id="exam-code-hint" className="text-muted-foreground text-xs text-center max-w-lg">
                                        Enter the 8-character code provided by your examiner. By joining, you agree to the academic integrity policy.
                                    </p>
                                </div>
                            </form>
                        </div>
                    </Card>
                </div>

                {/* System Readiness & Status */}
                <div className="md:col-span-12 lg:col-span-4 space-y-6">
                    {/* Readiness Card */}
                    <Card variant="glass" className={`p-6 transition-all duration-700 ${isSystemReady ? 'sweep-glow border-emerald-500/15' : ''}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg border transition-all duration-500 ${isSystemReady ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-secondary border-border'}`}>
                                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${isSystemReady ? 'bg-emerald-500 pulse-ring' : 'bg-muted-foreground'}`} />
                                </div>
                                <h3 className="font-medium text-foreground">System Check</h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                onClick={checkSystem}
                                aria-label="Run system check again"
                            >
                                <RefreshCw className={`w-4 h-4 text-muted-foreground transition-transform duration-500 ${status.microphone === 'checking' ? 'animate-spin' : 'hover:rotate-90'}`} aria-hidden="true" />
                            </Button>
                        </div>

                        <div className="space-y-3">
                            <StatusBadge status={status.microphone} label="Microphone" index={0} />
                            <StatusBadge status={status.camera} label="Camera" index={1} />
                            <StatusBadge status={status.network} label="Network" index={2} />
                        </div>

                        <div className="mt-6 pt-6 border-t border-border/50">
                            <p className={`text-xs leading-relaxed slide-up-stagger transition-colors duration-500 ${isSystemReady ? 'text-emerald-500/70' : 'text-muted-foreground'}`}
                                style={{ '--stagger-delay': '600ms' } as React.CSSProperties}>
                                {isSystemReady
                                    ? "✓ Your environment is optimized for this exam session."
                                    : "Please ensure your devices are connected and permissions are granted."}
                            </p>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Activity Tabs */}
            <div className="space-y-6">
                <Tabs defaultValue={defaultTab} className="w-full">
                    <TabsList>
                        <TabsTrigger value="available" className="gap-2">
                            <BookOpen className="h-4 w-4" /> Available
                            {availableExams.length > 0 && (
                                <span className="ml-1 inline-flex items-center justify-center rounded-full bg-primary/15 text-primary px-1.5 py-0.5 text-[10px] font-bold tabular-nums">
                                    {availableExams.length}
                                </span>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="active" className="gap-2">
                            <Clock className="h-4 w-4" /> In Progress
                        </TabsTrigger>
                        <TabsTrigger value="history" className="gap-2">
                            <FileText className="h-4 w-4" /> History
                        </TabsTrigger>
                    </TabsList>

                    {/* ─── Available Exams Tab ─── */}
                    <TabsContent value="available" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoadingExams ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-3 w-1/3" />
                                        </div>
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-20 rounded-xl" />
                                    <Skeleton className="h-10 w-full" />
                                </Card>
                            ))
                        ) : availableExams.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={BookOpen}
                                    title="No Available Exams"
                                    description="There are no exams available for you right now. Check back later or enter an exam code above."
                                />
                            </div>
                        ) : (
                            availableExams.map(({ exam, attemptCount, attemptsLeft, isNew }) => (
                                <Card key={exam.id} className="p-6 flex flex-col border border-border hover:border-border/80 transition-colors">
                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-5 gap-3">
                                        <div className="min-w-0 flex-1">
                                            {isNew ? (
                                                <Badge className="mb-2 bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10">
                                                    New
                                                </Badge>
                                            ) : (
                                                <Badge className="mb-2 bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/10">
                                                    Retry
                                                </Badge>
                                            )}
                                            <div className="font-semibold text-foreground text-base truncate" title={exam.title}>
                                                {exam.title}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">CODE: {exam.exam_code}</div>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-2.5 text-sm mb-5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Duration</span>
                                            <span className="font-medium text-foreground">{exam.settings?.duration_minutes ? `${exam.settings.duration_minutes} min` : 'Varies'}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Questions</span>
                                            <span className="font-medium text-foreground">{exam.settings?.number_of_questions ?? '—'}</span>
                                        </div>
                                        {(exam.start_time || exam.end_time) && (
                                            <div className="flex items-start justify-between gap-4">
                                                <span className="text-muted-foreground flex items-center gap-1.5 shrink-0"><Calendar className="h-3.5 w-3.5" /> Ends</span>
                                                <span className="font-medium text-foreground text-right text-xs">{exam.end_time ? formatToLocalDateTime(exam.end_time) : 'No end date'}</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-border">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Attempts left</div>
                                            <div className="text-lg font-bold text-foreground">
                                                {attemptsLeft} <span className="text-sm font-normal text-muted-foreground">/ {exam.max_attempts}</span>
                                            </div>
                                        </div>
                                        <Button
                                            size="sm"
                                            disabled={joinMutation.isPending && joiningExamId === exam.id}
                                            onClick={() => {
                                                setJoiningExamId(exam.id);
                                                joinMutation.mutate(exam.exam_code);
                                            }}
                                        >
                                            {joinMutation.isPending && joiningExamId === exam.id ? (
                                                <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Joining...</>
                                            ) : (
                                                isNew ? 'Start Exam' : 'Retry'
                                            )}
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="active" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="p-6 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-6 w-3/4" />
                                            <Skeleton className="h-3 w-1/4" />
                                        </div>
                                        <Skeleton className="h-6 w-12 rounded-full" />
                                    </div>
                                    <Skeleton className="h-24 rounded-xl" />
                                    <Skeleton className="h-10 w-full" />
                                </Card>
                            ))
                        ) : activeSessions.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={Zap}
                                    title="No Active Exams"
                                    description="You're all caught up! Enter an exam code above to start a new session."
                                />
                            </div>
                        ) : (
                            activeSessions.map((session) => (
                                <Card key={session.id} className="p-6 flex flex-col border border-border hover:border-border/80 transition-colors">
                                    {/* Header */}
                                    <div className="mb-5">
                                        {session.status === SessionStatus.IN_PROGRESS ? (
                                            <Badge className="mb-2 bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
                                                <span className="relative flex h-1.5 w-1.5 mr-1.5" aria-hidden="true">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary"></span>
                                                </span>
                                                In Progress
                                            </Badge>
                                        ) : (
                                            <Badge variant="outline" className="mb-2 text-muted-foreground">
                                                Not Started
                                            </Badge>
                                        )}
                                        <div className="font-semibold text-foreground text-base truncate" title={session.exam?.title || session.exam_title || 'Untitled Exam'}>
                                            {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                        </div>
                                        <div className="text-xs text-muted-foreground font-mono mt-0.5">SESSION: {session.id.slice(0, 8)}</div>
                                    </div>

                                    {/* Stats */}
                                    <div className="space-y-2.5 text-sm mb-5 flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Started</span>
                                            <span className="font-medium text-foreground">{formatToLocalDateTime(session.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> Duration</span>
                                            <span className="font-medium text-foreground">{session.exam?.settings?.duration_minutes ? `${session.exam.settings.duration_minutes} min` : 'Varies'}</span>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="space-y-2 pt-4 border-t border-border">
                                        <Button asChild className="w-full" size="sm">
                                            <Link href={`/student/exam/${session.id}/session`}>
                                                {session.status === SessionStatus.PENDING ? 'Start Session' : 'Resume Session'}
                                            </Link>
                                        </Button>
                                        <div className="grid grid-cols-2 gap-2">
                                            <Button variant="outline" size="sm" disabled className="opacity-50 cursor-not-allowed">
                                                <Flag className="mr-1.5 h-3 w-3" /> Report
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSessionToTerminate(session.id)}
                                                className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                                            >
                                                <XCircle className="mr-1.5 h-3 w-3" /> End
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {isLoading ? (
                            Array(3).fill(0).map((_, i) => (
                                <Card key={i} className="p-6 space-y-4">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-1/3" />
                                    <div className="flex items-end justify-between border-t border-border pt-4">
                                        <Skeleton className="h-8 w-16" />
                                        <Skeleton className="h-8 w-20" />
                                    </div>
                                </Card>
                            ))
                        ) : historySessions.length === 0 ? (
                            <div className="col-span-full">
                                <EmptyState
                                    icon={Trophy}
                                    title="No History Yet"
                                    description="Complete your first exam to see your performance metrics here."
                                />
                            </div>
                        ) : (
                            historySessions.map((session) => {
                                const score = Math.round(session.final_score ?? session.score ?? 0);
                                const passed = score >= 40;
                                return (
                                    <Card key={session.id} className="p-6 flex flex-col border border-border hover:border-border/80 transition-colors">
                                        {/* Header */}
                                        <div className="mb-5">
                                            <Badge className={`mb-2 ${passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/10'}`}>
                                                {passed ? 'Passed' : 'Completed'}
                                            </Badge>
                                            <div className="font-semibold text-foreground text-base truncate" title={session.exam?.title || session.exam_title || 'Untitled Exam'}>
                                                {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-0.5">SESSION: {session.id.slice(0, 8)}</div>
                                        </div>

                                        {/* Stats */}
                                        <div className="space-y-2.5 text-sm mb-5 flex-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-muted-foreground flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Completed</span>
                                                <span className="font-medium text-foreground">{formatToLocalDateTime(session.created_at)}</span>
                                            </div>
                                        </div>

                                        {/* Footer */}
                                        <div className="flex items-center justify-between pt-4 border-t border-border">
                                            <div>
                                                <div className="text-[11px] text-muted-foreground uppercase tracking-wide mb-0.5">Score</div>
                                                <div className={`text-2xl font-bold ${passed ? 'text-emerald-500' : 'text-foreground'}`}>{score}%</div>
                                            </div>
                                            <Button asChild size="sm" variant="outline">
                                                <Link href={`/student/exam/${session.id}/result`}>View Results</Link>
                                            </Button>
                                        </div>
                                    </Card>
                                );
                            })
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </main >
    );
}

