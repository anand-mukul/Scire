'use client';

import React from 'react';
import { PremiumCard } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';
import { motion } from 'motion/react';
import { CheckCircle, Search, Filter, PlayCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useReviewQueue } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { VivaSession } from '@/types/backend';

export default function ReviewerDashboard() {
    const [examCodeFilter, setExamCodeFilter] = React.useState('');
    const [debouncedExamCode, setDebouncedExamCode] = React.useState('');

    // Debounce filter
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedExamCode(examCodeFilter);
        }, 500);
        return () => clearTimeout(timer);
    }, [examCodeFilter]);

    const { data: flaggedSessions, isLoading } = useReviewQueue({
        status: 'flagged',
        exam_code: debouncedExamCode || undefined
    });

    const reviews = flaggedSessions || [];

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <BackgroundBeams className='-z-10 opacity-30' />

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <span className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold tracking-widest uppercase">
                                Quality Control
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-200">
                            Review Hub
                        </h1>
                        <p className="text-neutral-400 text-lg max-w-2xl">
                            Validate AI-flagged anomalies and ensure academic integrity.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <PremiumCard className="px-6 py-3 flex flex-col items-center justify-center border-l-4 border-l-blue-500 bg-blue-500/5">
                            <span className="text-3xl font-bold text-white leading-none">{reviews.length}</span>
                            <span className="text-[10px] uppercase tracking-widest text-blue-400 font-bold mt-1">Pending Cases</span>
                        </PremiumCard>
                    </div>
                </motion.div>

                {/* Filters */}
                <div className="sticky top-4 z-20">
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-black/60 p-2 pl-4 pr-2 rounded-2xl border border-white/10 backdrop-blur-xl shadow-2xl">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500 group-focus-within:text-white transition-colors" />
                            <Input
                                placeholder="Filter by Exam Code..."
                                value={examCodeFilter}
                                onChange={(e) => setExamCodeFilter(e.target.value)}
                                className="pl-10 bg-white/5 border-transparent focus:bg-white/10 focus:border-white/20 transition-all rounded-xl h-10"
                            />
                        </div>
                        <div className="w-px h-8 bg-white/10 hidden md:block" />
                        <Button variant="ghost" className="text-neutral-400 hover:text-white hover:bg-white/5">
                            <Filter className="w-4 h-4 mr-2" />
                            Filter by Reason
                        </Button>
                        <div className="ml-auto text-sm font-medium text-neutral-500 px-4">
                            Showing <span className="text-white">{reviews.length}</span> items
                        </div>
                    </div>
                </div>

                {/* Queue List */}
                <div className="space-y-4 min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-neutral-500 animate-pulse">Syncing review queue...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center py-32 text-center"
                        >
                            <div className="w-24 h-24 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 shadow-[0_0_50px_rgba(59,130,246,0.2)]">
                                <CheckCircle className="w-12 h-12 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">All Clear!</h3>
                            <p className="text-neutral-400 max-w-md mx-auto">
                                You&apos;ve reviewed all flagged sessions. Great job maintaining the standards.
                            </p>
                        </motion.div>
                    ) : (
                        <div className="grid gap-3">
                            {reviews.map((session: VivaSession, index: number) => (
                                <motion.div
                                    key={session.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <PremiumCard interactive className="group relative overflow-hidden transition-all duration-300 hover:border-blue-500/30 !p-0 bg-neutral-900/40 backdrop-blur-xl border-neutral-800">
                                        <div className="relative h-full w-full p-4 flex flex-col md:flex-row gap-6 justify-between items-center">

                                            {/* Minimal Left: Exam & Student Info */}
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="w-2 h-12 rounded-full bg-red-500/50 group-hover:bg-red-500 transition-colors" />

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                                                            {session.exam?.title || 'Untitled Exam'}
                                                        </h3>
                                                        <Badge variant="outline" className="text-[10px] h-5 border-white/10 text-neutral-400 font-mono">
                                                            {session.exam?.exam_code || '---'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-neutral-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-neutral-800 flex items-center justify-center text-[8px] text-neutral-400 font-bold">ST</div>
                                                            {session.student?.full_name || session.student_id.slice(0, 8)}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-neutral-700" />
                                                        <span className="font-mono text-xs">{formatToLocalDateTime(session.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Minimal Right: AI Score & Action */}
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-[10px] uppercase font-bold text-neutral-500 tracking-wider mb-0.5">AI Score</div>
                                                    <div className="text-2xl font-black text-white">
                                                        {session.final_score?.toFixed(0)}<span className="text-sm font-normal text-neutral-600">%</span>
                                                    </div>
                                                </div>

                                                <Button asChild className="bg-blue-500/10 hover:bg-blue-600 hover:text-white border border-blue-500/20 hover:border-blue-500/50 text-white transition-all shadow-none hover:shadow-lg hover:shadow-blue-500/20 h-10 px-5 font-bold tracking-wide rounded-xl">
                                                    <Link href={`/reviewer/session/${session.id}`} className="flex items-center justify-center gap-2">
                                                        Review
                                                        <PlayCircle className="w-3.5 h-3.5" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
