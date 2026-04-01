'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import {
    Users,
    Building2,
    AlertTriangle,
    TrendingUp,
    Activity,
    DollarSign,
    Server,
    Globe,
    Shield,
    Zap,
    CheckCircle2,
    XCircle,
    Clock,
    BookOpen,
    BarChart3,
    Bug,
    ArrowRight,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
import { PageHeader } from '@/components/dashboard/page-header';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
} from '@/components/ui/chart';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    Pie,
    PieChart,
    XAxis,
    YAxis,
} from 'recharts';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

const STATUS_COLORS: Record<string, string> = {
    DRAFT: 'hsl(220, 14%, 60%)',
    PUBLISHED: 'hsl(210, 100%, 56%)',
    ACTIVE: 'hsl(142, 71%, 45%)',
    COMPLETED: 'hsl(262, 83%, 58%)',
    ARCHIVED: 'hsl(30, 80%, 55%)',
};

const SCORE_COLORS = [
    'hsl(0, 72%, 51%)',
    'hsl(25, 95%, 53%)',
    'hsl(45, 93%, 47%)',
    'hsl(142, 71%, 45%)',
    'hsl(160, 84%, 39%)',
];

export default function PlatformPage() {
    const queryClient = useQueryClient();
    const [deleteUserId, setDeleteUserId] = useState('');
    const [deleteExamId, setDeleteExamId] = useState('');
    const [showUserDialog, setShowUserDialog] = useState(false);
    const [showExamDialog, setShowExamDialog] = useState(false);
    const [confirmText, setConfirmText] = useState('');

    const deleteUserMutation = useMutation({
        mutationFn: (id: string) => api.admin.forceDeleteUser(id),
        onSuccess: () => {
            toast.success('User permanently deleted (bypassing safeguards)');
            setDeleteUserId('');
            setShowUserDialog(false);
            setConfirmText('');
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete user');
        }
    });

    const deleteExamMutation = useMutation({
        mutationFn: (id: string) => api.admin.forceDeleteExam(id),
        onSuccess: () => {
            toast.success('Exam permanently deleted (bypassing safeguards)');
            setDeleteExamId('');
            setShowExamDialog(false);
            setConfirmText('');
            queryClient.invalidateQueries({ queryKey: ['platform-stats'] });
            queryClient.invalidateQueries({ queryKey: ['platform-analytics'] });
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete exam');
        }
    });

    const { data: stats, isLoading: statsLoading } = useQuery({
        queryKey: ['platform-stats'],
        queryFn: () => api.platform.getStats(),
    });

    const { data: analytics, isLoading: analyticsLoading } = useQuery({
        queryKey: ['platform-analytics'],
        queryFn: () => api.platform.getAnalytics(),
    });

    const { data: tenants } = useQuery({
        queryKey: ['platform-tenants'],
        queryFn: () => api.platform.listTenants(),
    });

    const safeTenants = Array.isArray(tenants) ? tenants : [];
    const isLoading = statsLoading || analyticsLoading;

    // Chart configs
    const sessionsChartConfig = {
        count: { label: 'Sessions', color: 'hsl(210, 100%, 56%)' },
    };

    const examStatusChartConfig = (analytics?.exams_by_status || []).reduce(
        (acc: Record<string, { label: string; color: string }>, item: { status: string }, i: number) => {
            acc[item.status] = {
                label: item.status,
                color: STATUS_COLORS[item.status] || `hsl(${i * 72}, 70%, 50%)`,
            };
            return acc;
        },
        {}
    );

    const scoreChartConfig = {
        count: { label: 'Students', color: 'hsl(262, 83%, 58%)' },
    };



    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in w-full max-w-[1600px] mx-auto">
            <PageHeader
                title="Platform Overview"
                description="Monitor your SaaS platform health and manage operations."
                badge={{
                    label: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                    icon: Clock,
                    variant: "date"
                }}
            />

            {/* KPI Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <KPICard
                    title="Total Users"
                    value={isLoading ? '—' : (stats?.total_users ?? 0)}
                    icon={Users}
                    description={stats?.users_by_role
                        ? `${stats.users_by_role.INSTRUCTOR || 0} instructors, ${stats.users_by_role.STUDENT || 0} students`
                        : undefined
                    }
                />
                <KPICard
                    title="Active Sessions"
                    value={isLoading ? '—' : (stats?.active_sessions ?? 0)}
                    icon={Activity}
                    description="Live right now"
                />
                <KPICard
                    title="Total Exams"
                    value={isLoading ? '—' : (stats?.total_exams ?? 0)}
                    icon={BookOpen}
                    description={stats ? `${stats.active_exams ?? 0} active` : undefined}
                />
                <KPICard
                    title="Avg Score"
                    value={isLoading ? '—' : `${stats?.avg_score ?? 0}%`}
                    icon={TrendingUp}
                    description={stats ? `${stats.completed_sessions ?? 0} completed` : undefined}
                />
                <KPICard
                    title="Flagged"
                    value={isLoading ? '—' : (stats?.flagged_sessions ?? 0)}
                    icon={AlertTriangle}
                    description="Integrity issues"
                />
            </div>



            {/* Charts 2x2 Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sessions Trend */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-primary" />
                            Sessions (Last 30 Days)
                        </CardTitle>
                        <CardDescription>Daily exam session activity</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <ChartContainer config={sessionsChartConfig} className="h-[250px] w-full">
                                <AreaChart data={analytics?.sessions_by_day || []} accessibilityLayer>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(v) => new Date(v).toLocaleDateString('en', { month: 'short', day: 'numeric' })}
                                        tick={{ fontSize: 11 }}
                                    />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <defs>
                                        <linearGradient id="sessionsFill" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="hsl(210, 100%, 56%)" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="hsl(210, 100%, 56%)"
                                        strokeWidth={2}
                                        fill="url(#sessionsFill)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Exam Status Breakdown */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-primary" />
                            Exam Status Breakdown
                        </CardTitle>
                        <CardDescription>Distribution by lifecycle stage</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <ChartContainer config={examStatusChartConfig} className="h-[250px] w-full">
                                <PieChart accessibilityLayer>
                                    <ChartTooltip content={<ChartTooltipContent nameKey="status" />} />
                                    <Pie
                                        data={(analytics?.exams_by_status || []).map((item: { status: string; count: number }) => ({
                                            ...item,
                                            fill: STATUS_COLORS[item.status] || 'hsl(220, 14%, 60%)',
                                        }))}
                                        dataKey="count"
                                        nameKey="status"
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={55}
                                        outerRadius={90}
                                        paddingAngle={3}
                                        strokeWidth={2}
                                    >
                                        {(analytics?.exams_by_status || []).map((item: { status: string }, i: number) => (
                                            <Cell key={item.status} fill={STATUS_COLORS[item.status] || `hsl(${i * 72}, 70%, 50%)`} />
                                        ))}
                                    </Pie>
                                    <ChartLegend content={<ChartLegendContent nameKey="status" />} />
                                </PieChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Score Distribution */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            Score Distribution
                        </CardTitle>
                        <CardDescription>How students are performing across all exams</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <ChartContainer config={scoreChartConfig} className="h-[250px] w-full">
                                <BarChart data={analytics?.score_distribution || []} accessibilityLayer>
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" />
                                    <XAxis dataKey="range" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                                        {(analytics?.score_distribution || []).map((_: unknown, i: number) => (
                                            <Cell key={i} fill={SCORE_COLORS[i] || 'hsl(262, 83%, 58%)'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ChartContainer>
                        )}
                    </CardContent>
                </Card>

                {/* Error Reports Summary */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Bug className="h-4 w-4 text-primary" />
                            Error Reports
                        </CardTitle>
                        <CardDescription>Current bug report status</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {analyticsLoading ? (
                            <div className="h-[250px] flex items-center justify-center">
                                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 pt-2">
                                {[
                                    { label: 'New', key: 'new', color: 'bg-blue-500' },
                                    { label: 'Investigating', key: 'investigating', color: 'bg-amber-500' },
                                    { label: 'Resolved', key: 'resolved', color: 'bg-emerald-500' },
                                    { label: 'Ignored', key: 'ignored', color: 'bg-zinc-400' },
                                ].map((item) => {
                                    const count = analytics?.error_reports?.[item.key] ?? 0;
                                    const total = analytics?.error_reports?.total || 1;
                                    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                                    return (
                                        <div key={item.key} className="flex items-center gap-3">
                                            <div className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                                            <span className="text-sm font-medium w-28">{item.label}</span>
                                            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${item.color} transition-all`}
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-mono text-muted-foreground w-8 text-right">{count}</span>
                                        </div>
                                    );
                                })}
                                <div className="flex items-center justify-between pt-3 border-t mt-2">
                                    <span className="text-sm text-muted-foreground">Total Reports</span>
                                    <span className="text-lg font-bold">{analytics?.error_reports?.total ?? 0}</span>
                                </div>
                                <Link
                                    href="/platform/reported-errors"
                                    className="text-sm text-primary hover:underline flex items-center gap-1 mt-1"
                                >
                                    View all reports <ArrowRight className="h-3 w-3" />
                                </Link>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Tenants Table */}
            {/* Tenants Table */}
            <Card className="border-border/50 shadow-sm overflow-hidden bg-card/40 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Organizations
                    </CardTitle>
                    <CardDescription>Active tenants on the platform</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {!safeTenants.length ? (
                        <p className="text-sm text-muted-foreground text-center py-10">No tenants found.</p>
                    ) : (
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[200px] pl-6">Organization</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Limits</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {safeTenants.slice(0, 10).map((t: any) => (
                                    <TableRow key={t.id} className="hover:bg-muted/40 border-border/40 transition-colors">
                                        <TableCell className="pl-6 font-medium">{t.name}</TableCell>
                                        <TableCell className="font-mono text-xs text-muted-foreground">{t.slug}</TableCell>
                                        <TableCell>
                                            <Badge
                                                variant={t.status === 'ACTIVE' ? 'default' : t.status === 'TRIAL' ? 'outline' : 'secondary'}
                                                className="capitalize text-xs"
                                            >
                                                {t.status?.toLowerCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="capitalize text-xs">{t.subscription_tier}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {t.max_students ? `${t.max_students} students` : '—'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* ── Danger Zone ── */}
            <div className="relative mt-4 space-y-6">
                <Card className="border border-destructive/20 shadow-xl rounded-2xl overflow-hidden">

                    {/* Header */}
                    <CardHeader className="pb-6 border-b border-destructive/20">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
                                <Shield className="h-5 w-5 text-destructive" />
                            </div>
                            <div>
                                <CardTitle className="text-lg font-semibold text-foreground">
                                    Danger Zone
                                </CardTitle>
                                <CardDescription className="text-muted-foreground text-sm mt-1">
                                    Irreversible actions — proceed with extreme caution
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    {/* Content */}
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                            {/* Force Delete User */}
                            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-5 hover:shadow-md transition">
                                <div className="flex items-center gap-2.5">
                                    <Users className="h-4 w-4 text-destructive/70" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Force Delete User
                                    </h4>
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Permanently removes a user and all associated data including exams,
                                    sessions, transcripts, grading, and audit logs.
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="dangerUserId" className="text-xs text-muted-foreground">
                                        User UUID
                                    </Label>
                                    <Input
                                        id="dangerUserId"
                                        placeholder="e.g. 288107a5-e440-46a3-97ea-2a05dcbcfe4e"
                                        value={deleteUserId}
                                        onChange={(e) => setDeleteUserId(e.target.value)}
                                        className="font-mono text-sm h-10 border border-border focus-visible:ring-2 focus-visible:ring-destructive/50 rounded-lg"
                                    />
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full gap-2 font-medium tracking-wide shadow-sm hover:shadow-md transition active:scale-[0.98]"
                                    disabled={!deleteUserId.trim() || deleteUserMutation.isPending}
                                    onClick={() => {
                                        setConfirmText('');
                                        setShowUserDialog(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deleteUserMutation.isPending ? 'Deleting…' : 'Force Delete User'}
                                </Button>
                            </div>

                            {/* Force Delete Exam */}
                            <div className="rounded-xl border border-border bg-muted/40 p-5 space-y-5 hover:shadow-md transition">
                                <div className="flex items-center gap-2.5">
                                    <BookOpen className="h-4 w-4 text-destructive/70" />
                                    <h4 className="text-sm font-semibold text-foreground">
                                        Force Delete Exam
                                    </h4>
                                </div>

                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Permanently removes an exam and all associated sessions, rubrics,
                                    knowledge base entries, grading data, and audit logs.
                                </p>

                                <div className="space-y-2">
                                    <Label htmlFor="dangerExamId" className="text-xs text-muted-foreground">
                                        Exam UUID
                                    </Label>
                                    <Input
                                        id="dangerExamId"
                                        placeholder="e.g. 13abb558-3edf-437c-a343-07c8bc83df3a"
                                        value={deleteExamId}
                                        onChange={(e) => setDeleteExamId(e.target.value)}
                                        className="font-mono text-sm h-10 border border-border focus-visible:ring-2 focus-visible:ring-destructive/50 rounded-lg"
                                    />
                                </div>

                                <Button
                                    variant="destructive"
                                    size="sm"
                                    className="w-full gap-2 font-medium tracking-wide shadow-sm hover:shadow-md transition active:scale-[0.98]"
                                    disabled={!deleteExamId.trim() || deleteExamMutation.isPending}
                                    onClick={() => {
                                        setConfirmText('');
                                        setShowExamDialog(true);
                                    }}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    {deleteExamMutation.isPending ? 'Deleting…' : 'Force Delete Exam'}
                                </Button>
                            </div>

                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* ── Confirmation Dialog: Delete User ── */}
            <AlertDialog open={showUserDialog} onOpenChange={(open) => { setShowUserDialog(open); if (!open) setConfirmText(''); }}>
                <AlertDialogContent className="border-destructive/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Permanently Delete User
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You are about to <strong className="text-destructive">permanently delete</strong> a user and all associated data. This operation:
                                </p>
                                <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                                    <li>Deletes all exams created by this user</li>
                                    <li>Removes all exam sessions and transcripts</li>
                                    <li>Erases grading data and integrity snapshots</li>
                                    <li>Bypasses audit log immutability and purges audit trails</li>
                                </ul>
                                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 mt-2">
                                    <p className="text-xs font-medium text-destructive mb-1.5">Target User ID</p>
                                    <code className="text-xs font-mono bg-background/80 px-2 py-1 rounded border">{deleteUserId}</code>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                                    </Label>
                                    <Input
                                        placeholder="Type DELETE"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="h-9 font-mono text-sm border-destructive/20 focus-visible:ring-destructive/40"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteUserMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            disabled={confirmText !== 'DELETE' || deleteUserMutation.isPending}
                            onClick={(e) => {
                                e.preventDefault();
                                deleteUserMutation.mutate(deleteUserId);
                            }}
                        >
                            {deleteUserMutation.isPending ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                                    Deleting…
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Force Delete User
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* ── Confirmation Dialog: Delete Exam ── */}
            <AlertDialog open={showExamDialog} onOpenChange={(open) => { setShowExamDialog(open); if (!open) setConfirmText(''); }}>
                <AlertDialogContent className="border-destructive/30">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Permanently Delete Exam
                        </AlertDialogTitle>
                        <AlertDialogDescription asChild>
                            <div className="space-y-3">
                                <p>
                                    You are about to <strong className="text-destructive">permanently delete</strong> an exam and all associated data. This operation:
                                </p>
                                <ul className="list-disc list-inside text-xs space-y-1 text-muted-foreground">
                                    <li>Deletes all sessions (active, completed, pending)</li>
                                    <li>Removes all rubrics and knowledge base entries</li>
                                    <li>Erases transcripts, grading data, and integrity snapshots</li>
                                    <li>Bypasses audit log immutability and purges audit trails</li>
                                </ul>
                                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 mt-2">
                                    <p className="text-xs font-medium text-destructive mb-1.5">Target Exam ID</p>
                                    <code className="text-xs font-mono bg-background/80 px-2 py-1 rounded border">{deleteExamId}</code>
                                </div>
                                <div className="space-y-1.5 pt-1">
                                    <Label className="text-xs text-muted-foreground">
                                        Type <span className="font-mono font-bold text-destructive">DELETE</span> to confirm
                                    </Label>
                                    <Input
                                        placeholder="Type DELETE"
                                        value={confirmText}
                                        onChange={(e) => setConfirmText(e.target.value)}
                                        className="h-9 font-mono text-sm border-destructive/20 focus-visible:ring-destructive/40"
                                        autoFocus
                                    />
                                </div>
                            </div>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleteExamMutation.isPending}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            className={buttonVariants({ variant: 'destructive' })}
                            disabled={confirmText !== 'DELETE' || deleteExamMutation.isPending}
                            onClick={(e) => {
                                e.preventDefault();
                                deleteExamMutation.mutate(deleteExamId);
                            }}
                        >
                            {deleteExamMutation.isPending ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white mr-2" />
                                    Deleting…
                                </>
                            ) : (
                                <>
                                    <Trash2 className="h-3.5 w-3.5 mr-2" />
                                    Force Delete Exam
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
