'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/page-header';
import {
    ArrowLeft, CheckCircle, XCircle, Target,
    TrendingUp, MessageCircle, BarChart3, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/network/api';

export default function PracticeReportPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const examId = params.id as string;
    const sessionId = searchParams.get('session');

    const { data: report, isLoading } = useQuery({
        queryKey: ['practice-report', sessionId],
        queryFn: () => api.practice.getReport(sessionId!),
        enabled: !!sessionId,
    });

    if (!sessionId) {
        return (
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
                <p className="text-muted-foreground">No session specified.</p>
                <Button asChild variant="outline">
                    <Link href={`/student/practice/${examId}`}>← Back</Link>
                </Button>
            </main>
        );
    }

    if (isLoading) {
        return (
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
                <Skeleton className="h-8 w-64" />
                <div className="grid gap-4 md:grid-cols-3">
                    {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32" />)}
                </div>
                <Skeleton className="h-64 w-full" />
            </main>
        );
    }

    if (!report) {
        return (
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
                <p className="text-muted-foreground">Report not available yet.</p>
                <Button asChild variant="outline">
                    <Link href={`/student/practice/${examId}`}>← Back</Link>
                </Button>
            </main>
        );
    }

    const score = report.session.final_score;
    const confidence = report.session.confidence_score;
    const analysis = report.analysis;
    const scoreColor = score >= 70 ? 'text-emerald-500' : score >= 40 ? 'text-amber-500' : 'text-destructive';

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <Link href={`/student/practice/${examId}`}>
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title="Practice Report"
                    description={report.exam?.title || 'Practice Session'}
                />
            </div>

            {/* Score Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="p-6 text-center">
                    <div className="bg-primary/10 p-3 rounded-xl w-fit mx-auto border border-primary/20 mb-3">
                        <Target className="h-6 w-6 text-primary" />
                    </div>
                    <p className={`text-4xl font-bold ${scoreColor}`}>
                        {score !== null ? `${Math.round(score)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Overall Score</p>
                </Card>
                <Card className="p-6 text-center">
                    <div className="bg-blue-500/10 p-3 rounded-xl w-fit mx-auto border border-blue-500/20 mb-3">
                        <BarChart3 className="h-6 w-6 text-blue-500" />
                    </div>
                    <p className="text-4xl font-bold text-foreground">
                        {confidence !== null ? `${Math.round(confidence * 100)}%` : 'N/A'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Confidence</p>
                </Card>
                <Card className="p-6 text-center">
                    <div className="bg-emerald-500/10 p-3 rounded-xl w-fit mx-auto border border-emerald-500/20 mb-3">
                        <TrendingUp className="h-6 w-6 text-emerald-500" />
                    </div>
                    <p className="text-4xl font-bold text-foreground">
                        {analysis.passed}/{analysis.total_rubrics}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 font-medium uppercase tracking-wider">Rubrics Passed</p>
                </Card>
            </div>

            {/* Rubric Breakdown */}
            <Card className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                    Rubric Breakdown
                </h3>
                <div className="space-y-3">
                    {report.rubric_results.map((rubric: any, idx: number) => (
                        <div
                            key={idx}
                            className={`p-4 rounded-xl border transition-all ${rubric.passed
                                    ? 'bg-emerald-500/5 border-emerald-500/20'
                                    : 'bg-destructive/5 border-destructive/20'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {rubric.passed ? (
                                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                                    ) : (
                                        <XCircle className="h-4 w-4 text-destructive" />
                                    )}
                                    <span className="font-medium text-foreground text-sm">{rubric.criterion}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs font-mono">
                                        Weight: {rubric.weight}%
                                    </Badge>
                                    {rubric.score_awarded !== null && (
                                        <Badge className={rubric.passed ? 'bg-emerald-500/10 text-emerald-500' : 'bg-destructive/10 text-destructive'}>
                                            {Math.round(rubric.score_awarded)}%
                                        </Badge>
                                    )}
                                </div>
                            </div>
                            {rubric.ai_reasoning && (
                                <p className="text-xs text-muted-foreground ml-6 leading-relaxed">
                                    {rubric.ai_reasoning}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </Card>

            {/* Strengths & Improvements */}
            <div className="grid gap-4 md:grid-cols-2">
                {analysis.strengths.length > 0 && (
                    <Card className="p-6 space-y-3">
                        <h3 className="font-semibold text-emerald-500 flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            Strengths
                        </h3>
                        <ul className="space-y-2">
                            {analysis.strengths.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
                {analysis.areas_to_improve.length > 0 && (
                    <Card className="p-6 space-y-3">
                        <h3 className="font-semibold text-amber-500 flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4" />
                            Areas to Improve
                        </h3>
                        <ul className="space-y-2">
                            {analysis.areas_to_improve.map((s: string, i: number) => (
                                <li key={i} className="text-sm text-foreground flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                                    {s}
                                </li>
                            ))}
                        </ul>
                    </Card>
                )}
            </div>

            {/* Transcript */}
            {report.transcript && report.transcript.length > 0 && (
                <Card className="p-6 space-y-4">
                    <h3 className="font-semibold text-foreground flex items-center gap-2">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        Full Transcript
                    </h3>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {report.transcript.map((turn: any, idx: number) => (
                            <div
                                key={idx}
                                className={`p-3 rounded-lg text-sm ${turn.speaker === 'ASSISTANT'
                                        ? 'bg-primary/5 border border-primary/10 ml-4'
                                        : 'bg-muted/50 border border-border mr-4'
                                    }`}
                            >
                                <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="text-[10px] font-mono py-0">
                                        {turn.speaker === 'ASSISTANT' ? 'AI Examiner' : 'You'}
                                    </Badge>
                                </div>
                                <p className="text-foreground leading-relaxed">{turn.text}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Practice Again */}
            <div className="flex gap-3">
                <Button asChild variant="outline" className="flex-1 h-12 gap-2">
                    <Link href={`/student/practice/${examId}`}>
                        <RefreshCw className="h-4 w-4" />
                        Practice Again
                    </Link>
                </Button>
                <Button asChild className="flex-1 h-12 gap-2">
                    <Link href="/student/practice">
                        <Target className="h-4 w-4" />
                        All Practice Exams
                    </Link>
                </Button>
            </div>
        </main>
    );
}
