'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, ArrowRight } from "lucide-react";
import { useRouter } from 'next/navigation';

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureName?: string;
}

const PRO_FEATURES = [
    'Unlimited Exams & Sessions',
    'AI-Powered Insights & Analytics',
    'Practice Mode with AI Feedback',
    'Priority Support',
    'Custom Branding',
];

export function UpgradeModal({ open, onOpenChange, featureName = "Advanced Features" }: UpgradeModalProps) {
    const router = useRouter();

    const handleUpgrade = () => {
        onOpenChange(false);
        // Navigate to settings page — billing tab auto-selects via query param
        router.push('/settings?tab=billing');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[440px] p-0 overflow-hidden border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl">
                {/* Hero header with brand gradient */}
                <div className="relative px-6 pt-6 pb-2 text-center overflow-hidden">
                    {/* Subtle background glow */}
                    <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/4 to-transparent pointer-events-none" />
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative">
                        <div className="mx-auto w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center mb-3 shadow-lg shadow-primary/10">
                            <Crown className="w-6 h-6 text-primary" />
                        </div>

                        <DialogHeader className="space-y-1.5 !text-center">
                            <DialogTitle className="text-lg font-bold tracking-tight text-foreground">
                                Upgrade to Pro
                            </DialogTitle>
                            <DialogDescription className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px] mx-auto">
                                Unlock <span className="font-medium text-foreground/80">{featureName}</span> and
                                supercharge your assessment experience.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                </div>

                {/* Features list */}
                <div className="px-6 pb-1">
                    <div className="rounded-lg border border-border/50 bg-muted/30 px-4 py-3 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                                Everything in Pro
                            </span>
                        </div>
                        {PRO_FEATURES.map((feature) => (
                            <div key={feature} className="flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span className="text-[13px] text-foreground/80">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions */}
                <DialogFooter className="px-6 pb-5 pt-3 flex-col sm:flex-col gap-1.5">
                    <Button
                        onClick={handleUpgrade}
                        className="w-full h-10 text-sm font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200 hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                    >
                        View Plans & Upgrade
                        <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="w-full h-9 text-[13px] text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
