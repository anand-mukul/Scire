'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import {
    Bug,
    Search,
    RefreshCw,
    MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { ErrorReport } from './types';
import { STATUS_CONFIG, URGENCY_STYLES } from './constants';
import { ErrorDetailsSheet } from './error-details-sheet';

function timeAgo(dateStr: string) {
    const now = new Date();
    const date = new Date(dateStr);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
}

export default function ReportedErrorsPage() {
    const queryClient = useQueryClient();
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [urgencyFilter, setUrgencyFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedReport, setSelectedReport] = useState<ErrorReport | null>(null);

    const params: Record<string, string> = {};
    if (statusFilter !== 'all') params.status = statusFilter;
    if (urgencyFilter !== 'all') params.urgency = urgencyFilter;

    const { data, isLoading, refetch } = useQuery({
        queryKey: ['error-reports', statusFilter, urgencyFilter],
        queryFn: () => api.errorReports.list(params),
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: string }) =>
            api.errorReports.updateStatus(id, status),
        onSuccess: () => {
            toast.success('Status updated');
            queryClient.invalidateQueries({ queryKey: ['error-reports'] });
        },
        onError: (err: Error) => {
            toast.error(err.message || 'Failed to update status');
        },
    });

    const reports = (data?.items || []).filter((r: ErrorReport) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            r.error_message?.toLowerCase().includes(q) ||
            r.reporter_name?.toLowerCase().includes(q) ||
            r.reporter_email?.toLowerCase().includes(q) ||
            r.tenant_name?.toLowerCase().includes(q) ||
            r.id.toLowerCase().includes(q)
        );
    });

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
    };

    const handleStatusUpdate = (id: string, status: string) => {
        updateStatusMutation.mutate({ id, status });
        if (selectedReport && selectedReport.id === id) {
            setSelectedReport(prev => prev ? ({ ...prev, status }) : null);
        }
    };

    return (
        <div className="flex flex-col gap-6 p-6 animate-fade-in pb-20">
            <PageHeader
                title="Error Reports"
                description="Monitor and manage platform application errors."
                actions={
                    <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-2">
                        <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                        Sync
                    </Button>
                }
            />
            <Separator />

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="new">New</TabsTrigger>
                        <TabsTrigger value="investigating">Active</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved</TabsTrigger>
                        <TabsTrigger value="ignored">Ignored</TabsTrigger>
                    </TabsList>
                </Tabs>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search errors..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-[100px]">ID</TableHead>
                            <TableHead>Error Message</TableHead>
                            <TableHead>Reporter</TableHead>
                            <TableHead>Environment</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Time</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    Loading error reports...
                                </TableCell>
                            </TableRow>
                        ) : reports.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                                        <Bug className="h-8 w-8 opacity-20" />
                                        <p>No error reports found.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            reports.map((report: ErrorReport) => {
                                const statusConfig = STATUS_CONFIG[report.status] || STATUS_CONFIG.new;
                                const urgencyStyle = URGENCY_STYLES[report.urgency] || URGENCY_STYLES.low;
                                return (
                                    <TableRow key={report.id} className="cursor-pointer hover:bg-muted/40 border-border/40" onClick={() => setSelectedReport(report)}>
                                        <TableCell className="font-mono text-xs text-muted-foreground">
                                            {report.id.slice(0, 8)}
                                        </TableCell>
                                        <TableCell className="max-w-[300px]">
                                            <div className="truncate font-medium cursor-help" title={report.error_message}>
                                                {report.error_message}
                                            </div>
                                            {report.url && (
                                                <div className="truncate text-xs text-muted-foreground mt-0.5">
                                                    {new URL(report.url).pathname}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{report.reporter_name}</span>
                                                <span className="text-xs text-muted-foreground">{report.reporter_email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {report.tenant_name || 'Global'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={cn("capitalize font-normal", urgencyStyle.color, urgencyStyle.bg)}>
                                                {report.urgency}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={cn("gap-1 font-normal", statusConfig.color, statusConfig.bg)}>
                                                {statusConfig.icon && <statusConfig.icon className="h-3 w-3" />}
                                                {statusConfig.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                                            {timeAgo(report.created_at)}
                                        </TableCell>
                                        <TableCell onClick={(e) => e.stopPropagation()}>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'resolved' })}>
                                                        Mark Resolved
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => updateStatusMutation.mutate({ id: report.id, status: 'investigating' })}>
                                                        Mark Investigating
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem onClick={() => copyToClipboard(report.id, 'ID')}>
                                                        Copy ID
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <ErrorDetailsSheet
                open={!!selectedReport}
                onOpenChange={(open) => !open && setSelectedReport(null)}
                report={selectedReport}
                onStatusUpdate={handleStatusUpdate}
            />
        </div>
    );
}



