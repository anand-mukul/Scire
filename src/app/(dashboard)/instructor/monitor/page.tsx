'use client';

import React from 'react';
import { useSessions } from '@/hooks/use-dashboard-data';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
// import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Activity, Headphones, AlertTriangle } from 'lucide-react';
import { VivaSession } from '@/types/backend';

interface DashboardSession extends VivaSession {
    student_name?: string;
    exam_title?: string;
    state?: string;
    duration?: string;
    integrity_status?: string;
}

import { SessionStatus } from '@/types/backend';

export default function InstructorMonitorPage() {
    const { data: sessions, isLoading } = useSessions({ status: SessionStatus.IN_PROGRESS });
    const dashboardSessions = (sessions || []) as DashboardSession[];

    return (
        <div className="p-8 space-y-8 min-h-screen bg-background text-foreground relative overflow-hidden">
            {/* <AmbientGlow /> */}
            <div className="flex justify-between items-end relative z-10">
                <div className="space-y-2">
                    <h1 className="text-2xl font-semibold text-foreground">Live Monitor</h1>
                    <p className="text-muted-foreground">Real-time oversight of all active exam sessions.</p>
                </div>
                <Badge variant="outline" className="h-8 px-3 text-emerald-500 bg-emerald-500/10 border-emerald-500/20">
                    <span className="relative flex h-2 w-2 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    {sessions?.length || 0} Active Sessions
                </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {isLoading ? (
                    <div>Loading sessions...</div>
                ) : sessions?.length === 0 ? (
                    <div className="col-span-full py-20 text-center bg-muted/20 rounded-xl border border-dashed border-border">
                        <Activity className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <p className="text-muted-foreground">No active sessions to monitor</p>
                    </div>
                ) : (
                    dashboardSessions.map((session) => (
                        <Card key={session.id} className="flex flex-col gap-4 p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-foreground truncate">
                                        {session.student?.full_name || session.student_name || 'Unknown Student'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {session.exam?.title || session.exam_title || 'Unknown Exam'}
                                    </p>
                                </div>
                                <div className={`w-3 h-3 rounded-full ${session.integrity_status === 'flagged' ? 'bg-destructive animate-pulse' : 'bg-primary'}`} />
                            </div>

                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="uppercase text-[10px] tracking-wider">
                                    {session.state || session.status || 'Unknown'}
                                </Badge>
                                {session.integrity_status === 'flagged' && (
                                    <Badge variant="destructive" className="flex gap-1 text-[10px]">
                                        <AlertTriangle className="w-3 h-3" /> Flagged
                                    </Badge>
                                )}
                            </div>

                            <div className="mt-auto pt-4 border-t border-border flex gap-2">
                                <Button size="sm" className="w-full" variant="outline">
                                    <Headphones className="w-4 h-4 mr-2" />
                                    Connect
                                </Button>
                            </div>
                        </Card>
                    ))
                )}
            </div >
        </div >
    );
}
