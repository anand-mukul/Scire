'use client';

import React, { useState } from 'react';
import { useSessions } from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Activity, Headphones, AlertTriangle, Monitor, Shield, User, Clock, Signal } from 'lucide-react';
import { VivaSession, SessionStatus } from '@/types/backend';
import { PageHeader } from '@/components/dashboard/page-header';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { EmptyState } from '@/components/ui/empty-state';
import { formatDistanceToNow } from 'date-fns';
import { LiveMonitorDetails } from '@/components/viva/LiveMonitorDetails';

export interface DashboardSession extends VivaSession {
    student_name?: string;
    exam_title?: string;
    state?: string;
    duration?: string;
    integrity_status?: string;
    started_at?: string;
}

export default function InstructorMonitorPage() {
    const { data: sessions, isLoading } = useSessions(
        { status: SessionStatus.IN_PROGRESS },
        { refetchInterval: 5000 }
    );
    const dashboardSessions = (sessions || []) as DashboardSession[];
    const [selectedSession, setSelectedSession] = useState<DashboardSession | null>(null);

    const stats = {
        total: dashboardSessions.length,
        flagged: dashboardSessions.filter(s => s.integrity_status === 'flagged').length,
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Live Monitor"
                description="Real-time oversight of active examination sessions."
                badge={{ label: 'Active', value: stats.total, icon: Signal }}
                actions={stats.flagged > 0 ? (
                    <Badge variant="destructive" className="gap-1.5 text-xs">
                        <AlertTriangle className="h-3 w-3" />
                        {stats.flagged} Flagged
                    </Badge>
                ) : undefined}
            />
            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    Array(4).fill(0).map((_, i) => (
                        <Card key={i} className="h-48 bg-muted/20 border-border/50 animate-pulse rounded-xl" />
                    ))
                ) : sessions?.length === 0 ? (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Signal}
                            title="No Active Sessions"
                            description="Waiting for students to join. Scheduled exams will appear here automatically when they begin."
                        />
                    </div>
                ) : (
                    dashboardSessions.map((session) => (
                        <Card key={session.id} className={cn(
                            "group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 border-border/60",
                            session.integrity_status === 'flagged' ? "border-destructive/50 shadow-destructive/5" : "hover:border-primary/30"
                        )}>
                            {/* Decorative gradient background */}
                            <div className={cn(
                                "absolute top-0 inset-x-0 h-1",
                                session.integrity_status === 'flagged' ? "bg-destructive" : "bg-gradient-to-r from-primary/50 to-primary/10"
                            )} />

                            <div className="p-5 flex flex-col h-full gap-4">
                                <div className="flex justify-between items-start gap-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                            <AvatarFallback className={cn("text-xs font-bold", session.integrity_status === 'flagged' ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
                                                {(session.student?.full_name || session.student_name || 'S').charAt(0)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <h3 className="font-semibold text-sm text-foreground truncate leading-tight">
                                                {session.student?.full_name || session.student_name || 'Unknown Student'}
                                            </h3>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {session.exam?.title || session.exam_title || 'Unknown Exam'}
                                            </p>
                                        </div>
                                    </div>
                                    {session.integrity_status === 'flagged' ? (
                                        <div className="h-6 w-6 rounded-full bg-destructive/10 text-destructive flex items-center justify-center shrink-0 animate-pulse">
                                            <AlertTriangle className="h-3.5 w-3.5" />
                                        </div>
                                    ) : (
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2 shrink-0 animate-pulse ring-2 ring-emerald-500/20" />
                                    )}
                                </div>

                                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg border border-border/40">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Started {session.started_at ? formatDistanceToNow(new Date(session.started_at), { addSuffix: true }) : 'Just now'}</span>
                                </div>

                                <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
                                    <Button 
                                        size="sm" 
                                        variant="outline" 
                                        className="w-full text-xs h-8 gap-1.5 border-border/60 hover:bg-background hover:text-foreground"
                                        onClick={() => setSelectedSession(session)}
                                    >
                                        <Activity className="w-3.5 h-3.5" />
                                        Behavior Logs
                                    </Button>
                                    <Button size="sm" variant={session.integrity_status === 'flagged' ? 'destructive' : 'default'} className="w-full text-xs h-8 gap-1.5 shadow-sm">
                                        <Headphones className="w-3.5 h-3.5" />
                                        Connect
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>

            <LiveMonitorDetails 
                session={selectedSession} 
                open={!!selectedSession} 
                onOpenChange={(open) => !open && setSelectedSession(null)} 
            />
        </div>
    );
}
