'use client';

import React, { useCallback, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PracticePlansModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubscribed?: () => void;
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
    FREE: <Sparkles className="h-5 w-5" />,
    LITE: <Zap className="h-5 w-5" />,
    PLUS: <Crown className="h-5 w-5" />,
};

const PLAN_COLORS: Record<string, { bg: string; border: string; text: string; badge: string }> = {
    FREE: {
        bg: 'bg-muted/30',
        border: 'border-border',
        text: 'text-muted-foreground',
        badge: 'bg-muted text-muted-foreground',
    },
    LITE: {
        bg: 'bg-blue-500/5',
        border: 'border-blue-500/30',
        text: 'text-blue-500',
        badge: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    },
    PLUS: {
        bg: 'bg-purple-500/5',
        border: 'border-purple-500/30',
        text: 'text-purple-500',
        badge: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
    },
};

export function PracticePlansModal({ open, onOpenChange, onSubscribed }: PracticePlansModalProps) {
    const queryClient = useQueryClient();
    const [subscribingPlan, setSubscribingPlan] = useState<string | null>(null);

    const { data: plansData } = useQuery({
        queryKey: ['practice-plans'],
        queryFn: () => api.practice.getPlans(),
        enabled: open,
    });

    const { data: practiceStatus } = useQuery({
        queryKey: ['practice-status'],
        queryFn: () => api.practice.getStatus(),
        enabled: open,
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

    const subscribeMutation = useMutation({
        mutationFn: async (planId: string) => {
            setSubscribingPlan(planId);

            const loaded = await loadRazorpayScript();
            if (!loaded) throw new Error('Failed to load payment gateway.');

            const order = await api.practice.subscribe(planId);

            return new Promise<void>((resolve, reject) => {
                const options = {
                    key: order.key_id,
                    amount: order.amount,
                    currency: order.currency,
                    name: 'Scire',
                    description: `Practice ${order.plan_name} Plan`,
                    order_id: order.order_id,
                    handler: async (response: any) => {
                        try {
                            await api.practice.verifySubscription({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    },
                    modal: {
                        ondismiss: () => {
                            setSubscribingPlan(null);
                            reject(new Error('Payment cancelled'));
                        },
                    },
                    theme: { color: '#6366f1' },
                };

                const rzp = new window.Razorpay(options);
                rzp.open();
            });
        },
        onSuccess: () => {
            setSubscribingPlan(null);
            toast.success('🎉 Plan activated! Your practice sessions are ready.');
            queryClient.invalidateQueries({ queryKey: ['practice-status'] });
            queryClient.invalidateQueries({ queryKey: ['practice-plans'] });
            onOpenChange(false);
            onSubscribed?.();
        },
        onError: (error: any) => {
            setSubscribingPlan(null);
            if (error?.message !== 'Payment cancelled') {
                toast.error(error?.response?.data?.detail || 'Subscription failed. Please try again.');
            }
        },
    });

    const currentPlan = practiceStatus?.plan || 'FREE';
    const plans = plansData?.plans || [];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[700px] p-0 gap-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle className="text-xl font-bold">Choose Your Practice Plan</DialogTitle>
                    <DialogDescription>
                        {currentPlan === 'FREE'
                            ? 'Upgrade to unlock unlimited practice and detailed analytics.'
                            : `You're on the ${currentPlan} plan. Upgrade for more sessions.`
                        }
                    </DialogDescription>
                </DialogHeader>

                <div className="grid md:grid-cols-3 gap-4 p-6 pt-4">
                    {plans.map((plan: any) => {
                        const colors = PLAN_COLORS[plan.id] || PLAN_COLORS.FREE;
                        const isCurrent = currentPlan === plan.id;
                        const isPopular = plan.id === 'LITE';
                        const isDisabled = isCurrent || subscribingPlan !== null;

                        return (
                            <div
                                key={plan.id}
                                className={`
                                    relative rounded-xl border-2 p-5 flex flex-col transition-all
                                    ${isCurrent ? 'ring-2 ring-primary/30' : ''}
                                    ${isPopular ? `${colors.border} ${colors.bg} shadow-md` : `border-border ${colors.bg}`}
                                `}
                            >
                                {/* Popular badge */}
                                {isPopular && (
                                    <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-[10px] px-2 py-0.5 shadow-sm">
                                        MOST POPULAR
                                    </Badge>
                                )}

                                {/* Header */}
                                <div className="flex items-center gap-2 mb-3">
                                    <div className={`${colors.text}`}>
                                        {PLAN_ICONS[plan.id]}
                                    </div>
                                    <span className="font-bold text-foreground">{plan.name}</span>
                                    {isCurrent && (
                                        <Badge variant="secondary" className="text-[10px] ml-auto">
                                            CURRENT
                                        </Badge>
                                    )}
                                </div>

                                {/* Price */}
                                <div className="mb-4">
                                    {plan.price_inr > 0 ? (
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-3xl font-extrabold text-foreground">₹{plan.price_inr}</span>
                                            <span className="text-sm text-muted-foreground">/mo</span>
                                        </div>
                                    ) : (
                                        <span className="text-3xl font-extrabold text-foreground">Free</span>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-1">
                                        {plan.is_unlimited
                                            ? 'Unlimited sessions'
                                            : plan.is_lifetime_limit
                                                ? `${plan.sessions_per_month} sessions total`
                                                : `${plan.sessions_per_month} sessions/month`
                                        }
                                    </p>
                                </div>

                                {/* Features */}
                                <ul className="space-y-2 mb-5 flex-1">
                                    {(plan.features || []).map((feature: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                            <Check className={`h-3.5 w-3.5 shrink-0 mt-0.5 ${colors.text}`} />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                {/* CTA */}
                                {plan.id === 'FREE' ? (
                                    <Button variant="outline" disabled className="w-full text-xs h-9">
                                        {isCurrent ? 'Current Plan' : 'Default'}
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => subscribeMutation.mutate(plan.id)}
                                        disabled={isDisabled}
                                        className={`w-full text-xs h-9 font-semibold ${isPopular
                                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                : 'bg-purple-500 hover:bg-purple-600 text-white'
                                            }`}
                                    >
                                        {subscribingPlan === plan.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                                        ) : null}
                                        {isCurrent
                                            ? 'Current Plan'
                                            : subscribingPlan === plan.id
                                                ? 'Processing...'
                                                : `Upgrade to ${plan.name}`
                                        }
                                    </Button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Footer info */}
                <div className="px-6 pb-5 text-center">
                    <p className="text-[11px] text-muted-foreground">
                        All plans are billed monthly • Cancel anytime • Secure payment via Razorpay
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
