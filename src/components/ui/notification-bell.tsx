'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell, Check, CheckCheck, Clock, CreditCard, AlertTriangle, BookOpen,
    ShieldAlert, Megaphone, GraduationCap, Scale, UserCog, FileWarning,
    Brain, Eye, HandshakeIcon, Gavel, CircleAlert, Zap,
    ChevronUp, ChevronsUp, ChevronDown, Minus,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/network/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import type { Notification, NotificationListResponse } from '@/types/backend';

const TYPE_ICONS: Record<string, React.ElementType> = {
    'payment.success': CreditCard,
    'payment.failed': CreditCard,
    'plan.upgraded': Zap,
    'quota.warning': AlertTriangle,
    'quota.exceeded': AlertTriangle,
    'exam.created': BookOpen,
    'session.completed': GraduationCap,
    'session.terminated': CircleAlert,
    'session.abandoned': CircleAlert,
    'session.flagged': ShieldAlert,
    'grade.published': GraduationCap,
    'grade.overridden': Scale,
    'review.escalated': Eye,
    'review.completed': Check,
    'integrity.violation': ShieldAlert,
    'appeal.submitted': Gavel,
    'appeal.resolved': Gavel,
    'consent.updated': HandshakeIcon,
    'ai.low_confidence': Brain,
    'ai.bias_detected': Brain,
    'user.role_changed': UserCog,
    'system.announcement': Megaphone,
};

const TYPE_COLORS: Record<string, string> = {
    'payment.success': 'text-emerald-500',
    'payment.failed': 'text-red-500',
    'plan.upgraded': 'text-blue-500',
    'quota.warning': 'text-amber-500',
    'quota.exceeded': 'text-red-500',
    'exam.created': 'text-primary',
    'session.completed': 'text-emerald-500',
    'session.terminated': 'text-red-500',
    'session.abandoned': 'text-orange-500',
    'session.flagged': 'text-orange-500',
    'grade.published': 'text-primary',
    'grade.overridden': 'text-amber-500',
    'review.escalated': 'text-orange-500',
    'review.completed': 'text-emerald-500',
    'integrity.violation': 'text-red-500',
    'appeal.submitted': 'text-amber-500',
    'appeal.resolved': 'text-emerald-500',
    'consent.updated': 'text-slate-500',
    'ai.low_confidence': 'text-amber-500',
    'ai.bias_detected': 'text-red-500',
    'user.role_changed': 'text-violet-500',
    'system.announcement': 'text-cyan-500',
};

const PRIORITY_CONFIG: Record<string, { icon: any; className: string }> = {
    CRITICAL: { icon: ChevronsUp, className: 'text-red-500' },
    HIGH: { icon: ChevronUp, className: 'text-orange-500/70' },
    MEDIUM: { icon: Minus, className: 'text-muted-foreground/60' },
    LOW: { icon: ChevronDown, className: 'text-muted-foreground/60' },
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();

    const { data, isLoading } = useQuery<NotificationListResponse>({
        queryKey: ['notifications'],
        queryFn: () => api.notifications.list({ limit: 20 }),
        refetchInterval: 30000, // Poll every 30s
        staleTime: 15000,
    });

    const markReadMutation = useMutation({
        mutationFn: (id: string) => api.notifications.markRead(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllReadMutation = useMutation({
        mutationFn: () => api.notifications.markAllRead(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const handleNotificationClick = useCallback((notification: Notification) => {
        if (!notification.is_read) {
            markReadMutation.mutate(notification.id);
        }
        // Navigate via action_url (v2) or metadata.link (legacy), relative paths only
        const link = notification.action_url || (notification.metadata?.link as string);
        if (link && typeof link === 'string' && link.startsWith('/')) {
            router.push(link);
            setOpen(false);
        }
    }, [markReadMutation, router]);

    const unreadCount = data?.unread_count ?? 0;
    const notifications = data?.notifications ?? [];

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-lg hover:bg-muted/60 transition-colors"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-[18px] w-[18px] text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-sm animate-in zoom-in-50">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[380px] p-0 shadow-xl border-border/60 bg-popover/95 backdrop-blur-xl rounded-xl"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-md rounded-t-xl sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-[14px]">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="flex h-5 items-center justify-center rounded-full bg-primary/10 px-2 text-[11px] font-semibold text-primary">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-[12px] font-medium text-muted-foreground hover:text-foreground transition-all"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <Check className="h-3.5 w-3.5 mr-1" />
                            Mark all as read
                        </Button>
                    )}
                </div>

                {/* Notification List */}
                <ScrollArea className="max-h-[400px]">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                            <p className="text-xs text-muted-foreground mt-2">Loading...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="p-8 text-center">
                            <Bell className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                            <p className="text-sm text-muted-foreground">No notifications yet</p>
                            <p className="text-xs text-muted-foreground/60 mt-0.5">We&apos;ll notify you about important updates</p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                const Icon = TYPE_ICONS[n.type] ?? Bell;
                                const color = TYPE_COLORS[n.type] || 'text-muted-foreground';
                                const priorityConfig = PRIORITY_CONFIG[n.priority];
                                const PriorityIcon = priorityConfig?.icon;

                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "group flex w-full items-start gap-3 border-b border-border/40 px-4 py-3.5 text-left transition-colors last:border-0",
                                            !n.is_read
                                                ? "bg-primary/[0.02]"
                                                : "hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="relative mt-0.5 flex-shrink-0">
                                            <div className={cn(
                                                "flex h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-background",
                                            )}>
                                                {(() => {
                                                    const IconComponent = Icon as React.FC<{ className?: string }>;
                                                    return <IconComponent className={cn("h-3.5 w-3.5", color)} />;
                                                })()}
                                            </div>
                                            {!n.is_read && (
                                                <div className="absolute -right-0.5 -top-0.5 rounded-full border-2 border-background">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2 truncate">
                                                    <p className={cn(
                                                        "text-[13px] font-semibold tracking-tight",
                                                        !n.is_read ? "text-foreground" : "text-foreground/80"
                                                    )}>
                                                        {n.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 border border-border/40 rounded px-1.5 py-0.5 bg-muted/20">
                                                    {PriorityIcon && (
                                                        <PriorityIcon className={cn("h-2.5 w-2.5", priorityConfig.className)} strokeWidth={3} />
                                                    )}
                                                    <span className="text-[10px] font-medium text-muted-foreground/70">
                                                        {timeAgo(n.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {n.message && (
                                                <p className="text-[13px] text-muted-foreground/90 leading-relaxed pr-2 mt-0.5 truncate">
                                                    {n.message}
                                                </p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}
