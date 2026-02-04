'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

import { useQueryClient, useMutation } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { ExamStatus } from '@/types/backend';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { PremiumCard } from '@/components/ui/premium-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Search, MoreVertical, Settings, Trash2, Users, FileText, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { useExams } from '@/hooks/use-dashboard-data';

export default function AllExamsPage() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { data: exams, isLoading } = useExams();
    const [searchQuery, setSearchQuery] = useState('');
    const [examToDelete, setExamToDelete] = useState<string | null>(null);

    const deleteMutation = useMutation({
        mutationFn: api.exams.delete,
        onSuccess: () => {
            toast.success('Exam deleted successfully');
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            setExamToDelete(null);
        },
        onError: (error) => {
            toast.error(error.message || 'Failed to delete exam');
        },
    });

    const filteredExams = exams?.filter((exam) =>
        exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exam.exam_code?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const handleDelete = () => {
        if (examToDelete) {
            deleteMutation.mutate(examToDelete);
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <AmbientGlow />

            <AlertDialog open={!!examToDelete} onOpenChange={(open) => !open && setExamToDelete(null)}>
                <AlertDialogContent className="bg-card border-border text-card-foreground">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            This action cannot be undone. This will permanently delete the exam and all associated rubrics.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="border-border hover:bg-muted hover:text-foreground">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={deleteMutation.isPending}
                        >
                            {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <div className="relative z-10 p-8 max-w-7xl mx-auto space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">All Exams</h1>
                        <p className="text-muted-foreground">Manage your examination library.</p>
                    </div>
                    <Button
                        onClick={() => router.push('/instructor/exam/create')}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create New Exam
                    </Button>
                </motion.div>

                {/* Search Bar */}
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search exams..."
                        className="pl-10 bg-card/50 border-input focus:border-primary/50 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        Array(6).fill(0).map((_, i) => (
                            <div key={i} className="h-48 rounded-xl bg-card/50 animate-pulse border border-border" />
                        ))
                    ) : filteredExams.length === 0 ? (
                        <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border">
                            <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-medium">No exams found</p>
                            <p className="text-sm">Create your first exam to get started.</p>
                        </div>
                    ) : (
                        filteredExams.map((exam, i: number) => (
                            <motion.div
                                key={exam.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: i * 0.05 }}
                            >
                                <PremiumCard
                                    className="group h-full flex flex-col justify-between hover:border-primary/30 transition-all cursor-pointer bg-card/40 border-white/5"
                                    onClick={() => router.push(`/instructor/exam/${exam.id}`)}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary font-mono">
                                                {exam.exam_code || '---'}
                                            </Badge>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground -mr-2">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="bg-card border-border text-card-foreground">
                                                    <DropdownMenuItem onClick={() => router.push(`/instructor/exam/${exam.id}`)}>
                                                        <Settings className="w-4 h-4 mr-2" />
                                                        Manage
                                                    </DropdownMenuItem>
                                                    {exam.status === ExamStatus.DRAFT && (
                                                        <DropdownMenuItem
                                                            className="text-red-400 focus:text-red-400"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setExamToDelete(exam.id);
                                                            }}
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors pointer-events-none">
                                            {exam.title}
                                        </h3>

                                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 pointer-events-none">
                                            <div className="flex items-center gap-1">
                                                <div className={`w-2 h-2 rounded-full ${exam.status === ExamStatus.PUBLISHED ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-yellow-500'}`} />
                                                <span className="capitalize">{exam.status}</span>
                                            </div>
                                            <span>•</span>
                                            <div className="flex items-center gap-1">
                                                <Users className="w-3 h-3" />
                                                <span>{exam.candidates_count || 0}</span>
                                            </div>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </motion.div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
