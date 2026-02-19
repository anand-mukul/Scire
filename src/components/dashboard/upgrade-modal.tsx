
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
import { Check, Zap, Star } from "lucide-react";
import Link from 'next/link';

interface UpgradeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    featureName?: string;
}

export function UpgradeModal({ open, onOpenChange, featureName = "Advanced Features" }: UpgradeModalProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] border-amber-500/20 bg-gradient-to-b from-background to-amber-500/5">
                <DialogHeader>
                    <div className="mx-auto bg-amber-100 dark:bg-amber-900/30 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Star className="w-6 h-6 text-amber-600 dark:text-amber-400 fill-current" />
                    </div>
                    <DialogTitle className="text-center text-xl">Upgrade to Pro</DialogTitle>
                    <DialogDescription className="text-center">
                        Unlock <b>{featureName}</b> and other premium features with our Pro plan.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4 space-y-3">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-card/50 border border-border/50">
                        <div className="p-2 bg-primary/10 rounded-md text-primary">
                            <Zap className="w-4 h-4" />
                        </div>
                        <div className="text-sm">
                            <p className="font-medium">Advanced Analytics</p>
                            <p className="text-muted-foreground text-xs">Deep insights into student performance</p>
                        </div>
                    </div>

                    <div className="space-y-2 pl-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Unlimited Exams & Sessions</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>AI-Powered Insights</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Check className="w-4 h-4 text-green-500" />
                            <span>Priority Support</span>
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-col gap-2">
                    <Button asChild className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/20">
                        <Link href="/settings/billing">
                            Upgrade Now
                        </Link>
                    </Button>
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
                        Maybe Later
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
