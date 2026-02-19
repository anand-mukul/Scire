'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { api } from '@/lib/network/api';
import { cn } from '@/lib/utils';
import { ExamStatus } from '@/types/backend';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Plus, Search, MoreVertical, Settings, Trash2,
    Users, FileText, Clock, Share2, BookOpen, ShieldCheck,
} from 'lucide-react';
import { formatToLocalDateTime } from '@/lib/date-utils';

import { useExams } from '@/hooks/use-dashboard-data';
import DeleteExamDialog from '@/components/dashboard/DeleteExamDialog';
import ShareExamDialog from '@/components/dashboard/ShareExamDialog';

import { StatusBadge } from '@/components/ui/status-badge';

import { PageHeader } from '@/components/dashboard/page-header';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';


export default function AllExamsPage() {
    const router = useRouter();
    const { data: exams, isLoading } = useExams();
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
    const [shareTarget, setShareTarget] = useState<any | null>(null);

    const filteredExams = exams?.filter((exam) =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.exam_code?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 w-full">
            <div className="flex flex-col gap-4">


                <PageHeader
                    title="All Exams"
                    description="Manage your examination library."
                    actions={
                        <Button onClick={() => router.push('/instructor/exam/create')}>
                            <Plus className="w-4 h-4" />
                            Create New Exam
                        </Button>
                    }
                />
                <Separator />
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search by name or code..."
                    className="pl-10 bg-card/50 border-input focus:border-primary/50 transition-colors"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array(6).fill(0).map((_, i) => (
                        <div key={i} className="h-56 rounded-xl bg-card/50 animate-pulse border border-border" />
                    ))
                ) : filteredExams.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={FileText}
                            title="No exams found"
                            description="Create your first exam to get started."
                            action={{
                                label: "Create New Exam",
                                onClick: () => router.push('/instructor/exam/create')
                            }}
                        />
                    </div>
                ) : (
                    filteredExams.map((exam) => {
                        return (
                            <Card
                                key={exam.id}
                                className="card-hover group h-full flex flex-col hover:border-primary/30 transition-all cursor-pointer overflow-hidden"
                                onClick={() => router.push(`/instructor/exam/${exam.id}`)}
                            >
                                {/* Status bar */}
                                {/* Status bar - using inline style for dynamic color match if needed, or just simplified */}
                                <div className={cn("h-1 w-full",
                                    exam.status === ExamStatus.ACTIVE ? "bg-blue-500 animate-pulse" :
                                        exam.status === ExamStatus.PUBLISHED ? "bg-emerald-500" :
                                            exam.status === ExamStatus.DRAFT ? "bg-amber-500" : "bg-zinc-500"
                                )} />

                                <div className="flex flex-col flex-1 p-5">
                                    {/* Header row */}
                                    <div className="flex justify-between items-start mb-3">
                                        <Badge variant="outline" className="font-mono tracking-wider text-xs bg-primary/5 border-primary/10 text-primary">
                                            {exam.exam_code || '---'}
                                        </Badge>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2 -mt-1">
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => router.push(`/instructor/exam/${exam.id}`)}>
                                                    <Settings className="w-4 h-4" /> Manage
                                                </DropdownMenuItem>
                                                {(exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE) && (
                                                    <DropdownMenuItem onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShareTarget(exam);
                                                    }}>
                                                        <Share2 className="w-4 h-4" /> Share
                                                    </DropdownMenuItem>
                                                )}
                                                {exam.status === ExamStatus.DRAFT && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setDeleteTarget({ id: exam.id, title: exam.title });
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-base font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                                        {exam.title}
                                    </h3>

                                    {/* Meta info */}
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mt-auto pt-3 border-t border-border/50">
                                        <StatusBadge status={exam.status} className="text-[10px] px-2 py-0.5 h-auto" />
                                        <div className="flex items-center gap-1">
                                            <Users className="w-3 h-3" />
                                            <span>{exam.candidates_count || 0}</span>
                                        </div>
                                        {exam.settings?.duration_minutes && (
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                <span>{exam.settings.duration_minutes}m</span>
                                            </div>
                                        )}
                                        {exam.settings?.strict_mode && (
                                            <div className="flex items-center gap-1 text-amber-500">
                                                <ShieldCheck className="w-3 h-3" />
                                                <span>Strict</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>

            {/* Dialogs */}
            {
                deleteTarget && (
                    <DeleteExamDialog
                        open={!!deleteTarget}
                        onOpenChange={(open) => !open && setDeleteTarget(null)}
                        examId={deleteTarget.id}
                        examTitle={deleteTarget.title}
                    />
                )
            }
            {
                shareTarget && (
                    <ShareExamDialog
                        open={!!shareTarget}
                        onOpenChange={(open) => !open && setShareTarget(null)}
                        examTitle={shareTarget.title}
                        examCode={shareTarget.exam_code || ''}
                        startTime={shareTarget.start_time}
                        endTime={shareTarget.end_time}
                        durationMinutes={shareTarget.settings?.duration_minutes}
                    />
                )
            }
        </div >
    );
}
