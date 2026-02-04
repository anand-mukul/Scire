'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { motion } from 'motion/react';
import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';
import { PremiumCard } from '@/components/ui/premium-card';
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
        queryKey: ['sessions', { review_status: 'approved' }],
        queryFn: () => api.sessions.list({ review_status: 'approved' }),
    });

    // Fetch flagged sessions (reviewed and flagged for issues)
    const { data: flaggedSessions, isLoading: loadingFlagged } = useQuery<ReviewedSession[]>({
        queryKey: ['sessions', { review_status: 'flagged' }],
        queryFn: () => api.sessions.list({ review_status: 'flagged' }),
    });

    const isLoading = loadingApproved || loadingFlagged;

    // Combine and sort by date
    const allSessions = [
        ...(approvedSessions || []),
        ...(flaggedSessions || [])
    ].sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime());

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <BackgroundBeams className="-z-10 opacity-20" />

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20">
                            <History className="w-6 h-6 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Review History</h1>
                            <p className="text-sm text-neutral-500">
                                {allSessions.length} sessions reviewed
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                    className="grid grid-cols-2 gap-4 max-w-md"
                >
                    <PremiumCard className="p-4 bg-blue-500/5 border-blue-500/10">
                        <div className="flex items-center gap-3">
                            <CheckCircle className="w-5 h-5 text-blue-400" />
                            <div>
                                <div className="text-2xl font-bold text-white">{approvedSessions?.length || 0}</div>
                                <div className="text-xs text-neutral-500 uppercase tracking-widest">Approved</div>
                            </div>
                        </div>
                    </PremiumCard>
                    <PremiumCard className="p-4 bg-red-500/5 border-red-500/10">
                        <div className="flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-400" />
                            <div>
                                <div className="text-2xl font-bold text-white">{flaggedSessions?.length || 0}</div>
                                <div className="text-xs text-neutral-500 uppercase tracking-widest">Flagged</div>
                            </div>
                        </div>
                    </PremiumCard>
                </motion.div>

                {/* Session List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-3"
                >
                    {isLoading ? (
                        Array(4)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-xl bg-white/5" />
                            ))
                    ) : allSessions.length === 0 ? (
                        <div className="text-center py-16 text-neutral-500">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No reviewed sessions yet.</p>
                            <p className="text-sm mt-2">Sessions you review will appear here.</p>
                        </div>
                    ) : (
                        allSessions.map((session, index) => {
                            const isApproved = session.review_status === ReviewStatus.APPROVED;

                            return (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.03 }}
                                >
                                    <PremiumCard className="!p-0 bg-black/40 border-white/5 hover:border-white/10 transition-all group">
                                        <div className="relative p-5 flex items-center justify-between gap-4">
                                            {/* Status indicator */}
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-xl ${isApproved ? 'bg-blue-500' : 'bg-red-500'}`} />

                                            <div className="flex items-center gap-4 min-w-0 flex-1 pl-3">
                                                {/* Icon */}
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isApproved
                                                    ? 'bg-blue-500/10 border border-blue-500/20'
                                                    : 'bg-red-500/10 border border-red-500/20'
                                                    }`}>
                                                    {isApproved
                                                        ? <CheckCircle className="w-5 h-5 text-blue-400" />
                                                        : <XCircle className="w-5 h-5 text-red-400" />
                                                    }
                                                </div>

                                                {/* Info */}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-bold text-white truncate">
                                                            {session.exam?.title || 'Untitled Exam'}
                                                        </h3>
                                                        <Badge variant="outline" className={`text-xs ${isApproved
                                                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                            }`}>
                                                            {isApproved ? 'Approved' : 'Rejected'}
                                                        </Badge>
                                                        {session.final_score !== null && session.final_score !== undefined && (
                                                            <Badge variant="outline" className="bg-white/5 text-neutral-300 border-white/10 text-xs">
                                                                {Math.round(session.final_score)}%
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
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
                                                    className="text-neutral-400 hover:text-white hover:bg-white/10"
                                                >
                                                    View Details
                                                    <ArrowUpRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            );
                        })
                    )}
                </motion.div>
            </div>
        </div>
    );
}
