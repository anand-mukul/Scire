'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
// import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Plus, Users, Activity, FileText, ChevronRight, BarChart3, Settings } from 'lucide-react';

import { Exam, VivaSession, ExamStatus, SessionStatus } from '@/types/backend';

import { useExams, useSessions, useStats } from '@/hooks/use-dashboard-data';
import { api } from '@/lib/network/api';

interface DashboardSession extends VivaSession {
    student_name?: string;
    exam_title?: string;
    state?: string;
    duration?: string;
}

interface DashboardExam extends Exam {
    candidates_count?: number;
}

import { useRouter } from 'next/navigation';

export default function InstructorDashboard() {
    const router = useRouter();
    const { data: exams, isLoading: isLoadingExams } = useExams();
    const { data: sessions, isLoading: isLoadingSessions } = useSessions({ status: SessionStatus.IN_PROGRESS });
    const { data: stats, isLoading: isLoadingStats } = useStats();

    const activeExams = (exams || []) as DashboardExam[];
    const liveSessions = (sessions || []) as DashboardSession[];

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <AmbientGlow /> */}

            <div className="container mx-auto p-6 md:p-8 space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                            Instructor Console
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-2xl">
                            Orchestrate complex evaluations and monitor candidate performance in real-time.
                        </p>
                    </div>
                    <Button
                        className="h-10 px-6 rounded-full font-medium"
                        onClick={() => router.push('/instructor/exam/create')}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        New Assessment
                    </Button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isLoadingStats
                        ? Array(4).fill(0).map((_, i) => (
                            <Card key={i} className="h-full">
                                <div className="flex flex-col justify-between h-full p-6">
                                    <div className="flex justify-between items-start">
                                        <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
                                    </div>
                                    <div className="mt-6 space-y-2">
                                        <div className="h-8 w-16 bg-muted rounded animate-pulse" />
                                        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <div className="h-3 w-32 bg-muted rounded animate-pulse" />
                                    </div>
                                </div>
                            </Card>
                        ))
                        : [
                            { label: 'Active Exams', value: stats?.active_exams?.toString() || '0', icon: FileText, description: `${stats?.active_exams || 0} assessments live`, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                            { label: 'Live Sessions', value: stats?.live_sessions?.toString() || '0', icon: Activity, isLive: true, description: 'Currently in progress', color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                            { label: 'Pending Reviews', value: stats?.pending_reviews?.toString() || '0', icon: Users, description: 'Awaiting your review', color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                            { label: 'Avg. Score', value: stats?.avg_score ? `${stats.avg_score}%` : 'N/A', icon: BarChart3, description: 'Across all completed exams', color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                        ].map((stat) => (
                            <Card key={stat.label} className="h-full group transition-colors hover:border-primary/50">
                                <div className="flex flex-col justify-between h-full p-6">
                                    <div className="flex justify-between items-start">
                                        <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border}`}>
                                            <stat.icon className={`h-5 w-5 ${stat.color}`} aria-hidden="true" />
                                        </div>
                                        {stat.isLive && (
                                            <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                                            </span>
                                        )}
                                    </div>

                                    <div className="mt-6">
                                        <div className="text-3xl font-semibold text-foreground tracking-tight">{stat.value}</div>
                                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground">{stat.description}</p>
                                    </div>
                                </div>
                            </Card>
                        ))
                    }
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Active Exams & Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-medium text-foreground flex items-center gap-3">
                                <div className="p-2 bg-secondary/30 rounded-lg border border-border">
                                    <FileText className="w-5 h-5 text-primary" />
                                </div>
                                Exam Management
                            </h2>
                            <Button
                                variant="ghost"
                                className="text-muted-foreground hover:text-foreground hover:bg-secondary/20"
                                onClick={() => router.push('/instructor/exams')}
                            >
                                View All <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </div>

                        <div className="grid gap-4">
                            {isLoadingExams ? (
                                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">Loading exams...</div>
                            ) : activeExams.length === 0 ? (
                                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-xl bg-card/20">No active exams found. Create one to get started.</div>
                            ) : (
                                activeExams.slice(0, 4).map((exam: DashboardExam) => {
                                    const isDraft = exam.status === ExamStatus.DRAFT;
                                    const isPublished = exam.status === ExamStatus.PUBLISHED;
                                    const isActive = exam.status === ExamStatus.ACTIVE;

                                    const statusDot = isActive
                                        ? 'bg-blue-500 animate-pulse'
                                        : isPublished
                                            ? 'bg-emerald-500'
                                            : 'bg-amber-500';

                                    const statusBadge = isActive
                                        ? 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                                        : isPublished
                                            ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20';

                                    return (
                                        <Card
                                            key={exam.id}
                                            className="group cursor-pointer hover:border-primary/20 transition-all overflow-hidden"
                                            onClick={() => router.push(`/instructor/exam/${exam.id}`)}
                                        >
                                            {/* Status strip */}
                                            <div className={`h-0.5 w-full ${statusDot.replace('animate-pulse', '')}`} />

                                            <div className="p-5">
                                                <div className="flex justify-between items-start">
                                                    <div className="space-y-2.5 flex-1 min-w-0">
                                                        <div className="flex items-center gap-2.5 flex-wrap">
                                                            <h3 className="text-base font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                                                                {exam.title}
                                                            </h3>
                                                            <Badge variant="outline" className="bg-primary/5 border-primary/10 text-primary font-mono tracking-wider text-xs shrink-0">
                                                                {exam.exam_code || 'N/A'}
                                                            </Badge>
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                                            <Badge variant="outline" className={`text-[10px] border ${statusBadge}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${statusDot}`} />
                                                                {(exam.status as string).charAt(0).toUpperCase() + (exam.status as string).slice(1).toLowerCase()}
                                                            </Badge>
                                                            <div className="flex items-center gap-1.5">
                                                                <Users className="w-3.5 h-3.5" />
                                                                <span>{exam.candidates_count || 0} Candidates</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-full shrink-0"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            router.push(`/instructor/exam/${exam.id}`);
                                                        }}
                                                        aria-label={`Settings for ${exam.title}`}
                                                    >
                                                        <Settings className="w-5 h-5" aria-hidden="true" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    );
                                })
                            )}

                            <Card
                                className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 flex items-center justify-center p-8 cursor-pointer group transition-all"
                                onClick={() => router.push('/instructor/exam/create')}
                            >
                                <div className="flex flex-col items-center gap-3 text-primary/80 group-hover:text-primary">
                                    <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-medium">Draft New Exam</span>
                                </div>
                            </Card>
                        </div>
                    </div>

                    {/* Live Monitoring Feed */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-lg font-medium text-foreground flex items-center gap-3">
                                <div className="p-2 bg-secondary/30 rounded-lg border border-border">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                </div>
                                Live Monitor
                            </h2>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3">
                                <span className="relative flex h-2 w-2 mr-2" aria-hidden="true">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                <span className="sr-only">{liveSessions.length} sessions currently </span>{liveSessions.length} Online
                            </Badge>
                        </div>

                        <div className="border border-border rounded-2xl p-4 min-h-[400px]">
                            <div className="space-y-3">
                                {isLoadingSessions ? (
                                    <div className="text-center py-10 text-muted-foreground">Scanning active channels...</div>
                                ) : liveSessions.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-4">
                                        <div className="w-16 h-16 rounded-full bg-secondary/30 flex items-center justify-center">
                                            <Activity className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p>No active sessions found.</p>
                                    </div>
                                ) : (
                                    liveSessions.slice(0, 5).map((session, idx) => (
                                        <div key={session.id}>
                                            <Card className="p-4 border-l-2 border-l-emerald-500/50">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-medium text-foreground text-sm">{session.student_name || 'Student'}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{session.exam_title || 'Exam'}</div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 uppercase tracking-wider">
                                                        {session.state}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500/50 w-2/3" />
                                                    </div>
                                                    <span className="text-xs font-mono text-emerald-500">{session.duration || '00:00'}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="flex-1 h-7 text-xs"
                                                        onClick={() => router.push(`/instructor/monitor?session=${session.id}`)}
                                                    >
                                                        Listen
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to end this session?')) {
                                                                api.sessions.end(session.id).then(() => {
                                                                    window.location.reload();
                                                                });
                                                            }
                                                        }}
                                                        aria-label="End this session"
                                                    >
                                                        <Activity className="w-3 h-3" aria-hidden="true" />
                                                    </Button>
                                                </div>
                                            </Card>
                                        </div>
                                    ))
                                )}

                                {liveSessions.length > 5 && (
                                    <Button
                                        variant="outline"
                                        className="w-full text-muted-foreground border-border hover:bg-secondary/20 hover:text-foreground mt-4"
                                        onClick={() => router.push('/instructor/monitor')}
                                    >
                                        View All Active Sessions
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
}
