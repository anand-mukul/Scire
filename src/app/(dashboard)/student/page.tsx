'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { useSystemCheck, SystemStatus } from '@/hooks/use-system-check';
import { Trophy, Zap, RefreshCw, CheckCircle, AlertCircle, Loader2, Clock, FileText } from 'lucide-react';
import Link from 'next/link';

import { VivaSession, SessionStatus } from '@/types/backend';
import { useMySessions } from '@/hooks/use-dashboard-data';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { XCircle, Flag } from 'lucide-react';
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

export default function StudentDashboard() {
    const { data: sessions, isLoading } = useMySessions();
    const queryClient = useQueryClient();
    const [sessionToTerminate, setSessionToTerminate] = React.useState<string | null>(null);
    const { status, checkSystem } = useSystemCheck();

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
        toast.info(`Ticket created for session ${sessionId.slice(0, 8)}. Support will contact you.`);
    };

    const allSessions = (sessions || []) as StudentSession[];
    const activeSessions = allSessions.filter(s => s.status === SessionStatus.IN_PROGRESS);
    const historySessions = allSessions.filter(s => s.status === SessionStatus.COMPLETED);

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
                                if (input.value) window.location.href = `/student/join?code=${input.value}`;
                            }} className="mt-8 space-y-6">
                                <div className="relative max-w-lg">
                                    <Input
                                        name="examCode"
                                        placeholder="EXAM-CODE"
                                        className="bg-secondary/20 border-border text-foreground placeholder:text-muted-foreground/50 text-center font-mono text-2xl tracking-[0.2em] uppercase h-16 rounded-xl focus:border-primary/50 focus:ring-primary/20 transition-all"
                                        maxLength={10}
                                        autoComplete="off"
                                    />
                                </div>
                                <div className="flex flex-col gap-3">
                                    <Button type="submit" className="w-full max-w-lg h-12 text-base font-semibold">
                                        Verify & Join Exam
                                    </Button>
                                    <p className="text-muted-foreground text-xs text-center max-w-lg">
                                        By joining, you agree to the academic integrity policy.
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
                <Tabs defaultValue="active" className="w-full">
                    <TabsList className="bg-muted/50 p-1 rounded-lg border border-border/50 h-auto inline-flex">
                        <TabsTrigger value="active" className="rounded-md px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 cursor-pointer">
                            <Clock className="h-4 w-4" /> In Progress
                        </TabsTrigger>
                        <TabsTrigger value="history" className="rounded-md px-5 py-2.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm gap-2 cursor-pointer">
                            <FileText className="h-4 w-4" /> History
                        </TabsTrigger>
                    </TabsList>

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
                                <Card key={session.id} className="p-6 group hover:border-primary/50 transition-all card-hover">
                                    <div className="flex justify-between items-start mb-4 gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors" title={session.exam?.title || session.exam_title || 'Untitled Exam'}>
                                                {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-1">ID: {session.id.slice(0, 8)}</div>
                                        </div>
                                        <Badge className="shrink-0 bg-primary/10 text-primary border-primary/20">
                                            <span className="relative flex h-2 w-2 mr-2" aria-hidden="true">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                            </span>
                                            <span className="sr-only">Session is </span>Live
                                        </Badge>
                                    </div>

                                    <div className="bg-card/50 rounded-xl p-4 mb-6 space-y-2 border border-border/50">
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Started</span>
                                            <span className="text-foreground font-mono">{formatToLocalDateTime(session.created_at)}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-muted-foreground">Duration</span>
                                            <span className="text-foreground font-mono">~30m</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <Button asChild className="w-full h-10 font-semibold">
                                            <Link href={`/student/exam/${session.id}/session`}>
                                                RESUME SESSION
                                            </Link>
                                        </Button>

                                        <div className="grid grid-cols-2 gap-3">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleReport(session.id)}
                                                className="w-full border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                                            >
                                                <Flag className="mr-2 h-3 w-3" />
                                                Report
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setSessionToTerminate(session.id)}
                                                className="w-full border-border hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                            >
                                                <XCircle className="mr-2 h-3 w-3" />
                                                End
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
                            historySessions.map((session) => (
                                <Card key={session.id} className="p-6 group hover:border-primary/30 transition-all card-hover">
                                    <div className="flex justify-between items-start mb-6 gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="font-bold text-foreground text-lg truncate group-hover:text-foreground/80 transition-colors" title={session.exam?.title || session.exam_title || 'Untitled Exam'}>
                                                {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                            </div>
                                            <div className="text-xs text-muted-foreground font-mono mt-1">ID: {session.id.slice(0, 8)}</div>
                                        </div>
                                        <Badge variant="secondary" className={`shrink-0 ${(session.final_score ?? session.score ?? 0) >= 40
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-destructive/10 text-destructive border-destructive/20'
                                            }`}>
                                            {(session.final_score ?? session.score ?? 0) >= 40 ? 'Passed' : 'Completed'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-end justify-between border-t border-border pt-4">
                                        <div>
                                            <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Score</div>
                                            <div className="text-2xl font-semibold text-primary">{Math.round(session.final_score ?? session.score ?? 0)}%</div>
                                        </div>
                                        <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-primary group-hover:translate-x-1 transition-all">
                                            <Link href={`/student/exam/${session.id}/result`}>Details →</Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </main >
    );
}

