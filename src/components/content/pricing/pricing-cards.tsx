'use client';

import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Shared Interface for Plan Data
export interface PlanData {
    id: string;
    name: string;
    description: string;
    price: number | string;
    priceDetail?: string;
    features: { label: string; value?: string; included: boolean }[];
    isPopular?: boolean;
    isCurrent?: boolean;
    tierLevel?: number;
    currentTierLevel?: number;
    ctaText?: string;
    ctaLink?: string;
    ctaAction?: () => void;
    isLoading?: boolean;
}

interface PricingCardsProps {
    plans: PlanData[];
    variant?: 'public' | 'admin';
    onUpgrade?: (planId: string, billingCycle: 'MONTHLY' | 'YEARLY') => void;
}

const PricingCard = ({
    plan,
    variant,
    onUpgrade,
    billingCycle
}: {
    plan: PlanData,
    variant: 'public' | 'admin',
    onUpgrade?: (id: string, cycle: 'MONTHLY' | 'YEARLY') => void,
    billingCycle: 'MONTHLY' | 'YEARLY'
}) => {
    const isPopular = plan.isPopular;
    const isDowngrade = (plan.tierLevel || 0) < (plan.currentTierLevel || 0);

    // Calculate Price logic
    const displayPrice = typeof plan.price === 'number'
        ? (billingCycle === 'YEARLY' ? Math.round(plan.price * 12 * 0.8 / 12) : plan.price)
        : plan.price;

    return (
        <Card className={cn(
            "flex flex-col relative overflow-hidden transition-all duration-200",
            isPopular ? "border-primary shadow-lg scale-[1.02] z-10" : "border-border shadow-sm hover:shadow-md",
            "h-full"
        )}>
            {isPopular && (
                <div className="absolute top-0 right-0 p-4">
                    <Badge variant="default" className="bg-primary text-primary-foreground hover:bg-primary">
                        Most Popular
                    </Badge>
                </div>
            )}

            <CardHeader>
                <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-muted-foreground mt-2 min-h-[40px]">
                    {plan.description}
                </CardDescription>
            </CardHeader>

            <CardContent className="flex-1">
                <div className="mb-6">
                    {typeof displayPrice === 'number' ? (
                        <div className="flex items-baseline gap-1">
                            <span className="text-3xl font-bold text-foreground">
                                ₹{displayPrice.toLocaleString('en-IN')}
                            </span>
                            <span className="text-muted-foreground font-medium">/mo</span>
                        </div>
                    ) : (
                        <span className="text-3xl font-bold text-foreground">
                            {displayPrice}
                        </span>
                    )}
                    {billingCycle === 'YEARLY' && typeof plan.price === 'number' && (
                        <p className="text-xs text-muted-foreground mt-1">
                            Billed ₹{Math.round(plan.price * 12 * 0.8).toLocaleString('en-IN')} yearly
                        </p>
                    )}
                </div>

                <div className="space-y-4">
                    {plan.features.map((feature: any, i: number) => (
                        <div key={i} className="flex items-start gap-3 text-sm">
                            <div className={cn(
                                "mt-0.5 rounded-full p-1 shrink-0",
                                feature.included
                                    ? "bg-primary/10 text-primary"
                                    : "bg-muted text-muted-foreground"
                            )}>
                                {feature.included ? (
                                    <Check className="h-3 w-3" />
                                ) : (
                                    <X className="h-3 w-3" />
                                )}
                            </div>
                            <span className={cn(
                                feature.included ? "text-foreground" : "text-muted-foreground"
                            )}>
                                {feature.value ? (
                                    <span className="font-semibold mr-1">{feature.value}</span>
                                ) : null}
                                {feature.label}
                            </span>
                        </div>
                    ))}
                </div>
            </CardContent>

            <CardFooter className="pt-6">
                {variant === 'public' ? (
                    <Button
                        asChild={!!plan.ctaLink}
                        onClick={plan.ctaAction}
                        className="w-full"
                        variant={isPopular ? "default" : "outline"}
                    >
                        {plan.ctaLink ? (
                            <a href={plan.ctaLink}>{plan.ctaText || 'Get Started'}</a>
                        ) : (
                            plan.ctaText || 'Get Started'
                        )}
                    </Button>
                ) : (
                    <div className="w-full">
                        {plan.isCurrent ? (
                            <Button disabled className="w-full" variant="secondary">
                                Current Plan
                            </Button>
                        ) : plan.price === 'Contact Sales' || plan.id === 'enterprise' ? (
                            <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => window.open('mailto:sales@scire.app', '_blank')}
                            >
                                Contact Sales
                            </Button>
                        ) : isDowngrade ? (
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="w-full">
                                            <Button disabled className="w-full" variant="outline">
                                                Downgrade
                                            </Button>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>Please contact support to downgrade your plan.</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        ) : (
                            <Button
                                className="w-full"
                                variant={isPopular ? "default" : "outline"}
                                onClick={() => onUpgrade?.(plan.id, billingCycle)}
                            >
                                Upgrade to {plan.name}
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
};

export function PricingCards({ plans, variant = 'public', onUpgrade }: PricingCardsProps) {
    const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');

    return (
        <div className="w-full max-w-5xl mx-auto">
            {/* Toggle */}
            <div className="flex justify-center mb-10">
                <div className="flex items-center p-1 bg-muted rounded-full border border-border">
                    <button
                        onClick={() => setBillingCycle('MONTHLY')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200",
                            billingCycle === 'MONTHLY'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Monthly
                    </button>
                    <button
                        onClick={() => setBillingCycle('YEARLY')}
                        className={cn(
                            "px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center gap-2",
                            billingCycle === 'YEARLY'
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Yearly
                        <Badge variant="secondary" className="text-[10px] px-1.5 h-5 bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-500/20">
                            -20%
                        </Badge>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
                {plans.map((plan) => (
                    <PricingCard
                        key={plan.id}
                        plan={plan}
                        variant={variant}
                        onUpgrade={onUpgrade}
                        billingCycle={billingCycle}
                    />
                ))}
            </div>
        </div>
    );
}
