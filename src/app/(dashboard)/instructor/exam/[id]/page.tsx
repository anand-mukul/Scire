'use client';

import { useParams, useRouter } from 'next/navigation';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { ExamStatus } from '@/types/backend';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { PremiumCard } from '@/components/ui/premium-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, Settings, ListChecks, FileText, Trash2, AlertTriangle, ShieldCheck, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import RubricManager from '@/components/dashboard/RubricManager';
import ExamSettings from '@/components/dashboard/ExamSettings';
import KnowledgeBaseViewer from '@/components/dashboard/KnowledgeBaseViewer';
import { CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { motion } from 'motion/react';

export default function ManageExamPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.id as string;

    const { data: exam, isLoading, error } = useQuery({
        queryKey: ['exam', examId],
        queryFn: () => api.exams.get(examId),
    });

    if (isLoading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading exam details...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">Error loading exam.</div>;
    if (!exam) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Exam not found.</div>;

    const isEditable = exam.status === ExamStatus.DRAFT;

    return (
        <div className="min-h-screen w-full relative overflow-hidden bg-background">
            <AmbientGlow />
            <div className="container mx-auto p-6 space-y-8 relative z-10">

                {/* Navigation & Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-6"
                >
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors group"
                        onClick={() => router.push('/instructor')}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
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
                            <h1 className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)]">
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

                        {/* Quick Actions or Status Indicator could go here */}
                    </div>
                </motion.div>

                <Tabs defaultValue="settings" className="space-y-8">
                    <TabsList className="bg-secondary/20 p-1 rounded-full border border-border h-auto inline-flex">
                        <TabsTrigger value="settings" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                        <TabsTrigger value="rubrics" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                            <ListChecks className="h-4 w-4" /> Grading Rubrics
                        </TabsTrigger>
                        <TabsTrigger value="knowledge" className="rounded-full px-6 py-2.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground transition-all gap-2">
                            <BookOpen className="h-4 w-4" /> Knowledge Base
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="settings" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <ExamSettings exam={exam} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="rubrics" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <RubricManager examId={examId} isEditable={isEditable} />
                        </motion.div>
                    </TabsContent>

                    <TabsContent value="knowledge" className="mt-0">
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                            <PremiumCard className="bg-card/40 border-border backdrop-blur-xl p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/70">Knowledge Base</h2>
                                        <p className="text-muted-foreground">Manage the source material used by AI to generate questions.</p>
                                    </div>
                                    <div className="p-3 bg-primary/10 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-primary" />
                                    </div>
                                </div>

                                <CardContent className="p-0 space-y-6">
                                    {exam.syllabus_url ? (
                                        <div className="space-y-6">
                                            <div className="flex items-center justify-between p-5 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 backdrop-blur-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="p-3 bg-emerald-500/20 rounded-full ring-1 ring-emerald-500/30">
                                                        <FileText className="h-6 w-6 text-emerald-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-foreground text-lg">Syllabus Active</p>
                                                        <p className="text-sm text-emerald-500/80 font-medium">AI has processed this document.</p>
                                                    </div>
                                                </div>
                                                <Button variant="outline" size="sm" disabled className="bg-background/20 border-emerald-500/20 text-emerald-500 opacity-70">
                                                    Processed Successfully
                                                </Button>
                                            </div>

                                            <KnowledgeBaseViewer examId={examId} />

                                            <div className="flex justify-end pt-4 border-t border-border/50">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                                    onClick={async () => {
                                                        if (confirm("Are you sure you want to delete the syllabus? This will remove all generated questions context.")) {
                                                            try {
                                                                await api.exams.deleteSyllabus(examId);
                                                                window.location.reload();
                                                            } catch {
                                                                toast.error("Failed to delete syllabus");
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Delete & Re-upload Syllabus
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-20 px-6 border-2 border-dashed rounded-3xl bg-secondary/5 border-border hover:bg-secondary/10 hover:border-primary/30 transition-all duration-300 group cursor-pointer relative overflow-hidden">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                            <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-20 text-foreground group-hover:text-primary group-hover:opacity-100 group-hover:scale-110 transition-all duration-300" />
                                            <h3 className="text-xl font-bold mb-2 text-foreground">No Knowledge Base Uploaded</h3>
                                            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">Upload a PDF syllabus to allow the AI to generate context-aware questions for this exam.</p>

                                            {isEditable && (
                                                <div className="flex justify-center relative z-10">
                                                    <Button variant="default" size="lg" className="rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 relative overflow-hidden">
                                                        <input
                                                            type="file"
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                            accept=".pdf"
                                                            onChange={async (e) => {
                                                                const file = e.target.files?.[0];
                                                                if (!file) return;

                                                                const toastId = toast.loading("Uploading syllabus...");
                                                                try {
                                                                    const { upload_url, file_url } = await api.media.presign(
                                                                        examId, "syllabus_pdf", file.type, file.size
                                                                    );
                                                                    await api.media.uploadFile(upload_url, file);
                                                                    await api.media.confirm(examId, "syllabus_pdf", file_url);

                                                                    toast.success("Syllabus uploaded successfully!", { id: toastId });
                                                                    window.location.reload();
                                                                } catch (error) {
                                                                    console.error(error);
                                                                    toast.error("Failed to upload syllabus", { id: toastId });
                                                                }
                                                            }}
                                                        />
                                                        Upload Syllabus PDF
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </PremiumCard>
                        </motion.div>
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
                                className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all whitespace-nowrap"
                                onClick={async () => {
                                    if (confirm("Permanently delete this exam?")) {
                                        try {
                                            await api.exams.delete(examId);
                                            router.push('/instructor');
                                            toast.success('Exam deleted');
                                        } catch {
                                            toast.error('Failed to delete exam');
                                        }
                                    }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" /> Delete Exam
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
}
