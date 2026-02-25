'use client';

import React, { useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/dashboard/page-header';
import {
    ArrowLeft, Play, Loader2, CheckCircle, XCircle,
    Clock, BookOpen, CreditCard, Sparkles, RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export default function PracticeDetailPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const examId = params.id as string;

    const { data: exam, isLoading } = useQuery({
        queryKey: ['practice-exam', examId],
        queryFn: () => api.practice.getExam(examId),
        refetchInterval: (query) => {
            const data = query.state.data as any;
            return data?.kb_status === 'PROCESSING' ? 3000 : false;
        },
    });

    const { data: sessions } = useQuery({
        queryKey: ['practice-sessions'],
        queryFn: () => api.practice.listSessions(),
    });

    const { data: practiceStatus } = useQuery({
        queryKey: ['practice-status'],
        queryFn: () => api.practice.getStatus(),
    });

    const startMutation = useMutation({
        mutationFn: (paymentOrderId?: string) =>
            api.practice.startSession(examId, paymentOrderId),
        onSuccess: (data: any) => {
            toast.success('Practice session started!');
            queryClient.invalidateQueries({ queryKey: ['practice-sessions'] });
            router.push(`/student/exam/${data.id}/session`);
        },
        onError: (error: any) => {
            const status = error?.response?.status;
            const detail = error?.response?.data?.detail;

            if (status === 409 && detail?.active_session_id) {
                toast.info('Resuming your active practice session...');
                router.push(`/student/exam/${detail.active_session_id}/session`);
            } else if (status === 402) {
                handlePaymentFlow();
            } else {
                const message = typeof detail === 'string' ? detail : detail?.message || 'Failed to start session.';
                toast.error(message);
            }
        },
    });

    const loadRazorpayScript = useCallback((): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    }, []);

    const handlePaymentFlow = useCallback(async () => {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
            toast.error('Failed to load payment gateway.');
            return;
        }

        try {
            const order = await api.practice.createPaymentOrder();
            if (order.free) {
                startMutation.mutate(undefined);
                return;
            }

            const options = {
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Scire',
                description: 'Practice Viva Session',
                order_id: order.order_id,
                handler: async (response: any) => {
                    try {
                        await api.practice.verifyPayment({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('Payment successful!');
                        startMutation.mutate(response.razorpay_order_id);
                    } catch {
                        toast.error('Payment verification failed.');
                    }
                },
                theme: { color: '#6366f1' },
            };

            const rzp = new window.Razorpay(options);
            rzp.open();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || 'Payment failed.');
        }
    }, [loadRazorpayScript, startMutation]);

    const handleStart = useCallback(() => {
        const isFree = practiceStatus?.free_remaining > 0;
        if (isFree) {
            startMutation.mutate(undefined);
        } else {
            handlePaymentFlow();
        }
    }, [practiceStatus, startMutation, handlePaymentFlow]);

    const examSessions = (sessions || []).filter(
        (s: any) => s.exam_id === examId
    );

    if (isLoading) {
        return (
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full" />
            </main>
        );
    }

    if (!exam) {
        return (
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
                <p className="text-muted-foreground">Practice exam not found.</p>
                <Button asChild variant="outline">
                    <Link href="/student/practice">← Back to Practice</Link>
                </Button>
            </main>
        );
    }

    const isReady = exam.kb_status === 'READY';
    const isProcessing = exam.kb_status === 'PROCESSING';
    const isFailed = exam.kb_status === 'FAILED';

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" asChild className="shrink-0">
                    <Link href="/student/practice">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <PageHeader
                    title={exam.title}
                    description={`Code: ${exam.exam_code}`}
                />
            </div>

            {/* Status Card */}
            <Card className={`p-6 ${isProcessing ? 'border-amber-500/20 bg-amber-500/5' : isReady ? 'border-emerald-500/20 bg-emerald-500/5' : isFailed ? 'border-destructive/20 bg-destructive/5' : ''}`}>
                <div className="flex items-center gap-4">
                    {isProcessing && (
                        <>
                            <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                                <Loader2 className="h-6 w-6 text-amber-500 animate-spin" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-foreground">Preparing Your Exam...</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    The AI is analyzing your content and generating questions. This usually takes 1-2 minutes.
                                </p>
                            </div>
                        </>
                    )}
                    {isReady && (
                        <>
                            <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                                <CheckCircle className="h-6 w-6 text-emerald-500" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">Ready to Practice!</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {exam.rubric_count} rubrics generated • Click Start to begin your viva.
                                </p>
                            </div>
                        </>
                    )}
                    {isFailed && (
                        <>
                            <div className="bg-destructive/10 p-3 rounded-xl border border-destructive/20">
                                <XCircle className="h-6 w-6 text-destructive" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-foreground">Processing Failed</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Something went wrong while analyzing your content. Please try creating again.
                                </p>
                            </div>
                            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
                                <Link href="/student/practice/create">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                    Retry
                                </Link>
                            </Button>
                        </>
                    )}
                </div>
            </Card>

            {/* Details */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                        Session Details
                    </div>
                    <div className="space-y-3 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration</span>
                            <span className="font-mono text-foreground">{exam.settings?.duration_minutes || 15} min</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Questions</span>
                            <span className="font-mono text-foreground">~{exam.settings?.max_questions || 8}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Rubrics</span>
                            <span className="font-mono text-foreground">{exam.rubric_count || 0}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Attempts</span>
                            <span className="font-mono text-foreground">{exam.session_count || 0}</span>
                        </div>
                    </div>
                </Card>

                <Card className="p-6 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Pricing
                    </div>
                    <div className="space-y-3 text-sm">
                        {practiceStatus?.free_remaining > 0 ? (
                            <div className="p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-center">
                                <Sparkles className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                                <p className="font-semibold text-foreground">First Session Free!</p>
                                <p className="text-xs text-muted-foreground mt-1">No payment needed</p>
                            </div>
                        ) : (
                            <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center">
                                <p className="text-2xl font-bold text-foreground">₹19</p>
                                <p className="text-xs text-muted-foreground mt-1">per practice session</p>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* Instructions Preview */}
            {exam.instructions && (
                <Card className="p-6 space-y-3">
                    <h3 className="text-sm font-medium text-foreground">Your Instructions</h3>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {exam.instructions}
                    </p>
                </Card>
            )}

            {/* Start Button */}
            {isReady && (
                <Button
                    onClick={handleStart}
                    disabled={startMutation.isPending}
                    className="w-full h-14 font-semibold text-lg gap-3"
                    size="lg"
                >
                    {startMutation.isPending ? (
                        <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Starting...
                        </>
                    ) : (
                        <>
                            <Play className="h-5 w-5" />
                            {practiceStatus?.free_remaining > 0 ? 'Start Free Practice' : 'Pay ₹19 & Start Practice'}
                        </>
                    )}
                </Button>
            )}

            {/* Past Sessions */}
            {examSessions.length > 0 && (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-foreground">Past Attempts</h3>
                    <div className="grid gap-3">
                        {examSessions.map((session: any) => (
                            <Card key={session.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">
                                            {session.created_at ? formatToLocalDateTime(session.created_at) : 'N/A'}
                                        </span>
                                    </div>
                                    <Badge variant={session.status === 'COMPLETED' ? 'secondary' : 'outline'}>
                                        {session.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-3">
                                    {session.final_score !== null && (
                                        <span className="text-lg font-bold text-primary">
                                            {Math.round(session.final_score)}%
                                        </span>
                                    )}
                                    {session.status === 'COMPLETED' && (
                                        <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:text-primary">
                                            <Link href={`/student/practice/${examId}/report?session=${session.id}`}>
                                                Report →
                                            </Link>
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </main>
    );
}
