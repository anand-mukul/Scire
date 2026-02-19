'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumLoader } from '@/components/ui/premium-loader';
// import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Trophy, Clock, AlertTriangle, CheckCircle, ArrowLeft, Download, Mail, XCircle, Loader2, Zap, ShieldAlert, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { formatDuration } from '@/lib/date-utils';
import { toast } from 'sonner';


// Pass threshold
const PASS_THRESHOLD = 50;

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: sessionId } = React.use(params);

    const { data: session, isLoading } = useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => api.sessions.getStatus(sessionId),
    });

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <PremiumLoader text="Analyzing Results..." />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-6 p-4 text-center">
                <XCircle className="w-16 h-16 text-muted-foreground" />
                <h2 className="text-xl font-semibold text-foreground">Session Not Found</h2>
                <p className="text-muted-foreground max-w-md">We couldn't locate the exam session you are looking for. It may have been deleted or archived.</p>
                <Link href="/student">
                    <Button variant="outline">Return to Dashboard</Button>
                </Link>
            </div>
        );
    }

    const score = session.final_score;
    const isPending = score === null || score === undefined;
    const passed = (score ?? 0) >= PASS_THRESHOLD;

    // Integrity Data
    const integrityReport = session.integrity_report;
    const isFlagged = session.integrity_flag;
    const cleanSession = !isFlagged && (integrityReport?.is_clean !== false);

    const handleDownloadReport = () => {
        toast.info('Report generation coming soon. A detailed PDF report will be available here.');
    };

    return (
        <div className="relative min-h-screen w-full bg-background overflow-x-hidden text-foreground pb-20">
            {/* <AmbientGlow /> */}

            <div className="relative z-10 p-6 md:p-12 max-w-5xl mx-auto space-y-10">
                {/* Navigation */}
                <Link href="/student/history" className="inline-block">
                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground -ml-4 group">
                        <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
                        Back to History
                    </Button>
                </Link>

                {/* Header Section */}
                <div className="text-center space-y-6">
                    <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight" title={session.exam?.title}>
                        {session.exam?.title || 'Exam Result'}
                    </h1>

                    <div className="flex flex-wrap items-center justify-center gap-4">
                        {session.exam?.code && (
                            <Badge variant="outline" className="text-sm px-3 py-1 border-primary/20 uppercase tracking-widest bg-primary/5 text-foreground">
                                {session.exam.code}
                            </Badge>
                        )}
                        {!isPending && (
                            <Badge
                                variant="outline"
                                className={`text-sm px-4 py-1 uppercase tracking-widest font-bold shadow-lg ${passed
                                    ? 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10 shadow-emerald-500/10'
                                    : 'text-destructive border-destructive/30 bg-destructive/10 shadow-red-500/10'
                                    }`}
                            >
                                {passed ? 'Passed' : 'Failed'}
                            </Badge>
                        )}
                        <Badge variant="outline" className="text-sm px-3 py-1 border-border tracking-widest bg-muted/20 text-muted-foreground">
                            Attempt #{session.attempt_number}
                        </Badge>
                    </div>
                </div>

                {/* Helper for Radial Progress */}
                {/* We use CSS conic-gradient for a simple, dependency-free radial chart */}
                <style jsx>{`
                    .radial-progress {
                        background: conic-gradient(
                            ${passed ? 'hsl(var(--primary))' : 'hsl(var(--destructive))'} var(--progress), 
                            hsl(var(--muted)) 0deg
                        );
                    }
                `}</style>

                {/* Main Score Card */}
                <Card className={`p-8 md:p-16 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-500 ${isPending
                    ? 'bg-card/40 border-primary/20'
                    : passed
                        ? 'bg-gradient-to-b from-primary/10 to-card/40 border-primary/20 shadow-[0_0_50px_-12px_rgba(59,130,246,0.3)]'
                        : 'bg-gradient-to-b from-destructive/10 to-card/40 border-destructive/20 shadow-[0_0_50px_-12px_rgba(239,68,68,0.3)]'
                    }`}>

                    {isPending ? (
                        <div className="w-full max-w-md mx-auto space-y-8 animate-in fade-in duration-700">
                            {/* Pulse Animation */}
                            <div className="flex flex-col items-center justify-center relative">
                                <div className="absolute inset-0 bg-primary/20 blur-[60px] rounded-full animate-pulse" />
                                <div className="relative z-10 w-32 h-32 rounded-full bg-background/50 border border-primary/30 flex items-center justify-center backdrop-blur-xl shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                                    <PremiumLoader size="lg" text="" className="scale-150" />
                                </div>
                                <h2 className="mt-8 text-3xl font-bold text-foreground tracking-tight">AI Grading in Progress</h2>
                                <p className="text-muted-foreground mt-2 text-center max-w-xs">Our AI is analyzing your responses against the rubric criteria.</p>
                            </div>

                            {/* Progress Steps */}
                            <div className="space-y-4 pt-6 border-t border-border w-full">
                                {[
                                    { icon: CheckCircle, text: "Session Data Uploaded", active: false, done: true },
                                    { icon: Loader2, text: "Analyzing Voice & Transcripts", active: true, done: false },
                                    { icon: Trophy, text: "Generating Final Score", active: false, done: false }
                                ].map((step, idx) => (
                                    <div key={idx} className={`flex items-center gap-4 p-3 rounded-lg ${step.active ? 'bg-muted/30' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border transition-colors ${step.done ? 'bg-primary/20 text-primary border-primary/30' :
                                            step.active ? 'bg-primary/10 text-primary border-primary/30 animate-pulse' :
                                                'bg-muted text-muted-foreground border-border'
                                            }`}>
                                            <step.icon className={`w-4 h-4 ${step.active && step.icon === Loader2 ? 'animate-spin' : ''}`} />
                                        </div>
                                        <span className={`text-sm font-medium ${step.active || step.done ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {step.text}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                            {/* Radial Chart */}
                            <div
                                className="radial-progress relative w-48 h-48 rounded-full flex items-center justify-center shadow-2xl mb-8 before:absolute before:inset-[10px] before:bg-background before:rounded-full before:content-['']"
                                style={{ '--progress': `${(score ?? 0)}%` } as React.CSSProperties}
                            >
                                <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                    <span className={`text-6xl font-bold tracking-tighter ${passed ? 'text-foreground' : 'text-destructive'}`}>
                                        {Math.round(score ?? 0)}%
                                    </span>
                                    <span className="text-xs uppercase tracking-widest text-muted-foreground mt-1 font-medium">Score</span>
                                </div>
                            </div>

                            <h2 className="text-2xl font-medium text-foreground mb-2">
                                {passed ? "Excellent Work!" : "Keep Practicing"}
                            </h2>
                            <p className="text-muted-foreground text-sm max-w-sm text-center">
                                {passed
                                    ? "You have demonstrated a strong understanding of the material."
                                    : "You didn't meet the passing threshold this time. Review the feedback below."}
                            </p>
                        </div>
                    )}
                </Card>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="p-6 flex items-center gap-6 group hover:border-border transition-colors card-hover">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">Duration</p>
                            <p className="text-2xl font-bold text-foreground">{formatDuration(session.start_time, session.end_time)}</p>
                        </div>
                    </Card>

                    <Card className="p-6 flex items-center gap-6 group hover:border-border transition-colors card-hover">
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-1">AI Confidence</p>
                            <p className="text-2xl font-bold text-foreground">
                                {session.confidence_score ? `${Math.round(session.confidence_score * 100)}%` : '--'}
                            </p>
                        </div>
                    </Card>
                </div>

                {/* Integrity Report - Enhanced */}
                <Card className={`overflow-hidden transition-all ${isFlagged ? 'border-destructive/30' : 'border-emerald-500/30'}`}>
                    <div className={`p-6 border-b ${isFlagged ? 'bg-destructive/10 border-destructive/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                        <div className="flex items-center gap-3">
                            {isFlagged ? (
                                <ShieldAlert className="w-6 h-6 text-destructive" />
                            ) : (
                                <ShieldCheck className="w-6 h-6 text-emerald-500" />
                            )}
                            <h3 className={`text-lg font-bold ${isFlagged ? 'text-destructive' : 'text-emerald-500'}`}>
                                {isFlagged ? "Integrity Issues Detected" : "Integrity Verified"}
                            </h3>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        {isFlagged ? (
                            <div className="space-y-4">
                                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                                    <p>Our proctoring system flagged this session for review due to suspicious activity. An instructor will verify these findings.</p>
                                </div>

                                {integrityReport && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="bg-card/40 p-4 rounded-lg border border-border">
                                            <span className="text-xs text-muted-foreground uppercase">Alerts Triggered</span>
                                            <p className="text-2xl font-bold text-foreground mt-1">{integrityReport.flagged_count}</p>
                                        </div>
                                        <div className="bg-card/40 p-4 rounded-lg border border-border">
                                            <span className="text-xs text-muted-foreground uppercase">Total Snapshots</span>
                                            <p className="text-2xl font-bold text-foreground mt-1">{integrityReport.total_snapshots}</p>
                                        </div>
                                    </div>
                                )}

                                {integrityReport?.reasons && integrityReport.reasons.length > 0 && (
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Detected Issues</p>
                                        <div className="flex flex-wrap gap-2">
                                            {integrityReport.reasons.map((reason: string, i: number) => (
                                                <Badge key={i} variant="destructive" className="bg-destructive/20 text-destructive border-destructive/30 hover:bg-destructive/30">
                                                    {reason}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                    <CheckCircle className="w-8 h-8" />
                                </div>
                                <div className="flex-1 text-center sm:text-left">
                                    <p className="text-foreground font-medium">Clean Session Record</p>
                                    <p className="text-muted-foreground text-sm mt-1">
                                        Reference Check completed successfully. No tab switching, unauthorized voices, or absence detected.
                                    </p>
                                </div>
                                {integrityReport && (
                                    <div className="text-right hidden sm:block">
                                        <p className="text-2xl font-bold text-emerald-500">{integrityReport.total_snapshots}</p>
                                        <p className="text-xs text-emerald-500/70 uppercase">Checks Passed</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                {/* Share Credential */}
                <Card variant="glass" className="p-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="space-y-2 text-center md:text-left">
                            <h3 className="text-xl font-bold text-foreground">Share Your Success</h3>
                            <p className="text-sm text-muted-foreground max-w-lg">
                                Use this magic link to verify your result with employers or on LinkedIn. access to this page is public for anyone with the link.
                            </p>
                        </div>

                        {session.result_token ? (
                            <div className="flex w-full md:w-auto gap-2">
                                <div className="hidden sm:block px-4 py-3 rounded-lg bg-muted border border-border text-muted-foreground font-mono text-xs truncate max-w-[200px]">
                                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/results/verify/${session.result_token}`}
                                </div>
                                <Button
                                    onClick={() => {
                                        const url = `${window.location.origin}/results/verify/${session.result_token}`;
                                        navigator.clipboard.writeText(url);
                                        toast.success('Verification link copied to clipboard!');
                                    }}
                                    variant="secondary"
                                    className="flex-1 md:flex-none"
                                >
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    Copy Link
                                </Button>
                            </div>
                        ) : (
                            <div className="text-sm text-muted-foreground italic">
                                Verification link not available pending final confirmation.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Actions Footer */}
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <Button
                        onClick={handleDownloadReport}
                        className="flex-1 h-14 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] button-press"
                    >
                        <Download className="mr-2 h-5 w-5" />
                        Download Official Report
                    </Button>
                    <Link href="/student" className="flex-1">
                        <Button variant="outline" className="w-full h-14 text-base border-border text-foreground hover:bg-muted transition-all hover:scale-[1.02] button-press">
                            Return to Dashboard
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}

