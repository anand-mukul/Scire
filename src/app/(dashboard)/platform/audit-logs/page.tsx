'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import {
    ScrollText,
    Filter,
    User,
    Clock,
    ChevronDown,
    ChevronUp,
    ShieldAlert,
    RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { PageHeader } from '@/components/dashboard/page-header';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';

const ACTION_COLORS: Record<string, string> = {
    'user.login': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    'user.logout': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
    'user.create': 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    'exam.create': 'bg-violet-500/10 text-violet-600 border-violet-500/20',
    'exam.publish': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
    'session.start': 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
    'session.end': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    'admin.action': 'bg-rose-500/10 text-rose-600 border-rose-500/20',
    'integrity.flag': 'bg-red-500/10 text-red-600 border-red-500/20',
    'grading.submit': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const ACTION_OPTIONS = [
    { value: 'all', label: 'All Actions' },
    { value: 'user.login', label: 'User Login' },
    { value: 'user.create', label: 'User Create' },
    { value: 'exam.create', label: 'Exam Create' },
    { value: 'exam.publish', label: 'Exam Publish' },
    { value: 'session.start', label: 'Session Start' },
    { value: 'session.end', label: 'Session End' },
    { value: 'integrity.flag', label: 'Integrity Flag' },
    { value: 'grading.submit', label: 'Grading Submit' },
    { value: 'admin.action', label: 'Admin Action' },
];

function formatDate(dateStr: string) {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export default function AuditLogsPage() {
    const [actionFilter, setActionFilter] = useState<string>('all');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    const params: Record<string, string | number> = { limit: 100 };
    if (actionFilter !== 'all') params.action = actionFilter;

    const { data: logs, isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['audit-logs', actionFilter],
        queryFn: () => api.platform.getAuditLogs(params as any),
    });

    const safeLogs = Array.isArray(logs) ? logs : [];

    const handleRowClick = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="flex flex-col gap-6 p-6 animate-fade-in w-full">
            <PageHeader
                title="Audit Logs"
                description="Track and monitor significant actions across the platform."
                actions={
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 gap-2"
                        onClick={() => refetch()}
                        disabled={isLoading || isRefetching}
                    >
                        <RefreshCw className={cn("h-3.5 w-3.5", isRefetching && "animate-spin")} />
                        <span className="hidden sm:inline">Refresh</span>
                    </Button>
                }
            />

            {/* Filters */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card/30 p-1 rounded-xl">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-md border border-border/50 text-sm text-muted-foreground">
                        <Filter className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium uppercase tracking-wide">Filter</span>
                    </div>
                    <Select value={actionFilter} onValueChange={setActionFilter}>
                        <SelectTrigger className="w-[200px] h-9 text-sm bg-background/50">
                            <SelectValue placeholder="Select Action" />
                        </SelectTrigger>
                        <SelectContent>
                            {ACTION_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="text-xs text-muted-foreground px-2">
                    Showing recent 100 logs
                </div>
            </div>

            {/* Table */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm rounded-xl">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-b border-border/50">
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead className="w-[180px]">Timestamp</TableHead>
                                <TableHead className="w-[160px]">Action</TableHead>
                                <TableHead className="w-[200px]">User</TableHead>
                                <TableHead className="w-[150px]">Entity</TableHead>
                                <TableHead className="text-right">IP Address</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableSkeleton rows={8} columns={6} />
                            ) : !safeLogs.length ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-[400px]">
                                        <EmptyState
                                            icon={ShieldAlert}
                                            title="No Audit Logs Found"
                                            description={actionFilter !== 'all'
                                                ? "No logs match the selected filter."
                                                : "No audit trails have been recorded yet."}
                                            action={actionFilter !== 'all' ? {
                                                label: "Clear Filter",
                                                onClick: () => setActionFilter('all')
                                            } : undefined}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                safeLogs.map((log: any) => {
                                    const isExpanded = expandedId === log.id;
                                    const actionColor = ACTION_COLORS[log.action] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';

                                    return (
                                        <React.Fragment key={log.id}>
                                            <TableRow
                                                className={cn(
                                                    "cursor-pointer transition-colors border-b border-border/40",
                                                    isExpanded ? "bg-muted/30" : "hover:bg-muted/40"
                                                )}
                                                onClick={() => handleRowClick(log.id)}
                                            >
                                                <TableCell className="px-4">
                                                    <div className={cn("transition-transform duration-200", isExpanded && "rotate-180")}>
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                                                        <Clock className="h-3.5 w-3.5 opacity-70" />
                                                        {log.created_at ? formatDate(log.created_at) : '—'}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className={cn("text-[10px] font-mono border", actionColor)}>
                                                        {log.action}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {log.user_id ? (
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                                <User className="h-3.5 w-3.5" />
                                                            </div>
                                                            <span className="text-xs font-medium font-mono text-foreground/80 truncate max-w-[140px]" title={log.user_id}>
                                                                {log.user_id}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {log.entity_type ? (
                                                        <Badge variant="secondary" className="text-[10px] capitalize font-medium text-muted-foreground bg-muted/50">
                                                            {log.entity_type}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">—</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <span className="text-xs font-mono text-muted-foreground/70 bg-muted/30 px-1.5 py-0.5 rounded border border-border/50">
                                                        {log.ip_address || '—'}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                            <AnimatePresence>
                                                {isExpanded && (
                                                    <TableRow key={`${log.id}-detail`} className="hover:bg-transparent bg-muted/10 border-b border-border/40">
                                                        <TableCell colSpan={6} className="p-0 border-0">
                                                            <motion.div
                                                                initial={{ height: 0, opacity: 0 }}
                                                                animate={{ height: "auto", opacity: 1 }}
                                                                exit={{ height: 0, opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                className="overflow-hidden"
                                                            >
                                                                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                    <div className="col-span-1 space-y-4">
                                                                        <div>
                                                                            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Metadata</h4>
                                                                            <div className="space-y-2">
                                                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-border/50">
                                                                                    <span className="text-[10px] text-muted-foreground/70">Session ID</span>
                                                                                    <span className="text-xs font-mono break-all">{log.session_id || '—'}</span>
                                                                                </div>
                                                                                <div className="flex flex-col gap-1 p-3 rounded-lg bg-background border border-border/50">
                                                                                    <span className="text-[10px] text-muted-foreground/70">Exam ID</span>
                                                                                    <span className="text-xs font-mono break-all">{log.exam_id || '—'}</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div>
                                                                            <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">User Agent</h4>
                                                                            <div className="text-xs text-muted-foreground bg-background p-3 rounded-lg border border-border/50 leading-relaxed break-all">
                                                                                {log.user_agent || 'Unknown'}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-span-1 md:col-span-2">
                                                                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Full Payload</h4>
                                                                        <div className="relative rounded-lg border border-border/50 bg-[#0d0d0d] shadow-inner overflow-hidden">
                                                                            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                                {/* Could add copy button here */}
                                                                            </div>
                                                                            <div className="max-h-[250px] overflow-y-auto custom-scrollbar">
                                                                                <pre className="p-4 text-[11px] font-mono leading-relaxed text-slate-300/90 whitespace-pre-wrap selection:bg-white/10">
                                                                                    {log.log_metadata ? JSON.stringify(log.log_metadata, null, 2) : '{}'}
                                                                                </pre>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </motion.div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </AnimatePresence>
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
