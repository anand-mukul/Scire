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
    History,
    AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { VivaSession, ReviewStatus } from '@/types/backend';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { KPICard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/dashboard/page-header';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

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
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header */}
            <PageHeader
                title="Review History"
                badge={{
                    label: "Sessions Reviewed",
                    value: allSessions.length,
                    variant: "count"
                }}
            />

            {/* Stats */}
            <div className="grid gap-6 grid-cols-2 max-w-2xl">
                <KPICard
                    title="Approved Sessions"
                    value={approvedSessions?.length || 0}
                    icon={CheckCircle}
                    trend="neutral"
                    loading={isLoading}
                    className="bg-gradient-to-br from-emerald-500/5 to-transparent border-emerald-500/10"
                />
                <KPICard
                    title="Flagged Sessions"
                    value={flaggedSessions?.length || 0}
                    icon={AlertTriangle}
                    trend="neutral"
                    loading={isLoading}
                    className="bg-gradient-to-br from-amber-500/5 to-transparent border-amber-500/10"
                />
            </div>

            {/* Session List Table */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[300px] pl-6">Exam</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Score</TableHead>
                            <TableHead className="hidden md:table-cell">Student</TableHead>
                            <TableHead className="hidden md:table-cell">Reviewed On</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-border/50">
                                    <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-12" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell className="hidden md:table-cell"><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : allSessions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="h-64 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <History className="w-10 h-10 text-muted-foreground/20" />
                                        <p className="font-medium text-foreground">No history yet</p>
                                        <p className="text-sm">Reviewed sessions will appear here.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            allSessions.map((session) => {
                                const isApproved = session.review_status === ReviewStatus.APPROVED;
                                return (
                                    <TableRow key={session.id} className="hover:bg-muted/40 border-border/40 transition-colors group">
                                        <TableCell className="pl-6 py-3 font-medium">
                                            {session.exam?.title || 'Untitled Exam'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`text-xs capitalize ${isApproved
                                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                                                : 'bg-destructive/10 text-destructive border-destructive/20'
                                                }`}>
                                                {isApproved ? 'Approved' : 'Rejected'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {session.final_score !== null && session.final_score !== undefined ? (
                                                <Badge variant="secondary" className="font-mono text-xs">
                                                    {Math.round(session.final_score)}%
                                                </Badge>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            <div className="flex items-center gap-2">
                                                <User className="w-3.5 h-3.5" />
                                                {session.student?.full_name || session.student_id?.slice(0, 8) || 'Unknown'}
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-3.5 h-3.5" />
                                                {formatToLocalDateTime(session.updated_at || session.created_at)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Button variant="ghost" size="sm" asChild className="hover:bg-background/80">
                                                <Link href={`/reviewer/session/${session.id}`}>
                                                    View
                                                    <ArrowUpRight className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                                                </Link>
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </main>
    );
}
