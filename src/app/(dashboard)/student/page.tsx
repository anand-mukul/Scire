'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSystemCheck, SystemStatus } from '@/hooks/use-system-check';
import { Trophy, Zap, RefreshCw, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';
// import { AmbientGlow } from '@/components/ui/ambient-glow';

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
}

const StatusBadge = ({ status, label }: { status: SystemStatus, label: string }) => {
    if (status === 'checking') {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 border border-border">
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    {label}
                </div>
                <span className="text-xs font-mono text-muted-foreground">CHECKING</span>
            </div>
        );
    }

    if (status === 'ready') {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    {label}
                </div>
                <span className="text-xs font-bold font-mono text-emerald-500 lg:text-emerald-400">READY</span>
            </div>
        );
    }

    if (status === 'denied') {
        return (
            <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <div className="flex items-center gap-3 text-sm text-foreground">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    {label}
                </div>
                <span className="text-xs font-bold font-mono text-destructive">DENIED</span>
            </div>
        );
    }

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20">
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
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* Background Effects */}
            {/* <AmbientGlow /> */}

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

            <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                        Student Portal
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-2xl">
                        Calm, focused, and ready for your viva.
                    </p>
                </div>

                <div className="grid gap-8 md:grid-cols-12 items-start">
                    {/* Join Exam Section */}
                    <div className="md:col-span-12 lg:col-span-8">
                        <Card className="h-full flex flex-col justify-between p-8 md:p-10">
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
                        <Card className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg border ${isSystemReady ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-secondary border-border'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isSystemReady ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground'}`} />
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
                                    <RefreshCw className={`w-4 h-4 text-muted-foreground ${status.microphone === 'checking' ? 'animate-spin' : ''}`} aria-hidden="true" />
                                </Button>
                            </div>

                            <div className="space-y-3">
                                <StatusBadge status={status.microphone} label="Microphone" />
                                <StatusBadge status={status.camera} label="Camera" />
                                <StatusBadge status={status.network} label="Network" />
                            </div>

                            <div className="mt-6 pt-6 border-t border-border/50">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {isSystemReady
                                        ? "Your environment is optimized for this exam session. Good luck."
                                        : "Please ensure your devices are connected and permissions are granted."}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Activity Tabs */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-foreground">Your Examinations</h3>
                    </div>

                    <Tabs defaultValue="active" className="w-full">
                        <TabsList className="bg-secondary/30 border border-border p-1 rounded-xl">
                            <TabsTrigger value="active" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">In Progress</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-lg data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm">History</TabsTrigger>
                        </TabsList>

                        <TabsContent value="active" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <div key={i} className="h-[280px] rounded-xl bg-card/20 border border-border p-6 space-y-4 animate-pulse">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-2 flex-1">
                                                <div className="h-6 w-3/4 bg-muted/20 rounded" />
                                                <div className="h-3 w-1/4 bg-muted/20 rounded" />
                                            </div>
                                            <div className="h-6 w-12 bg-muted/20 rounded-full" />
                                        </div>
                                        <div className="h-24 bg-muted/10 rounded-xl" />
                                    </div>
                                ))
                            ) : activeSessions.length === 0 ? (
                                <div className="col-span-full">
                                    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
                                        <div className="bg-secondary p-4 rounded-full mb-4">
                                            <Zap className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-base font-medium text-foreground mb-2">No Active Exams</h4>
                                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">You&apos;re all caught up! Enter an exam code above to start a new session.</p>
                                    </Card>
                                </div>
                            ) : (
                                activeSessions.map((session) => (
                                    <Card key={session.id} className="p-6 group hover:border-primary/50 transition-all">
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
                                    <div key={i} className="h-[200px] rounded-xl bg-card/20 border border-border p-6 space-y-4 animate-pulse">
                                        <div className="h-6 w-3/4 bg-muted/20 rounded" />
                                        <div className="h-24 bg-muted/10 rounded-xl" />
                                    </div>
                                ))
                            ) : historySessions.length === 0 ? (
                                <div className="col-span-full">
                                    <Card className="flex flex-col items-center justify-center py-16 text-center border-dashed">
                                        <div className="bg-secondary p-4 rounded-full mb-4">
                                            <Trophy className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                        <h4 className="text-base font-medium text-foreground mb-2">No History Yet</h4>
                                        <p className="text-muted-foreground text-sm max-w-sm mx-auto">Complete your first exam to see your performance metrics here.</p>
                                    </Card>
                                </div>
                            ) : (
                                historySessions.map((session) => (
                                    <Card key={session.id} className="p-6 group hover:border-primary/30 transition-all">
                                        <div className="flex justify-between items-start mb-6 gap-4">
                                            <div className="min-w-0 flex-1">
                                                <div className="font-bold text-foreground text-lg truncate group-hover:text-foreground/80 transition-colors" title={session.exam?.title || session.exam_title || 'Untitled Exam'}>
                                                    {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                                </div>
                                                <div className="text-xs text-muted-foreground font-mono mt-1">ID: {session.id.slice(0, 8)}</div>
                                            </div>
                                            <Badge variant="secondary" className="shrink-0">Passed</Badge>
                                        </div>

                                        <div className="flex items-end justify-between border-t border-border pt-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1">Score</div>
                                                <div className="text-2xl font-semibold text-primary">{session.score || 0}%</div>
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
            </div>
        </main>
    );
}

