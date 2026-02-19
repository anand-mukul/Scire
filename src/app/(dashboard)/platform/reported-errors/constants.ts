import {
    AlertCircle,
    CheckCircle2,
    Search,
    XCircle,
    LucideIcon,
} from 'lucide-react';

export const STATUS_CONFIG: Record<string, { label: string, icon: LucideIcon, color: string, bg: string, ring: string }> = {
    new: { label: 'New', icon: AlertCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
    investigating: { label: 'Active', icon: Search, color: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    resolved: { label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    ignored: { label: 'Ignored', icon: XCircle, color: 'text-muted-foreground', bg: 'bg-muted/50', ring: 'ring-border/40' },
};

export const URGENCY_STYLES: Record<string, { className: string; label: string; dot: string; color: string; bg: string }> = {
    low: { className: 'text-slate-600 dark:text-slate-400', label: 'Low', dot: 'bg-slate-400', color: 'text-slate-500', bg: 'bg-slate-500/10' },
    medium: { className: 'text-blue-600 dark:text-blue-400', label: 'Medium', dot: 'bg-blue-500', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    high: { className: 'text-orange-600 dark:text-orange-400', label: 'High', dot: 'bg-orange-500', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    critical: { className: 'text-red-600 dark:text-red-400', label: 'Critical', dot: 'bg-red-600', color: 'text-red-600', bg: 'bg-red-600/10' },
};
