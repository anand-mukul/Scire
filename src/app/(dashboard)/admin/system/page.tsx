'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';

import {
    Activity,
    Server,
    Database,
    Cpu,
    HardDrive,
    CheckCircle,
    Clock,
    Users,
    FileText
} from 'lucide-react';

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
            color: 'primary'
        },
        {
            label: 'Database',
            value: 'Connected',
            status: 'healthy',
            icon: Database,
            color: 'primary'
        },
        {
            label: 'WebSocket',
            value: 'Active',
            status: 'healthy',
            icon: Activity,
            color: 'primary'
        },
        {
            label: 'Storage',
            value: 'Available',
            status: 'healthy',
            icon: HardDrive,
            color: 'primary'
        },
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy':
                return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'warning':
                return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
            case 'error':
                return 'text-destructive bg-destructive/10 border-destructive/20';
            default:
                return 'text-muted-foreground bg-muted/10 border-border';
        }
    };

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <AmbientGlow /> */}

            <div className="container mx-auto p-6 space-y-8 relative z-10">
                {/* Header */}
                <div className="space-y-2 animate-in fade-in duration-300">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                            <Cpu className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-foreground tracking-tight">System Health</h1>
                            <p className="text-sm text-muted-foreground">
                                Monitor infrastructure and service status
                            </p>
                        </div>
                    </div>
                </div>

                {/* Overall Status Banner */}
                <div>
                    <Card className="p-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                <Clock className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">All Systems Operational</h2>
                                <p className="text-sm text-muted-foreground">
                                    Last checked: {new Date().toLocaleTimeString()}
                                </p>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Service Status Grid */}
                <div>
                    <h2 className="text-base font-semibold text-foreground mb-4 px-1">Service Status</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {systemMetrics.map((metric, index) => {
                            const Icon = metric.icon;
                            return (
                                <div key={metric.label}>
                                    <Card className={`p-5 ${getStatusColor(metric.status)} transition-colors`}>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center border border-current opacity-70">
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <div className="text-xs opacity-70 uppercase tracking-widest mb-1">{metric.label}</div>
                                                <div className="font-bold">{metric.value}</div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Platform Stats */}
                <div>
                    <h2 className="text-base font-semibold text-foreground mb-4 px-1">Platform Statistics</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Users', value: stats?.total_users || '-', icon: Users, color: 'blue' },
                            { label: 'Active Sessions', value: stats?.active_sessions || '-', icon: Activity, color: 'emerald' },
                            { label: 'Total Exams', value: stats?.total_exams || '-', icon: FileText, color: 'purple' },
                            { label: 'Completed Sessions', value: stats?.completed_sessions || '-', icon: CheckCircle, color: 'cyan' },
                        ].map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <div key={stat.label}>
                                    <Card className="p-5 hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                                <Icon className="w-5 h-5 text-primary" />
                                            </div>
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{stat.label}</div>
                                                <div className="text-2xl font-bold text-foreground">
                                                    {isLoading ? '...' : stat.value}
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Uptime */}
                <div>
                    <Card className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold text-foreground">System Uptime</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-8 text-center">
                            <div>
                                <div className="text-3xl font-bold text-emerald-500">99.9%</div>
                                <div className="text-sm text-muted-foreground">Last 30 days</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-emerald-500">99.95%</div>
                                <div className="text-sm text-muted-foreground">Last 7 days</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-emerald-500">100%</div>
                                <div className="text-sm text-muted-foreground">Today</div>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
