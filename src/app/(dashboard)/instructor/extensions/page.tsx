'use client';

import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { ExamException, ExceptionStatus, ExceptionApprovalType } from '@/types/backend';
import { useExams } from '@/hooks/use-dashboard-data';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { Plus, Clock, Search, CheckCircle, XCircle, SearchX, Trash2, ChevronDown, ChevronUp, ShieldCheck, Loader2, Mail, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils';

interface StudentEntry {
    id: string;
    email: string;
    reason: string;
    status: 'idle' | 'valid' | 'invalid';
    showReason: boolean;
}

function generateId() {
    return Math.random().toString(36).substring(2, 10);
}

export default function InstructorExtensionsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Form state
    const [selectedExamId, setSelectedExamId] = useState<string>('');
    const [grantedUntil, setGrantedUntil] = useState<Date | undefined>(undefined);
    const [students, setStudents] = useState<StudentEntry[]>([
        { id: generateId(), email: '', reason: '', status: 'idle', showReason: false }
    ]);
    const [formStage, setFormStage] = useState<'input' | 'verifying' | 'verified' | 'submitting'>('input');

    const { data: exams, isLoading: isExamsLoading } = useExams();
    const { data, isLoading } = useQuery({
        queryKey: ['instructor-exceptions'],
        queryFn: () => api.exceptions.list({ limit: 100 }),
    });

    const exceptions = data?.items || [];

    // Reset form when dialog closes
    React.useEffect(() => {
        if (!isCreateDialogOpen) {
            setSelectedExamId('');
            setGrantedUntil(undefined);
            setStudents([{ id: generateId(), email: '', reason: '', status: 'idle', showReason: false }]);
            setFormStage('input');
        }
    }, [isCreateDialogOpen]);

    // Add new student
    const addStudent = useCallback(() => {
        setStudents(prev => [
            ...prev,
            { id: generateId(), email: '', reason: '', status: 'idle', showReason: false }
        ]);
        setFormStage('input');
    }, []);

    // Remove student
    const removeStudent = useCallback((id: string) => {
        setStudents(prev => {
            if (prev.length <= 1) return prev;
            return prev.filter(s => s.id !== id);
        });
        setFormStage('input');
    }, []);

    // Update student field
    const updateStudent = useCallback((id: string, field: keyof StudentEntry, value: string | boolean) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: value, ...(field === 'email' ? { status: 'idle' as const } : {}) } : s));
        if (field === 'email') setFormStage('input');
    }, []);

    // Toggle reason thread
    const toggleReason = useCallback((id: string) => {
        setStudents(prev => prev.map(s => s.id === id ? { ...s, showReason: !s.showReason } : s));
    }, []);

    // Verify emails
    const verifyMutation = useMutation({
        mutationFn: (emails: string[]) => api.exceptions.verify(emails),
        onSuccess: (result) => {
            const validSet = new Set(result.valid.map((e: string) => e.toLowerCase()));
            setStudents(prev => prev.map(s => ({
                ...s,
                status: validSet.has(s.email.toLowerCase().trim()) ? 'valid' as const : 'invalid' as const,
            })));
            if (result.invalid.length === 0) {
                setFormStage('verified');
                toast.success('All emails verified successfully');
            } else {
                setFormStage('input');
                toast.error(`${result.invalid.length} email(s) not found in the system`);
            }
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Verification failed');
            setFormStage('input');
        },
    });

    const handleVerify = () => {
        const emails = students.map(s => s.email.trim()).filter(Boolean);
        if (emails.length === 0) {
            toast.error('Please enter at least one email');
            return;
        }
        // Check all reasons are filled
        const missingReason = students.find(s => s.email.trim() && s.reason.trim().length < 10);
        if (missingReason) {
            toast.error('Each student must have a reason (at least 10 characters). Click the email row to add a reason.');
            // Auto-open reason for that student
            setStudents(prev => prev.map(s => s.id === missingReason.id ? { ...s, showReason: true } : s));
            return;
        }
        if (!selectedExamId) {
            toast.error('Please select an exam');
            return;
        }
        if (!grantedUntil) {
            toast.error('Please set a deadline');
            return;
        }
        setFormStage('verifying');
        verifyMutation.mutate(emails);
    };

    // Submit batch
    const createMutation = useMutation({
        mutationFn: () =>
            api.exceptions.create({
                exam_id: selectedExamId,
                granted_until: grantedUntil!.toISOString(),
                requests: students.filter(s => s.email.trim()).map(s => ({
                    email: s.email.trim(),
                    reason: s.reason.trim(),
                })),
            }),
        onSuccess: () => {
            toast.success('Exceptions created successfully');
            queryClient.invalidateQueries({ queryKey: ['instructor-exceptions'] });
            setIsCreateDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Failed to create exceptions');
            setFormStage('verified');
        },
    });

    const handleSubmit = () => {
        setFormStage('submitting');
        createMutation.mutate();
    };

    const filteredExceptions = exceptions.filter((e: ExamException) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (e.student?.email?.toLowerCase() || '').includes(q) ||
            (e.student?.full_name?.toLowerCase() || '').includes(q) ||
            (e.exam?.title?.toLowerCase() || '').includes(q)
        );
    });

    const StatusDisplay = ({ status, type }: { status: ExceptionStatus, type?: ExceptionApprovalType }) => {
        let color = "bg-muted-foreground/30";
        let text = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

        if (status === ExceptionStatus.PENDING) color = "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]";
        if (status === ExceptionStatus.APPROVED) color = "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]";
        if (status === ExceptionStatus.REJECTED) color = "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]";

        let subText = "";
        if (type === ExceptionApprovalType.MANUAL) subText = "Admin Approved";
        else if (type === ExceptionApprovalType.AUTO) subText = "System Auto";
        else if (type === ExceptionApprovalType.SELF) subText = "Self Approved";

        return (
            <div className="flex flex-col pt-0.5 gap-0.5">
                <div className="flex items-center gap-2">
                    <div className={cn("h-1.5 w-1.5 rounded-full blur-[0.5px]", color)} />
                    <span className={cn(
                        "text-sm font-medium",
                        status === ExceptionStatus.PENDING && "text-amber-600 dark:text-amber-500",
                        status === ExceptionStatus.APPROVED && "text-emerald-600 dark:text-emerald-500",
                        status === ExceptionStatus.REJECTED && "text-rose-600 dark:text-rose-500",
                        status === ExceptionStatus.EXPIRED && "text-muted-foreground"
                    )}>
                        {text}
                    </span>
                </div>
                {subText && status === ExceptionStatus.APPROVED && (
                    <span className="text-[10px] text-muted-foreground/70 font-semibold pl-3.5 tracking-tight uppercase">
                        {subText}
                    </span>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 w-full">
            <PageHeader
                title="Extensions"
                description="Grant deadline extensions for students who need extra time on exams."
                actions={
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md">
                                <Plus className="w-4 h-4" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground max-w-2xl backdrop-blur-xl sm:rounded-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle className="text-xl">New Extension Request</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Grant extended access to one or more students on a past exam.
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-5 py-4">
                                {/* Exam Selector */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Exam</label>
                                    <Select onValueChange={setSelectedExamId} value={selectedExamId} disabled={isExamsLoading}>
                                        <SelectTrigger className="bg-background/50 h-10">
                                            <SelectValue placeholder="Select an exam" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {exams?.map((exam) => (
                                                <SelectItem key={exam.id} value={exam.id}>
                                                    {exam.title}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Grant Until — DateTimePicker */}
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1.5">Grant Access Until</label>
                                    <DateTimePicker
                                        date={grantedUntil}
                                        setDate={setGrantedUntil}
                                        label="Set extension deadline"
                                        disablePastDates
                                    />
                                </div>

                                {/* Student Entries */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-sm font-medium text-foreground">Students</label>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={addStudent}
                                            className="h-7 px-2.5 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary transition-colors"
                                        >
                                            <Plus className="w-3.5 h-3.5 mr-1" />
                                            Add Student
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {students.map((student, idx) => (
                                            <div
                                                key={student.id}
                                                className={cn(
                                                    "rounded-xl border transition-all duration-200 overflow-hidden",
                                                    student.status === 'valid' && "border-emerald-500/50 bg-emerald-500/5",
                                                    student.status === 'invalid' && "border-rose-500/50 bg-rose-500/5 animate-shake",
                                                    student.status === 'idle' && "border-border/50 bg-card/50",
                                                )}
                                            >
                                                {/* Email row */}
                                                <div className="flex items-center gap-2 p-1.5 px-2.5">
                                                    <div className="flex items-center justify-center w-5 h-5 ml-0.5 rounded-full bg-muted text-muted-foreground text-[10px] font-mono font-medium shrink-0">
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex-1 flex items-center h-9">
                                                        <Mail className="w-4 h-4 text-muted-foreground/60 mr-2.5 ml-1 shrink-0" />
                                                        <Input
                                                            type="email"
                                                            placeholder="student@example.com"
                                                            value={student.email}
                                                            onChange={(e) => updateStudent(student.id, 'email', e.target.value)}
                                                            className={cn(
                                                                "h-full text-sm !bg-transparent dark:!bg-transparent border-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0 min-w-0 rounded-none",
                                                                student.status === 'invalid' && "text-rose-400 placeholder:text-rose-400/50",
                                                            )}
                                                        />
                                                    </div>

                                                    <div className="flex items-center gap-0.5 pr-0.5 shrink-0">
                                                        {/* Status indicator */}
                                                        {student.status === 'valid' && (
                                                            <div className="flex items-center justify-center w-7 h-7">
                                                                <CheckCircle className="w-4 h-4 text-emerald-500" />
                                                            </div>
                                                        )}
                                                        {student.status === 'invalid' && (
                                                            <div className="flex items-center justify-center w-7 h-7">
                                                                <XCircle className="w-4 h-4 text-rose-500" />
                                                            </div>
                                                        )}

                                                        {/* Toggle reason */}
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleReason(student.id)}
                                                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                                            title={student.showReason ? "Hide reason" : "Add reason"}
                                                        >
                                                            {student.showReason ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </Button>

                                                        {/* Remove */}
                                                        {students.length > 1 && (
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="icon"
                                                                onClick={() => removeStudent(student.id)}
                                                                className="h-7 w-7 text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10"
                                                                title="Remove student"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Reason thread (cascade card) */}
                                                <div className={cn(
                                                    "overflow-hidden transition-all duration-300 ease-in-out",
                                                    student.showReason ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                                                )}>
                                                    <div className="px-2.5 pb-2.5 pt-0">
                                                        <div className="ml-8 border-l-2 border-border/50 pl-3">
                                                            <Textarea
                                                                placeholder="Medical emergency, technical issues, etc. (min 10 chars)"
                                                                value={student.reason}
                                                                onChange={(e) => updateStudent(student.id, 'reason', e.target.value)}
                                                                className="bg-background/30 resize-none min-h-[60px] text-sm border-border/30 focus-visible:ring-primary/30"
                                                                rows={2}
                                                            />
                                                            {student.reason.length > 0 && student.reason.length < 10 && (
                                                                <p className="text-xs text-rose-400 mt-1">{10 - student.reason.length} more characters needed</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <DialogFooter className="pt-2 gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                    className="border-border/50"
                                >
                                    Cancel
                                </Button>

                                {formStage === 'verified' ? (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={createMutation.isPending}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                                    >
                                        {createMutation.isPending ? (
                                            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Submitting...</>
                                        ) : (
                                            <><ShieldCheck className="w-4 h-4 mr-1.5" /> Submit Request</>
                                        )}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={handleVerify}
                                        disabled={formStage === 'verifying'}
                                    >
                                        {formStage === 'verifying' ? (
                                            <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Verifying...</>
                                        ) : (
                                            'Verify Emails'
                                        )}
                                    </Button>
                                )}
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                }
            />

            <div className="space-y-4">
                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by student or exam..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9 h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50 transition-all"
                    />
                </div>

                <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/30 bg-muted/20">
                                <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Student</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Exam</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Deadline</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Reason</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-border/20">
                                        <TableCell className="pl-6"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full shrink-0" /><div><Skeleton className="h-4 w-24 mb-1.5" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredExceptions.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={5} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                <CalendarClock className="w-6 h-6 text-muted-foreground/40" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">No extensions yet</p>
                                                <p className="text-xs text-muted-foreground/60 mt-0.5">Create a new request to grant students extra time.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExceptions.map((ex: ExamException) => (
                                    <TableRow key={ex.id} className="group hover:bg-muted/30 border-border/20 transition-colors">
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-semibold text-primary">
                                                        {(ex.student?.full_name || 'N').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-foreground truncate max-w-[150px]">
                                                        {ex.student?.full_name || 'N/A'}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground/70 truncate max-w-[150px] font-mono">
                                                        {ex.student?.email || ex.student_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-sm text-foreground truncate block max-w-[150px]">
                                                {ex.exam?.title || 'N/A'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <StatusDisplay status={ex.status} type={ex.approval_type} />
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <CalendarClock className="w-3.5 h-3.5 shrink-0 text-muted-foreground/50" />
                                                <span className="font-mono text-xs">{formatToLocalDateTime(ex.granted_until)}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <div className="text-sm max-w-[220px] truncate text-muted-foreground group-hover:text-foreground transition-colors" title={ex.reason}>
                                                {ex.reason}
                                            </div>
                                            {ex.rejection_reason && (
                                                <div className="text-[11px] text-rose-500/80 mt-1 max-w-[220px] truncate" title={ex.rejection_reason}>
                                                    ✕ {ex.rejection_reason}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </div>
    );
}
