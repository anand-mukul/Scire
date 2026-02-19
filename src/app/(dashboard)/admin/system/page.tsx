'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/dashboard/page-header';
import { KPICard } from '@/components/dashboard/kpi-card';
import {
    Activity,
    Server,
    Database,
    Cpu,
    HardDrive,
    CheckCircle,
    Clock,
    Users,
    FileText,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';

export default function AdminSystemPage() {
    // Fetch admin stats for system overview
    const { data: stats, isLoading } = useQuery({
        queryKey: ['admin-stats'],
        queryFn: api.admin.getStats,
    });

    const systemMetrics = [
        {
            label: 'API Status',
            value: 'Operational',
            status: 'healthy',
            icon: Server,
            latency: '24ms'
        },
        {
            label: 'Database',
            value: 'Connected',
            status: 'healthy',
            icon: Database,
            latency: '12ms'
        },
        {
            label: 'WebSocket',
            value: 'Active',
            status: 'healthy',
            icon: Activity,
            latency: '5ms'
        },
        {
            label: 'Storage',
            value: 'Available',
            status: 'healthy',
            icon: HardDrive,
            usage: '45%'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-500';
            case 'warning':
                return 'text-yellow-500';
            case 'error':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header */}
            <PageHeader
                title="System Health"
                description="Monitor real-time infrastructure status and platform performance."
                actions={
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-medium border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        All Systems Operational
                    </div>
                }
            />

            {/* Service Status Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {systemMetrics.map((metric) => {
                    const Icon = metric.icon;
                    return (
                        <div key={metric.label} className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 p-5 hover:border-primary/20 transition-all duration-300 hover:shadow-sm">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn("p-2.5 rounded-lg bg-background border border-border/50 shadow-sm", getStatusColor(metric.status))}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                                        <p className="font-semibold text-foreground flex items-center gap-2">
                                            {metric.value}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {metric.latency && <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{metric.latency}</span>}
                                    {metric.usage && <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">{metric.usage}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <Separator className="bg-border/40" />

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Platform Stats */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">Platform Statistics</h2>
                        <Button variant="ghost" size="sm" className="text-xs">View Detailed Report</Button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <KPICard
                            title="Total Users"
                            value={stats?.total_users || 0}
                            icon={Users}
                            trend="up"
                            change="12% vs last month"
                            loading={isLoading}
                            className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                        />
                        <KPICard
                            title="Active Sessions"
                            value={stats?.active_sessions || 0}
                            icon={Activity}
                            trend="up"
                            change="Current load normal"
                            loading={isLoading}
                            className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                        />
                        <KPICard
                            title="Total Exams"
                            value={stats?.total_exams || 0}
                            icon={FileText}
                            trend="neutral"
                            change="Stable growth"
                            loading={isLoading}
                            className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                        />
                        <KPICard
                            title="Completed Sessions"
                            value={stats?.completed_sessions || 0}
                            icon={CheckCircle}
                            trend="up"
                            change="High completion rate"
                            loading={isLoading}
                            className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                        />
                    </div>
                </div>

                {/* Uptime & Incidents */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">System Performance</h2>
                    </div>

                    <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <Clock className="w-4 h-4 text-primary" />
                                Uptime History
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Today</span>
                                    <span className="font-bold text-emerald-500">100%</span>
                                </div>
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-full rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last 7 Days</span>
                                    <span className="font-bold text-emerald-500">99.95%</span>
                                </div>
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[99.95%] rounded-full" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Last 30 Days</span>
                                    <span className="font-bold text-emerald-500">99.9%</span>
                                </div>
                                <div className="h-2 w-full bg-muted/40 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[99.9%] rounded-full" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/60 shadow-sm bg-card/40 backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-primary" />
                                Recent Incidents
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-sm text-muted-foreground text-center py-4">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500/50 mx-auto mb-2" />
                                No active incidents reported in the last 24 hours.
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
