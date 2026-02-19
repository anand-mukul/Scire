import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Shield, User, GraduationCap, School, CheckCircle2, AlertTriangle, Clock, XCircle, Activity, FileText, Archive, Zap, type LucideIcon } from 'lucide-react';
import { UserRole } from '@/types/auth';
import { TenantStatus, ExamStatus } from '@/types/backend';

// Define variants for status and roles
const statusBadgeVariants = cva(
    "gap-1.5 pl-1.5 pr-2.5 py-0.5 text-xs font-medium border transition-colors",
    {
        variants: {
            variant: {
                default: "bg-primary/10 text-primary border-primary/20",
                success: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                warning: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
                destructive: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                info: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                secondary: "bg-muted text-muted-foreground border-border",
                purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
                orange: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
                zinc: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface StatusConfig {
    variant: VariantProps<typeof statusBadgeVariants>['variant'];
    label: string;
    icon: LucideIcon;
}

// Map roles to config
const roleConfig: Record<string, StatusConfig> = {
    [UserRole.ADMIN]: { variant: 'info', label: 'Admin', icon: Shield },
    [UserRole.INSTRUCTOR]: { variant: 'purple', label: 'Instructor', icon: School },
    [UserRole.STUDENT]: { variant: 'success', label: 'Student', icon: GraduationCap },
    [UserRole.REVIEWER]: { variant: 'warning', label: 'Reviewer', icon: User },
};

// Map tenant status to config
const tenantStatusConfig: Record<string, StatusConfig> = {
    [TenantStatus.ACTIVE]: { variant: 'success', label: 'Active', icon: CheckCircle2 },
    [TenantStatus.SUSPENDED]: { variant: 'destructive', label: 'Suspended', icon: XCircle },
    [TenantStatus.TRIAL]: { variant: 'orange', label: 'Trial', icon: Clock },
    [TenantStatus.CHURNED]: { variant: 'secondary', label: 'Churned', icon: Activity },
};

// Map exam status to config
const examStatusConfig: Record<string, StatusConfig> = {
    [ExamStatus.DRAFT]: { variant: 'warning', label: 'Draft', icon: FileText },
    [ExamStatus.PUBLISHED]: { variant: 'success', label: 'Published', icon: CheckCircle2 },
    [ExamStatus.ACTIVE]: { variant: 'info', label: 'Active', icon: Zap }, // Uses 'info' (blue) to match previous 'blue-500' pulse
    [ExamStatus.ARCHIVED]: { variant: 'zinc', label: 'Archived', icon: Archive },
};

export interface StatusBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    status?: string | TenantStatus | ExamStatus; // Accepts raw string or enum
    role?: string | UserRole;     // Accepts raw string or enum
    className?: string;
}

export function StatusBadge({ status, role, className, ...props }: StatusBadgeProps) {
    let config: StatusConfig = { variant: 'secondary', label: 'Unknown', icon: Activity };

    if (role) {
        // Normalize role string (handle case insensitivity if needed, though enums are precise)
        const roleKey = Object.keys(roleConfig).find(k => k === role) || role;
        config = roleConfig[roleKey as string] || { variant: 'secondary', label: role as string, icon: User };
    } else if (status) {
        // Normalize status string
        const statusKey = Object.keys(tenantStatusConfig).find(k => k === status) || status;

        let foundConfig = tenantStatusConfig[statusKey as string];
        if (!foundConfig) {
            const examStatusKey = Object.keys(examStatusConfig).find(k => k === status) || status;
            foundConfig = examStatusConfig[examStatusKey as string];
        }

        config = foundConfig || { variant: 'secondary', label: status as string, icon: Activity };
    }

    const Icon = config.icon;

    return (
        <Badge
            variant="outline" // Base style is outline, color comes from className override
            className={cn(statusBadgeVariants({ variant: config.variant }), className)}
            {...props}
        >
            <Icon className="w-3.5 h-3.5" />
            {config.label}
        </Badge>
    );
}
