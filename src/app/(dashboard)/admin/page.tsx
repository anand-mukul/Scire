'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Activity, Users, Server, AlertTriangle, Shield, FileText, BarChart3, BookOpen } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatToLocalDateTime } from '@/lib/date-utils';


interface AdminStats {
    total_users: number;
    users_by_role: Record<string, number>;
    active_sessions: number;
    flagged_sessions: number;
    total_exams: number;
    active_exams: number;
    completed_sessions: number;
    avg_score: number;
}

interface AuditLog {
    id: string;
    action: string;
    user_id?: string;
    created_at: string;
    metadata?: Record<string, unknown>;
}

function StatCardSkeleton() {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-4 rounded" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
            </CardContent>
        </Card>
    );
}

export default function AdminDashboard() {

    const { data: stats, isLoading: isLoadingStats, error } = useQuery<AdminStats>({
        queryKey: ['admin', 'stats'],
        queryFn: api.admin.getStats,
    });

    const { data: auditLogs, isLoading: isLoadingLogs } = useQuery<AuditLog[]>({
        queryKey: ['admin', 'audit-logs'],
        queryFn: () => api.admin.getAuditLogs({ limit: 5 }),
    });

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.total_users ?? 0,
            icon: Users,
            description: `${stats?.users_by_role?.STUDENT ?? 0} students`,
            color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20',
        },
        {
            title: 'Active Sessions',
            value: stats?.active_sessions ?? 0,
            icon: Activity,
            description: `${stats?.active_exams ?? 0} active exams`,
            isLive: true,
            color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20',
        },
        {
            title: 'System Health',
            value: '99.9%',
            icon: Server,
            description: 'All systems operational',
            color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20',
        },
        {
            title: 'Flagged Sessions',
            value: stats?.flagged_sessions ?? 0,
            icon: AlertTriangle,
            description: stats?.flagged_sessions ? 'Requires review' : 'No issues detected',
            color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20',
        },
    ];

    const additionalStats = [
        {
            title: 'Total Exams',
            value: stats?.total_exams ?? 0,
            icon: FileText,
        },
        {
            title: 'Completed Sessions',
            value: stats?.completed_sessions ?? 0,
            icon: Shield,
        },
        {
            title: 'Average Score',
            value: stats?.avg_score ? `${stats.avg_score}%` : 'N/A',
            icon: BarChart3,
        },
    ];

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

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <div className="container mx-auto p-6 md:p-8 space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground">
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground mt-2 max-w-2xl">
                            Command center for system monitoring, user management, and platform analytics.
                        </p>
                    </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {isLoadingStats
                        ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        : statCards.map((stat) => (
                            <Card key={stat.title} className="h-full group transition-colors hover:border-primary/50">
                                <div className="flex flex-col justify-between h-full p-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border}`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
                                        </div>
                                        {stat.isLive && (
                                            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        <div className="text-3xl font-semibold text-foreground tracking-tight">{stat.value}</div>
                                        <p className="text-sm text-muted-foreground mt-1">{stat.title}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))}
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <AdminActionCard
                        href="/instructor/monitor"
                        icon={Activity}
                        title="Live Monitor"
                        desc="Watch active exams"
                        delay={0.4}
                    />
                    <AdminActionCard
                        href="/reviewer"
                        icon={Shield}
                        title="Review Hub"
                        desc="Audit flagged sessions"
                        delay={0.5}
                    />
                    <AdminActionCard
                        href="/instructor"
                        icon={FileText}
                        title="Manage Exams"
                        desc="Create & Edit Exams"
                        delay={0.6}
                    />
                    <AdminActionCard
                        href="/admin/users"
                        icon={Users}
                        title="User Management"
                        desc="Manage Accounts"
                        delay={0.7}
                    />
                    <AdminActionCard
                        href="/admin/subjects"
                        icon={BookOpen}
                        title="Subjects"
                        desc="Departments & Courses"
                        delay={0.8}
                    />
                </div>


                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 space-y-4">
                        {isLoadingStats
                            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl opacity-20" />)
                            : additionalStats.map((stat) => (
                                <Card key={stat.title} className="group hover:border-primary/30 transition-colors">
                                    <div className="p-6 flex items-center justify-between">
                                        <div>
                                            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">{stat.title}</p>
                                            <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
                                        </div>
                                        <div className="p-3 rounded-xl bg-primary/10 text-primary">
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                    </div>
                                </Card>
                            ))}
                    </div>

                    <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
                        <Card className="p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="p-2.5 bg-primary/10 rounded-lg text-primary border border-primary/20"><Server className="w-4 h-4" /></div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">System Logs</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Latest events</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    LIVE
                                </div>
                            </div>

                            <div className="space-y-4 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
                                {isLoadingLogs ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <div key={i} className="flex gap-4"><Skeleton className="h-2 w-2 rounded-full mt-2" /><div className="space-y-2 flex-1"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/4" /></div></div>
                                    ))
                                ) : auditLogs && auditLogs.length > 0 ? (
                                    auditLogs.map((log) => (
                                        <div key={log.id} className="relative pl-6 border-l border-border last:border-0 pb-8 last:pb-0 group">
                                            <div className="absolute left-[-5px] top-0 h-2.5 w-2.5 rounded-full bg-muted-foreground ring-4 ring-background group-hover:bg-primary transition-colors" />
                                            <div className="flex flex-col gap-1.5 -mt-1 group-hover:translate-x-1 transition-transform duration-300">
                                                <span className="text-sm text-foreground font-medium group-hover:text-primary transition-colors">{log.action}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider group-hover:text-primary/70 transition-colors">
                                                    {formatToLocalDateTime(log.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                        <Activity className="w-8 h-8 mb-2 opacity-20" />
                                        <p className="text-sm">No recent system activity</p>
                                    </div>
                                )}
                            </div>
                        </Card>

                        <Card className="p-6 h-full flex flex-col">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-muted rounded-lg text-muted-foreground border border-border"><Users className="w-4 h-4" /></div>
                                    <div>
                                        <h3 className="text-base font-semibold text-foreground">User Base</h3>
                                        <p className="text-xs text-muted-foreground mt-0.5">Role distribution</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 flex-1">
                                {isLoadingStats ? (
                                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                                ) : stats?.users_by_role ? (
                                    Object.entries(stats.users_by_role).map(([role, count], i) => {
                                        const total = Object.values(stats.users_by_role).reduce((a, b) => a + b, 0);
                                        const percent = Math.round((count / total) * 100);

                                        return (
                                            <div key={role} className="group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{role}</span>
                                                    <span className="text-sm font-mono text-foreground">{count} <span className="text-muted-foreground">/ {percent}%</span></span>
                                                </div>
                                                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        style={{ width: `${percent}%` }}
                                                        className="h-full rounded-full bg-primary transition-all duration-700"
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No user data available</p>
                                )}
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </main>
    );
}

// Helper component for quick actions
function AdminActionCard({ href, icon: Icon, title, desc }: { href: string; icon: any; title: string; desc: string; delay: number }) {
    return (
        <Link href={href} className="block h-full" aria-label={`${title}: ${desc}`}>
            <Card className="h-full p-6 flex flex-col items-center text-center justify-center gap-3 hover:border-primary/50 transition-colors group">
                <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary">
                    <Icon className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground mb-0.5">{title}</h3>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
            </Card>
        </Link>
    );
}
