'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Exam, ExamStatus, Rubric, KBStatus } from '@/types/backend';
import { toast } from 'sonner';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DateTimePicker } from '@/components/ui/datetime-picker';

import {
    Save,
    Clock,
    Hash,
    RotateCcw,
    ShieldAlert,
    Globe,
    BarChart3,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Lock,
    Calendar,
    Zap,
    BookOpen,
    ListChecks,
    AlertTriangle,
    Eye,
    Mic,
    ShieldCheck,
} from 'lucide-react';
import { getTimezoneAbbreviation } from '@/lib/date-utils';

const examSettingsSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters"),
    max_attempts: z.number().min(1).max(10),
    duration_minutes: z.number().min(5).max(180),
    number_of_questions: z.number().min(1).max(50),
    difficulty: z.enum(["easy", "medium", "hard"]),
    strict_mode: z.boolean(),
    is_public: z.boolean(),
    start_time: z.date().optional().nullable(),
    end_time: z.date().optional().nullable(),
    auto_publish: z.boolean(),
    // Granular Proctoring Settings
    max_tab_switches: z.number().min(1).max(10),
    max_violations: z.number().min(1).max(20),
    require_face_tracking: z.boolean(),
    record_ambient_audio: z.boolean(),
});

type ExamSettingsValues = z.infer<typeof examSettingsSchema>;

interface ExamSettingsProps {
    exam: Exam;
}

export default function ExamSettings({ exam }: ExamSettingsProps) {
    const queryClient = useQueryClient();
    const isPublished = exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE;
    const isScheduled = !isPublished && exam.auto_publish && exam.start_time;
    const [showRubricAlert, setShowRubricAlert] = useState(false);

    // Fetch rubrics for the readiness checklist & publish guard
    const { data: rubrics = [] } = useQuery<Rubric[]>({
        queryKey: ['rubrics', exam.id],
        queryFn: () => api.exams.getRubrics(exam.id),
        staleTime: 30_000,
    });

    const form = useForm<ExamSettingsValues>({
        resolver: zodResolver(examSettingsSchema),
        defaultValues: {
            title: exam.title || '',
            max_attempts: exam.max_attempts || 1,
            duration_minutes: exam.settings?.duration_minutes || 30,
            number_of_questions: exam.settings?.number_of_questions || 5,
            difficulty: exam.settings?.difficulty || 'medium',
            strict_mode: exam.settings?.strict_mode || false,
            is_public: exam.is_public || false,
            start_time: exam.start_time ? new Date(exam.start_time) : null,
            end_time: exam.end_time ? new Date(exam.end_time) : null,
            auto_publish: exam.auto_publish || false,
            max_tab_switches: exam.settings?.max_tab_switches || 3,
            max_violations: exam.settings?.max_violations || 3,
            require_face_tracking: exam.settings?.require_face_tracking ?? true,
            record_ambient_audio: exam.settings?.record_ambient_audio ?? true,
        },
    });

    const watchAutoPublish = form.watch('auto_publish');
    const watchStartTime = form.watch('start_time');
    const watchStrictMode = form.watch('strict_mode');

    // Update form when exam data changes (e.g. after refetch)
    useEffect(() => {
        if (exam) {
            form.reset({
                title: exam.title,
                max_attempts: exam.max_attempts,
                duration_minutes: exam.settings?.duration_minutes,
                number_of_questions: exam.settings?.number_of_questions,
                difficulty: exam.settings?.difficulty || 'medium',
                strict_mode: exam.settings?.strict_mode,
                is_public: exam.is_public,
                start_time: exam.start_time ? new Date(exam.start_time) : null,
                end_time: exam.end_time ? new Date(exam.end_time) : null,
                auto_publish: exam.auto_publish || false,
                max_tab_switches: exam.settings?.max_tab_switches || 3,
                max_violations: exam.settings?.max_violations || 3,
                require_face_tracking: exam.settings?.require_face_tracking ?? true,
                record_ambient_audio: exam.settings?.record_ambient_audio ?? true,
            });
        }
    }, [exam, form]);

    const updateMutation = useMutation({
        mutationFn: async (values: ExamSettingsValues) => {
            return api.exams.update(exam.id, {
                title: values.title,
                max_attempts: values.max_attempts,
                is_public: values.is_public,
                start_time: values.start_time ? values.start_time.toISOString() : undefined,
                end_time: values.end_time ? values.end_time.toISOString() : undefined,
                auto_publish: values.auto_publish,
                settings: {
                    duration_minutes: values.duration_minutes,
                    number_of_questions: values.number_of_questions,
                    strict_mode: values.strict_mode,
                    difficulty: values.difficulty,
                    max_tab_switches: values.max_tab_switches,
                    max_violations: values.max_violations,
                    require_face_tracking: values.require_face_tracking,
                    record_ambient_audio: values.record_ambient_audio,
                }
            });
        },
        onSuccess: (updatedExam: Exam) => {
            queryClient.invalidateQueries({ queryKey: ['exam', exam.id] });
            queryClient.setQueryData(['exam', exam.id], updatedExam);
            toast.success('Exam settings updated successfully');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update exam');
        },
    });

    const statusMutation = useMutation({
        mutationFn: async (status: ExamStatus) => {
            return api.exams.update(exam.id, { status });
        },
        onSuccess: (updatedExam) => {
            queryClient.invalidateQueries({ queryKey: ['exam', exam.id] });
            queryClient.setQueryData(['exam', exam.id], updatedExam);
            toast.success(`Exam ${updatedExam.status.toLowerCase()}`);
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update status');
        },
    });

    const onSubmit = (values: ExamSettingsValues) => {
        updateMutation.mutate(values);
    };

    // Rubric guard: check before publishing
    const handlePublish = () => {
        if (rubrics.length === 0) {
            setShowRubricAlert(true);
        } else {
            statusMutation.mutate(ExamStatus.PUBLISHED);
        }
    };

    // Readiness items
    const readinessItems = [
        {
            label: 'Syllabus uploaded',
            ready: exam.kb_status === KBStatus.READY,
            icon: BookOpen,
        },
        {
            label: 'Rubrics defined',
            ready: rubrics.length > 0,
            icon: ListChecks,
        },
        {
            label: 'Schedule set',
            ready: !!exam.start_time,
            icon: Calendar,
        },
    ];

    return (
        <>
            <div className="flex flex-col xl:flex-row gap-8 items-start">
                {/* Main Configuration Form */}
                <div className="flex-1 w-full space-y-6">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                            {/* General Information Card */}
                            <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        General Information
                                    </CardTitle>
                                    <CardDescription>
                                        Basic details and configuration for this assessment.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="title"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Exam Title</FormLabel>
                                                <FormControl>
                                                    <div className="relative">
                                                        <Input {...field} disabled={isPublished} className="pl-3" />
                                                        {isPublished && <Lock className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground opacity-50" />}
                                                    </div>
                                                </FormControl>
                                                <FormDescription>
                                                    The visible name of the exam for students.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="difficulty"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Difficulty Level</FormLabel>
                                                    <Select
                                                        onValueChange={field.onChange}
                                                        defaultValue={field.value}
                                                        disabled={isPublished}
                                                    >
                                                        <FormControl>
                                                            <SelectTrigger>
                                                                <div className="flex items-center gap-2">
                                                                    <BarChart3 className="w-4 h-4 text-muted-foreground" />
                                                                    <SelectValue placeholder="Select difficulty" />
                                                                </div>
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="easy">Easy</SelectItem>
                                                            <SelectItem value="medium">Medium</SelectItem>
                                                            <SelectItem value="hard">Hard</SelectItem>
                                                        </SelectContent>
                                                    </Select>
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
                                                            <RotateCcw className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                                                                onBlur={field.onBlur}
                                                                ref={field.ref}
                                                                name={field.name}
                                                                disabled={isPublished}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Schedule Card (Draft Only) */}
                            {!isPublished && (
                                <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Calendar className="w-5 h-5 text-primary" />
                                            Schedule
                                        </CardTitle>
                                        <CardDescription>
                                            Define when the exam starts and ends. Set auto-publish to go live automatically.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="start_time"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Start Time</FormLabel>
                                                        <FormControl>
                                                            <DateTimePicker
                                                                date={field.value ?? undefined}
                                                                setDate={(d) => field.onChange(d ?? null)}
                                                                label="Select start time"
                                                                disablePastDates
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Students can join after this time.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="end_time"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>End Time</FormLabel>
                                                        <FormControl>
                                                            <DateTimePicker
                                                                date={field.value ?? undefined}
                                                                setDate={(d) => field.onChange(d ?? null)}
                                                                label="Select end time"
                                                                minDate={watchStartTime || undefined}
                                                                disablePastDates
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            The exam window closes at this time.
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <Separator />

                                        {/* Auto-Publish Toggle */}
                                        <FormField
                                            control={form.control}
                                            name="auto_publish"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4 shadow-sm bg-card/30">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base flex items-center gap-2">
                                                            <Zap className="w-4 h-4 text-amber-500" />
                                                            Auto-Publish
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Automatically publish this exam at the scheduled start time.
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={!watchStartTime}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        {watchAutoPublish && !watchStartTime && (
                                            <Alert className="bg-destructive/10 border-destructive/20 text-destructive dark:text-red-300 animate-in fade-in slide-in-from-top-1 duration-200 mt-4">
                                                <AlertTriangle className="h-4 w-4" />
                                                <AlertTitle className="text-sm font-medium">Start time required</AlertTitle>
                                                <AlertDescription className="text-xs mt-1 opacity-90">
                                                    Set a start time above for auto-publish to work.
                                                </AlertDescription>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            )}

                            {/* Parameters Card */}
                            <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                                <CardHeader>
                                    <CardTitle>Exam Parameters</CardTitle>
                                    <CardDescription>
                                        Define the structure and limits of the exam session.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="duration_minutes"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Duration (Minutes)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 5)}
                                                                onBlur={field.onBlur}
                                                                ref={field.ref}
                                                                name={field.name}
                                                                disabled={isPublished}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Allocated time • {getTimezoneAbbreviation()}
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="number_of_questions"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Number of Questions</FormLabel>
                                                    <FormControl>
                                                        <div className="relative">
                                                            <Hash className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                                            <Input
                                                                type="number"
                                                                value={field.value}
                                                                onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 1)}
                                                                onBlur={field.onBlur}
                                                                ref={field.ref}
                                                                name={field.name}
                                                                disabled={isPublished}
                                                                className="pl-9"
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription>
                                                        Questions generated per exam.
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <Separator />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                                        <FormField
                                            control={form.control}
                                            name="strict_mode"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4 shadow-sm bg-card/30">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base flex items-center gap-2">
                                                            <ShieldAlert className="w-4 h-4 text-primary" />
                                                            Strict Mode
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Enforce fullscreen, tab monitoring & copy protection
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isPublished}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="is_public"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-4 shadow-sm bg-card/30">
                                                    <div className="space-y-0.5">
                                                        <FormLabel className="text-base flex items-center gap-2">
                                                            <Globe className="w-4 h-4 text-primary" />
                                                            Guest Access
                                                        </FormLabel>
                                                        <FormDescription>
                                                            Allow external users via code
                                                        </FormDescription>
                                                    </div>
                                                    <FormControl>
                                                        <Switch
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            disabled={isPublished}
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    {/* Granular Proctoring Settings — visible when Strict Mode is ON */}
                                    {watchStrictMode && (
                                        <>
                                            <Separator className="mt-4" />
                                            <div className="space-y-4 pt-2">
                                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                                                    <ShieldCheck className="w-4 h-4" />
                                                    Integrity & Proctoring
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                    <FormField
                                                        control={form.control}
                                                        name="max_tab_switches"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm">Max Tab Switches</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 3)}
                                                                        onBlur={field.onBlur}
                                                                        ref={field.ref}
                                                                        name={field.name}
                                                                        disabled={isPublished}
                                                                        min={1}
                                                                        max={10}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription className="text-xs">
                                                                    Warning after switching tabs.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="max_violations"
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormLabel className="text-sm">Max Violations (Strikes)</FormLabel>
                                                                <FormControl>
                                                                    <Input
                                                                        type="number"
                                                                        value={field.value}
                                                                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 3)}
                                                                        onBlur={field.onBlur}
                                                                        ref={field.ref}
                                                                        name={field.name}
                                                                        disabled={isPublished}
                                                                        min={1}
                                                                        max={20}
                                                                    />
                                                                </FormControl>
                                                                <FormDescription className="text-xs">
                                                                    Session terminates after this many violations.
                                                                </FormDescription>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="require_face_tracking"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-3 shadow-sm bg-card/30">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                                        <Eye className="w-3.5 h-3.5 text-primary" />
                                                                        Face Tracking
                                                                    </FormLabel>
                                                                    <FormDescription className="text-xs">
                                                                        Gaze & identity checks
                                                                    </FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        disabled={isPublished}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />

                                                    <FormField
                                                        control={form.control}
                                                        name="record_ambient_audio"
                                                        render={({ field }) => (
                                                            <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/60 p-3 shadow-sm bg-card/30">
                                                                <div className="space-y-0.5">
                                                                    <FormLabel className="text-sm flex items-center gap-1.5">
                                                                        <Mic className="w-3.5 h-3.5 text-primary" />
                                                                        Ambient Audio
                                                                    </FormLabel>
                                                                    <FormDescription className="text-xs">
                                                                        Record noise levels
                                                                    </FormDescription>
                                                                </div>
                                                                <FormControl>
                                                                    <Switch
                                                                        checked={field.value}
                                                                        onCheckedChange={field.onChange}
                                                                        disabled={isPublished}
                                                                    />
                                                                </FormControl>
                                                            </FormItem>
                                                        )}
                                                    />
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </CardContent>
                                <CardFooter className="sticky bottom-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t border-border/80 px-6 py-4 flex justify-between md:justify-end gap-3 rounded-b-xl shadow-[0_-4px_14px_-8px_rgba(0,0,0,0.1)]">
                                    <Button
                                        type="submit"
                                        size="lg"
                                        className="shadow-md font-semibold min-w-[140px]"
                                        disabled={isPublished || !form.formState.isDirty || updateMutation.isPending}
                                    >
                                        {updateMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save className="w-4 h-4" />
                                                Save Changes
                                            </>
                                        )}
                                    </Button>
                                </CardFooter>
                            </Card>
                        </form>
                    </Form>
                </div>

                {/* Side Status Panel */}
                <div className="w-full xl:w-80 space-y-6 shrink-0">
                    <Card className={isPublished
                        ? "border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm shadow-sm"
                        : "border-amber-500/20 bg-amber-500/5 backdrop-blur-sm shadow-sm"
                    }>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base font-medium flex items-center justify-between">
                                Status
                                <Badge variant={isPublished ? "default" : isScheduled ? "outline" : "secondary"} className={
                                    isPublished 
                                        ? "bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 border-emerald-500/20" 
                                        : isScheduled
                                            ? "border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10"
                                            : "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25 border-amber-500/20"
                                }>
                                    {isPublished ? exam.status : isScheduled ? 'SCHEDULED' : exam.status}
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {isPublished ? (
                                <>
                                    <Alert className="bg-emerald-500/10 border-emerald-500/20 text-emerald-800 dark:text-emerald-200">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                        <AlertTitle>Exam is Live</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 opacity-90">
                                            Settings is locked to preserve integrity.
                                        </AlertDescription>
                                    </Alert>
                                    <div className="flex flex-col gap-2 w-full pt-2">
                                        {exam.status === ExamStatus.PUBLISHED && (
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    if(confirm("Are you sure you want to unpublish this exam? This will only work if no students have joined it yet.")) {
                                                        statusMutation.mutate(ExamStatus.DRAFT);
                                                    }
                                                }}
                                                disabled={statusMutation.isPending || updateMutation.isPending}
                                                className="w-full"
                                            >
                                                Unpublish to Draft
                                            </Button>
                                        )}
                                        <Button
                                            variant="secondary"
                                            className="w-full text-destructive hover:bg-destructive/10"
                                            onClick={() => {
                                                if(confirm("Are you sure you want to archive this exam? This will hide it from students.")) {
                                                    statusMutation.mutate(ExamStatus.ARCHIVED);
                                                }
                                            }}
                                            disabled={statusMutation.isPending || updateMutation.isPending}
                                        >
                                            Archive Exam
                                        </Button>
                                    </div>
                                </>
                            ) : exam.status === ExamStatus.COMPLETED || exam.status === ExamStatus.ARCHIVED ? (
                                <>
                                     <Alert className="bg-muted border-border text-muted-foreground">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <AlertTitle>Exam Closed</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 opacity-90">
                                            This exam is no longer active.
                                        </AlertDescription>
                                    </Alert>
                                </>
                            ) : isScheduled ? (
                                <>
                                    <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200">
                                        <Zap className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <AlertTitle>Auto-Publish Scheduled</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 opacity-90">
                                            <p>
                                                This exam will go live automatically on{' '}
                                                <span className="font-semibold">{format(new Date(exam.start_time!), 'PPP')}</span> at{' '}
                                                <span className="font-semibold">{format(new Date(exam.start_time!), 'p')}</span>.
                                                The server checks every 60 seconds.
                                            </p>
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md border-0"
                                        onClick={handlePublish}
                                        disabled={statusMutation.isPending || updateMutation.isPending}
                                    >
                                        {statusMutation.isPending && exam.status === ExamStatus.DRAFT ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Publish Now"
                                        )}
                                    </Button>
                                </>
                            ) : exam.status === ExamStatus.DRAFT ? (
                                <>
                                    <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-800 dark:text-amber-200">
                                        <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                        <AlertTitle>Draft Mode</AlertTitle>
                                        <AlertDescription className="text-xs mt-1 opacity-90">
                                            Visible only to instructors. Publish to make it available to students.
                                        </AlertDescription>
                                    </Alert>
                                    <Button
                                        className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-md border-0"
                                        onClick={handlePublish}
                                        disabled={statusMutation.isPending || updateMutation.isPending}
                                    >
                                        {statusMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            "Publish Exam"
                                        )}
                                    </Button>
                                </>
                            ) : null}
                        </CardContent>
                    </Card>

                    {/* Readiness Checklist */}
                    {!isPublished && (
                        <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <ListChecks className="w-4 h-4 text-primary" />
                                    Publish Readiness
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {readinessItems.map((item) => (
                                    <div
                                        key={item.label}
                                        className="flex items-center gap-3 text-sm"
                                    >
                                        {item.ready ? (
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                        ) : (
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                        )}
                                        <span className={item.ready ? 'text-foreground' : 'text-muted-foreground'}>
                                            {item.label}
                                        </span>
                                    </div>
                                ))}
                                <p className="text-xs text-muted-foreground pt-2 border-t border-border/40">
                                    These are optional but recommended for a complete exam setup.
                                </p>
                            </CardContent>
                        </Card>
                    )}



                    {!isPublished && (
                        <div className="text-center text-xs text-muted-foreground p-2">
                            <p>Need to delete?</p>
                            <p className="mt-1">Delete using the &quot;Danger Zone&quot; below the tabs.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Rubric Guard Alert Dialog */}
            <AlertDialog open={showRubricAlert} onOpenChange={setShowRubricAlert}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                            No Grading Rubrics Defined
                        </AlertDialogTitle>
                        <AlertDialogDescription className="space-y-2">
                            <p>
                                This exam has no rubrics. Without rubrics, students will be evaluated
                                without structured grading criteria — results may be inconsistent.
                            </p>
                            <p className="text-sm font-medium text-foreground/80">
                                Are you sure you want to publish without rubrics?
                            </p>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-amber-600 hover:bg-amber-500 text-white"
                            onClick={() => statusMutation.mutate(ExamStatus.PUBLISHED)}
                        >
                            Publish Anyway
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
