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

const PRIORITY_STYLES: Record<string, { badge: string; border: string }> = {
    CRITICAL: { badge: 'bg-red-500/10 text-red-600 border-red-500/20', border: 'border-red-500/20 shadow-red-500/5' },
    HIGH: { badge: 'bg-orange-500/10 text-orange-600 border-orange-500/20', border: 'border-orange-500/15' },
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d`;
    return date.toLocaleDateString();
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
            >
                <SheetHeader className="p-6 pb-4 border-b border-border/20 bg-primary/[0.01]">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <SheetTitle className="text-xl font-bold tracking-tight">Inbox</SheetTitle>
                            <p className="text-xs text-muted-foreground font-medium">
                                {unreadCount > 0
                                    ? `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}`
                                    : 'You\'re all caught up for now'
                                }
                            </p>
                        </div>
                        {unreadCount > 0 && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-[11px] font-bold uppercase tracking-widest gap-2 rounded-xl border-primary/20 hover:bg-primary/5 hover:text-primary transition-all"
                                onClick={() => markAllReadMutation.mutate()}
                                disabled={markAllReadMutation.isPending}
                            >
                                <CheckCheck className="h-3.5 w-3.5" />
                                Mark Read
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
                        <div className="flex flex-col items-center justify-center py-32 text-center px-10">
                            <div className="h-24 w-24 rounded-[2rem] bg-muted/20 flex items-center justify-center mb-8 border border-dashed border-border/50 rotate-6 group-hover:rotate-0 transition-transform duration-500">
                                <Bell className="h-10 w-10 text-muted-foreground/20" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground/90 leading-tight">Quiet and peaceful</h3>
                            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                                We'll let you know when something important happens on your platform.
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 space-y-2">
                            {notifications.map((n) => {
                                const Icon = (TYPE_ICONS[n.type] ?? Bell) as React.FC<{ className?: string }>;
                                const style = TYPE_COLORS[n.type] || { text: 'text-muted-foreground', bg: 'bg-muted/40', ring: 'ring-border/40' };
                                const priorityStyle = PRIORITY_STYLES[n.priority];

                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "w-full flex items-start gap-4 p-4 rounded-2xl text-left transition-all border group relative",
                                            !n.is_read
                                                ? cn("bg-primary/[0.02] shadow-sm shadow-primary/5", priorityStyle?.border || "border-primary/10")
                                                : "bg-background hover:bg-muted/30 border-transparent"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 p-2.5 rounded-xl border ring-1 transition-all",
                                            style.bg, style.text, style.ring, "border-transparent"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className={cn(
                                                    "text-sm font-bold truncate",
                                                    !n.is_read ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] font-medium text-muted-foreground/50 whitespace-nowrap flex items-center gap-1.5 underline-offset-4 decoration-primary/20 group-hover:underline">
                                                    <Clock className="h-2.5 w-2.5" />
                                                    {timeAgo(n.created_at)}
                                                    {priorityStyle && (
                                                        <span className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full border ml-1', priorityStyle.badge)}>
                                                            {n.priority}
                                                        </span>
                                                    )}
                                                </span>
                                            </div>
                                            {n.message && (
                                                <p className="text-xs text-muted-foreground/70 leading-relaxed line-clamp-2 pr-2">
                                                    {n.message}
                                                </p>
                                            )}
                                        </div>

                                        {!n.is_read && (
                                            <div className="absolute top-4 right-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </ScrollArea>

                <SheetFooter className="p-6 border-t border-border/20 bg-muted/10">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-10 rounded-xl text-xs font-bold text-muted-foreground hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => setOpen(false)}
                    >
                        Dismiss Overlay
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
}
