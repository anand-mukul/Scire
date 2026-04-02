'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { ExamException, ExceptionStatus, ExceptionApprovalType } from '@/types/backend';
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
import { Search, AlertTriangle, CheckCircle, XCircle, Clock, SearchX, ShieldAlert, CalendarClock } from 'lucide-react';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Label } from '@/components/ui/label';

export default function AdminExtensionsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');

    const [selectedException, setSelectedException] = useState<ExamException | null>(null);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [overrideDate, setOverrideDate] = useState<Date | undefined>(undefined);

    const { data, isLoading } = useQuery({
        queryKey: ['admin-exceptions', statusFilter],
        queryFn: () => api.exceptions.list({
            status: statusFilter !== 'ALL' ? statusFilter : undefined,
            limit: 100
        }),
    });

    const exceptions = data?.items || [];

    const stats = {
        pending: exceptions.filter(e => e.status === ExceptionStatus.PENDING).length,
        approved: exceptions.filter(e => e.status === ExceptionStatus.APPROVED && e.approval_type === ExceptionApprovalType.MANUAL).length,
        auto: exceptions.filter(e => e.status === ExceptionStatus.APPROVED && (e.approval_type === ExceptionApprovalType.AUTO || e.approval_type === ExceptionApprovalType.SELF)).length,
        rejected: exceptions.filter(e => e.status === ExceptionStatus.REJECTED).length,
    };

    const approveMutation = useMutation({
        mutationFn: (payload: { id: string, granted_until?: string }) =>
            api.exceptions.approve(payload.id, payload.granted_until ? { granted_until: payload.granted_until } : undefined),
        onSuccess: () => {
            toast.success('Exception approved');
            queryClient.invalidateQueries({ queryKey: ['admin-exceptions'] });
            setIsApproveDialogOpen(false);
            setSelectedException(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Failed to approve exception');
        }
    });

    const rejectMutation = useMutation({
        mutationFn: (payload: { id: string, reason: string }) =>
            api.exceptions.reject(payload.id, { reason: payload.reason }),
        onSuccess: () => {
            toast.success('Exception rejected');
            queryClient.invalidateQueries({ queryKey: ['admin-exceptions'] });
            setIsRejectDialogOpen(false);
            setRejectReason('');
            setSelectedException(null);
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.detail || 'Failed to reject exception');
        }
    });

    const handleApprove = () => {
        if (!selectedException) return;
        const formattedDate = overrideDate ? overrideDate.toISOString() : undefined;
        approveMutation.mutate({ id: selectedException.id, granted_until: formattedDate });
    };

    const handleReject = () => {
        if (!selectedException) return;
        if (!rejectReason.trim()) {
            toast.error('Rejection reason is required');
            return;
        }
        rejectMutation.mutate({ id: selectedException.id, reason: rejectReason });
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
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Extensions"
                description="Manage deadline extensions for students who need extra time on exams."
            />

            <div className="grid gap-6 md:grid-cols-4">
                <KPICard
                    title="Pending Reviews"
                    value={statusFilter === 'ALL' || statusFilter === 'PENDING' ? stats.pending : '-'}
                    icon={AlertTriangle}
                    trend="neutral"
                    loading={isLoading}
                    className="shadow-sm border-amber-200/50 bg-amber-50/50 dark:bg-amber-950/20"
                />
                <KPICard
                    title="Manual Approvals"
                    value={statusFilter === 'ALL' ? stats.approved : '-'}
                    icon={CheckCircle}
                    trend="up"
                    loading={isLoading}
                    className="shadow-sm border-emerald-200/50 bg-emerald-50/50 dark:bg-emerald-950/20"
                />
                <KPICard
                    title="Auto/Self Approved"
                    value={statusFilter === 'ALL' ? stats.auto : '-'}
                    icon={Clock}
                    trend="neutral"
                    loading={isLoading}
                    className="shadow-sm border-blue-200/50 bg-blue-50/50 dark:bg-blue-950/20"
                />
                <KPICard
                    title="Rejected"
                    value={statusFilter === 'ALL' || statusFilter === 'REJECTED' ? stats.rejected : '-'}
                    icon={XCircle}
                    trend="down"
                    loading={isLoading}
                    className="shadow-sm border-rose-200/50 bg-rose-50/50 dark:bg-rose-950/20"
                />
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/30 p-1 rounded-xl">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by student email, name, or exam..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[160px] h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50">
                                <SelectValue placeholder="All Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ALL">All Status</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="APPROVED">Approved</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                                <SelectItem value="EXPIRED">Expired</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-border/30 bg-muted/20">
                                <TableHead className="pl-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10 w-[240px]">Student</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10 w-[240px]">Exam</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10 w-[140px]">Status</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10 w-[180px]">Deadline</TableHead>
                                <TableHead className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Reason</TableHead>
                                <TableHead className="text-right pr-6 text-xs font-semibold uppercase tracking-wider text-muted-foreground/70 h-10">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(3).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-border/20">
                                        <TableCell className="pl-6"><div className="flex items-center gap-3"><Skeleton className="h-8 w-8 rounded-full shrink-0" /><div><Skeleton className="h-4 w-24 mb-1.5" /><Skeleton className="h-3 w-32" /></div></div></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28 mb-1.5" /><Skeleton className="h-3 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                                        <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredExceptions.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={6} className="h-40 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                                                <CalendarClock className="w-6 h-6 text-muted-foreground/40" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-muted-foreground">No extensions found</p>
                                                <p className="text-xs text-muted-foreground/60 mt-0.5">There are no requests matching your filters.</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredExceptions.map((ex) => (
                                    <TableRow key={ex.id} className="group hover:bg-muted/30 border-border/20 transition-colors">
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/10 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-semibold text-primary">
                                                        {(ex.student?.full_name || 'N').charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-medium text-sm text-foreground truncate max-w-[180px]">
                                                        {ex.student?.full_name || 'N/A'}
                                                    </div>
                                                    <div className="text-[11px] text-muted-foreground/70 truncate max-w-[180px] font-mono">
                                                        {ex.student?.email || ex.student_id}
                                                    </div>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-3">
                                            <span className="text-sm text-foreground truncate block max-w-[180px]">{ex.exam?.title || 'N/A'}</span>
                                            <div className="text-[11px] text-muted-foreground/70 mt-0.5 truncate max-w-[180px]">
                                                Req by: {ex.requester?.full_name || 'Instructor'}
                                            </div>
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
                                        <TableCell className="text-right pr-6">
                                            {ex.status === ExceptionStatus.PENDING && (
                                                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                                    <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 dark:text-emerald-400" onClick={() => {
                                                        setSelectedException(ex);
                                                        setOverrideDate(undefined);
                                                        setIsApproveDialogOpen(true);
                                                    }}>
                                                        Approve
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="h-8 border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:hover:bg-rose-950/30 dark:text-rose-400" onClick={() => {
                                                        setSelectedException(ex);
                                                        setRejectReason('');
                                                        setIsRejectDialogOpen(true);
                                                    }}>
                                                        Reject
                                                    </Button>
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

            {/* Approve Dialog */}
            <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Approve Exception Request</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to approve this request for <strong className="text-foreground">{selectedException?.student?.email}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                            <div><span className="font-semibold">Reason:</span> {selectedException?.reason}</div>
                            <div><span className="font-semibold">Requested Deadline:</span> {selectedException && formatToLocalDateTime(selectedException.granted_until)}</div>
                        </div>

                        <div className="space-y-2">
                            <Label>Override Requested Deadline (Optional)</Label>
                            <DateTimePicker
                                date={overrideDate}
                                setDate={setOverrideDate}
                                label="Override deadline (optional)"
                                disablePastDates
                            />
                            <p className="text-xs text-muted-foreground">Leave blank to use the instructor's requested deadline.</p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleApprove} disabled={approveMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                            {approveMutation.isPending ? 'Approving...' : 'Confirm Approval'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Reject Dialog */}
            <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Reject Exception Request</DialogTitle>
                        <DialogDescription>
                            You are about to reject the extension request for <strong className="text-foreground">{selectedException?.student?.email}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-2">
                        <Label>Reason for Rejection (Required)</Label>
                        <Textarea
                            placeholder="e.g. Documentation not sufficient for extension."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="min-h-[100px]"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleReject} disabled={rejectMutation.isPending || !rejectReason.trim()} variant="destructive">
                            {rejectMutation.isPending ? 'Rejecting...' : 'Reject Request'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
