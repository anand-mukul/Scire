'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Search, Filter, PlayCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { useReviewQueue } from '@/hooks/use-dashboard-data';
import Link from 'next/link';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { VivaSession, ReviewStatus } from '@/types/backend';
import { PageHeader } from '@/components/dashboard/page-header';

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
        exam_code: debouncedExamCode || undefined
    });

    const reviews = flaggedSessions || [];

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header */}
            <PageHeader
                title="Review Queue"
                description="Validate AI-flagged anomalies and ensure academic integrity."
                badge={{
                    label: "Pending Cases",
                    value: reviews.length,
                    variant: "count"
                }}
            />

            {/* Filters */}
            {/* Filters */}
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/30 p-1 rounded-xl">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Filter by Exam Code..."
                        value={examCodeFilter}
                        onChange={(e) => setExamCodeFilter(e.target.value)}
                        className="pl-9 h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50 transition-all"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Button variant="outline" className="h-10 bg-background/50 border-transparent hover:border-border/50 text-muted-foreground hover:text-foreground" aria-label="Filter reviews by reason">
                        <Filter className="w-4 h-4 mr-2" aria-hidden="true" />
                        Filter by Reason
                    </Button>
                </div>
            </div>

            {/* Queue List Table */}
            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden min-h-[500px]">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[300px] pl-6">Exam Details</TableHead>
                            <TableHead>Student</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead>AI Score</TableHead>
                            <TableHead className="text-right pr-6">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array(5).fill(0).map((_, i) => (
                                <TableRow key={i} className="border-border/50">
                                    <TableCell className="pl-6"><Skeleton className="h-10 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                    <TableCell className="pr-6"><Skeleton className="h-9 w-24 ml-auto" /></TableCell>
                                </TableRow>
                            ))
                        ) : reviews.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-64 text-center text-muted-foreground">
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <CheckCircle className="w-10 h-10 text-muted-foreground/20" />
                                        <p className="font-medium text-foreground">All caught up!</p>
                                        <p className="text-sm">No pending reviews in the queue.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reviews.map((session: VivaSession) => (
                                <TableRow key={session.id} className="hover:bg-muted/40 border-border/40 transition-colors group">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <span className="font-semibold text-foreground">
                                                {session.exam?.title || 'Untitled Exam'}
                                            </span>
                                            <Badge variant="outline" className="w-fit text-[10px] h-5 border-border text-muted-foreground font-mono px-1.5">
                                                {session.exam?.exam_code || '---'}
                                            </Badge>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[9px] font-bold text-primary">
                                                {session.student?.full_name?.charAt(0) || 'S'}
                                            </div>
                                            <div className="flex flex-col text-sm">
                                                <span className="text-foreground font-medium">
                                                    {session.student?.full_name || 'Unknown Student'}
                                                </span>
                                                <span className="text-muted-foreground text-xs">
                                                    ID: {session.student_id?.slice(0, 8)}
                                                </span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">
                                        {formatToLocalDateTime(session.created_at)}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-bold text-foreground">
                                                {session.final_score?.toFixed(0)}
                                            </span>
                                            <span className="text-xs text-muted-foreground">%</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right pr-6">
                                        <Button asChild size="sm" className="font-semibold shadow-sm gap-2">
                                            <Link href={`/reviewer/session/${session.id}`}>
                                                Review
                                                <PlayCircle className="w-3.5 h-3.5" />
                                            </Link>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </main >
    );
}
