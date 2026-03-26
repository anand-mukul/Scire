'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { VivaSession, SessionStatus } from '@/types/backend';
import { useSessions } from '@/hooks/use-dashboard-data';
import { Clock, ArrowUpRight, ShieldAlert, FileText, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatToLocalDateTime, formatDuration } from '@/lib/date-utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface HistorySession extends VivaSession {
    exam_title?: string;
}

export default function StudentHistoryPage() {
    // Fetch completed sessions
    const { data: sessions, isLoading } = useSessions({ status: SessionStatus.COMPLETED });

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Exam History"
                description="View your past assessments and results."
                badge={sessions ? { label: "Completed", value: sessions.length } : undefined}
            />

            <div className="grid gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="space-y-3 flex-1">
                                    <div className="flex items-center gap-3">
                                        <Skeleton className="h-6 w-64" />
                                        <Skeleton className="h-5 w-20 rounded-full" />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <Skeleton className="h-4 w-32" />
                                        <Skeleton className="h-4 w-24" />
                                    </div>
                                </div>
                                <Skeleton className="h-10 w-32" />
                            </div>
                        </Card>
                    ))
                ) : sessions?.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No completed exams found"
                        description="Once you finish an exam, it will appear here for you to review."
                    />
                ) : (
                    ([...(sessions as unknown as HistorySession[])]
                        .sort((a, b) => {
                            // Sort by start_time descending (most recently attempted first)
                            const timeA = a.start_time ? new Date(a.start_time).getTime() : 0;
                            const timeB = b.start_time ? new Date(b.start_time).getTime() : 0;
                            return timeB - timeA;
                        })
                    )?.map((session, index) => {
                        const isPending = session.final_score === null || session.final_score === undefined;
                        const passed = (session.final_score || 0) >= 50;
                        const isUnderReview = (session.integrity_flag || session.review_status === 'FLAGGED' || session.review_status === 'UNDER_REVIEW') && 
                                              session.review_status !== 'APPROVED' && 
                                              session.review_status !== 'REJECTED';

                        return (
                            <div key={session.id} className="animate-in fade-in duration-200" style={{ animationDelay: `${index * 50}ms` }}>
                                <Card className="p-6 group hover:border-primary/50 transition-all duration-200 card-hover">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="space-y-3 flex-1 min-w-0">
                                            <div className="flex flex-wrap items-center gap-3">
                                                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[500px]" title={session.exam?.title || 'Untitled Exam'}>
                                                    {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                                </h3>
                                                {isUnderReview ? (
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                                                        <ShieldAlert className="w-3 h-3 mr-1" />
                                                        Pending Review
                                                    </Badge>
                                                ) : isPending ? (
                                                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                                        <span className="relative flex h-2 w-2 mr-2">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                        </span>
                                                        Analyzing
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className={`${passed ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-destructive/10 text-destructive border-destructive/20'}`}>
                                                        {Math.round(session.final_score || 0)}% {passed ? 'Passed' : 'Failed'}
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground font-medium">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    <span>{formatToLocalDateTime(session.created_at)}</span>
                                                </div>
                                                {session.start_time && session.end_time && (
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4" />
                                                        <span>{formatDuration(session.start_time, session.end_time)}</span>
                                                    </div>
                                                )}
                                                <div className="hidden md:flex items-center gap-2 font-mono text-xs opacity-50 border-l border-border pl-6">
                                                    ID: {session.id.slice(0, 8)}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6 mt-2 md:mt-0">
                                            {isUnderReview ? (
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="w-full md:w-auto">
                                                            <Button disabled variant="outline" className="w-full md:w-auto bg-destructive/5 text-destructive border-destructive/20 font-bold opacity-100 cursor-not-allowed">
                                                                <ShieldAlert className="mr-2 w-4 h-4" />
                                                                In Review
                                                            </Button>
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent className="max-w-xs border-border">
                                                        <p>Integrity issues were detected during this session. It is currently being reviewed by your instructor.</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            ) : (
                                                <Link href={`/student/exam/${session.id}/result`} className="w-full md:w-auto">
                                                    <Button className="w-full md:w-auto bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-foreground border border-border hover:border-primary transition-all font-bold shadow-sm button-press">
                                                        View Results
                                                        <ArrowUpRight className="ml-2 w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        );
                    })
                )}
            </div>
        </main>
    );
}
