'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    ChevronRight,
    AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Exam, Rubric } from '@/types/backend';
import { useExams } from '@/hooks/use-dashboard-data';
import { PageHeader } from '@/components/dashboard/page-header';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';


interface ExamWithRubrics extends Exam {
    rubrics?: Rubric[];
}

export default function InstructorRubricsPage() {
    const router = useRouter();
    // Fetch all exams 
    const { data: exams, isLoading: loadingExams } = useExams();

    // Filter to only show exams created by the current user (with rubrics)
    const activeExams = (exams || []) as ExamWithRubrics[];

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <div className="flex flex-col gap-4">
                <PageHeader
                    title="Rubric Management"
                    description="Manage grading rubrics for your exams"
                />
                <Separator />
            </div>

            {/* Info Banner */}
            <Card className="p-4 bg-blue-500/5 border-blue-500/20">
                <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-blue-400 mb-1">Rubrics are managed per exam</p>
                        <p>Select an exam below to view, add, or edit its rubrics. Each exam has its own set of grading criteria.</p>
                    </div>
                </div>
            </Card>

            {/* Exam List */}
            <div className="space-y-4">
                <h2 className="text-lg font-medium text-foreground">Select an Exam</h2>

                {loadingExams ? (
                    Array(3)
                        .fill(0)
                        .map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted/50" />
                        ))
                ) : activeExams.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="No exams found"
                        description="Create an exam first to manage its rubrics."
                        action={{
                            label: "Create Exam",
                            onClick: () => router.push('/instructor/exam/create')
                        }}
                    />
                ) : (
                    <div className="grid gap-4">
                        {activeExams.map((exam) => (
                            <Link key={exam.id} href={`/instructor/exam/${exam.id}?tab=rubrics`}>
                                <Card className="p-5 hover:border-primary/30 transition-all group cursor-pointer">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                <FileText className="w-5 h-5 text-primary" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                                        {exam.title}
                                                    </h3>
                                                    <Badge variant="outline" className="text-xs font-mono">
                                                        {exam.exam_code}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                                    <span className="capitalize">{(exam.status as string).toLowerCase()}</span>
                                                    <span>•</span>
                                                    <span>Max {exam.max_attempts} attempts</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                            <span className="text-sm hidden md:block">Manage Rubrics</span>
                                            <ChevronRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
