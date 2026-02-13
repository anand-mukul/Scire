'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    CheckCircle,
    XCircle,
    Calendar,
    User,
    ArrowUpRight,
    History
} from 'lucide-react';
import Link from 'next/link';
import { VivaSession, ReviewStatus } from '@/types/backend';
import { formatToLocalDateTime } from '@/lib/date-utils';

interface ReviewedSession extends VivaSession {
    reviewer_notes?: string;
}

export default function ReviewerHistoryPage() {
    // Fetch approved sessions (reviewed and passed)
    const { data: approvedSessions, isLoading: loadingApproved } = useQuery<ReviewedSession[]>({
        queryKey: ['sessions', { review_status: ReviewStatus.APPROVED }],
        queryFn: () => api.sessions.list({ review_status: ReviewStatus.APPROVED }),
    });

    // Fetch flagged sessions (reviewed and flagged for issues)
    const { data: flaggedSessions, isLoading: loadingFlagged } = useQuery<ReviewedSession[]>({
        queryKey: ['sessions', { review_status: ReviewStatus.FLAGGED }],
        queryFn: () => api.sessions.list({ review_status: ReviewStatus.FLAGGED }),
    });

    const isLoading = loadingApproved || loadingFlagged;

    // Combine and sort by date
    const allSessions = [
        ...(approvedSessions || []),
        ...(flaggedSessions || [])
    ].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <BackgroundBeams className="-z-10 opacity-20" /> */}

            <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <History className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                                Review History
                            </h1>
                            <p className="text-muted-foreground text-sm max-w-2xl">
                                {allSessions.length} sessions reviewed
                            </p>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 max-w-md">
                    <Card className="p-4 bg-primary/5 border-primary/10">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-primary" />
                            <div>
                                <div className="text-2xl font-semibold text-foreground">{approvedSessions?.length || 0}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">Approved</div>
                            </div>
                        </div>
                    </Card>
                    <Card className="p-4 bg-destructive/5 border-destructive/10">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-destructive" />
                            <div>
                                <div className="text-2xl font-semibold text-foreground">{flaggedSessions?.length || 0}</div>
                                <div className="text-xs text-muted-foreground uppercase tracking-widest">Flagged</div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Session List */}
                <div className="space-y-3">
                    {isLoading ? (
                        Array(4)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl" />
                            ))
                    ) : allSessions.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No reviewed sessions yet.</p>
                            <p className="text-sm mt-2">Sessions you review will appear here.</p>
                        </div>
                    ) : (
                        allSessions.map((session, index) => {
                            const isApproved = session.review_status === ReviewStatus.APPROVED;

                            return (
                                <div key={session.id}>
                                    <Card className="hover:border-primary/10 transition-colors group">
                                        <div className="relative p-5 flex items-center justify-between gap-4">
                                            {/* Status indicator */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isApproved ? 'bg-primary' : 'bg-destructive'}`} />

                                            <div className="flex items-center gap-4 min-w-0 flex-1 pl-3">
                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isApproved
                                                    ? 'bg-primary/10 border border-primary/20'
                                                    : 'bg-destructive/10 border border-destructive/20'
                                                    }`}>
                                                    {isApproved
                                                        ? <CheckCircle className="w-5 h-5 text-primary" />
                                                        : <XCircle className="w-5 h-5 text-destructive" />
                                                    }
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-semibold text-foreground truncate">
                                                            {session.exam?.title || 'Untitled Exam'}
                                                        </h3>
                                                        <Badge variant="outline" className={`text-xs ${isApproved
                                                            ? 'bg-primary/10 text-primary border-primary/20'
                                                            : 'bg-destructive/10 text-destructive border-destructive/20'
                                                            }`}>
                                                            {isApproved ? 'Approved' : 'Rejected'}
                                                        </Badge>
                                                        {session.final_score !== null && session.final_score !== undefined && (
                                                            <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-xs">
                                                                {Math.round(session.final_score)}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <User className="w-3.5 h-3.5" />
                                                            {session.student?.full_name || session.student_id?.slice(0, 8) || 'Unknown'}
                                                        </span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatToLocalDateTime(session.updated_at || session.created_at)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Action */}
                                            <Link href={`/reviewer/session/${session.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-foreground"
                                                >
                                                    View Details
                                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
