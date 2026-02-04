'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Upload, FileText, X, Loader2, ArrowLeft, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/network/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

import { AmbientGlow } from '@/components/ui/ambient-glow';
import { PremiumCard } from '@/components/ui/premium-card';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { cn } from '@/lib/utils';

export default function CreateExamPage() {
    const [title, setTitle] = useState('');
    const [duration, setDuration] = useState(30);
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [strictMode, setStrictMode] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [startTime, setStartTime] = useState<Date | undefined>(undefined);
    const [endTime, setEndTime] = useState<Date | undefined>(undefined);

    const queryClient = useQueryClient();
    const router = useRouter();

    const createMutation = useMutation({
        mutationFn: async () => {
            if (!file) throw new Error("Syllabus file is required");

            const exam = await api.exams.create({
                title,
                settings: {
                    duration_minutes: duration,
                    strict_mode: strictMode,
                    number_of_questions: numberOfQuestions,
                },
                start_time: startTime ? startTime.toISOString() : undefined,
                end_time: endTime ? endTime.toISOString() : undefined
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
        <div className="min-h-screen w-full relative overflow-hidden bg-background">
            <AmbientGlow />

            <div className="container mx-auto p-4 md:p-8 max-w-6xl relative z-10 space-y-8">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col gap-4"
                >
                    <Button
                        variant="ghost"
                        className="w-fit pl-0 text-muted-foreground hover:text-foreground hover:bg-transparent transition-colors p-0 h-auto"
                        onClick={() => router.push('/instructor')}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Instructor Console
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">
                            Create New Exam
                        </h1>
                        <p className="text-muted-foreground text-lg mt-1">
                            Set up the details, schedule, and source material for your new assessment.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* Main Content (Left) */}
                    <div className="lg:col-span-8 space-y-6">

                        {/* Basic Info */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <PremiumCard className="p-6 bg-card/40 border-border/50">
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
                                </div>
                            </PremiumCard>
                        </motion.div>

                        {/* Knowledge Base */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <PremiumCard className="p-6 bg-card/40 border-border/50 h-full">
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
                                    <AnimatePresence mode="wait">
                                        {file ? (
                                            <motion.div
                                                key="file-selected"
                                                initial={{ opacity: 0, scale: 0.98 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20"
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
                                            </motion.div>
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-20 pointer-events-none">
                                                <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                                <p className="font-medium text-foreground">Click or drag PDF to upload</p>
                                                <p className="text-sm text-muted-foreground mt-1">Max file size: 10MB</p>
                                            </div>
                                        )}
                                    </AnimatePresence>

                                    <input
                                        id="file-upload"
                                        type="file"
                                        className="hidden"
                                        accept="application/pdf"
                                        onChange={(e) => {
                                            if (e.target.files?.[0]) setFile(e.target.files[0]);
                                        }}
                                    />
                                </div>
                            </PremiumCard>
                        </motion.div>
                    </div>

                    {/* Sidebar (Right) */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Schedule */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <PremiumCard className="p-6 bg-card/40 border-border/50 space-y-6">
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
                            </PremiumCard>
                        </motion.div>

                        {/* Settings */}
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <PremiumCard className="p-6 bg-card/40 border-border/50 space-y-6">
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

                                <div className="flex items-center justify-between pt-2">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-medium">Strict Mode</Label>
                                        <p className="text-xs text-muted-foreground">Enforce fullscreen</p>
                                    </div>
                                    <Switch checked={strictMode} onCheckedChange={setStrictMode} />
                                </div>
                            </PremiumCard>
                        </motion.div>

                        <Button
                            size="lg"
                            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 mt-2"
                            disabled={!title || !file || createMutation.isPending}
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
        </div>
    );
}
