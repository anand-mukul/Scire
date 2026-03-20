'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Users, Server, AlertTriangle, Shield, FileText, BarChart3, BookOpen, Clock, CheckCircle2, Zap, ArrowRight, MousePointerClick } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Button } from '@/components/ui/button';
import { AdminStats, AuditLog } from '@/types/admin';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/dashboard/page-header';

export default function AdminDashboard() {

    const { data: stats, isLoading: isLoadingStats, error } = useQuery<AdminStats>({
        queryKey: ['admin', 'stats'],
        queryFn: api.admin.getStats,
    });

    const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
        queryKey: ['admin', 'audit-logs'],
        queryFn: () => api.admin.getAuditLogs({ limit: 5 }),
    });

    if (error) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[50vh] text-muted-foreground">
                <div className="bg-destructive/10 border border-destructive/20 p-6 rounded-xl flex items-center gap-4">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                    <p>Failed to load admin statistics. Please check your permissions.</p>
                </div>
            </div>
        );
    }

    const QuickAction = ({ icon: Icon, title, desc, href, colorClass }: { icon: any, title: string, desc: string, href: string, colorClass: string }) => (
        <Link href={href}>
            <div className="group flex items-center gap-4 p-3.5 rounded-xl hover:bg-muted/50 transition-all duration-300 cursor-pointer border border-transparent hover:border-border/40 hover:shadow-sm">
                <div className={cn("p-2.5 rounded-lg flex-shrink-0 transition-colors duration-300", colorClass, "group-hover:bg-white group-hover:text-foreground dark:group-hover:bg-card/80")}>
                    <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm text-foreground/90 group-hover:text-foreground transition-colors">{title}</h3>
                    <p className="text-xs text-muted-foreground truncate group-hover:text-muted-foreground/80">{desc}</p>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
            </div>
        </Link>
    );

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">

            {/* 1. Header Section: Clean & Minimal with Greetings */}
            <PageHeader
                title="Overview"
                description="Here's what's happening in your academy today."
                badge={{
                    label: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
                    icon: Clock,
                    variant: "date"
                }}
            />

            {/* 2. KPI Section: Clean Row with Better Contrast */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <KPICard
                    title="Total Users"
                    value={stats?.total_users || 0}
                    icon={Users}
                    change={`${stats?.users_by_role?.STUDENT || 0} students enrolled`}
                    trend="neutral"
                    loading={isLoadingStats}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Active Sessions"
                    value={stats?.active_sessions || 0}
                    icon={Activity}
                    change={`${stats?.active_exams || 0} exams in progress`}
                    trend="up"
                    loading={isLoadingStats}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Flagged Sessions"
                    value={stats?.flagged_sessions || 0}
                    icon={AlertTriangle}
                    change={stats?.flagged_sessions === 0 ? "No issues detected" : "Requires attention"}
                    trend={stats?.flagged_sessions === 0 ? "neutral" : "down"}
                    loading={isLoadingStats}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Avg Score"
                    value={stats?.avg_score ? `${stats.avg_score.toFixed(1)}%` : 'N/A'}
                    icon={CheckCircle2}
                    change={`Based on ${stats?.completed_sessions || 0} completions`}
                    trend="up"
                    loading={isLoadingStats}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
            </div>

            {/* 3. Main Content: Asymmetrical Grid (2/3 + 1/3) */}
            <div className="grid gap-10 lg:grid-cols-3">

                {/* Left Column: Activity & Monitoring (Span 2) */}
                <div className="lg:col-span-2 space-y-10">

                    {/* Live Monitoring Section */}
                    <div>
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
                                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                    <Activity className="w-4 h-4" />
                                </div>
                                Live Status
                            </h2>
                            <Link href="/admin/monitor" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors hover:underline">View All</Link>
                        </div>
                        <div className="grid gap-5 sm:grid-cols-2">
                            <div className="group relative overflow-hidden p-6 rounded-2xl border border-border/50 bg-card/40 flex items-center gap-5 hover:bg-card/60 hover:shadow-md transition-all duration-300 cursor-pointer backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform duration-300 relative z-10 border border-emerald-500/10">
                                    <Server className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold text-emerald-600/80 dark:text-emerald-400/80 uppercase tracking-wider mb-1">System Health</p>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-2xl font-bold text-foreground">Operational</h3>
                                        <span className="relative flex h-2.5 w-2.5">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="group relative overflow-hidden p-6 rounded-2xl border border-border/50 bg-card/40 flex items-center gap-5 hover:bg-card/60 hover:shadow-md transition-all duration-300 cursor-pointer backdrop-blur-sm">
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform duration-300 relative z-10 border border-blue-500/10">
                                    <Zap className="w-6 h-6" />
                                </div>
                                <div className="relative z-10">
                                    <p className="text-xs font-semibold text-blue-600/80 dark:text-blue-400/80 uppercase tracking-wider mb-1">Real-time Load</p>
                                    <div className="flex items-center gap-2.5">
                                        <h3 className="text-2xl font-bold text-foreground">Optimal</h3>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* System Activity Feed */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-semibold tracking-tight flex items-center gap-2.5">
                            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                                <FileText className="w-4 h-4" />
                            </div>
                            Recent Activity
                        </h2>
                        <div className="bg-card/30 border border-border/40 rounded-2xl overflow-hidden shadow-sm">
                            <div className="divide-y divide-border/40">
                                {isLoadingLogs ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="p-5 flex gap-4">
                                            <Skeleton className="w-9 h-9 rounded-full" />
                                            <div className="space-y-2.5 flex-1">
                                                <Skeleton className="h-3.5 w-3/4" />
                                                <Skeleton className="h-3 w-1/2" />
                                            </div>
                                        </div>
                                    ))
                                ) : auditLogs && auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="p-5 flex items-center gap-4 hover:bg-muted/30 transition-colors group relative">
                                            <div className="absolute inset-y-0 left-0 w-1 bg-primary/0 group-hover:bg-primary/40 transition-colors" />
                                            <div className={`
                                                w-9 h-9 rounded-full flex items-center justify-center shrink-0 border border-border/60 shadow-sm
                                                ${log.action.includes('CREATE') ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : ''}
                                                ${log.action.includes('UPDATE') ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' : ''}
                                                ${log.action.includes('DELETE') ? 'bg-red-500/10 text-red-600 border-red-500/20' : ''}
                                                ${!log.action.includes('CREATE') && !log.action.includes('UPDATE') && !log.action.includes('DELETE') ? 'bg-muted/40 text-muted-foreground' : ''}
                                           `}>
                                                {log.action.includes('CREATE') && <CheckCircle2 className="w-4 h-4" />}
                                                {log.action.includes('UPDATE') && <Activity className="w-4 h-4" />}
                                                {log.action.includes('DELETE') && <AlertTriangle className="w-4 h-4" />}
                                                {!log.action.includes('CREATE') && !log.action.includes('UPDATE') && !log.action.includes('DELETE') && <FileText className="w-4 h-4" />}
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-foreground truncate max-w-[80%]">{log.action.replace(/_/g, ' ')}</p>
                                                    <span className="text-xs text-muted-foreground/60 font-mono group-hover:text-muted-foreground transition-colors">
                                                        {formatToLocalDateTime(log.created_at)}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-muted-foreground flex items-center gap-2">
                                                    by <span className="font-semibold text-foreground/80 bg-muted/30 px-1.5 py-0.5 rounded border border-border/30">{log.user_id || 'System'}</span>
                                                </p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-10 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                                        <FileText className="w-8 h-8 opacity-20" />
                                        <span>No recent activity recorded.</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                </div>

                {/* Right Column: Quick Actions & Distribution (Span 1) */}
                <div className="space-y-10">

                    {/* Quick Actions Panel */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-semibold tracking-tight">Quick Actions</h2>
                        <div className="bg-card/30 border border-border/40 rounded-2xl p-2.5 space-y-1.5 shadow-sm backdrop-blur-sm">
                            <QuickAction
                                title="Manage Exams"
                                desc="Create, edit or publish"
                                href="/instructor/exams"
                                icon={BookOpen}
                                colorClass="bg-orange-500/10 text-orange-600 border border-orange-500/20"
                            />
                            <QuickAction
                                title="User Management"
                                desc="Add students or instructors"
                                href="/admin/users"
                                icon={Users}
                                colorClass="bg-indigo-500/10 text-indigo-600 border border-indigo-500/20"
                            />
                            <QuickAction
                                title="Review Sessions"
                                desc="Audit flagged exams"
                                href="/reviewer"
                                icon={Shield}
                                colorClass="bg-rose-500/10 text-rose-600 border border-rose-500/20"
                            />
                        </div>
                    </div>

                    {/* User Distribution Widget */}
                    <div className="space-y-5">
                        <h2 className="text-lg font-semibold tracking-tight">Demographics</h2>
                        <Card className="border-border/40 shadow-none bg-card/30 rounded-2xl overflow-hidden backdrop-blur-sm">
                            <CardContent className="p-6 space-y-7">
                                {isLoadingStats ? (
                                    <div className="space-y-5">
                                        <Skeleton className="h-4 w-full" />
                                        <Skeleton className="h-4 w-full" />
                                    </div>
                                ) : (
                                    Object.entries(stats?.users_by_role || {}).filter(([role]) => role !== 'PLATFORM_ADMIN').map(([role, count]) => {
                                        const total = stats?.total_users || 1;
                                        const percentage = Math.round((count / total) * 100);
                                        // Match StatusBadge colors
                                        const color = role === 'STUDENT' ? 'bg-emerald-500' :
                                            role === 'INSTRUCTOR' ? 'bg-purple-500' :
                                                role === 'ADMIN' ? 'bg-blue-500' :
                                                    role === 'REVIEWER' ? 'bg-amber-500' : 'bg-gray-500';

                                        return (
                                            <div key={role} className="space-y-2.5 group">
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`w-2.5 h-2.5 rounded-full ${color} shadow-sm ring-2 ring-background`}></span>
                                                        <span className="font-semibold text-foreground/90 capitalize">{role.toLowerCase().replace('_', ' ')}</span>
                                                    </div>
                                                    <span className="text-muted-foreground font-mono bg-muted/40 px-1.5 py-0.5 rounded text-[10px]">{count}</span>
                                                </div>
                                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden border border-border/20">
                                                    <div
                                                        className={cn("h-full rounded-full transition-all duration-700 ease-out", color, "opacity-90 group-hover:opacity-100 shadow-[0_0_10px_rgba(0,0,0,0.1)]")}
                                                        style={{ width: `${percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Helpful Link / Guide */}
                    <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 rounded-2xl border border-primary/10 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                            <BookOpen className="w-16 h-16 text-primary" />
                        </div>
                        <h3 className="font-semibold text-sm text-primary mb-1.5 relative z-10">Need Help?</h3>
                        <p className="text-xs text-muted-foreground mb-4 relative z-10 leading-relaxed">Check out our documentation for guides on managing your exams and users.</p>
                        <Button size="sm" variant="outline" className="w-full h-9 text-xs font-medium bg-background/50 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-300 relative z-10">
                            View Documentation
                        </Button>
                    </div>

                </div>
            </div>
        </main>
    );
}
