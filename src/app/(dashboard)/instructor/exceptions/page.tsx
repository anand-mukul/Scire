'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Clock, Search, AlertTriangle, CheckCircle, XCircle, SearchX } from 'lucide-react';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';

const createExceptionSchema = z.object({
    exam_id: z.string().min(1, 'Exam is required'),
    student_email: z.string().email('Invalid email address'),
    reason: z.string().min(5, 'Reason must be at least 5 characters'),
    granted_until: z.string().min(1, 'Deadline extension is required'),
});

type CreateExceptionFormValues = z.infer<typeof createExceptionSchema>;

export default function InstructorExceptionsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // List of instructor's exams for the dropdown
    const { data: exams, isLoading: isExamsLoading } = useExams();

    const { data, isLoading } = useQuery({
        queryKey: ['instructor-exceptions'],
        queryFn: () => api.exceptions.list({
            limit: 100
        }),
    });

    const exceptions = data?.items || [];

    const form = useForm<CreateExceptionFormValues>({
        resolver: zodResolver(createExceptionSchema),
        defaultValues: {
            exam_id: '',
            student_email: '',
            reason: '',
            granted_until: '',
        },
    });

    React.useEffect(() => {
        if (!isCreateDialogOpen) {
            form.reset();
        }
    }, [isCreateDialogOpen, form]);

    const createMutation = useMutation({
        mutationFn: (data: CreateExceptionFormValues) =>
            api.exceptions.create({
                ...data,
                granted_until: new Date(data.granted_until).toISOString()
            }),
        onSuccess: () => {
            toast.success('Exception requested successfully');
            queryClient.invalidateQueries({ queryKey: ['instructor-exceptions'] });
            setIsCreateDialogOpen(false);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Failed to request exception');
        },
    });

    const onSubmit = (data: CreateExceptionFormValues) => {
        createMutation.mutate(data);
    };

    const filteredExceptions = exceptions.filter(e => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            (e.student_email?.toLowerCase() || '').includes(q) ||
            (e.student_name?.toLowerCase() || '').includes(q) ||
            (e.exam_title?.toLowerCase() || '').includes(q)
        );
    });

    const getStatusBadge = (status: ExceptionStatus) => {
        switch (status) {
            case ExceptionStatus.PENDING:
                return <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
            case ExceptionStatus.APPROVED:
                return <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"><CheckCircle className="w-3 h-3 mr-1" /> Approved</Badge>;
            case ExceptionStatus.REJECTED:
                return <Badge variant="outline" className="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-900/30 dark:text-rose-400 dark:border-rose-800"><XCircle className="w-3 h-3 mr-1" /> Rejected</Badge>;
            case ExceptionStatus.EXPIRED:
                return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const getApprovalTypeBadge = (type?: ExceptionApprovalType) => {
        if (!type) return null;
        switch (type) {
            case ExceptionApprovalType.SELF:
                return <Badge variant="secondary" className="text-xs">Self Approved</Badge>;
            case ExceptionApprovalType.AUTO:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">System Auto</Badge>;
            case ExceptionApprovalType.MANUAL:
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">Admin Manual</Badge>;
            default:
                return <Badge variant="secondary" className="text-xs">{type}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 w-full">
            <PageHeader
                title="Late Tickets (Exceptions)"
                description="Request deadline extensions or special access for individual students."
                actions={
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md">
                                <Plus className="w-4 h-4" />
                                New Request
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground max-w-md backdrop-blur-xl sm:rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Request Deadline Extension</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Provide details to grant a specific student special access to a past exam.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                                    <FormField
                                        control={form.control}
                                        name="exam_id"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Exam</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isExamsLoading}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50">
                                                            <SelectValue placeholder="Select an exam" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {exams?.map((exam) => (
                                                            <SelectItem key={exam.id} value={exam.id}>
                                                                {exam.title}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="student_email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Student Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="student@example.com" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="granted_until"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Grant Access Until</FormLabel>
                                                <FormControl>
                                                    <Input type="datetime-local" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="reason"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Reason Request</FormLabel>
                                                <FormControl>
                                                    <Textarea placeholder="Medical emergency, technical issues, etc." className="bg-background/50 resize-none min-h-[100px]" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="pt-4">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createMutation.isPending}
                                        >
                                            {createMutation.isPending ? 'Submitting...' : 'Submit Request'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
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

                <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="pl-6">Student</TableHead>
                                <TableHead>Exam</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Extended Deadline</TableHead>
                                <TableHead>Details</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-border/50">
                                        <TableCell className="pl-6"><Skeleton className="h-4 w-32 mb-2"/><Skeleton className="h-3 w-40"/></TableCell>
                                        <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredExceptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <SearchX className="w-8 h-8 opacity-20" />
                                            <p>No late tickets found.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExceptions.map((ex) => (
                                    <TableRow key={ex.id} className="hover:bg-muted/40 border-border/40 transition-colors">
                                        <TableCell className="pl-6">
                                            <div className="font-medium text-sm text-foreground">
                                                {ex.student_name || 'Unknown Student'}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {ex.student_email || ex.student_id}
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-sm">
                                            {ex.exam_title || 'Unknown Exam'}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1 items-start">
                                                {getStatusBadge(ex.status)}
                                                {getApprovalTypeBadge(ex.approval_type)}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm font-medium">
                                            {formatToLocalDateTime(ex.granted_until)}
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-sm max-w-[250px] truncate" title={ex.reason}>
                                                {ex.reason}
                                            </div>
                                            {ex.rejection_reason && (
                                                <div className="text-xs text-rose-500 mt-1 max-w-[250px] truncate" title={ex.rejection_reason}>
                                                    Rejected: {ex.rejection_reason}
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
