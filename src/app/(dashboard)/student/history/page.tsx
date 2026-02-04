'use client';

import React from 'react';
import { PremiumCard } from '@/components/ui/premium-card';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Badge } from '@/components/ui/badge';
import { VivaSession } from '@/types/backend';
import { useSessions } from '@/hooks/use-dashboard-data';
import { FileText, Calendar, Clock, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { formatToLocalDateTime, formatDuration } from '@/lib/date-utils';
import { motion } from 'motion/react';

interface HistorySession extends VivaSession {
    exam_title?: string;
}

export default function StudentHistoryPage() {
    // Fetch completed sessions
    const { data: sessions, isLoading } = useSessions({ status: 'COMPLETED' });

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <AmbientGlow />

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col gap-2"
                >
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)] pb-2 flex items-center gap-4">
                        Exam History
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl">
                        View your past assessments and results.
                    </p>
                </motion.div>

                <div className="grid gap-4">
                    {isLoading ? (
                        <div className="text-muted-foreground animate-pulse flex items-center gap-2">
                            <Clock className="w-4 h-4 animate-spin" />
                            Loading history...
                        </div>
                    ) : sessions?.length === 0 ? (
                        <PremiumCard className="p-16 flex flex-col items-center justify-center text-center bg-card/40 border-border border-dashed">
                            <div className="p-4 rounded-full bg-muted/20 text-muted-foreground mb-4">
                                <FileText className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">No completed exams found</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto">
                                Once you finish an exam, it will appear here for you to review.
                            </p>
                        </PremiumCard>
                    ) : (
                        (sessions as unknown as HistorySession[])?.map((session, index) => {
                            const isPending = session.final_score === null || session.final_score === undefined;
                            const passed = (session.final_score || 0) >= 50;

                            return (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.3, delay: index * 0.1 }}
                                >
                                    <PremiumCard className="p-6 group hover:border-primary/50 transition-all duration-300 bg-card/40 backdrop-blur-xl border-border">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                            <div className="space-y-3 flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[500px]" title={session.exam?.title || 'Untitled Exam'}>
                                                        {session.exam?.title || session.exam_title || 'Untitled Exam'}
                                                    </h3>
                                                    {isPending ? (
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
                                                <Link href={`/student/exam/${session.id}/result`} className="w-full md:w-auto">
                                                    <Button className="w-full md:w-auto bg-secondary/50 hover:bg-primary hover:text-primary-foreground text-foreground border border-border hover:border-primary transition-all font-bold shadow-sm">
                                                        View Results
                                                        <ArrowUpRight className="ml-2 w-4 h-4" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
