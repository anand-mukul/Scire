'use client';

import React from 'react';
import { motion } from 'motion/react';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { PremiumCard } from '@/components/ui/premium-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    FileText,
    ChevronRight,
    ListOrdered,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { Exam, Rubric } from '@/types/backend';
import { useExams } from '@/hooks/use-dashboard-data';


interface ExamWithRubrics extends Exam {
    rubrics?: Rubric[];
}

export default function InstructorRubricsPage() {
    // Fetch all exams 
    const { data: exams, isLoading: loadingExams } = useExams();

    // Filter to only show exams created by the current user (with rubrics)
    const activeExams = (exams || []) as ExamWithRubrics[];

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <AmbientGlow />

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="space-y-2"
                >
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <ListOrdered className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">Rubric Management</h1>
                            <p className="text-sm text-muted-foreground">
                                Manage grading rubrics for your exams
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Info Banner */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.1 }}
                >
                    <PremiumCard className="!p-4 bg-blue-500/5 border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-muted-foreground">
                                <p className="font-medium text-blue-400 mb-1">Rubrics are managed per exam</p>
                                <p>Select an exam below to view, add, or edit its rubrics. Each exam has its own set of grading criteria.</p>
                            </div>
                        </div>
                    </PremiumCard>
                </motion.div>

                {/* Exam List */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="space-y-3"
                >
                    <h2 className="text-lg font-semibold text-foreground px-1">Your Exams</h2>

                    {loadingExams ? (
                        Array(3)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted/50" />
                            ))
                    ) : activeExams.length === 0 ? (
                        <div className="text-center py-16 text-muted-foreground">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No exams found.</p>
                            <p className="text-sm mt-2">Create an exam first to manage its rubrics.</p>
                            <Link href="/instructor">
                                <Button className="mt-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                                    Go to Dashboard
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        activeExams.map((exam, index) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.03 }}
                            >
                                <Link href={`/instructor/exam/${exam.id}?tab=rubrics`}>
                                    <PremiumCard className="!p-0 bg-card/40 border-white/5 hover:border-primary/30 transition-all group cursor-pointer">
                                        <div className="relative p-5 flex items-center justify-between gap-4">
                                            {/* Info */}
                                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                                <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                                    <FileText className="w-6 h-6 text-primary" />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-3 mb-1">
                                                        <h3 className="font-bold text-foreground truncate group-hover:text-primary transition-colors">
                                                            {exam.title}
                                                        </h3>
                                                        <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-muted/20 text-xs font-mono">
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

                                            {/* Arrow */}
                                            <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                                <span className="text-sm hidden md:block">Manage Rubrics</span>
                                                <ChevronRight className="w-5 h-5" />
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </Link>
                            </motion.div>
                        ))
                    )}
                </motion.div>
            </div>
        </div>
    );
}
