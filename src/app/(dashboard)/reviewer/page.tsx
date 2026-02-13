'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, Filter, PlayCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useReviewQueue } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { VivaSession, ReviewStatus } from '@/types/backend';

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
        status: ReviewStatus.FLAGGED,
        exam_code: debouncedExamCode || undefined
    });

    const reviews = flaggedSessions || [];

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <BackgroundBeams className='-z-10 opacity-30' /> */}

            <div className="relative z-10 p-6 md:p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Review Hub
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-2xl">
                            Validate AI-flagged anomalies and ensure academic integrity.
                        </p>
                    </div>

                    <div className="flex gap-4">
                        <Card className="px-6 py-3 flex flex-col items-center justify-center border-l-4 border-l-primary" role="status" aria-label={`${reviews.length} pending review cases`}>
                            <span className="text-3xl font-semibold text-foreground leading-none">{reviews.length}</span>
                            <span className="text-[10px] uppercase tracking-widest text-primary font-bold mt-1">Pending Cases</span>
                        </Card>
                    </div>
                </div>

                {/* Filters */}
                <div className="sticky top-4 z-20">
                    <div className="flex flex-col md:flex-row gap-4 items-center bg-muted/60 p-2 pl-4 pr-2 rounded-xl border border-border">
                        <div className="relative w-full md:w-96 group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Filter by Exam Code..."
                                value={examCodeFilter}
                                onChange={(e) => setExamCodeFilter(e.target.value)}
                                className="pl-10 bg-background border-border focus:border-primary/50 transition-all rounded-lg h-10"
                            />
                        </div>
                        <div className="w-px h-8 bg-border hidden md:block" />
                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" aria-label="Filter reviews by reason">
                            <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                            Filter by Reason
                        </Button>
                        <div className="ml-auto text-sm font-medium text-muted-foreground px-4">
                            Showing <span className="text-foreground">{reviews.length}</span> items
                        </div>
                    </div>
                </div>

                {/* Queue List */}
                <div className="space-y-4 min-h-[500px]">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-muted-foreground animate-pulse">Syncing review queue...</p>
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-300">
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle className="w-12 h-12 text-primary" />
                            </div>
                            <h3 className="text-2xl font-semibold text-foreground mb-2">All Clear!</h3>
                            <p className="text-muted-foreground max-w-md mx-auto">
                                You&apos;ve reviewed all flagged sessions. Great job maintaining the standards.
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-3">
                            {reviews.map((session: VivaSession) => (
                                <div key={session.id}>
                                    <Card className="group overflow-hidden hover:border-primary/30 transition-colors">
                                        <div className="relative h-full w-full p-4 flex flex-col md:flex-row gap-6 justify-between items-center">

                                            {/* Minimal Left: Exam & Student Info */}
                                            <div className="flex items-center gap-6 flex-1">
                                                <div className="w-2 h-12 rounded-full bg-destructive/50 group-hover:bg-destructive transition-colors" aria-hidden="true" />

                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                                                            {session.exam?.title || 'Untitled Exam'}
                                                        </h3>
                                                        <Badge variant="outline" className="text-[10px] h-5 border-border text-muted-foreground font-mono">
                                                            {session.exam?.exam_code || '---'}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                        <span className="flex items-center gap-1.5">
                                                            <div className="w-4 h-4 rounded-full bg-muted flex items-center justify-center text-[8px] text-muted-foreground font-bold">ST</div>
                                                            {session.student?.full_name || session.student_id.slice(0, 8)}
                                                        </span>
                                                        <span className="w-1 h-1 rounded-full bg-border" />
                                                        <span className="font-mono text-xs">{formatToLocalDateTime(session.created_at)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Minimal Right: AI Score & Action */}
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-0.5">AI Score</div>
                                                    <div className="text-2xl font-semibold text-foreground">
                                                        {session.final_score?.toFixed(0)}<span className="text-sm font-normal text-muted-foreground">%</span>
                                                    </div>
                                                </div>

                                                <Button asChild className="bg-primary/10 hover:bg-primary hover:text-primary-foreground border border-primary/20 hover:border-primary text-foreground transition-all h-10 px-5 font-bold tracking-wide rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                                                    <Link href={`/reviewer/session/${session.id}`} className="flex items-center justify-center gap-2" aria-label={`Review session for ${session.exam?.title || 'Untitled Exam'}`}>
                                                        Review
                                                        <PlayCircle className="w-3.5 h-3.5" aria-hidden="true" />
                                                    </Link>
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
