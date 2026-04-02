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
import { Search, AlertTriangle, CheckCircle, XCircle, Clock, SearchX, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Label } from '@/components/ui/label';

export default function AdminExceptionsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('PENDING');

    const [selectedException, setSelectedException] = useState<ExamException | null>(null);
    const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
    const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
    const [rejectReason, setRejectReason] = useState('');
    const [overrideDate, setOverrideDate] = useState('');

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
        const formattedDate = overrideDate ? new Date(overrideDate).toISOString() : undefined;
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
                return <Badge variant="secondary" className="text-xs">Self (Instructor)</Badge>;
            case ExceptionApprovalType.AUTO:
                return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 text-xs">System Auto</Badge>;
            case ExceptionApprovalType.MANUAL:
                return <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 text-xs">Admin Manual</Badge>;
            default:
                return <Badge variant="secondary" className="text-xs">{type}</Badge>;
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Exception Requests"
                description="Manage deadline extensions and special access tickets for students."
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

                <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="pl-6">Student</TableHead>
                                <TableHead>Exam</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Granted Until</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead className="text-right pr-6">Action</TableHead>
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
                                        <TableCell className="pr-6"><Skeleton className="h-8 w-20 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredExceptions.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <SearchX className="w-8 h-8 opacity-20" />
                                            <p>No exceptions found.</p>
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
                                        <TableCell className="font-medium">
                                            {ex.exam_title || 'Unknown Exam'}
                                            <div className="text-xs text-muted-foreground mt-0.5 max-w-[200px] truncate">
                                                Requested by: {ex.requested_by_name || 'Instructor'}
                                            </div>
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
                                        <TableCell className="text-right pr-6">
                                            {ex.status === ExceptionStatus.PENDING && (
                                                <div className="flex flex-col sm:flex-row gap-2 justify-end">
                                                    <Button variant="outline" size="sm" className="h-8 border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950/30 dark:text-emerald-400" onClick={() => {
                                                        setSelectedException(ex);
                                                        setOverrideDate('');
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
                            Are you sure you want to approve this request for <strong className="text-foreground">{selectedException?.student_email}</strong>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                            <div><span className="font-semibold">Reason:</span> {selectedException?.reason}</div>
                            <div><span className="font-semibold">Requested Deadline:</span> {selectedException && formatToLocalDateTime(selectedException.granted_until)}</div>
                        </div>
                        
                        <div className="space-y-2">
                            <Label>Override Requested Deadline (Optional)</Label>
                            <Input 
                                type="datetime-local" 
                                value={overrideDate}
                                onChange={(e) => setOverrideDate(e.target.value)}
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
                            You are about to reject the extension request for <strong className="text-foreground">{selectedException?.student_email}</strong>.
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
