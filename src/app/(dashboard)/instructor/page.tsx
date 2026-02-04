'use client';

import React, { useState } from 'react';
import { PremiumCard } from '@/components/ui/premium-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { motion } from 'motion/react';
import { Plus, Users, Activity, FileText, ChevronRight, BarChart3, Settings } from 'lucide-react';

import { Exam, VivaSession } from '@/types/backend';

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
    const { data: sessions, isLoading: isLoadingSessions } = useSessions({ status: 'IN_PROGRESS' });
    const { data: stats, isLoading: isLoadingStats } = useStats();

    const activeExams = (exams || []) as DashboardExam[];
    const liveSessions = (sessions || []) as DashboardSession[];

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            <AmbientGlow />

            <div className="container mx-auto p-6 space-y-8 relative z-10">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
                >
                    <div className="space-y-2">
                        <h1 className="text-4xl md:text-6xl font-black tracking-tighter bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)] pb-2">
                            Instructor Console
                        </h1>
                        <p className="text-muted-foreground text-lg max-w-2xl">
                            Orchestrate complex evaluations and monitor candidate performance in real-time.
                        </p>
                    </div>
                    <Button
                        className="h-12 px-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_20px_-5px_rgba(var(--primary),0.3)] hover:shadow-primary/40 transition-all hover:scale-105 font-medium border-0"
                        onClick={() => router.push('/instructor/exam/create')}
                    >
                        <Plus className="mr-2 h-5 w-5" />
                        New Assessment
                    </Button>
                </motion.div>

                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Active Exams', value: stats?.active_exams?.toString() || '-', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                        { label: 'Live Sessions', value: stats?.live_sessions?.toString() || '-', icon: Activity, isLive: true, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                        { label: 'Pending Reviews', value: stats?.pending_reviews?.toString() || '-', icon: Users, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                        { label: 'Avg. Score', value: stats?.avg_score ? `${stats.avg_score}%` : '-', icon: BarChart3, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' },
                    ].map((stat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <PremiumCard className="relative overflow-hidden group p-6 flex items-center gap-6 hover:border-border transition-all duration-300 border-border bg-card/40 backdrop-blur-xl">
                                <div className={`p-4 rounded-2xl ${stat.bg} border ${stat.border}`}>
                                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                                </div>
                                <div className="relative">
                                    {stat.isLive && (
                                        <span className="absolute -right-3 -top-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                        </span>
                                    )}
                                    <div className="text-3xl font-black text-foreground tracking-tight">{isLoadingStats ? '...' : stat.value}</div>
                                    <div className="text-xs text-muted-foreground font-bold uppercase tracking-widest mt-1">{stat.label}</div>
                                </div>
                            </PremiumCard>
                        </motion.div>
                    ))}
                </div>

                {/* Main Content Area */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Active Exams & Management */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
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
                                activeExams.slice(0, 3).map((exam: DashboardExam) => (
                                    <PremiumCard
                                        key={exam.id}
                                        interactive
                                        className="group cursor-pointer hover:border-primary/20 transition-all p-6 bg-card/40 backdrop-blur-xl border-border"
                                        onClick={() => router.push(`/instructor/exam/${exam.id}`)}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-3">
                                                <div>
                                                    <div className="flex items-center gap-3">
                                                        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">{exam.title}</h3>
                                                        <Badge variant="outline" className="bg-secondary/20 border-border text-muted-foreground font-mono tracking-wider">{exam.exam_code || 'N/A'}</Badge>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6 text-sm text-neutral-500 font-medium">
                                                    <div className="flex items-center gap-2">
                                                        <Users className="w-4 h-4" />
                                                        <span>{exam.candidates_count || 0} Candidates</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className={`w-2 h-2 rounded-full ${(exam.status as string).toLowerCase() === 'published' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-amber-500'}`} />
                                                        <span className="capitalize text-muted-foreground">{(exam.status as string).toLowerCase()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    className="text-muted-foreground hover:text-foreground hover:bg-background/50 rounded-full"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        router.push(`/instructor/exam/${exam.id}`);
                                                    }}
                                                >
                                                    <Settings className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </PremiumCard>
                                ))
                            )}

                            <PremiumCard
                                interactive
                                className="border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 flex items-center justify-center p-8 cursor-pointer group transition-all rounded-3xl"
                                onClick={() => router.push('/instructor/exam/create')}
                            >
                                <div className="flex flex-col items-center gap-3 text-primary/80 group-hover:text-primary">
                                    <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                        <Plus className="w-6 h-6" />
                                    </div>
                                    <span className="font-bold">Draft New Exam</span>
                                </div>
                            </PremiumCard>
                        </div>
                    </div>

                    {/* Live Monitoring Feed */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center px-1">
                            <h2 className="text-xl font-bold text-foreground flex items-center gap-3">
                                <div className="p-2 bg-secondary/30 rounded-lg border border-border">
                                    <Activity className="w-5 h-5 text-emerald-500" />
                                </div>
                                Live Monitor
                            </h2>
                            <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 px-3">
                                <span className="relative flex h-2 w-2 mr-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                                {liveSessions.length} Online
                            </Badge>
                        </div>

                        <div className="bg-card/40 border border-border rounded-3xl p-4 min-h-[400px] backdrop-blur-sm">
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
                                        <motion.div
                                            key={session.id}
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            <PremiumCard className="p-4 bg-card/60 hover:bg-card/80 transition-colors border-l-2 border-l-emerald-500/50 border-y-border border-r-border">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <div className="font-bold text-foreground text-sm">{session.student_name || 'Student'}</div>
                                                        <div className="text-xs text-muted-foreground truncate max-w-[150px]">{session.exam_title || 'Exam'}</div>
                                                    </div>
                                                    <Badge variant="outline" className="text-[10px] px-2 py-0.5 uppercase tracking-wider bg-secondary/20 text-muted-foreground border-border">
                                                        {session.state}
                                                    </Badge>
                                                </div>

                                                <div className="flex items-center gap-2 mb-3">
                                                    <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                                                        <div className="h-full bg-emerald-500/50 w-2/3 animate-pulse" />
                                                    </div>
                                                    <span className="text-xs font-mono text-emerald-500">{session.duration || '00:00'}</span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="secondary"
                                                        className="flex-1 h-7 text-xs bg-secondary/50 hover:bg-secondary text-foreground border-0"
                                                        onClick={() => router.push(`/instructor/monitor?session=${session.id}`)}
                                                    >
                                                        Listen
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-7 w-7 p-0 bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-400 border border-red-500/20"
                                                        onClick={() => {
                                                            if (confirm('Are you sure you want to end this session?')) {
                                                                api.sessions.end(session.id).then(() => {
                                                                    window.location.reload();
                                                                });
                                                            }
                                                        }}
                                                        title="End Session"
                                                    >
                                                        <Activity className="w-3 h-3" />
                                                    </Button>
                                                </div>
                                            </PremiumCard>
                                        </motion.div>
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
        </div>
    );
}
