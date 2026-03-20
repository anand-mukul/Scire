'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/dashboard/page-header';
import { Target, Plus, Loader2, CheckCircle, XCircle, Clock, Sparkles, Zap, Crown } from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/network/api';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PracticePlansModal } from '@/components/content/practice/practice-plans-modal';

const KBStatusBadge = ({ status }: { status: string | null }) => {
    if (!status) return <Badge variant="secondary">Unknown</Badge>;
    switch (status) {
        case 'PROCESSING':
            return (
                <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                    <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    Processing
                </Badge>
            );
        case 'READY':
            return (
                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready
                </Badge>
            );
        case 'FAILED':
            return (
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                    <XCircle className="h-3 w-3 mr-1" />
                    Failed
                </Badge>
            );
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

const PLAN_ICON: Record<string, React.ReactNode> = {
    FREE: <Sparkles className="h-5 w-5 text-muted-foreground" />,
    LITE: <Zap className="h-5 w-5 text-blue-500" />,
    PLUS: <Crown className="h-5 w-5 text-purple-500" />,
};

export default function PracticePage() {
    const [showPlansModal, setShowPlansModal] = useState(false);

    const { data: exams, isLoading: examsLoading } = useQuery({
        queryKey: ['practice-exams'],
        queryFn: () => api.practice.listExams(),
    });

    const { data: practiceStatus } = useQuery({
        queryKey: ['practice-status'],
        queryFn: () => api.practice.getStatus(),
    });

    const currentPlan = practiceStatus?.plan || 'FREE';

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Practice Viva"
                description="Build confidence with AI-powered practice sessions."
                actions={
                    <Button asChild className="font-semibold gap-2">
                        <Link href="/student/practice/create">
                            <Plus className="h-4 w-4" />
                            New Practice Session
                        </Link>
                    </Button>
                }
            />

            {/* Plan-Aware Status Banner */}
            {practiceStatus && (
                <Card className="p-5 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent border-primary/10">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
                                {PLAN_ICON[currentPlan] || <Sparkles className="h-5 w-5 text-primary" />}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-medium text-foreground">
                                        {practiceStatus.plan_name || currentPlan} Plan
                                    </p>
                                    {currentPlan !== 'FREE' && (
                                        <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                            ACTIVE
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {practiceStatus.is_unlimited
                                        ? `Unlimited sessions • ${practiceStatus.sessions_used} used`
                                        : `${practiceStatus.sessions_remaining} of ${practiceStatus.sessions_limit} sessions remaining`
                                    }
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {currentPlan === 'FREE' && (
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="text-xs gap-1.5 font-semibold"
                                    onClick={() => setShowPlansModal(true)}
                                >
                                    <Zap className="h-3.5 w-3.5" />
                                    Upgrade
                                </Button>
                            )}
                            {currentPlan === 'FREE' && practiceStatus.sessions_remaining > 0 && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs">
                                    FREE
                                </Badge>
                            )}
                        </div>
                    </div>
                </Card>
            )}

            {/* Practice Exams Grid */}
            <div>
                <h2 className="text-lg font-semibold text-foreground mb-4">Your Practice Exams</h2>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {examsLoading ? (
                        Array(3).fill(0).map((_, i) => (
                            <Card key={i} className="p-6 space-y-4">
                                <Skeleton className="h-6 w-3/4" />
                                <Skeleton className="h-4 w-1/2" />
                                <Skeleton className="h-10 w-full" />
                            </Card>
                        ))
                    ) : !exams || exams.length === 0 ? (
                        <div className="col-span-full">
                            <EmptyState
                                icon={Target}
                                title="No Practice Exams Yet"
                                description="Create your first practice session to start preparing for your viva."
                                action={{ label: 'Create Practice Session', href: '/student/practice/create' }}
                            />
                        </div>
                    ) : (
                        exams.map((exam: any) => (
                            <Card key={exam.id} className="p-6 group hover:border-primary/30 transition-all card-hover">
                                <div className="flex justify-between items-start mb-4 gap-3">
                                    <div className="min-w-0 flex-1">
                                        <h3 className="font-bold text-foreground text-lg truncate group-hover:text-primary transition-colors">
                                            {exam.title}
                                        </h3>
                                        <p className="text-xs text-muted-foreground font-mono mt-1">
                                            {exam.exam_code}
                                        </p>
                                    </div>
                                    <KBStatusBadge status={exam.kb_status} />
                                </div>

                                {exam.instructions && (
                                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                        {exam.instructions}
                                    </p>
                                )}

                                <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-border/50 pt-3 mt-auto">
                                    <div className="flex items-center gap-1.5">
                                        <Clock className="h-3 w-3" />
                                        {exam.created_at ? formatToLocalDateTime(exam.created_at) : 'N/A'}
                                    </div>
                                </div>

                                <Button
                                    asChild
                                    className="w-full mt-4 font-semibold"
                                    disabled={exam.kb_status !== 'READY'}
                                >
                                    <Link href={`/student/practice/${exam.id}`}>
                                        {exam.kb_status === 'PROCESSING' ? 'Preparing...' :
                                            exam.kb_status === 'FAILED' ? 'Retry Setup' :
                                                'View & Start'}
                                    </Link>
                                </Button>
                            </Card>
                        ))
                    )}
                </div>
            </div>

            {/* Plans Modal */}
            <PracticePlansModal
                open={showPlansModal}
                onOpenChange={setShowPlansModal}
            />
        </main>
    );
}
