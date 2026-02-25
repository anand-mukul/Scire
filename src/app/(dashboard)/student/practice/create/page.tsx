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
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-3xl mx-auto w-full">
            <PageHeader
                title="New Practice Session"
                description="Set up a topic and start practicing."
                backButton
            />

            {/* Title */}
            <Card className="p-6 space-y-4">
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
            <Card className="p-6 space-y-6">
                <div className="space-y-2">
                    <Label className="text-sm font-medium">How should the AI prepare questions?</Label>
                    <p className="text-xs text-muted-foreground">
                        Choose one approach below.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setMode('instructions')}
                        className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${mode === 'instructions'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border/80 hover:bg-accent/30'
                            }`}
                    >
                        <FileText className={`h-5 w-5 mb-2 ${mode === 'instructions' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-medium text-foreground">Write Instructions</p>
                        <p className="text-xs text-muted-foreground mt-1">Describe topics to be tested</p>
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('syllabus')}
                        className={`p-4 rounded-xl border-2 transition-all text-left cursor-pointer ${mode === 'syllabus'
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-border/80 hover:bg-accent/30'
                            }`}
                    >
                        <Upload className={`h-5 w-5 mb-2 ${mode === 'syllabus' ? 'text-primary' : 'text-muted-foreground'}`} />
                        <p className="text-sm font-medium text-foreground">Upload Syllabus</p>
                        <p className="text-xs text-muted-foreground mt-1">PDF (max 10MB)</p>
                    </button>
                </div>

                {mode === 'instructions' ? (
                    <div className="space-y-2">
                        <Textarea
                            placeholder={"Describe the topics, concepts, or areas you want the AI to test you on. Be specific for better questions.\n\nExample: Test me on binary trees, graph traversal algorithms (BFS/DFS), dynamic programming basics, and time complexity analysis..."}
                            value={instructions}
                            onChange={(e) => setInstructions(e.target.value)}
                            className="min-h-[160px] text-sm resize-none"
                            maxLength={5000}
                        />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{instructions.length < 20 ? `Min 20 characters (${20 - instructions.length} more)` : '✓ Ready'}</span>
                            <span>{instructions.length}/5000</span>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {syllabusUrl ? (
                            <div className="flex items-center gap-3 p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                                <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{syllabusName}</p>
                                    <p className="text-xs text-emerald-500">Uploaded successfully</p>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => { setSyllabusUrl(null); setSyllabusName(null); }}
                                    className="text-muted-foreground hover:text-destructive shrink-0"
                                >
                                    Remove
                                </Button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all">
                                {uploading ? (
                                    <Loader2 className="h-8 w-8 text-primary animate-spin mb-2" />
                                ) : (
                                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                                )}
                                <p className="text-sm font-medium text-foreground">
                                    {uploading ? 'Uploading...' : 'Click to upload PDF'}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">Max 10MB</p>
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
        </main>
    );
}
