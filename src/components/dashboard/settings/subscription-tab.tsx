'use client';

import React, { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { UserRole } from '@/types/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
    CreditCard, Sparkles, Zap, Crown, Download,
    TrendingUp, Users, BookOpen, Radio, ShieldCheck,
    ChevronRight, CheckCircle, ArrowUpRight, Receipt,
    Calendar, Clock, BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ────────────────────────────────────────────────
// Re-export the tab label & visibility helpers
// ────────────────────────────────────────────────

export function getSubscriptionTabLabel(role?: string): string {
    switch (role) {
        case UserRole.ADMIN: return 'Billing';
        case UserRole.STUDENT: return 'Subscription';
        case UserRole.INSTRUCTOR: return 'Usage';
        default: return 'Billing';
    }
}

export function shouldShowSubscriptionTab(role?: string): boolean {
    return role === UserRole.ADMIN
        || role === UserRole.STUDENT
        || role === UserRole.INSTRUCTOR;
}


// ────────────────────────────────────────────────
// Main component — role router
// ────────────────────────────────────────────────

export function SubscriptionTab() {
    const { user } = useAuth();

    switch (user?.role) {
        case UserRole.ADMIN:
            return <AdminBillingView />;
        case UserRole.STUDENT:
            return <StudentPlanView />;
        case UserRole.INSTRUCTOR:
            return <InstructorUsageView />;
        default:
            return null;
    }
}


// ══════════════════════════════════════════════════
// 1. ADMIN — Full Tenant Billing
// ══════════════════════════════════════════════════

function AdminBillingView() {
    // Delegate to the existing BillingTab (it's already excellent)
    const { BillingTab } = require('@/components/dashboard/settings/billing-tab');
    return <BillingTab />;
}


// ══════════════════════════════════════════════════
// 2. STUDENT — Practice Plan + Subscription
// ══════════════════════════════════════════════════

const PLAN_ICON: Record<string, React.ReactNode> = {
    FREE: <Sparkles className="h-5 w-5" />,
    LITE: <Zap className="h-5 w-5" />,
    PLUS: <Crown className="h-5 w-5" />,
};

const PLAN_GRADIENT: Record<string, string> = {
    FREE: 'from-slate-500/10 to-slate-500/5',
    LITE: 'from-blue-500/10 to-blue-500/5',
    PLUS: 'from-purple-500/10 to-purple-500/5',
};

const PLAN_ACCENT: Record<string, string> = {
    FREE: 'text-slate-500',
    LITE: 'text-blue-500',
    PLUS: 'text-purple-500',
};

function StudentPlanView() {
    const queryClient = useQueryClient();
    const [showPlans, setShowPlans] = useState(false);

    const { data: status, isLoading } = useQuery({
        queryKey: ['practice-status'],
        queryFn: () => api.practice.getStatus(),
    });

    const { data: plansData } = useQuery({
        queryKey: ['practice-plans'],
        queryFn: () => api.practice.getPlans(),
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[200px] w-full rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[280px] rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const currentPlan = status?.plan || 'FREE';
    const gradient = PLAN_GRADIENT[currentPlan] || PLAN_GRADIENT.FREE;
    const accent = PLAN_ACCENT[currentPlan] || PLAN_ACCENT.FREE;
    const plans = plansData?.plans || [];

    return (
        <div className="space-y-8">
            {/* Current Plan Hero */}
            <Card className={cn(
                "relative overflow-hidden border-0 shadow-lg",
                `bg-gradient-to-br ${gradient}`
            )}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
                <CardContent className="p-8 relative">
                    <div className="flex items-start justify-between flex-wrap gap-6">
                        <div className="flex items-center gap-5">
                            <div className={cn(
                                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm border",
                                currentPlan === 'PLUS' ? 'bg-purple-500/10 border-purple-500/20' :
                                    currentPlan === 'LITE' ? 'bg-blue-500/10 border-blue-500/20' :
                                        'bg-muted border-border'
                            )}>
                                <span className={accent}>{PLAN_ICON[currentPlan]}</span>
                            </div>
                            <div>
                                <div className="flex items-center gap-2.5">
                                    <h3 className="text-xl font-bold text-foreground">
                                        {status?.plan_name || currentPlan} Plan
                                    </h3>
                                    <Badge className={cn(
                                        "text-[10px] font-semibold uppercase tracking-wider",
                                        currentPlan === 'FREE'
                                            ? "bg-muted text-muted-foreground"
                                            : "bg-primary/10 text-primary border-primary/20"
                                    )}>
                                        {currentPlan === 'FREE' ? 'FREE TIER' : 'ACTIVE'}
                                    </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {status?.is_unlimited
                                        ? 'Unlimited practice sessions'
                                        : `${status?.sessions_remaining ?? 0} of ${status?.sessions_limit ?? 0} sessions remaining`
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Usage ring */}
                        {!status?.is_unlimited && (
                            <div className="flex items-center gap-4">
                                <div className="relative w-16 h-16">
                                    <svg className="w-full h-full -rotate-90" viewBox="0 0 48 48">
                                        <circle cx="24" cy="24" r="20" fill="none" stroke="currentColor" strokeWidth="3" className="text-muted/30" />
                                        <circle
                                            cx="24" cy="24" r="20" fill="none"
                                            stroke="currentColor" strokeWidth="3" strokeLinecap="round"
                                            className={accent}
                                            strokeDasharray={`${Math.min(((status?.sessions_used || 0) / Math.max(status?.sessions_limit || 1, 1)) * 125.7, 125.7)} 125.7`}
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                                        {status?.sessions_used || 0}
                                    </span>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs font-medium text-muted-foreground">Used</p>
                                    <p className="text-sm font-bold text-foreground">
                                        {status?.sessions_used || 0} / {status?.sessions_limit || 0}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Plan Cards */}
            <div>
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Available Plans</h3>
                        <p className="text-sm text-muted-foreground">Choose the plan that fits your study needs</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-5">
                    {plans.map((plan: any) => {
                        const isCurrent = currentPlan === plan.id;
                        const planAccent = PLAN_ACCENT[plan.id] || 'text-foreground';
                        const isPopular = plan.id === 'LITE';

                        return (
                            <Card
                                key={plan.id}
                                className={cn(
                                    "relative overflow-hidden transition-all duration-300 group",
                                    isCurrent
                                        ? "border-primary/40 shadow-md ring-1 ring-primary/20"
                                        : "border-border/60 hover:border-primary/30 hover:shadow-md",
                                    isPopular && !isCurrent && "border-blue-500/30"
                                )}
                            >
                                {isPopular && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-blue-400" />
                                )}
                                {isCurrent && (
                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-primary/60" />
                                )}

                                <CardContent className="p-6 flex flex-col h-full">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2.5">
                                            <div className={cn(
                                                "w-9 h-9 rounded-lg flex items-center justify-center",
                                                isCurrent ? "bg-primary/10" : "bg-muted/50"
                                            )}>
                                                <span className={isCurrent ? "text-primary" : planAccent}>
                                                    {PLAN_ICON[plan.id]}
                                                </span>
                                            </div>
                                            <h4 className="font-bold text-foreground">{plan.name}</h4>
                                        </div>
                                        {isCurrent && (
                                            <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">
                                                CURRENT
                                            </Badge>
                                        )}
                                        {isPopular && !isCurrent && (
                                            <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 text-[10px]">
                                                POPULAR
                                            </Badge>
                                        )}
                                    </div>

                                    <div className="mb-5">
                                        {plan.price_inr > 0 ? (
                                            <div className="flex items-baseline gap-1">
                                                <span className="text-3xl font-extrabold text-foreground">₹{plan.price_inr}</span>
                                                <span className="text-sm text-muted-foreground font-medium">/mo</span>
                                            </div>
                                        ) : (
                                            <span className="text-3xl font-extrabold text-foreground">Free</span>
                                        )}
                                        <p className="text-xs text-muted-foreground mt-1.5">
                                            {plan.is_unlimited ? 'Unlimited sessions' :
                                                plan.is_lifetime_limit ? `${plan.sessions_per_month} sessions total` :
                                                    `${plan.sessions_per_month} sessions/month`}
                                        </p>
                                    </div>

                                    <ul className="space-y-2.5 mb-6 flex-1">
                                        {(plan.features || []).map((f: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2.5 text-xs text-muted-foreground">
                                                <CheckCircle className={cn("h-3.5 w-3.5 shrink-0 mt-0.5", planAccent)} />
                                                {f}
                                            </li>
                                        ))}
                                    </ul>

                                    {plan.id !== 'FREE' && !isCurrent ? (
                                        <SubscribeButton planId={plan.id} planName={plan.name} isPopular={isPopular} />
                                    ) : (
                                        <Button variant="outline" disabled className="w-full text-xs h-9 font-medium">
                                            {isCurrent ? '✓ Current Plan' : 'Default Plan'}
                                        </Button>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// Subscribe button with inline Razorpay
function SubscribeButton({ planId, planName, isPopular }: { planId: string; planName: string; isPopular: boolean }) {
    const [loading, setLoading] = useState(false);
    const queryClient = useQueryClient();

    const handleSubscribe = useCallback(async () => {
        setLoading(true);
        try {
            // Load Razorpay
            if (!window.Razorpay) {
                const script = document.createElement('script');
                script.src = 'https://checkout.razorpay.com/v1/checkout.js';
                await new Promise<void>((resolve, reject) => {
                    script.onload = () => resolve();
                    script.onerror = () => reject();
                    document.body.appendChild(script);
                });
            }

            const order = await api.practice.subscribe(planId);
            const rzp = new window.Razorpay({
                key: order.key_id,
                amount: order.amount,
                currency: order.currency,
                name: 'Scire',
                description: `Practice ${planName} Plan`,
                order_id: order.order_id,
                handler: async (response: any) => {
                    try {
                        await api.practice.verifySubscription({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                        });
                        toast.success('🎉 Plan activated!');
                        queryClient.invalidateQueries({ queryKey: ['practice-status'] });
                        queryClient.invalidateQueries({ queryKey: ['practice-plans'] });
                    } catch {
                        toast.error('Payment verification failed.');
                    }
                    setLoading(false);
                },
                modal: { ondismiss: () => setLoading(false) },
                theme: { color: '#6366f1' },
            });
            rzp.open();
        } catch (e: any) {
            toast.error(e?.response?.data?.detail || 'Failed to start payment.');
            setLoading(false);
        }
    }, [planId, planName, queryClient]);

    return (
        <Button
            onClick={handleSubscribe}
            disabled={loading}
            className={cn(
                "w-full text-xs h-9 font-semibold gap-2 transition-all",
                isPopular
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-sm"
                    : "bg-purple-500 hover:bg-purple-600 text-white shadow-sm"
            )}
        >
            {loading ? 'Processing...' : (
                <>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Upgrade to {planName}
                </>
            )}
        </Button>
    );
}


// ══════════════════════════════════════════════════
// 3. INSTRUCTOR — Read-Only Usage Limits
// ══════════════════════════════════════════════════

function InstructorUsageView() {
    const { tenantId, subscriptionTier } = useTenant();

    const { data: usageData, isLoading } = useQuery({
        queryKey: ['tenant-usage'],
        queryFn: api.tenant.getUsage,
        enabled: !!tenantId,
    });

    if (isLoading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-[120px] w-full rounded-2xl" />
                <div className="grid md:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-[160px] rounded-2xl" />)}
                </div>
            </div>
        );
    }

    const students = usageData?.current?.students || 0;
    const studentLimit = usageData?.limits?.max_students || 0;
    const exams = usageData?.current?.exams_this_month || 0;
    const examLimit = usageData?.limits?.max_exams_per_month || 0;
    const sessions = usageData?.current?.sessions_this_month || 0;
    const sessionLimit = usageData?.limits?.max_sessions_per_month || 0;

    const meters = [
        {
            label: 'Students',
            icon: <Users className="h-4.5 w-4.5" />,
            used: students,
            limit: studentLimit,
            color: 'from-blue-500 to-blue-400',
            bgColor: 'bg-blue-500/10',
            textColor: 'text-blue-500',
        },
        {
            label: 'Exams this month',
            icon: <BookOpen className="h-4.5 w-4.5" />,
            used: exams,
            limit: examLimit,
            color: 'from-amber-500 to-amber-400',
            bgColor: 'bg-amber-500/10',
            textColor: 'text-amber-500',
        },
        {
            label: 'AI Sessions this month',
            icon: <Radio className="h-4.5 w-4.5" />,
            used: sessions,
            limit: sessionLimit,
            color: 'from-purple-500 to-purple-400',
            bgColor: 'bg-purple-500/10',
            textColor: 'text-purple-500',
        },
    ];

    return (
        <div className="space-y-8">
            {/* Plan Badge */}
            <Card className="border-0 bg-gradient-to-br from-muted/40 to-muted/20 shadow-sm">
                <CardContent className="p-6 flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-bold text-foreground">
                                {subscriptionTier
                                    ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1)
                                    : 'Starter'
                                } Plan
                            </h3>
                            <p className="text-xs text-muted-foreground">Your organization's current plan limits</p>
                        </div>
                    </div>
                    <Badge variant="secondary" className="text-xs px-3 py-1.5 bg-muted border-border">
                        <BarChart3 className="h-3 w-3 mr-1.5" /> Read-Only
                    </Badge>
                </CardContent>
            </Card>

            {/* Usage Meters */}
            <div className="grid md:grid-cols-3 gap-5">
                {meters.map((m) => {
                    const isUnlimited = m.limit === null || m.limit === -1 || m.limit === 0;
                    const pct = isUnlimited ? 0 : Math.min((m.used / Math.max(m.limit, 1)) * 100, 100);
                    const isHigh = pct > 80;

                    return (
                        <Card key={m.label} className={cn(
                            "border-border/60 transition-all",
                            isHigh && "border-amber-500/30"
                        )}>
                            <CardContent className="p-6 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2.5">
                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.bgColor)}>
                                            <span className={m.textColor}>{m.icon}</span>
                                        </div>
                                        <span className="text-sm font-semibold text-foreground">{m.label}</span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Used</span>
                                        <span className="font-bold text-foreground">
                                            {m.used} / {isUnlimited ? '∞' : m.limit}
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                                        <div
                                            className={cn(
                                                "h-full rounded-full bg-gradient-to-r transition-all duration-700",
                                                isHigh ? 'from-amber-500 to-red-400' : m.color
                                            )}
                                            style={{ width: isUnlimited ? '0%' : `${pct}%` }}
                                        />
                                    </div>
                                    {!isUnlimited && (
                                        <p className="text-[10px] text-muted-foreground text-right">
                                            {Math.round(pct)}% used
                                        </p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Usage limits are managed by your organization admin. Contact them if you need higher limits.
            </p>
        </div>
    );
}
