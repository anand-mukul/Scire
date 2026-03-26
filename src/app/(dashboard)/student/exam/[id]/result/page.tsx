'use client';

import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { Trophy, Clock, ArrowLeft, Download, ShieldCheck, ShieldAlert, Loader2, XCircle, FileText, Key, Check, ClipboardCopy, Share2 } from 'lucide-react';
import Link from 'next/link';
import { formatDuration } from '@/lib/date-utils';
import { toast } from 'sonner';
import ShareCredentialDialog from '@/components/dashboard/ShareCredentialDialog';
import { generateResultPdf } from '@/lib/generate-result-pdf';

// Pass threshold
const PASS_THRESHOLD = 50;

export default function ResultPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: sessionId } = React.use(params);

    const { data: session, isLoading } = useQuery({
        queryKey: ['session', sessionId],
        queryFn: () => api.sessions.getStatus(sessionId),
    });

    const [isCopied, setIsCopied] = useState(false);
    const [animatedScore, setAnimatedScore] = useState(0);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const score = session?.final_score;
    const isPending = score === null || score === undefined;
    const passed = (score ?? 0) >= PASS_THRESHOLD;

    // SVG Ring Calculations (Apple Activity Style)
    const size = 160;
    const strokeWidth = 16;
    const radius = size / 2;
    const normalizedRadius = radius - strokeWidth;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

    useEffect(() => {
        if (!isPending && score !== undefined) {
            const timer = setTimeout(() => setAnimatedScore(score), 50);
            return () => clearTimeout(timer);
        }
    }, [isPending, score]);

    if (isLoading) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center animate-in fade-in duration-300">
                <PremiumLoader text="Loading Results..." />
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 p-4 text-center animate-in fade-in duration-300">
                <XCircle className="w-16 h-16 text-muted-foreground/50" />
                <h2 className="text-2xl font-bold tracking-tight text-foreground">Session Not Found</h2>
                <p className="text-muted-foreground max-w-md">We couldn't locate the exam session you are looking for. It may have been deleted or archived.</p>
                <Link href="/student/history">
                    <Button variant="outline">Return to History</Button>
                </Link>
            </div>
        );
    }

    // Integrity Data
    const integrityReport = session.integrity_report;
    const isFlagged = session.integrity_flag;
    const isReviewed = session.review_status === 'APPROVED' || session.review_status === 'REJECTED';
    const hasNotes = !!session.review_notes;

    const handleDownloadReport = async () => {
        setIsGenerating(true);
        try {
            await generateResultPdf(session);
            toast.success('PDF report downloaded!');
        } catch {
            toast.error('Failed to generate report. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleCopyLink = () => {
        if (!session.result_token) return;
        const url = `${window.location.origin}/results/verify/${session.result_token}`;
        navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast.success('Verification link copied to clipboard!');
        setTimeout(() => setIsCopied(false), 2000);
    };

    return (
        <main className="flex flex-col h-full gap-5 p-4 md:p-6 lg:max-w-7xl mx-auto selection:bg-primary/20 animate-in fade-in duration-500">
            {/* Header with PDF Button */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-4 border-b border-border/50">
                <div className="flex flex-col gap-2">
                    <Link href="/student/history" className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors group">
                        <ArrowLeft className="h-3 w-3 mr-1 transition-transform group-hover:-translate-x-0.5" />
                        Back to History
                    </Link>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground">
                            {session.exam?.title || 'Exam Result'}
                        </h1>
                        <div className="hidden md:flex gap-2 items-center">
                            {session.exam?.exam_code && (
                                <Badge variant="secondary" className="rounded-md">{session.exam.exam_code}</Badge>
                            )}
                            <Badge variant="outline" className="rounded-md">Attempt #{session.attempt_number}</Badge>
                            {session.end_time && (
                                <Badge variant="outline" className="rounded-md bg-secondary/20">
                                    Completed {new Date(session.end_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Badge>
                            )}
                            <Badge 
                                variant="outline"
                                className={`rounded-md border ${session.review_status === 'APPROVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : session.review_status === 'REJECTED' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-secondary/20 text-muted-foreground'}`}
                            >
                                {session.review_status === 'APPROVED' ? 'Approved' : session.review_status === 'REJECTED' ? 'Rejected' : 'Pending Review'}
                            </Badge>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3 shrink-0">
                    <Button onClick={handleDownloadReport} disabled={isGenerating || isPending} className="gap-2 px-6 shadow-sm">
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        {isGenerating ? 'Generating...' : 'Save PDF Report'}
                    </Button>
                </div>
            </div>

            {/* Main Compact Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                
                {/* Left Column - Core Metrics */}
                <div className="lg:col-span-4 flex flex-col gap-5">
                    {/* Compact Ring Card */}
                    <Card className="flex flex-col items-center justify-center p-6 h-[300px] border-border/50 shadow-sm relative overflow-hidden">
                        {isPending ? (
                            <div className="flex flex-col items-center justify-center space-y-4 animate-pulse">
                                <Loader2 className="w-10 h-10 text-muted-foreground animate-spin" />
                                <div className="text-center">
                                    <h2 className="text-xl font-bold">Grading...</h2>
                                    <p className="text-sm text-muted-foreground">Analyzing responses</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center w-full">
                                <div 
                                    className="relative flex items-center justify-center mb-6 shrink-0" 
                                    style={{ width: size, height: size }}
                                >
                                    <svg
                                        viewBox={`0 0 ${size} ${size}`}
                                        className="transform -rotate-90 w-full h-full"
                                        style={{ overflow: 'visible' }}
                                    >
                                        <circle
                                            stroke="currentColor"
                                            fill="transparent"
                                            strokeWidth={strokeWidth}
                                            r={normalizedRadius}
                                            cx={radius}
                                            cy={radius}
                                            className={passed ? 'text-emerald-500/20' : 'text-rose-500/20'}
                                        />
                                        <circle
                                            stroke="currentColor"
                                            fill="transparent"
                                            strokeWidth={strokeWidth}
                                            strokeLinecap="round"
                                            strokeDasharray={circumference + ' ' + circumference}
                                            style={{
                                                strokeDashoffset,
                                                transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16, 1, 0.3, 1)',
                                                filter: passed ? 'drop-shadow(0px 0px 8px rgba(16,185,129,0.4))' : 'drop-shadow(0px 0px 8px rgba(244,63,94,0.4))'
                                            }}
                                            r={normalizedRadius}
                                            cx={radius}
                                            cy={radius}
                                            className={passed ? 'text-emerald-500' : 'text-rose-500'}
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
                                        <span className={`text-5xl font-extrabold tracking-tighter mb-1 ${passed ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {Math.round(score ?? 0)}
                                        </span>
                                    </div>
                                </div>

                                <Badge 
                                    variant="outline" 
                                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider border ${
                                        passed
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                                            : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
                                    }`}
                                >
                                    {passed ? 'Passed Qualification' : 'Did Not Pass'}
                                </Badge>
                                <p className="text-[10px] text-muted-foreground mt-3 font-semibold tracking-wider uppercase">
                                    Required Score: {PASS_THRESHOLD}
                                </p>
                            </div>
                        )}
                    </Card>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="p-4 border-border/50 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-background border border-border/40 shadow-sm flex items-center justify-center shrink-0">
                                <Clock className="w-5 h-5 text-foreground/70" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Duration</p>
                                <p className="text-xl font-bold tracking-tight">{formatDuration(session.start_time, session.end_time)}</p>
                            </div>
                        </Card>

                        <Card className="p-4 border-border/50 shadow-sm flex flex-col items-center justify-center text-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-background border border-border/40 shadow-sm flex items-center justify-center shrink-0">
                                <Trophy className="w-5 h-5 text-foreground/70" />
                            </div>
                            <div>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Confidence</p>
                                <p className="text-xl font-bold tracking-tight">
                                    {session.confidence_score ? `${Math.round(session.confidence_score * 100)}%` : '--'}
                                </p>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Right Column - Feedback & Modules */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                    
                    {/* Integrity Card */}
                    <Card className={`p-6 border-border/50 shadow-sm ${isFlagged ? 'bg-rose-50/50 dark:bg-rose-950/20' : 'bg-card'}`}>
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                                {isFlagged ? (
                                    <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center text-rose-600">
                                        <ShieldAlert className="w-5 h-5" />
                                    </div>
                                ) : (
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center text-emerald-600">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-xl font-bold tracking-tight">Integrity Record</h3>
                                    <p className={`text-xs font-semibold ${isFlagged ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        {isFlagged ? "Flagged for manual review" : "Passes system requirements"}
                                    </p>
                                </div>
                            </div>
                            {!isFlagged && integrityReport && (
                                <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                                        {integrityReport.total_snapshots}
                                    </span>
                                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600/70 dark:text-emerald-400/70">Checks</span>
                                </div>
                            )}
                        </div>

                        {isFlagged ? (
                            <div className="bg-background/80 rounded-xl p-4 border border-rose-100 dark:border-rose-900/30">
                                <p className="text-sm font-medium mb-3">
                                    The automated proctoring system flagged this session due to unusual activity.
                                </p>
                                {integrityReport?.reasons && integrityReport.reasons.length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {integrityReport.reasons.map((reason: string, i: number) => (
                                            <span key={i} className="inline-flex px-3 py-1 rounded-md text-xs font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                                                {reason}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-sm text-foreground/80 font-medium leading-relaxed max-w-2xl">
                                Your identity was continuously verified. No tab switching, unauthorized voices, or absence anomalies were detected during the session.
                            </p>
                        )}
                    </Card>

                    {/* Official Feedback Module */}
                    {isReviewed && hasNotes && (
                        <Card className="flex-1 p-6 border-border/50 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary/50" />
                            <div className="pl-3 flex flex-col h-full">
                                <div className="flex items-center gap-3 mb-4">
                                    <FileText className="w-5 h-5 text-primary" />
                                    <h3 className="text-lg font-bold tracking-tight">Instructor Notes</h3>
                                </div>
                                <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 whitespace-pre-wrap bg-secondary/20 p-4 rounded-xl flex-1">
                                    {session.review_notes}
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* Share Credential */}
                    <Card className="p-6 border-border/50 shadow-sm bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-full bg-background border border-border/40 shadow-sm">
                                <Key className="w-5 h-5 text-foreground/70" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold tracking-tight">Public Credential</h3>
                                <p className="text-xs text-muted-foreground font-medium">
                                    Share a verified public link of your examination record.
                                </p>
                            </div>
                        </div>
                        {session.result_token ? (
                            <Button
                                onClick={() => setShowShareDialog(true)}
                                variant="outline"
                                className="w-full sm:w-auto gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share Credential
                            </Button>
                        ) : (
                            <Badge variant="secondary" className="px-4 py-1.5 opacity-70">
                                Pending
                            </Badge>
                        )}
                    </Card>

                </div>
            </div>

            {/* Dialogs */}
            {session.result_token && (
                <ShareCredentialDialog
                    open={showShareDialog}
                    onOpenChange={setShowShareDialog}
                    examTitle={session.exam?.title || 'Exam Result'}
                    credentialLink={`${window.location.origin}/results/verify/${session.result_token}`}
                />
            )}
        </main>
    );
}


