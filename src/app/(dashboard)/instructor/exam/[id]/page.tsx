'use client';

import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useRef, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { ExamStatus, KBStatus } from '@/types/backend';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, BookOpen, Settings, ListChecks,
    Trash2, AlertTriangle, ShieldCheck, Clock, Loader2,
    RotateCcw, Upload, CheckCircle2, XCircle, Share2
} from 'lucide-react';
import { toast } from 'sonner';
import RubricManager from '@/components/dashboard/RubricManager';
import ExamSettings from '@/components/dashboard/ExamSettings';
import KnowledgeBaseViewer from '@/components/dashboard/KnowledgeBaseViewer';
import DeleteExamDialog from '@/components/dashboard/DeleteExamDialog';
import ShareExamDialog from '@/components/dashboard/ShareExamDialog';
import { Badge } from '@/components/ui/badge';

import { PageHeader } from '@/components/dashboard/page-header';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';


export default function ManageExamPage() {
    const params = useParams();
    const router = useRouter();
    const searchParams = useSearchParams();
    const queryClient = useQueryClient();

    // UI State
    const activeTab = searchParams.get('tab') || 'settings';

    const examId = params.id as string;
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);

    // Handle tab change
    const handleTabChange = (value: string) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('tab', value);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    const { data: exam, isLoading, error } = useQuery({
        queryKey: ['exam', examId],
        queryFn: () => api.exams.get(examId),
        // Auto-poll when KB is processing
        refetchInterval: (query) => {
            const data = query.state.data;
            if (data?.kb_status === KBStatus.PROCESSING) return 5000;
            return false;
        },
    });

    // Upload syllabus mutation
    const uploadMutation = useMutation({
        mutationFn: async (file: File) => {
            const { upload_url, file_url } = await api.media.presign(
                examId, 'syllabus_pdf', file.type, file.size
            );
            await api.media.uploadFile(upload_url, file);
            await api.media.confirm(examId, 'syllabus_pdf', file_url);
        },
        onSuccess: () => {
            toast.success('Syllabus uploaded! AI is now processing it.');
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
        },
        onError: () => {
            toast.error('Failed to upload syllabus');
        },
    });

    // Delete syllabus mutation
    const deleteMutation = useMutation({
        mutationFn: () => api.exams.deleteSyllabus(examId),
        onSuccess: () => {
            toast.success('Syllabus deleted');
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
            queryClient.invalidateQueries({ queryKey: ['knowledge-base', examId] });
        },
        onError: () => {
            toast.error('Failed to delete syllabus');
        },
    });

    // Retry ingestion mutation
    const retryMutation = useMutation({
        mutationFn: () => api.exams.retryIngestion(examId),
        onSuccess: () => {
            toast.success('Re-processing syllabus...');
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
        },
        onError: () => {
            toast.error('Failed to retry ingestion');
        },
    });

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        uploadMutation.mutate(file);
        e.target.value = '';
    };

    const handleReplace = async (file: File) => {
        const toastId = toast.loading('Replacing syllabus...');
        try {
            await api.exams.deleteSyllabus(examId);
            const { upload_url, file_url } = await api.media.presign(
                examId, 'syllabus_pdf', file.type, file.size
            );
            await api.media.uploadFile(upload_url, file);
            await api.media.confirm(examId, 'syllabus_pdf', file_url);
            toast.success('Syllabus replaced! AI is now processing it.', { id: toastId });
            queryClient.invalidateQueries({ queryKey: ['exam', examId] });
            queryClient.invalidateQueries({ queryKey: ['knowledge-base', examId] });
        } catch {
            toast.error('Failed to replace syllabus', { id: toastId });
        }
    };

    if (isLoading) return <div className="flex items-center justify-center py-32 text-muted-foreground">Loading exam details...</div>;
    if (error) return <div className="flex items-center justify-center py-32 text-destructive">Error loading exam.</div>;
    if (!exam) return <div className="flex items-center justify-center py-32 text-muted-foreground">Exam not found.</div>;

    const isEditable = exam.status === ExamStatus.DRAFT;
    const kbStatus = exam.kb_status as KBStatus | null;

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <div className="flex flex-col gap-4">


                <div className="flex flex-col gap-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="space-y-4">
                            <h1 className="text-2xl font-bold tracking-tight">{exam.title}</h1>

                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="bg-background/50 backdrop-blur-sm border-border text-foreground font-mono tracking-wider shadow-sm px-3 py-1">
                                        {exam.exam_code}
                                    </Badge>
                                    <Badge
                                        variant={exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE ? 'default' : 'secondary'}
                                        className={cn(
                                            "capitalize px-3 py-1 shadow-sm",
                                            (exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE) && "bg-emerald-600 hover:bg-emerald-700"
                                        )}
                                    >
                                        {exam.status}
                                    </Badge>
                                    <div className="h-4 w-[1px] bg-border mx-2" />
                                </div>
                                <div className="flex items-center gap-6 text-muted-foreground font-medium">
                                    <div className="flex items-center gap-2" title="Duration">
                                        <Clock className="w-4 h-4 text-primary/70" />
                                        <span>{exam.settings?.duration_minutes || 30} mins</span>
                                    </div>
                                    <div className="flex items-center gap-2" title="Proctoring Mode">
                                        <ShieldCheck className={cn("w-4 h-4", exam.settings?.strict_mode ? "text-primary/70" : "text-muted-foreground")} />
                                        <span>{exam.settings?.strict_mode ? 'Strict Mode On' : 'Standard Mode'}</span>
                                    </div>
                                    <div className="flex items-center gap-2" title="Question Count">
                                        <ListChecks className="w-4 h-4 text-primary/70" />
                                        <span>{exam.settings?.number_of_questions || 5} Questions</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {(exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE) && (
                            <Button
                                variant="outline"
                                size="lg"
                                className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-primary shadow-sm active:scale-95 transition-all"
                                onClick={() => setShowShareDialog(true)}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                        )}
                    </div>
                </div>
                <Separator className="mt-2" />
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                <div className="flex items-center justify-between">
                    <TabsList>
                        <TabsTrigger
                            value="settings"
                            className="gap-2"
                        >
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                        <TabsTrigger
                            value="rubrics"
                            className="gap-2"
                        >
                            <ListChecks className="h-4 w-4" /> Grading Rubrics
                        </TabsTrigger>
                        <TabsTrigger
                            value="knowledge"
                            className="gap-2"
                        >
                            <BookOpen className="h-4 w-4" /> Knowledge Base
                            {kbStatus === KBStatus.PROCESSING && (
                                <span className="relative flex h-2 w-2 ml-1" aria-hidden="true">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                                </span>
                            )}
                            {kbStatus === KBStatus.FAILED && (
                                <span className="relative flex h-2 w-2 ml-1" aria-hidden="true">
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
                                </span>
                            )}
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="settings" className="mt-0">
                    <div className="animate-in fade-in duration-200">
                        <ExamSettings exam={exam} />
                    </div>
                </TabsContent>

                <TabsContent value="rubrics" className="mt-0">
                    <div className="animate-in fade-in duration-200">
                        <RubricManager examId={examId} isEditable={isEditable} />
                    </div>
                </TabsContent>

                <TabsContent value="knowledge" className="mt-0">
                    <div className="animate-in fade-in duration-300">
                        <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm">
                            <CardContent className="p-6 md:p-8 space-y-8">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-semibold tracking-tight">Knowledge Base</h2>
                                        <p className="text-muted-foreground">Manage the source material used by AI to generate questions.</p>
                                    </div>
                                    <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <BookOpen className="h-5 w-5" />
                                    </div>
                                </div>

                                <Separator />

                                {/* Hidden file input for uploads */}
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    className="hidden"
                                    accept=".pdf"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (!file) return;
                                        if (exam.syllabus_url) {
                                            handleReplace(file);
                                        } else {
                                            uploadMutation.mutate(file);
                                        }
                                        e.target.value = '';
                                    }}
                                />

                                {/* STATE 1: Empty — No syllabus uploaded */}
                                {!exam.syllabus_url && !kbStatus && (
                                    <div
                                        className="relative group cursor-pointer border-2 border-dashed border-border hover:border-primary/50 rounded-xl p-12 text-center transition-all duration-300 bg-muted/5 hover:bg-muted/30 overflow-hidden"
                                        onClick={() => isEditable && fileInputRef.current?.click()}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="relative z-10 flex flex-col items-center gap-4">
                                            <div className="h-16 w-16 rounded-full bg-background shadow-sm border border-border flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                                <Upload className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div className="space-y-2">
                                                <h3 className="text-lg font-semibold text-foreground">Upload Syllabus PDF</h3>
                                                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                                                    Drag & drop your PDF here or click to browse. The AI will analyze this document to generate context-aware questions.
                                                </p>
                                            </div>

                                            {isEditable && (
                                                <Button
                                                    size="lg"
                                                    className="mt-4 rounded-full px-8 gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-semibold"
                                                    disabled={uploadMutation.isPending}
                                                >
                                                    {uploadMutation.isPending ? (
                                                        <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</>
                                                    ) : (
                                                        <>Choose File</>
                                                    )}
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* STATE 2: Processing — AI is ingesting the syllabus */}
                                {kbStatus === KBStatus.PROCESSING && (
                                    <div className="relative overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/5 p-8">
                                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent,rgba(245,158,11,0.05),transparent)] animate-[shimmer_2s_italic_infinite]" />
                                        <div className="relative flex items-center gap-6">
                                            <div className="relative">
                                                <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full" />
                                                <div className="relative h-14 w-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                                    <Loader2 className="h-7 w-7 text-amber-500 animate-spin" />
                                                </div>
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold text-amber-600 dark:text-amber-500 flex items-center gap-2">
                                                    Processing Document
                                                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 animate-pulse">
                                                        Indexing
                                                    </Badge>
                                                </h3>
                                                <p className="text-amber-600/80 dark:text-amber-500/80">
                                                    AI is currently analyzing the structure and content of your syllabus. This usually takes less than a minute.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* STATE 3: Ready — AI has processed the syllabus */}
                                {kbStatus === KBStatus.READY && exam.syllabus_url && (
                                    <div className="space-y-8">
                                        <div className="relative rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-emerald-700 dark:text-emerald-500 flex items-center gap-2">
                                                        Knowledge Base Active
                                                        <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                                                            Ready
                                                        </Badge>
                                                    </h3>
                                                    <p className="text-sm text-emerald-600/80 dark:text-emerald-500/80">
                                                        Your syllabus has been successfully indexed and is ready for question generation.
                                                    </p>
                                                </div>
                                            </div>

                                            {isEditable && (
                                                <div className="flex items-center gap-3">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2 border-dashed"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <RotateCcw className="w-4 h-4" />
                                                        Replace PDF
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                                                        disabled={deleteMutation.isPending}
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete the syllabus? This will remove all generated questions context.')) {
                                                                deleteMutation.mutate();
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        <KnowledgeBaseViewer examId={examId} />
                                    </div>
                                )}

                                {/* STATE 4: Failed — RAG ingestion failed */}
                                {kbStatus === KBStatus.FAILED && (
                                    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center space-y-4">
                                        <div className="mx-auto h-14 w-14 rounded-full bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                                            <XCircle className="h-7 w-7 text-destructive" />
                                        </div>
                                        <div className="space-y-1">
                                            <h3 className="text-lg font-semibold text-destructive">Ingestion Failed</h3>
                                            <p className="text-muted-foreground max-w-md mx-auto">
                                                We couldn't process this PDF. It might be corrupted or password protected. Please try uploading a different file.
                                            </p>
                                        </div>

                                        {isEditable && (
                                            <div className="flex justify-center gap-4 pt-2">
                                                <Button
                                                    variant="default"
                                                    className="gap-2"
                                                    disabled={retryMutation.isPending}
                                                    onClick={() => retryMutation.mutate()}
                                                >
                                                    {retryMutation.isPending ? (
                                                        <><Loader2 className="h-4 w-4 animate-spin" /> Retrying...</>
                                                    ) : (
                                                        <><RotateCcw className="h-4 w-4" /> Retry Action</>
                                                    )}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="gap-2"
                                                    onClick={() => fileInputRef.current?.click()}
                                                >
                                                    <Upload className="h-4 w-4" /> New Upload
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>

            {/* Danger Zone */}
            {isEditable && (
                <div className="pt-8 pb-6">
                    <div className="relative overflow-hidden rounded-xl border border-destructive/20 bg-destructive/5 p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-sm transition-all hover:bg-destructive/10">
                        <div className="absolute inset-0 bg-gradient-to-r from-destructive/5 via-transparent to-transparent pointer-events-none" />
                        <div className="space-y-1 relative z-10">
                            <h3 className="text-lg font-semibold text-destructive flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5" />
                                Danger Zone
                            </h3>
                            <p className="text-destructive/70 text-sm max-w-md">
                                Deleting this exam will permanently remove all associated data, including candidate results and generated questions. This action cannot be undone.
                            </p>
                        </div>
                        <Button
                            variant="destructive"
                            className="shadow-lg transition-all whitespace-nowrap relative z-10"
                            onClick={() => setShowDeleteDialog(true)}
                        >
                            <Trash2 className="h-4 w-4" /> Delete Exam
                        </Button>
                    </div>
                </div>
            )}

            {/* Dialogs */}
            <DeleteExamDialog
                open={showDeleteDialog}
                onOpenChange={setShowDeleteDialog}
                examId={examId}
                examTitle={exam.title}
                onDeleted={() => router.push('/instructor')}
            />
            <ShareExamDialog
                open={showShareDialog}
                onOpenChange={setShowShareDialog}
                examTitle={exam.title}
                examCode={exam.exam_code || ''}
                startTime={exam.start_time}
                endTime={exam.end_time}
                durationMinutes={exam.settings?.duration_minutes}
            />
        </main>
    );
}
