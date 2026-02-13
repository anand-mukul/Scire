'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, Loader2, ArrowLeft, ShieldAlert, Globe, BookOpen } from 'lucide-react';
import { api } from '@/lib/network/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Card } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { cn } from '@/lib/utils';

interface SubjectOption {
    id: string;
    name: string;
    code: string;
}

export default function CreateExamPage() {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [maxAttempts, setMaxAttempts] = useState(1);
    const [strictMode, setStrictMode] = useState(false);
    const [isPublic, setIsPublic] = useState(false);
    const [subjectId, setSubjectId] = useState<string | undefined>(undefined);
    const [file, setFile] = useState<File | null>(null);
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [endTime, setEndTime] = useState<Date | undefined>(undefined);

    const queryClient = useQueryClient();
    const router = useRouter();

    // Fetch subjects for the dropdown — fails gracefully if tenant has none
    const { data: subjects = [] } = useQuery<SubjectOption[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            try {
                const data = await api.tenant.listSubjects();
                return (data as SubjectOption[]) || [];
            } catch {
                // Tenant may not have subjects configured — that's fine
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!title.trim()) throw new Error("Exam title is required");
            if (!file) throw new Error("Syllabus file is required");

            // Validate schedule logic
            if (startTime && endTime && startTime >= endTime) {
                throw new Error("End time must be after start time");
            }

            // Clamp values for safety (defense in depth — backend validates too)
            const safeDuration = Math.max(5, Math.min(180, duration));
            const safeQuestions = Math.max(1, Math.min(50, numberOfQuestions));
            const safeAttempts = Math.max(1, Math.min(5, maxAttempts));

            const exam = await api.exams.create({
                title: title.trim(),
                settings: {
                    duration_minutes: safeDuration,
                    strict_mode: strictMode,
                    number_of_questions: safeQuestions,
                },
                max_attempts: safeAttempts,
                start_time: startTime ? startTime.toISOString() : undefined,
                end_time: endTime ? endTime.toISOString() : undefined,
                subject_id: subjectId || undefined,
                is_public: isPublic,
            });

            if (!exam || !exam.id) {
                throw new Error("Failed to create exam record");
            }

            const presignData = await api.media.presign(
                exam.id,
                'syllabus_pdf',
                file.type,
                file.size
            );

            await api.media.uploadFile(presignData.upload_url, file);

            await api.media.confirm(
                exam.id,
                'syllabus_pdf',
                presignData.file_url
            );

            return exam;
        },
        onSuccess: (exam) => {
            toast.success("Exam Created Successfully");
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            router.push(`/instructor/exam/${exam.id}`);
        },
        onError: (error) => {
            console.error(error);
            toast.error(error instanceof Error ? error.message : "Failed to create exam");
        }
    });

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.type === 'application/pdf') {
                setFile(droppedFile);
            } else {
                toast.error("Only PDF files are allowed");
            }
        }
    };

    return (
        <main className="min-h-screen w-full relative overflow-hidden bg-background">
            {/* <AmbientGlow /> */}

            <div className="container mx-auto p-6 md:p-8 max-w-6xl relative z-10 space-y-8">
                {/* Header */}
                <div
                    className="flex flex-col gap-4 animate-in fade-in duration-300"
                >
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => router.push('/instructor')}
                        aria-label="Go back to instructor console"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" aria-hidden="true" />
                        Back to Instructor Console
                    </Button>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Create New Exam
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Set up the details, schedule, and source material for your new assessment.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Basic Info */}
                        <div>
                            <Card className="p-6">
                                <h2 className="text-xl font-semibold mb-6">Exam Details</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="title">Exam Title</Label>
                                        <Input
                                            id="title"
                                            placeholder="e.g. Introduction to Computer Science - Final"
                                            className="h-11 bg-background/50"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            autoFocus
                                        />
                                    </div>

                                    {/* Subject Dropdown — only rendered if tenant has subjects */}
                                    {subjects.length > 0 && (
                                        <div className="space-y-2">
                                            <Label className="flex items-center gap-2">
                                                <BookOpen className="w-3.5 h-3.5 text-muted-foreground" />
                                                Subject
                                                <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                                            </Label>
                                            <Select
                                                value={subjectId ?? "none"}
                                                onValueChange={(val) => setSubjectId(val === "none" ? undefined : val)}
                                            >
                                                <SelectTrigger className="w-full h-11 bg-background/50">
                                                    <SelectValue placeholder="Select a subject" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">No Subject</SelectItem>
                                                    {subjects.map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.id}>
                                                            {subject.code} — {subject.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>

                        {/* Knowledge Base */}
                        <div>
                            <Card className="p-6 h-full">
                                <div className="flex items-center justify-between mb-2">
                                    <h2 className="text-xl font-semibold">Syllabus & Material</h2>
                                    {file && <span className="text-xs font-medium text-emerald-500 uppercase tracking-wide">Ready for processing</span>}
                                </div>
                                <p className="text-sm text-muted-foreground mb-6">Upload the PDF course material. The AI will use this to generate questions.</p>

                                <div
                                    className={`
                                        relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer
                                        ${file
                                            ? 'border-emerald-500/30 bg-emerald-500/5'
                                            : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                                        }
                                    `}
                                    style={{ minHeight: '200px' }}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={handleFileDrop}
                                    onClick={() => document.getElementById('file-upload')?.click()}
                                >
                                    <div>
                                        {file ? (
                                            <div
                                                key="file-selected"
                                                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in duration-200"
                                            >
                                                <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                                                    <FileText className="w-6 h-6 text-emerald-500" />
                                                </div>
                                                <p className="font-medium text-foreground text-lg">{file.name}</p>
                                                <p className="text-muted-foreground text-sm mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>

                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                >
                                                    Remove File
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
                                                <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                                <p className="font-medium text-foreground">Click or drag PDF to upload</p>
                                                <p className="text-sm text-muted-foreground mt-1">Max file size: 10MB</p>
                                            </div>
                                        )}
                                    </div>

                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf"
                                        aria-label="Upload syllabus PDF file"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setFile(e.target.files[0]);
                                        }}
                                    />
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Schedule */}
                        <div>
                            <Card className="p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Schedule</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Starts</Label>
                                        <DateTimePicker
                                            date={startTime}
                                            setDate={setStartTime}
                                            label="Start Date"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Ends</Label>
                                        <DateTimePicker
                                            date={endTime}
                                            setDate={setEndTime}
                                            label="End Date"
                                        />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Settings */}
                        <div>
                            <Card className="p-6 space-y-6">
                                <h2 className="text-lg font-semibold">Config & Security</h2>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Duration (Min)</Label>
                                        <Input
                                            type="number"
                                            min="5"
                                            max="180"
                                            className="bg-background/50 h-10"
                                            value={duration}
                                            onChange={(e) => setDuration(parseInt(e.target.value) || 30)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs text-muted-foreground">Questions</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            max="50"
                                            className="bg-background/50 h-10"
                                            value={numberOfQuestions}
                                            onChange={(e) => setNumberOfQuestions(parseInt(e.target.value) || 5)}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-xs text-muted-foreground">Max Attempts</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max="5"
                                        className="bg-background/50 h-10"
                                        value={maxAttempts}
                                        onChange={(e) => setMaxAttempts(parseInt(e.target.value) || 1)}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        How many times a student can attempt this exam
                                    </p>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <ShieldAlert className="w-3.5 h-3.5" />
                                                Strict Mode
                                            </Label>
                                            <p className="text-xs text-muted-foreground">Enforce fullscreen & flag tab switches</p>
                                        </div>
                                        <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="space-y-0.5">
                                            <Label className="text-sm font-medium flex items-center gap-2">
                                                <Globe className="w-3.5 h-3.5" />
                                                Allow Guest Access
                                            </Label>
                                            <p className="text-xs text-muted-foreground">Students outside your organization can join</p>
                                        </div>
                                        <Switch checked={isPublic} onCheckedChange={setIsPublic} />
                                    </div>
                                </div>
                            </Card>
                        </div>

                        <Button
                            size="lg"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                            disabled={!title.trim() || !file || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Redirecting...
                                </>
                            ) : (
                                'Create and continue'
                            )}
                        </Button>

                    </div>
                </div>
            </div>
        </main>
    );
}
