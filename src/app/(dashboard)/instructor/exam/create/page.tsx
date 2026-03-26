'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Loader2, ShieldAlert, Globe, BookOpen, Clock, HelpCircle, Calendar, Hash, RotateCcw } from 'lucide-react';
import { api } from '@/lib/network/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { DateTimePicker } from '@/components/ui/datetime-picker';
import { cn } from '@/lib/utils';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Separator } from "@/components/ui/separator";
import { PageHeader } from '@/components/dashboard/page-header';
import Link from 'next/link';

interface SubjectOption {
    id: string;
    name: string;
    code: string;
}

const examFormSchema = z.object({
    title: z.string().min(1, "Exam title is required"),
    subject_id: z.string().optional(),
    start_time: z.date().optional(),
    end_time: z.date().optional(),
    duration: z.coerce.number().min(5).max(180).default(30),
    number_of_questions: z.coerce.number().min(1).max(50).default(5),
    max_attempts: z.coerce.number().min(1).max(5).default(1),
    strict_mode: z.boolean().default(false),
    is_public: z.boolean().default(false),
    file: z.any()
        .refine((file) => file instanceof File, "Syllabus file is required")
        .refine((file) => file?.type === "application/pdf", "Only PDF files are allowed")
        .refine((file) => file?.size <= 10 * 1024 * 1024, "Max file size is 10MB"),
}).refine(data => {
    if (data.start_time && data.start_time < new Date()) {
        return false;
    }
    return true;
}, {
    message: "Start time cannot be in the past",
    path: ["start_time"],
}).refine(data => {
    if (data.start_time && data.end_time) {
        return data.end_time > data.start_time;
    }
    return true;
}, {
    message: "End time must be after start time",
    path: ["end_time"],
});

type ExamFormValues = z.infer<typeof examFormSchema>;

export default function CreateExamPage() {
    const queryClient = useQueryClient();
    const router = useRouter();

    const form = useForm<ExamFormValues>({
        resolver: zodResolver(examFormSchema) as any,
        defaultValues: {
            title: '',
            duration: 30,
            number_of_questions: 5,
            max_attempts: 1,
            strict_mode: false,
            is_public: false,
            subject_id: 'none',
        },
    });

    const fileRef = form.watch('file');

    const { data: subjects = [] } = useQuery<SubjectOption[]>({
        queryKey: ['subjects'],
        queryFn: async () => {
            try {
                const data = await api.tenant.listSubjects();
                return (data as SubjectOption[]) || [];
            } catch {
                return [];
            }
        },
        staleTime: 5 * 60 * 1000,
    });

    const createMutation = useMutation({
        mutationFn: async (values: ExamFormValues) => {
            const subjectId = values.subject_id === 'none' ? undefined : values.subject_id;
            const file = values.file as File;

            const exam = await api.exams.create({
                title: values.title.trim(),
                settings: {
                    duration_minutes: values.duration,
                    strict_mode: values.strict_mode,
                    number_of_questions: values.number_of_questions,
                },
                max_attempts: values.max_attempts,
                start_time: values.start_time ? values.start_time.toISOString() : undefined,
                end_time: values.end_time ? values.end_time.toISOString() : undefined,
                subject_id: subjectId,
                is_public: values.is_public,
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

    const onSubmit = (values: ExamFormValues) => {
        createMutation.mutate(values);
    };

    const handleFileDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            form.setValue('file', droppedFile, { shouldValidate: true });
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Create New Exam"
                description="Set up the details, schedule, and source material for your new assessment."
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                    {/* Basic Info */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <FileText className="h-5 w-5 text-primary" />
                                Exam Details
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Basic information about the assessment.</p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem className="col-span-2">
                                        <FormLabel>Exam Title</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="e.g. Introduction to Computer Science - Final" className="pl-9" {...field} autoFocus />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {subjects.length > 0 && (
                                <FormField
                                    control={form.control}
                                    name="subject_id"
                                    render={({ field }) => (
                                        <FormItem className="col-span-2 md:col-span-1">
                                            <FormLabel>Subject <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <div className="flex items-center gap-2">
                                                            <BookOpen className="w-4 h-4 text-muted-foreground" />
                                                            <SelectValue placeholder="Select a subject" />
                                                        </div>
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">No Subject</SelectItem>
                                                    {subjects.map((subject) => (
                                                        <SelectItem key={subject.id} value={subject.id}>
                                                            {subject.code} — {subject.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </div>
                    </div>

                    {/* Syllabus */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <BookOpen className="h-5 w-5 text-primary" />
                                Syllabus & Material
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Upload the PDF course material. The AI will use this to generate questions.</p>
                        </div>
                        <Separator />

                        <FormField
                            control={form.control}
                            name="file"
                            render={() => (
                                <FormItem>
                                    <FormControl>
                                        <div
                                            className={cn(
                                                "relative overflow-hidden rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer min-h-[160px] flex items-center justify-center",
                                                fileRef
                                                    ? 'border-emerald-500/30 bg-emerald-500/5'
                                                    : 'border-muted-foreground/20 hover:border-primary/50 hover:bg-accent/50'
                                            )}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={handleFileDrop}
                                            onClick={() => document.getElementById('file-upload')?.click()}
                                        >
                                            <div className="w-full">
                                                {fileRef ? (
                                                    <div className="flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200">
                                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mb-3">
                                                            <FileText className="w-6 h-6 text-emerald-500" />
                                                        </div>
                                                        <p className="font-medium text-foreground text-lg">{fileRef.name}</p>
                                                        <p className="text-muted-foreground text-sm mb-4">{(fileRef.size / 1024 / 1024).toFixed(2)} MB</p>

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                form.setValue('file', undefined);
                                                            }}
                                                        >
                                                            Remove File
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-6 text-center pointer-events-none">
                                                        <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                                                        <p className="font-medium text-foreground">Click or drag PDF to upload</p>
                                                        <p className="text-sm text-muted-foreground mt-1">Max file size: 10MB</p>
                                                    </div>
                                                )}
                                            </div>
                                            <Input
                                                id="file-upload"
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => {
                                                    if (e.target.files?.[0]) {
                                                        form.setValue('file', e.target.files[0], { shouldValidate: true });
                                                    }
                                                }}
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* Schedule */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Calendar className="h-5 w-5 text-primary" />
                                Schedule
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Define when the exam starts and ends.</p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="start_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Start Date</FormLabel>
                                        <FormControl>
                                            <DateTimePicker date={field.value} setDate={field.onChange} label="Select start time" disablePastDates />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="end_time"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>End Date</FormLabel>
                                        <FormControl>
                                            <DateTimePicker date={field.value} setDate={field.onChange} label="Select end time" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>


                    {/* Configuration */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Configuration
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Exam parameters and security settings.</p>
                        </div>
                        <Separator />


                        <div className="grid gap-6 md:grid-cols-3">
                            <FormField
                                control={form.control}
                                name="duration"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Duration (Min)</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Clock className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" min={5} max={180} className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="number_of_questions"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Questions</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <HelpCircle className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" min={1} max={50} className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="max_attempts"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Attempts</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <RotateCcw className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input type="number" min={1} max={5} className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid gap-6 md:grid-cols-2 pt-2">
                            <FormField
                                control={form.control}
                                name="strict_mode"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-medium flex items-center gap-2">
                                                <ShieldAlert className="w-4 h-4 text-primary" />
                                                Strict Mode
                                            </FormLabel>
                                            <FormDescription>
                                                Enforce fullscreen & flag tab switches
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="is_public"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base font-medium flex items-center gap-2">
                                                <Globe className="w-4 h-4 text-primary" />
                                                Guest Access
                                            </FormLabel>
                                            <FormDescription>
                                                Allow external students to join
                                            </FormDescription>
                                        </div>
                                        <FormControl>
                                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-start gap-4 pt-4">
                        <Button
                            size="lg"
                            className="px-8 font-semibold shadow-md"
                            disabled={createMutation.isPending}
                            type="submit"
                        >
                            {createMutation.isPending ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Exam'
                            )}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            size="lg"
                            asChild
                        >
                            <Link href="/instructor/exams">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
