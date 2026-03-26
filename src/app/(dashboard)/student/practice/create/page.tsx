'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PageHeader } from '@/components/dashboard/page-header';
import { Upload, FileText, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';

export default function CreatePracticePage() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [instructions, setInstructions] = useState('');
    const [mode, setMode] = useState<'instructions' | 'syllabus'>('instructions');
    const [uploading, setUploading] = useState(false);
    const [syllabusUrl, setSyllabusUrl] = useState<string | null>(null);
    const [syllabusName, setSyllabusName] = useState<string | null>(null);

    const createMutation = useMutation({
        mutationFn: () =>
            api.practice.createExam({
                title,
                instructions: mode === 'instructions' ? instructions : undefined,
                syllabus_url: mode === 'syllabus' ? syllabusUrl || undefined : undefined,
            }),
        onSuccess: (data: any) => {
            toast.success('Practice exam created! Processing will take a moment.');
            queryClient.invalidateQueries({ queryKey: ['practice-exams'] });
            router.push(`/student/practice/${data.id}`);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Failed to create practice exam.');
        },
    });

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            toast.error('Only PDF files are supported.');
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error('File size must be under 10MB.');
            return;
        }

        setUploading(true);
        setSyllabusName(file.name);

        try {
            const presign = await api.practice.presignSyllabus();
            await api.media.uploadFile(presign.upload_url, file);
            setSyllabusUrl(presign.file_url);
            toast.success('Syllabus uploaded successfully!');
        } catch {
            toast.error('Failed to upload file.');
            setSyllabusName(null);
        } finally {
            setUploading(false);
        }
    };

    const isValid =
        title.length >= 3 &&
        ((mode === 'instructions' && instructions.length >= 20) ||
            (mode === 'syllabus' && syllabusUrl));

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="New Practice Session"
                description="Set up a topic and start practicing with AI-powered viva questions."
            />

            <div className="grid gap-8 lg:grid-cols-12 items-start">
                {/* Left Column — Form */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Title Card */}
                    <Card className="p-6 md:p-8 space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm font-medium">Session Title</Label>
                            <Input
                                id="title"
                                placeholder="e.g., Data Structures & Algorithms"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                className="h-12 text-base"
                                maxLength={200}
                            />
                            <p className="text-xs text-muted-foreground">
                                Give your practice session a descriptive name.
                            </p>
                        </div>
                    </Card>

                    {/* Content Mode Selector */}
                    <Card className="p-6 md:p-8 space-y-6">
                        <div className="space-y-1">
                            <Label className="text-base font-semibold text-foreground">Question Source</Label>
                            <p className="text-sm text-muted-foreground">
                                Choose how the AI should prepare your practice questions.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setMode('instructions')}
                                className={`group/mode p-5 rounded-xl border-2 transition-all text-left cursor-pointer hover:shadow-md ${mode === 'instructions'
                                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                                    : 'border-border hover:border-primary/30 hover:bg-accent/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg w-fit mb-3 transition-colors ${mode === 'instructions' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 border border-border/50'}`}>
                                    <FileText className={`h-5 w-5 ${mode === 'instructions' ? 'text-primary' : 'text-muted-foreground group-hover/mode:text-primary/70'}`} />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Write Instructions</p>
                                <p className="text-xs text-muted-foreground mt-1">Describe topics & concepts to be tested on</p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMode('syllabus')}
                                className={`group/mode p-5 rounded-xl border-2 transition-all text-left cursor-pointer hover:shadow-md ${mode === 'syllabus'
                                    ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                                    : 'border-border hover:border-primary/30 hover:bg-accent/30'
                                    }`}
                            >
                                <div className={`p-2 rounded-lg w-fit mb-3 transition-colors ${mode === 'syllabus' ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50 border border-border/50'}`}>
                                    <Upload className={`h-5 w-5 ${mode === 'syllabus' ? 'text-primary' : 'text-muted-foreground group-hover/mode:text-primary/70'}`} />
                                </div>
                                <p className="text-sm font-semibold text-foreground">Upload Syllabus</p>
                                <p className="text-xs text-muted-foreground mt-1">Upload a PDF syllabus (max 10MB)</p>
                            </button>
                        </div>

                        {mode === 'instructions' ? (
                            <div className="space-y-2">
                                <Textarea
                                    placeholder={"Describe the topics, concepts, or areas you want the AI to test you on. Be specific for better questions.\n\nExample: Test me on binary trees, graph traversal algorithms (BFS/DFS), dynamic programming basics, and time complexity analysis..."}
                                    value={instructions}
                                    onChange={(e) => setInstructions(e.target.value)}
                                    className="min-h-[200px] text-sm resize-none bg-secondary/20 border-border focus:border-primary/50 focus:ring-primary/20 transition-all"
                                    maxLength={5000}
                                />
                                <div className="flex justify-between text-xs text-muted-foreground">
                                    <span className={instructions.length >= 20 ? 'text-emerald-500 font-medium' : ''}>
                                        {instructions.length < 20 ? `Min 20 characters (${20 - instructions.length} more)` : '✓ Ready'}
                                    </span>
                                    <span className="font-mono">{instructions.length}/5000</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {syllabusUrl ? (
                                    <div className="flex items-center gap-3 p-5 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                        <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
                                            <FileText className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-foreground truncate">{syllabusName}</p>
                                            <p className="text-xs text-emerald-500 font-medium">Uploaded successfully</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => { setSyllabusUrl(null); setSyllabusName(null); }}
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all group/upload">
                                        {uploading ? (
                                            <Loader2 className="h-10 w-10 text-primary animate-spin mb-3" />
                                        ) : (
                                            <div className="bg-muted/50 p-3 rounded-xl border border-border/50 mb-3 group-hover/upload:bg-primary/10 group-hover/upload:border-primary/20 transition-colors">
                                                <Upload className="h-6 w-6 text-muted-foreground group-hover/upload:text-primary transition-colors" />
                                            </div>
                                        )}
                                        <p className="text-sm font-semibold text-foreground">
                                            {uploading ? 'Uploading...' : 'Click to upload PDF'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">PDF format, max 10MB</p>
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="application/pdf"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                    </label>
                                )}
                            </div>
                        )}
                    </Card>

                    {/* Submit */}
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={!isValid || createMutation.isPending}
                        className="w-full h-12 font-semibold text-base gap-2"
                        size="lg"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <Sparkles className="h-4 w-4" />
                                Create Practice Session
                            </>
                        )}
                    </Button>
                </div>

                {/* Right Column — Tips & Info */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="p-6 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
                                <Sparkles className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-semibold text-foreground">How It Works</h3>
                        </div>
                        <div className="space-y-4">
                            {[
                                { step: '1', text: 'Name your session and describe the topic or upload a syllabus.' },
                                { step: '2', text: 'Our AI builds a custom question bank based on your input.' },
                                { step: '3', text: 'Start a live viva practice with real-time AI evaluation.' },
                            ].map((item) => (
                                <div key={item.step} className="flex gap-3 items-start">
                                    <div className="bg-primary/10 text-primary text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shrink-0 border border-primary/20">
                                        {item.step}
                                    </div>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                                </div>
                            ))}
                        </div>
                    </Card>

                    <Card className="p-6">
                        <h3 className="font-semibold text-foreground mb-3">Tips for Better Results</h3>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                Be specific about topics - mention chapters, algorithms, or concepts.
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                For syllabi, ensure the PDF text is selectable (not scanned images).
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="text-primary mt-0.5">•</span>
                                Include the depth level you want: introductory, intermediate, or advanced.
                            </li>
                        </ul>
                    </Card>
                </div>
            </div>
        </main>
    );
}
