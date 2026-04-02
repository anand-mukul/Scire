'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    Bell,
    Check,
    CheckCheck,
    Clock,
    CreditCard,
    AlertTriangle,
    BookOpen,
    ShieldAlert,
    Megaphone,
    X,
    GraduationCap,
    Scale,
    UserCog,
    Brain,
    Eye,
    HandshakeIcon,
    Gavel,
    CircleAlert,
    Zap,
    ChevronUp,
    ChevronsUp,
    ChevronDown,
    Minus,
} from 'lucide-react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetFooter,
    SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/network/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const TYPE_COLORS: Record<string, { text: string; bg: string; ring: string }> = {
    'payment.success': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    'payment.failed': { text: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    'plan.upgraded': { text: 'text-blue-500', bg: 'bg-blue-500/10', ring: 'ring-blue-500/20' },
    'quota.warning': { text: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    'quota.exceeded': { text: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    'exam.created': { text: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
    'session.completed': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    'session.terminated': { text: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    'session.abandoned': { text: 'text-orange-500', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
    'session.flagged': { text: 'text-orange-500', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
    'grade.published': { text: 'text-primary', bg: 'bg-primary/10', ring: 'ring-primary/20' },
    'grade.overridden': { text: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    'review.escalated': { text: 'text-orange-500', bg: 'bg-orange-500/10', ring: 'ring-orange-500/20' },
    'review.completed': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    'integrity.violation': { text: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    'appeal.submitted': { text: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    'appeal.resolved': { text: 'text-emerald-500', bg: 'bg-emerald-500/10', ring: 'ring-emerald-500/20' },
    'consent.updated': { text: 'text-slate-500', bg: 'bg-slate-500/10', ring: 'ring-slate-500/20' },
    'ai.low_confidence': { text: 'text-amber-500', bg: 'bg-amber-500/10', ring: 'ring-amber-500/20' },
    'ai.bias_detected': { text: 'text-red-500', bg: 'bg-red-500/10', ring: 'ring-red-500/20' },
    'user.role_changed': { text: 'text-violet-500', bg: 'bg-violet-500/10', ring: 'ring-violet-500/20' },
    'system.announcement': { text: 'text-cyan-500', bg: 'bg-cyan-500/10', ring: 'ring-cyan-500/20' },
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

export function NotificationSheet() {
    const [open, setOpen] = useState(false);
    const queryClient = useQueryClient();
    const router = useRouter();
    const prevUnreadRef = useRef<number>(0);

    const { data, isLoading } = useQuery<NotificationListResponse>({
        queryKey: ['notifications'],
        queryFn: () => api.notifications.list({ limit: 40 }),
        refetchInterval: 15000,
        staleTime: 8000,
        refetchOnWindowFocus: true,
    });

    // F3: Play notification sound when new unread notifications arrive
    useEffect(() => {
        const currentUnread = data?.unread_count ?? 0;
        if (currentUnread > prevUnreadRef.current && prevUnreadRef.current >= 0 && !open) {
            try {
                const audio = new Audio('/notification.mp3');
                audio.volume = 0.3;
                audio.play().catch(() => { }); // Swallow autoplay restrictions
            } catch { } // eslint-disable-line no-empty
        }
        prevUnreadRef.current = currentUnread;
    }, [data?.unread_count, open]);

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
        const link = notification.action_url || (notification.metadata?.link as string);
        if (link && typeof link === 'string' && link.startsWith('/')) {
            router.push(link);
            setOpen(false);
        }
    }, [markReadMutation, router]);

    const unreadCount = data?.unread_count ?? 0;
    const notifications = data?.notifications ?? [];

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="relative h-9 w-9 rounded-xl hover:bg-muted/60 transition-all group"
                    aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                >
                    <Bell className="h-[18px] w-[18px] text-muted-foreground group-hover:text-foreground transition-colors" />
                    {unreadCount > 0 && (
                        <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground shadow-[0_0_8px_rgba(var(--primary),0.4)] animate-in zoom-in-50">
                            {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                    )}
                </Button>
            </SheetTrigger>

            <SheetContent
                side="right"
                className="w-full sm:max-w-[420px] p-0 flex flex-col bg-background/95 backdrop-blur-3xl border-l border-border/40 shadow-2xl"
                aria-describedby={undefined}
            >
                <SheetHeader className="px-5 py-3.5 border-b border-border/40 bg-background/95 backdrop-blur-md sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <SheetTitle className="text-[14px] font-semibold text-foreground">Notifications</SheetTitle>
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
                </SheetHeader>

                <ScrollArea className="flex-1">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-4">
                            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 animate-pulse">Syncing notifications</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-[60vh] text-center px-10">
                            <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-5 border border-border/50 text-muted-foreground/40">
                                <Bell className="h-6 w-6" />
                            </div>
                            <h3 className="text-[14px] font-semibold text-foreground/90 leading-tight">All caught up</h3>
                            <p className="text-[13px] text-muted-foreground mt-1.5 leading-relaxed">
                                You don't have any new notifications.
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {notifications.map((n) => {
                                const Icon = (TYPE_ICONS[n.type] ?? Bell) as React.FC<{ className?: string }>;
                                const style = TYPE_COLORS[n.type] || { text: 'text-muted-foreground', bg: 'bg-muted/40', ring: 'ring-border/40' };
                                const priorityConfig = PRIORITY_CONFIG[n.priority];
                                const PriorityIcon = priorityConfig?.icon;

                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "group flex w-full items-start gap-3.5 border-b border-border/40 px-5 py-4 text-left transition-all last:border-0",
                                            !n.is_read
                                                ? "bg-primary/[0.02]"
                                                : "hover:bg-muted/40"
                                        )}
                                    >
                                        <div className="relative mt-0.5 flex-shrink-0">
                                            <div className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full border border-border/50 bg-background",
                                                !n.is_read && "bg-primary/[0.02]"
                                            )}>
                                                <Icon className={cn("h-4 w-4", style.text)} />
                                            </div>
                                            {!n.is_read && (
                                                <div className="absolute -right-1 -top-1 rounded-full border-2 border-background">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-1 flex-col gap-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex items-center gap-2.5 truncate">
                                                    <p className={cn(
                                                        "text-[13.5px] font-semibold tracking-tight",
                                                        !n.is_read ? "text-foreground" : "text-foreground/80"
                                                    )}>
                                                        {n.title}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 border border-border/40 rounded px-1.5 py-0.5 bg-muted/20">
                                                    {PriorityIcon && (
                                                        <PriorityIcon className={cn("h-3 w-3", priorityConfig.className)} strokeWidth={3} />
                                                    )}
                                                    <span className="text-[11px] font-medium text-muted-foreground/70">
                                                        {timeAgo(n.created_at)}
                                                    </span>
                                                </div>
                                            </div>
                                            {n.message && (
                                                <p className="text-[13px] text-muted-foreground/90 leading-relaxed pr-6 mt-0.5 truncate">
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


            </SheetContent>
        </Sheet>
    );
}
