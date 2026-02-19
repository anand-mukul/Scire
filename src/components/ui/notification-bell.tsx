'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, CheckCheck, Clock, CreditCard, AlertTriangle, BookOpen, ShieldAlert, Megaphone } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/network/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    is_read: boolean;
    metadata: Record<string, unknown>;
    created_at: string;
}

interface NotificationListResponse {
    notifications: Notification[];
    unread_count: number;
    total: number;
}

const TYPE_ICONS = {
    'payment.success': CreditCard,
    'payment.failed': CreditCard,
    'plan.upgraded': CreditCard,
    'quota.warning': AlertTriangle,
    'quota.exceeded': AlertTriangle,
    'exam.created': BookOpen,
    'session.flagged': ShieldAlert,
    'user.role_changed': Check,
    'system.announcement': Megaphone,
} as const satisfies Partial<Record<string, React.ElementType>>;

const TYPE_COLORS: Record<string, string> = {
    'payment.success': 'text-green-500',
    'payment.failed': 'text-red-500',
    'plan.upgraded': 'text-blue-500',
    'quota.warning': 'text-amber-500',
    'quota.exceeded': 'text-red-500',
    'exam.created': 'text-primary',
    'session.flagged': 'text-orange-500',
    'user.role_changed': 'text-violet-500',
    'system.announcement': 'text-cyan-500',
};

function timeAgo(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
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
        // Navigate if there's a link in metadata (relative paths only to prevent open redirect)
        const link = notification.metadata?.link as string;
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
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending}
                        >
                            <CheckCheck className="h-3.5 w-3.5" />
                            Mark all read
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
                        <div className="divide-y divide-border/30">
                            {notifications.map((n) => {
                                const Icon = (TYPE_ICONS[n.type as keyof typeof TYPE_ICONS] ?? Bell) as React.ElementType;
                                const color = TYPE_COLORS[n.type] || 'text-muted-foreground';

                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotificationClick(n)}
                                        className={cn(
                                            "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                                            !n.is_read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex-shrink-0 mt-0.5 p-1.5 rounded-lg",
                                            !n.is_read ? "bg-primary/10" : "bg-muted/40"
                                        )}>
                                            {(() => {
                                                const IconComponent = Icon as React.FC<{ className?: string }>;
                                                return <IconComponent className={cn("h-3.5 w-3.5", !n.is_read ? color : "text-muted-foreground/60")} />;
                                            })()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={cn(
                                                "text-sm leading-tight",
                                                !n.is_read ? "font-medium text-foreground" : "text-muted-foreground"
                                            )}>
                                                {n.title}
                                            </p>
                                            {n.message && (
                                                <p className="text-xs text-muted-foreground/70 mt-0.5 line-clamp-2">
                                                    {n.message}
                                                </p>
                                            )}
                                            <div className="flex items-center gap-1.5 mt-1">
                                                <Clock className="h-2.5 w-2.5 text-muted-foreground/40" />
                                                <span className="text-[10px] text-muted-foreground/50">
                                                    {timeAgo(n.created_at)}
                                                </span>
                                            </div>
                                        </div>
                                        {!n.is_read && (
                                            <div className="flex-shrink-0 mt-1.5">
                                                <div className="w-2 h-2 rounded-full bg-primary shadow-sm shadow-primary/30" />
                                            </div>
                                        )}
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
