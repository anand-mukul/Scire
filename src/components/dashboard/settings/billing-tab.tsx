'use client';

import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { useTenant } from '@/contexts/TenantContext';
import { PricingCards, PlanData } from '@/components/content/pricing/pricing-cards';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, History, Download } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

import { toast } from 'sonner';
import Script from 'next/script';
import { Logger } from '@/lib/logger';

declare global {
    interface Window {
        Razorpay: any;
    }
}

export function BillingTab() {
    const { tenantId, subscriptionTier } = useTenant();
    const queryClient = useQueryClient();
    const [isProcessing, setIsProcessing] = React.useState(false);

    // Fetch Plans
    const { data: plansData, isLoading: isLoadingPlans, error: plansError } = useQuery({
        queryKey: ['billing-plans'],
        queryFn: api.billing.getPlans,
        enabled: !!tenantId,
        staleTime: 60000,
    });

    // Fetch History
    const { data: historyData, isLoading: isLoadingHistory } = useQuery({
        queryKey: ['billing-history'],
        queryFn: () => api.billing.getHistory({ limit: 10 }),
        enabled: !!tenantId,
    });

    // Fetch Usage
    const { data: usageData, isLoading: isLoadingUsage } = useQuery({
        queryKey: ['tenant-usage'],
        queryFn: api.tenant.getUsage,
        enabled: !!tenantId,
    });

    // Transform backend plans to component format
    const transformedPlans: PlanData[] = React.useMemo(() => {
        if (!plansData?.plans) return [];

        const tiers = { 'starter': 1, 'pro': 2, 'enterprise': 3 };
        const currentTierLevel = tiers[subscriptionTier?.toLowerCase() as keyof typeof tiers] || 0;

        return plansData.plans.map((plan: any) => {
            const planId = plan.id?.toLowerCase();
            const tierLevel = tiers[planId as keyof typeof tiers] || 0;
            const isCurrent = planId === subscriptionTier?.toLowerCase();

            // Define standardized features for comparison
            // This ensures we have checked/crossed items for every plan
            const features = [
                {
                    label: "Students",
                    value: plan.limits.max_students === -1 ? "Unlimited" : `${plan.limits.max_students}`,
                    included: true
                },
                {
                    label: "Exams per month",
                    value: plan.limits.max_exams_per_month === -1 ? "Unlimited" : `${plan.limits.max_exams_per_month}`,
                    included: true
                },
                {
                    label: "AI Sessions/mo",
                    value: plan.limits.max_sessions_per_month === -1 ? "Unlimited" : `${plan.limits.max_sessions_per_month}`,
                    included: true
                },
                { label: "Basic Proctoring", included: true },
                { label: "Advanced Proctoring", included: planId !== 'starter' },
                { label: "Priority Support", included: planId !== 'starter' },
                { label: "Advanced Analytics", included: planId !== 'starter' },
                { label: "Custom AI Models", included: planId === 'enterprise' },
                { label: "SSO Integration", included: planId === 'enterprise' }
            ];

            return {
                id: plan.id,
                name: plan.name,
                description: plan.description,
                price: plan.price_inr > 0 ? plan.price_inr : (planId === 'enterprise' ? 'Contact Sales' : 'Free'),
                features: features,
                isCurrent: isCurrent,
                isPopular: planId === 'pro',
                tierLevel: tierLevel,
                currentTierLevel: currentTierLevel,
                ctaText: "Upgrade",
            };
        });
    }, [plansData, subscriptionTier]);

    // Handle Upgrade
    const handleUpgrade = async (planId: string, billingCycle: 'MONTHLY' | 'YEARLY') => {
        setIsProcessing(true);
        try {
            // 1. Create Order
            const order = await api.payments.createOrder({
                plan_id: planId,
                billing_cycle: billingCycle,
                currency: 'INR'
            });

            // 2. Open Razorpay Checkout
            if (!window.Razorpay) {
                toast.error('Razorpay SDK failed to load');
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
                name: "Scire Platform",
                description: `Upgrade to ${planId.toUpperCase()} (${billingCycle})`,
                order_id: order.id,
                handler: async function (response: any) {
                    try {
                        const loadingToast = toast.loading('Verifying payment...');
                        // 3. Verify Payment
                        await api.payments.verify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        toast.dismiss(loadingToast);
                        toast.success('Subscription updated successfully!');

                        // Refresh Data
                        queryClient.invalidateQueries({ queryKey: ['billing-plans'] });
                        queryClient.invalidateQueries({ queryKey: ['billing-history'] });
                        queryClient.invalidateQueries({ queryKey: ['tenant-details'] });
                        queryClient.invalidateQueries({ queryKey: ['tenant-usage'] });
                    } catch (verifyError) {
                        toast.error('Payment verification failed');
                        Logger.error('Payment verification failed:', verifyError);
                    }
                },
                theme: {
                    color: "#7C3AED"
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response: any) {
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();

        } catch (error) {
            Logger.error('Upgrade failed:', error);
            toast.error('Failed to initiate upgrade');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoadingPlans || isLoadingUsage) {
        return (
            <div className="space-y-8">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="grid md:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                        <Skeleton key={i} className="h-[400px] w-full rounded-3xl" />
                    ))}
                </div>
            </div>
        );
    }

    if (plansError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load subscription plans. Please try refreshing the page.
                </AlertDescription>
            </Alert>
        );
    }

    // Calculate usage percentages
    const studentUsage = usageData?.current?.students || 0;
    const studentLimit = usageData?.limits?.max_students || 100;
    const studentPercent = studentLimit === -1 ? 0 : Math.min((studentUsage / studentLimit) * 100, 100);

    const examUsage = usageData?.current?.exams_this_month || 0;
    const examLimit = usageData?.limits?.max_exams_per_month || 10;
    const examPercent = examLimit === -1 ? 0 : Math.min((examUsage / examLimit) * 100, 100);

    const sessionUsage = usageData?.current?.sessions_this_month || 0;
    const sessionLimit = usageData?.limits?.max_sessions_per_month || 50;
    const sessionPercent = sessionLimit === -1 ? 0 : Math.min((sessionUsage / sessionLimit) * 100, 100);

    return (
        <div className="space-y-12 animate-fade-in relative">
            <Script
                id="razorpay-checkout-js"
                src="https://checkout.razorpay.com/v1/checkout.js"
            />

            {/* Header Section */}
            <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Current Plan & Usage - Replaces Mock & "Payment Method" */}
                <Card className="w-full border-primary/20 bg-gradient-to-br from-primary/5 via-primary/5 to-background shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3">
                        <Badge className="bg-primary/90 text-primary-foreground hover:bg-primary shadow-sm">
                            {subscriptionTier ? subscriptionTier.charAt(0).toUpperCase() + subscriptionTier.slice(1) : 'Free'} Plan
                        </Badge>
                    </div>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            Usage Overview
                        </CardTitle>
                        <CardDescription>
                            Your current billing cycle usage.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Students Usage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Students</span>
                                <span className="text-muted-foreground">
                                    {studentUsage} / {studentLimit === -1 ? 'Unlimited' : studentLimit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${studentPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Exams Usage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">Exams (this month)</span>
                                <span className="text-muted-foreground">
                                    {examUsage} / {examLimit === -1 ? 'Unlimited' : examLimit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${examPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Sessions Usage */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex flex-col">
                                    <span className="font-medium">AI Sessions</span>
                                    <span className="text-[10px] text-muted-foreground">Includes Public Exams</span>
                                </div>
                                <span className="text-muted-foreground">
                                    {sessionUsage} / {sessionLimit === -1 ? 'Unlimited' : sessionLimit}
                                </span>
                            </div>
                            <div className="h-2 w-full bg-primary/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${sessionPercent}%` }}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="text-center max-w-2xl mx-auto space-y-2">
                <h2 className="text-2xl font-bold tracking-tight">Available Plans</h2>
                <p className="text-muted-foreground">
                    Upgrade your plan to unlock more exams, advanced proctoring, and larger student capacity.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className={cn("transition-opacity duration-200", isProcessing && "opacity-50 pointer-events-none")}>
                <PricingCards
                    plans={transformedPlans}
                    variant="admin"
                    onUpgrade={handleUpgrade}
                />
            </div>

            {/* Payment History */}
            {historyData?.payments?.length > 0 && (
                <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm mt-12 overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-muted-foreground" />
                            <CardTitle className="text-lg">Payment History</CardTitle>
                        </div>
                        <CardDescription>Recent transactions and invoices.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/40">
                            {historyData.payments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                    <div className="flex flex-col gap-0.5">
                                        <span className="font-medium text-sm">
                                            {p.plan_id ? `${p.plan_id.charAt(0).toUpperCase() + p.plan_id.slice(1)} Plan Upgrade` : 'Subscription Payment'}
                                        </span>
                                        <span className="text-xs text-muted-foreground font-mono">
                                            {new Date(p.created_at).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="font-semibold text-sm">₹{p.amount_inr?.toLocaleString('en-IN')}</span>
                                        <Badge
                                            variant={p.status === 'captured' || p.status === 'CAPTURED' ? 'default' : 'destructive'}
                                            className={cn(
                                                "text-[10px] uppercase px-2 py-0.5 h-6",
                                                (p.status === 'captured' || p.status === 'CAPTURED') ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20" : ""
                                            )}
                                        >
                                            {p.status_label || (p.status === 'CAPTURED' || p.status === 'captured' ? 'Paid' : p.status)}
                                        </Badge>
                                        {(p.status === 'captured' || p.status === 'CAPTURED') && (
                                            <button
                                                onClick={() => api.billing.downloadInvoice(p.id)}
                                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-md hover:bg-primary/5 cursor-pointer"
                                                title="Download Invoice"
                                            >
                                                <Download className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Invoice</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
