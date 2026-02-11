'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PremiumCard } from '@/components/ui/premium-card';
import { Activity, Users, Server, AlertTriangle, Shield, FileText, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { motion } from 'motion/react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { AmbientGlow } from '@/components/ui/ambient-glow';
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
        },
        {
            title: 'Active Sessions',
            value: stats?.active_sessions ?? 0,
            icon: Activity,
            description: `${stats?.active_exams ?? 0} active exams`,
            isLive: true,
        },
        {
            title: 'System Health',
            value: '99.9%',
            icon: Server,
            description: 'All systems operational',
        },
        {
            title: 'Flagged Sessions',
            value: stats?.flagged_sessions ?? 0,
            icon: AlertTriangle,
            description: stats?.flagged_sessions ? 'Requires review' : 'No issues detected',
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
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <AmbientGlow />

            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 relative z-10">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-3"
                    >
                        <h1 className="text-5xl md:text-6xl font-bold text-foreground leading-tight">
                            Admin Console
                        </h1>
                        <p className="text-muted-foreground text-base max-w-2xl">
                            Command center for system monitoring, user management, and platform analytics.
                        </p>
                    </motion.div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
                    {isLoadingStats
                        ? Array(4).fill(0).map((_, i) => <StatCardSkeleton key={i} />)
                        : statCards.map((stat, index) => (
                            <motion.div
                                key={stat.title}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <PremiumCard className="h-full group relative overflow-hidden transition-all duration-300 hover:border-primary/20 bg-card border-border">
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                                    <div className="relative z-10 flex flex-col justify-between h-full p-6">
                                        <div className="flex justify-between items-start">
                                            <div className="p-3 rounded-2xl bg-primary/10 border border-primary/20 group-hover:bg-primary/20 transition-colors duration-300">
                                                <stat.icon className="h-6 w-6 text-primary group-hover:text-primary transition-colors" />
                                            </div>
                                            {stat.isLive && (
                                                <span className="relative flex h-2.5 w-2.5">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-6">
                                            <div className="text-4xl font-bold text-foreground tracking-tight">{stat.value}</div>
                                            <p className="text-sm font-medium text-muted-foreground mt-1">{stat.title}</p>
                                        </div>

                                        <div className="mt-4 pt-4 border-t border-border/50">
                                            <p className="text-xs text-muted-foreground font-medium">{stat.description}</p>
                                        </div>
                                    </div>
                                </PremiumCard>
                            </motion.div>
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
                </div>


                <div className="grid gap-8 lg:grid-cols-3">
                    <div className="lg:col-span-1 space-y-4">
                        {isLoadingStats
                            ? Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl opacity-20" />)
                            : additionalStats.map((stat, index) => (
                                <motion.div
                                    key={stat.title}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                                >
                                    <PremiumCard className="relative overflow-hidden group !p-0 border-border bg-card/40 backdrop-blur-xl hover:border-primary/30 transition-colors">
                                        <div className="relative h-full w-full p-6 flex items-center justify-between">
                                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                            <div className="relative z-10">
                                                <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1">{stat.title}</p>
                                                <p className="text-3xl font-black text-foreground">{stat.value}</p>
                                            </div>
                                            <div className="relative z-10 p-3 rounded-xl bg-primary/10 text-primary group-hover:text-primary group-hover:bg-primary/20 transition-all">
                                                <stat.icon className="w-6 h-6" />
                                            </div>
                                        </div>
                                    </PremiumCard>
                                </motion.div>
                            ))}
                    </div>

                    <div className="lg:col-span-2 grid gap-6 md:grid-cols-2">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.8 }}
                            className="bg-card/40 rounded-3xl border border-border backdrop-blur-xl p-8 h-full flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-xl text-primary border border-primary/20"><Server className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground leading-tight">System Logs</h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-1">LATEST EVENTS</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-bold">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    LIVE
                                </div>
                            </div>

                            <div className="space-y-6 flex-1 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar relative z-10">
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
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: 0.9 }}
                            className="bg-card/40 rounded-3xl border border-border backdrop-blur-xl p-8 h-full flex flex-col relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-32 bg-secondary/5 blur-[50px] rounded-full pointer-events-none" />
                            <div className="flex items-center justify-between mb-8 relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-secondary/10 rounded-xl text-secondary-foreground border border-secondary/20"><Users className="w-5 h-5" /></div>
                                    <div>
                                        <h3 className="text-lg font-bold text-foreground leading-tight">User Base</h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-1">ROLE DISTRIBUTION</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-5 flex-1 relative z-10">
                                {isLoadingStats ? (
                                    Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)
                                ) : stats?.users_by_role ? (
                                    Object.entries(stats.users_by_role).map(([role, count], i) => {
                                        const total = Object.values(stats.users_by_role).reduce((a, b) => a + b, 0);
                                        const percent = Math.round((count / total) * 100);
                                        const opacity = i === 0 ? 'bg-white/70' : i === 1 ? 'bg-white/50' : 'bg-white/30';

                                        return (
                                            <div key={role} className="group">
                                                <div className="flex justify-between items-end mb-2">
                                                    <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{role}</span>
                                                    <span className="text-sm font-mono text-foreground">{count} <span className="text-muted-foreground">/ {percent}%</span></span>
                                                </div>
                                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${percent}%` }}
                                                        transition={{ duration: 1, delay: 1 + (i * 0.1) }}
                                                        className={`h-full ${opacity} rounded-full bg-primary`}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-muted-foreground text-sm italic">No user data available</p>
                                )}
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Helper component for quick actions
function AdminActionCard({ href, icon: Icon, title, desc, delay }: { href: string; icon: any; title: string; desc: string; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay }}
        >
            <Link href={href} className="block h-full">
                <PremiumCard interactive className="h-full p-6 flex flex-col items-center text-center justify-center gap-4 hover:-translate-y-2 transition-all duration-300 group border-border bg-card/40 backdrop-blur-xl hover:border-primary/50">
                    <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 group-hover:text-primary group-hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all duration-300">
                        <Icon className="w-8 h-8 group-hover:scale-110 transition-transform" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground text-lg mb-1">{title}</h3>
                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold group-hover:text-primary transition-colors">{desc}</p>
                    </div>
                </PremiumCard>
            </Link>
        </motion.div>
    );
}
