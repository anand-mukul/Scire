'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import {
    Shield,
    CheckCircle,
    XCircle,
    Clock,
    Building2,
    Mail,
    Calendar,
    FileText,
    Phone,
    AlertTriangle,
    Inbox,
} from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { PageHeader } from '@/components/dashboard/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableSkeleton } from '@/components/ui/table-skeleton';


// ============= Types & Helpers =============

type RequestStatus = 'pending' | 'approved' | 'rejected';

interface OrgRequest {
    id: string;
    name: string;
    slug: string;
    email: string;
    full_name: string;
    phone?: string;
    use_case?: string;
    status: RequestStatus;
    admin_notes?: string;
    created_at: string;
    updated_at: string;
}

type FilterTab = 'all' | RequestStatus;

const filterTabs: { value: FilterTab; label: string; icon: typeof Inbox }[] = [
    { value: 'all', label: 'All', icon: Inbox },
    { value: 'pending', label: 'Pending', icon: Clock },
    { value: 'approved', label: 'Approved', icon: CheckCircle },
    { value: 'rejected', label: 'Rejected', icon: XCircle },
];

function getRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60_000);
    const diffHours = Math.floor(diffMs / 3_600_000);
    const diffDays = Math.floor(diffMs / 86_400_000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getStatusBadge(status: RequestStatus) {
    switch (status) {
        case 'pending':
            return (
                <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/15 border-amber-500/20 gap-1">
                    <Clock className="h-3 w-3" />
                    Pending
                </Badge>
            );
        case 'approved':
            return (
                <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/15 border-emerald-500/20 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Approved
                </Badge>
            );
        case 'rejected':
            return (
                <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/15 border-red-500/20 gap-1">
                    <XCircle className="h-3 w-3" />
                    Rejected
                </Badge>
            );
    }
}


// ============= Main Component =============

export default function PlatformRequestsPage() {
    const queryClient = useQueryClient();
    const [activeFilter, setActiveFilter] = useState<FilterTab>('all');

    // Dialogs
    const [approveTarget, setApproveTarget] = useState<OrgRequest | null>(null);
    const [rejectTarget, setRejectTarget] = useState<OrgRequest | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // ============= Data Fetching =============

    const { data: requests, isLoading, error } = useQuery<OrgRequest[]>({
        queryKey: ['platform-requests'],
        queryFn: () => api.platform.listRequests(),
    });

    const safeRequests = useMemo(() => {
        const list = Array.isArray(requests) ? requests : [];
        if (activeFilter === 'all') return list;
        return list.filter((r) => r.status === activeFilter);
    }, [requests, activeFilter]);

    // Counts for tabs
    const counts = useMemo(() => {
        const list = Array.isArray(requests) ? requests : [];
        return {
            all: list.length,
            pending: list.filter((r) => r.status === 'pending').length,
            approved: list.filter((r) => r.status === 'approved').length,
            rejected: list.filter((r) => r.status === 'rejected').length,
        };
    }, [requests]);

    // ============= Mutations =============

    const approveMutation = useMutation({
        mutationFn: api.platform.approveRequest,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: ['platform-requests'] });
            const previous = queryClient.getQueryData<OrgRequest[]>(['platform-requests']);
            queryClient.setQueryData<OrgRequest[]>(['platform-requests'], (old) =>
                old?.map((r) => (r.id === id ? { ...r, status: 'approved' as const } : r)) ?? []
            );
            return { previous };
        },
        onSuccess: (data: any) => {
            toast.success('Request approved!', {
                description: `Tenant created with TRIAL status. Welcome email sent to ${data.user_email}.`,
            });
        },
        onError: (err: any, _id, context) => {
            queryClient.setQueryData(['platform-requests'], context?.previous);
            toast.error(err?.response?.data?.detail || err.message || 'Approval failed');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-requests'] });
            setApproveTarget(null);
        },
    });

    const rejectMutation = useMutation({
        mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
            api.platform.rejectRequest(id, reason),
        onMutate: async ({ id }) => {
            await queryClient.cancelQueries({ queryKey: ['platform-requests'] });
            const previous = queryClient.getQueryData<OrgRequest[]>(['platform-requests']);
            queryClient.setQueryData<OrgRequest[]>(['platform-requests'], (old) =>
                old?.map((r) => (r.id === id ? { ...r, status: 'rejected' as const } : r)) ?? []
            );
            return { previous };
        },
        onSuccess: () => {
            toast.success('Request rejected.');
        },
        onError: (err: any, _vars, context) => {
            queryClient.setQueryData(['platform-requests'], context?.previous);
            toast.error(err?.response?.data?.detail || err.message || 'Rejection failed');
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['platform-requests'] });
            setRejectTarget(null);
            setRejectReason('');
        },
    });

    // ============= Handlers =============

    const handleApprove = () => {
        if (approveTarget) {
            approveMutation.mutate(approveTarget.id);
        }
    };

    const handleReject = () => {
        if (rejectTarget) {
            rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason || undefined });
        }
    };

    // ============= Render =============

    if (error) {
        return (
            <div className="p-6 md:p-8">
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 shrink-0" />
                    <p className="font-medium">Failed to load requests. Please try again later.</p>
                </div>
            </div>
        );
    }

    const isActioning = approveMutation.isPending || rejectMutation.isPending;

    return (
        <div className="flex flex-col gap-6 p-6 md:p-8 animate-fade-in w-full max-w-[1600px] mx-auto">
            <PageHeader
                title="Access Requests"
                description="Review and manage incoming organization sign-up requests."
            />

            {/* ========== Filter Tabs ========== */}
            <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1 w-fit border border-border/50">
                {filterTabs.map(({ value, label, icon: Icon }) => {
                    const isActive = activeFilter === value;
                    return (
                        <button
                            key={value}
                            onClick={() => setActiveFilter(value)}
                            className={`
                                relative flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200
                                ${isActive
                                    ? 'bg-background text-foreground shadow-sm border border-border/60'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                                }
                            `}
                        >
                            <Icon className="h-3.5 w-3.5" />
                            {label}
                            {counts[value] > 0 && (
                                <span
                                    className={`
                                        text-[10px] min-w-[18px] text-center px-1 py-0.5 rounded-full font-semibold
                                        ${value === 'pending' && counts.pending > 0
                                            ? 'bg-amber-500/15 text-amber-600'
                                            : isActive
                                                ? 'bg-muted text-muted-foreground'
                                                : 'bg-muted/60 text-muted-foreground'
                                        }
                                    `}
                                >
                                    {counts[value]}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ========== Table Card ========== */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm rounded-xl">
                <CardContent className="p-0">
                    {isLoading ? (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="pl-6">Organization</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableSkeleton
                                    rows={5}
                                    columns={5}
                                    columnWidths={['w-32', 'w-40', 'w-20', 'w-24', 'w-24']}
                                />
                            </TableBody>
                        </Table>
                    ) : !safeRequests.length ? (
                        <div className="py-16">
                            <EmptyState
                                icon={activeFilter === 'all' ? Shield : filterTabs.find((t) => t.value === activeFilter)!.icon}
                                title={
                                    activeFilter === 'all'
                                        ? 'No Requests Yet'
                                        : activeFilter === 'pending'
                                            ? 'No Pending Requests'
                                            : activeFilter === 'approved'
                                                ? 'No Approved Requests'
                                                : 'No Rejected Requests'
                                }
                                description={
                                    activeFilter === 'pending'
                                        ? 'All requests have been processed. New requests will appear here.'
                                        : `No ${activeFilter} requests found.`
                                }
                            />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="pl-6">Organization</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Submitted</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                <AnimatePresence>
                                    {safeRequests.map((req) => (
                                        <React.Fragment key={req.id}>
                                            <TableRow
                                                className="hover:bg-muted/40 border-border/40 transition-colors cursor-pointer group"
                                                onClick={() => setExpandedRow(expandedRow === req.id ? null : req.id)}
                                            >
                                                {/* Organization */}
                                                <TableCell className="pl-6">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/5 border border-border/50 shrink-0">
                                                            <Building2 className="h-4 w-4 text-primary/70" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium text-sm">{req.name}</div>
                                                            <div className="text-xs text-muted-foreground font-mono">{req.slug}.scire.app</div>
                                                        </div>
                                                    </div>
                                                </TableCell>

                                                {/* Contact */}
                                                <TableCell>
                                                    <div className="text-sm">{req.full_name}</div>
                                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                                        <Mail className="h-3 w-3" />
                                                        {req.email}
                                                    </div>
                                                </TableCell>

                                                {/* Status */}
                                                <TableCell>{getStatusBadge(req.status)}</TableCell>

                                                {/* Submitted */}
                                                <TableCell>
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                                    <Calendar className="h-3.5 w-3.5" />
                                                                    {getRelativeTime(req.created_at)}
                                                                </div>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                {new Date(req.created_at).toLocaleString()}
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </TableCell>

                                                {/* Actions */}
                                                <TableCell className="text-right pr-6">
                                                    {req.status === 'pending' && (
                                                        <div
                                                            className="flex justify-end gap-2"
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                                                                onClick={() => setRejectTarget(req)}
                                                                disabled={isActioning}
                                                            >
                                                                <XCircle className="h-3.5 w-3.5" />
                                                                Reject
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                                                                onClick={() => setApproveTarget(req)}
                                                                disabled={isActioning}
                                                            >
                                                                <CheckCircle className="h-3.5 w-3.5" />
                                                                Approve
                                                            </Button>
                                                        </div>
                                                    )}
                                                    {req.status !== 'pending' && (
                                                        <span className="text-xs text-muted-foreground">
                                                            Processed
                                                        </span>
                                                    )}
                                                </TableCell>
                                            </TableRow>

                                            {/* Expanded Details Row */}
                                            {expandedRow === req.id && (
                                                <TableRow className="bg-muted/20 hover:bg-muted/20 border-border/30">
                                                    <TableCell colSpan={5} className="px-6 py-4">
                                                        <motion.div
                                                            initial={{ opacity: 0, height: 0 }}
                                                            animate={{ opacity: 1, height: 'auto' }}
                                                            exit={{ opacity: 0, height: 0 }}
                                                            className="grid grid-cols-3 gap-6 text-sm"
                                                        >
                                                            {req.phone && (
                                                                <div>
                                                                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                                        <Phone className="h-3 w-3" /> Phone
                                                                    </p>
                                                                    <p>{req.phone}</p>
                                                                </div>
                                                            )}
                                                            {req.use_case && (
                                                                <div className="col-span-2">
                                                                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                                        <FileText className="h-3 w-3" /> Use Case
                                                                    </p>
                                                                    <p className="text-muted-foreground leading-relaxed">
                                                                        {req.use_case}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {req.admin_notes && (
                                                                <div className="col-span-3">
                                                                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                                                                        <AlertTriangle className="h-3 w-3 text-amber-500" /> Admin Notes
                                                                    </p>
                                                                    <p className="text-muted-foreground italic">
                                                                        {req.admin_notes}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {!req.phone && !req.use_case && !req.admin_notes && (
                                                                <div className="col-span-3 text-center text-muted-foreground text-xs py-2">
                                                                    No additional details provided.
                                                                </div>
                                                            )}
                                                        </motion.div>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </React.Fragment>
                                    ))}
                                </AnimatePresence>
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ========== Approve Confirmation Dialog ========== */}
            <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-emerald-500" />
                            Approve Request
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    This will create a new tenant and admin user. The following will happen:
                                </p>
                                {approveTarget && (
                                    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Tenant</span>
                                            <span className="font-medium">{approveTarget.name}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Subdomain</span>
                                            <span className="font-mono text-xs">{approveTarget.slug}.scire.app</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Admin Email</span>
                                            <span>{approveTarget.email}</span>
                                        </div>
                                        <div className="border-t border-border/50 pt-2 flex justify-between">
                                            <span className="text-muted-foreground">Plan</span>
                                            <Badge variant="secondary" className="gap-1">
                                                <Inbox className="h-3 w-3" />
                                                Starter (14-day Trial)
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    A welcome email with login credentials will be sent to the admin.
                                </p>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={approveMutation.isPending}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleApprove}
                            disabled={approveMutation.isPending}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                            {approveMutation.isPending ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                                    Approving...
                                </>
                            ) : (
                                'Approve & Create Tenant'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ========== Reject Dialog with Reason ========== */}
            <Dialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectReason(''); } }}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <XCircle className="h-5 w-5 text-destructive" />
                            Reject Request
                        </DialogTitle>
                        <DialogDescription>
                            {rejectTarget && (
                                <>
                                    Reject the request from <strong>{rejectTarget.full_name}</strong> ({rejectTarget.name}).
                                </>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">
                            Rejection Reason <span className="text-muted-foreground/60">(optional)</span>
                        </label>
                        <Textarea
                            placeholder="e.g., Duplicate request, incomplete information, not an institution..."
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => { setRejectTarget(null); setRejectReason(''); }}
                            disabled={rejectMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleReject}
                            disabled={rejectMutation.isPending}
                        >
                            {rejectMutation.isPending ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                                    Rejecting...
                                </>
                            ) : (
                                'Reject Request'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
