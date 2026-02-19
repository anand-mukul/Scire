'use client';

import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { LucideIcon, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface PageHeaderBadge {
    label: string;
    value?: string | number;
    icon?: LucideIcon;
    variant?: 'default' | 'count' | 'date';
}

interface PageHeaderProps {
    title: string;
    description?: string;
    badge?: PageHeaderBadge;
    button?: ReactNode;
    actions?: ReactNode; // For backwards compatibility
    className?: string;
    backButton?: boolean;
}

export function PageHeader({
    title,
    description,
    badge,
    button,
    actions,
    className,
    backButton
}: PageHeaderProps) {
    const router = useRouter();

    return (
        <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4", className)}>
            <div className="flex items-start gap-4">
                {backButton && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.back()}
                        className="mt-1 -ml-2 text-muted-foreground hover:text-foreground hidden md:flex"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                )}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                    {description && (
                        <p className="text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {(badge || button || actions) && (
                <div className="flex items-center gap-2">
                    {/* Badge display */}
                    {badge && (
                        <span className="text-xs font-semibold text-muted-foreground/70 bg-muted/30 px-3 py-1.5 rounded-md border border-border/40 inline-flex items-center shadow-sm gap-1.5">
                            {badge.icon && <badge.icon className="w-3 h-3 opacity-70" />}
                            {badge.value !== undefined && (
                                <>
                                    <span className="text-foreground font-bold">{badge.value}</span>
                                    <span className="text-muted-foreground/60">·</span>
                                </>
                            )}
                            <span>{badge.label}</span>
                        </span>
                    )}
                    {/* Button or custom actions */}
                    {button}
                    {actions}
                </div>
            )}
        </div>
    );
}
