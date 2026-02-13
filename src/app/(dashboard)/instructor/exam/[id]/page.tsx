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

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading exam details...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading exam.</div>;
    if (!exam) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Exam not found.</div>;

    const isEditable = exam.status === ExamStatus.DRAFT;
    const kbStatus = exam.kb_status as KBStatus | null;

    return (
        <main className="min-h-screen w-full relative overflow-hidden bg-background">
            <div className="container mx-auto p-6 md:p-8 space-y-8 relative z-10">

                {/* Navigation & Header */}
                <div className="flex flex-col gap-6 animate-in fade-in duration-300">
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => router.push('/instructor')}
                        aria-label="Go back to instructor console"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                        Back to Instructor Console
                    </Button>

                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3 mb-2">
                                <Badge variant="outline" className="bg-primary/5 border-primary/20 text-primary font-mono tracking-wider">
                                    {exam.exam_code}
                                </Badge>
                                <Badge variant={exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE ? 'default' : 'secondary'} className="capitalize">
                                    {exam.status}
                                </Badge>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                                {exam.title}
                            </h1>
                            <div className="flex items-center gap-6 text-muted-foreground text-sm font-medium pt-1">
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    <span>{exam.settings?.duration_minutes || 30} mins</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>{exam.settings?.strict_mode ? 'Strict Mode On' : 'Standard Mode'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <ListChecks className="w-4 h-4" />
                                    <span>{exam.settings?.number_of_questions || 5} Questions</span>
                                </div>
                            </div>
                        </div>
                        {/* Share button — only shown for published/active exams */}
                        {(exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE) && (
                            <Button
                                variant="outline"
                                className="gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/30 text-primary"
                                onClick={() => setShowShareDialog(true)}
                            >
                                <Share2 className="h-4 w-4" />
                                Share
                            </Button>
                        )}
                    </div>
                </div>

                <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-8">
                    <TabsList className="bg-secondary/20 p-1 rounded-full border border-border h-auto inline-flex">
                        <TabsTrigger value="settings" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="rubrics" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                            <ListChecks className="h-4 w-4" /> Grading Rubrics
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
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
                        <div className="animate-in fade-in duration-200">
                            <Card className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-semibold text-foreground">Knowledge Base</h2>
                                        <p className="text-muted-foreground">Manage the source material used by AI to generate questions.</p>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                    </div>
                                </div>

                                <CardContent className="p-0 space-y-6">
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
                                            className="text-center py-20 px-6 border-2 border-dashed rounded-3xl bg-secondary/5 border-border hover:bg-secondary/10 hover:border-primary/30 transition-all duration-300 group cursor-pointer relative overflow-hidden"
                                            onClick={() => isEditable && fileInputRef.current?.click()}
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20 text-foreground group-hover:text-primary group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                            <h3 className="text-xl font-bold mb-2 text-foreground">No Knowledge Base Uploaded</h3>
                                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
                                                Upload a PDF syllabus to allow the AI to generate context-aware questions for this exam.
                                            </p>

                                            {isEditable && (
                                                <div className="flex justify-center relative z-10">
                                                    <Button
                                                        variant="default"
                                                        size="lg"
                                                        className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40"
                                                        disabled={uploadMutation.isPending}
                                                    >
                                                        {uploadMutation.isPending ? (
                                                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</>
                                                        ) : (
                                                            <><Upload className="w-4 h-4 mr-2" /> Upload Syllabus PDF</>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STATE 2: Processing — AI is ingesting the syllabus */}
                                    {kbStatus === KBStatus.PROCESSING && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-5 border border-amber-500/20 rounded-2xl bg-amber-500/5 backdrop-blur-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-amber-500/20 rounded-full ring-1 ring-amber-500/30">
                                                        <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-lg">Processing Syllabus</p>
                                                        <p className="text-sm text-amber-500/80 font-medium">
                                                            AI is analyzing and indexing your document. This may take a moment...
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-600">
                                                    <Loader2 className="h-3 w-3 mr-1 animate-spin" /> In Progress
                                                </Badge>
                                            </div>
                                        </div>
                                    )}

                                    {/* STATE 3: Ready — AI has processed the syllabus */}
                                    {kbStatus === KBStatus.READY && exam.syllabus_url && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-5 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 backdrop-blur-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-emerald-500/20 rounded-full ring-1 ring-emerald-500/30">
                                                        <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-lg">Syllabus Active</p>
                                                        <p className="text-sm text-emerald-500/80 font-medium">
                                                            AI has processed this document successfully.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" /> Ready
                                                </Badge>
                                            </div>

                                            <KnowledgeBaseViewer examId={examId} />

                                            {isEditable && (
                                                <div className="flex justify-between items-center pt-4 border-t border-border/50">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Upload className="w-4 h-4 mr-2" />
                                                        Replace Syllabus
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                        disabled={deleteMutation.isPending}
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to delete the syllabus? This will remove all generated questions context.')) {
                                                                deleteMutation.mutate();
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4 mr-2" />
                                                        {deleteMutation.isPending ? 'Deleting...' : 'Delete Syllabus'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* STATE 4: Failed — RAG ingestion failed */}
                                    {kbStatus === KBStatus.FAILED && (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-5 border border-red-500/20 rounded-2xl bg-red-500/5 backdrop-blur-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-red-500/20 rounded-full ring-1 ring-red-500/30">
                                                        <XCircle className="h-6 w-6 text-red-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-lg">Processing Failed</p>
                                                        <p className="text-sm text-red-500/80 font-medium">
                                                            AI could not process the syllabus. You can retry or upload a different file.
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline" className="bg-red-500/10 border-red-500/30 text-red-600">
                                                    <XCircle className="h-3 w-3 mr-1" /> Failed
                                                </Badge>
                                            </div>

                                            {isEditable && (
                                                <div className="flex items-center gap-3 pt-2">
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        className="gap-2"
                                                        disabled={retryMutation.isPending}
                                                        onClick={() => retryMutation.mutate()}
                                                    >
                                                        {retryMutation.isPending ? (
                                                            <><Loader2 className="h-4 w-4 animate-spin" /> Retrying...</>
                                                        ) : (
                                                            <><RotateCcw className="h-4 w-4" /> Retry Ingestion</>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                        onClick={() => fileInputRef.current?.click()}
                                                    >
                                                        <Upload className="h-4 w-4" /> Upload Different PDF
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors gap-2"
                                                        disabled={deleteMutation.isPending}
                                                        onClick={() => {
                                                            if (confirm('Delete the syllabus?')) {
                                                                deleteMutation.mutate();
                                                            }
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
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
                    <div className="pt-12 pb-6">
                        <div className="border border-red-500/20 bg-red-500/5 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 backdrop-blur-sm">
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold text-red-500 flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5" />
                                    Danger Zone
                                </h3>
                                <p className="text-red-500/60 text-sm max-w-md">
                                    Deleting this exam will permanently remove all associated data, including candidate results and generated questions. This action cannot be undone.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                className="bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all whitespace-nowrap"
                                onClick={() => setShowDeleteDialog(true)}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
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
            </div>
        </main>
    );
}
