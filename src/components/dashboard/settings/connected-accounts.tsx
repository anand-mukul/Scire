'use client';

/**
 * ConnectedAccounts — displays OAuth providers that can be linked/unlinked
 * from the authenticated user's account.
 *
 * Shows all supported providers (Google, Microsoft) at all times.
 * Connected ones get a disconnect button; disconnected ones get a connect
 * button that redirects through the OAuth link flow.
 *
 * Security note: the connect redirect goes directly to the backend OAuth
 * endpoint with `?action=link`. The backend reads the current session
 * cookie there and embeds the user_id into Redis state, so the flow is
 * fully server-verified — no sensitive data is passed via the frontend.
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { OAuthConnection } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertCircle, Loader2, Link2, Link2Off, ExternalLink } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';

// ──────────────────────────────────────────────
// Provider metadata
// ──────────────────────────────────────────────

interface ProviderMeta {
    id: 'google' | 'microsoft';
    label: string;
    description: string;
    icon: React.ReactNode;
}

const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        />
        <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        />
        <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
    </svg>
);

const MicrosoftIcon = () => (
    <svg viewBox="0 0 21 21" className="h-5 w-5" aria-hidden="true">
        <rect x="1" y="1" width="9" height="9" fill="#F25022" />
        <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
        <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
        <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
);

const PROVIDERS: ProviderMeta[] = [
    {
        id: 'google',
        label: 'Google',
        description: 'Sign in with your Google account',
        icon: <GoogleIcon />,
    },
    {
        id: 'microsoft',
        label: 'Microsoft',
        description: 'Sign in with Microsoft Entra ID / Azure AD',
        icon: <MicrosoftIcon />,
    },
];

// ──────────────────────────────────────────────
// Component
// ──────────────────────────────────────────────

export function ConnectedAccounts() {
    const queryClient = useQueryClient();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [pendingUnlink, setPendingUnlink] = useState<'google' | 'microsoft' | null>(null);

    // Show toast for link success / error coming back from the OAuth redirect
    React.useEffect(() => {
        const linkSuccess = searchParams.get('link_success');
        const linkError = searchParams.get('link_error');

        if (linkSuccess) {
            const name = linkSuccess.charAt(0).toUpperCase() + linkSuccess.slice(1);
            toast.success(`${name} account connected successfully`);
            // Strip the query param so refreshing doesn't show the toast again
            router.replace('/settings?tab=security');
        }
        if (linkError) {
            const messages: Record<string, string> = {
                session_expired: 'Session expired — please try again.',
                user_not_found: 'Could not verify your account.',
                email_mismatch:
                    'The OAuth account email does not match your account email. You can only link an account that shares the same email address.',
                already_linked_other:
                    'This OAuth account is already linked to a different user.',
            };
            toast.error(messages[linkError] ?? 'Failed to connect account — please try again.');
            router.replace('/settings?tab=security');
        }
    }, [searchParams, router]);

    // Fetch connected providers
    const { data, isLoading, isError } = useQuery({
        queryKey: ['oauth-connections'],
        queryFn: () => api.sso.getConnections(),
        staleTime: 30_000,
    });

    const connectedMap = React.useMemo(() => {
        const map = new Map<string, OAuthConnection>();
        for (const c of data?.connections ?? []) {
            map.set(c.provider, c);
        }
        return map;
    }, [data]);

    // Unlink mutation
    const unlinkMutation = useMutation({
        mutationFn: (provider: 'google' | 'microsoft') => api.sso.unlinkConnection(provider),
        onSuccess: (_, provider) => {
            toast.success(
                `${provider.charAt(0).toUpperCase() + provider.slice(1)} account disconnected`
            );
            queryClient.invalidateQueries({ queryKey: ['oauth-connections'] });
        },
        onError: (err: Error) => {
            toast.error(err.message ?? 'Failed to disconnect account');
        },
        onSettled: () => setPendingUnlink(null),
    });

    const handleConnect = (provider: 'google' | 'microsoft') => {
        // Redirect to the backend link flow (backend reads the session cookie)
        window.location.href = api.sso.getLoginUrl(provider, 'link');
    };

    const handleUnlink = (provider: 'google' | 'microsoft') => {
        setPendingUnlink(provider);
    };

    const confirmUnlink = () => {
        if (pendingUnlink) {
            unlinkMutation.mutate(pendingUnlink);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 text-muted-foreground gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading connected accounts…</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="flex items-center gap-2 p-4 text-destructive text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                Failed to load connected accounts.
            </div>
        );
    }

    return (
        <>
            <div className="divide-y divide-border/50">
                {PROVIDERS.map((provider, idx) => {
                    const connection = connectedMap.get(provider.id);
                    const isConnected = !!connection;
                    const isUnlinking =
                        unlinkMutation.isPending && unlinkMutation.variables === provider.id;

                    return (
                        <div
                            key={provider.id}
                            className="flex items-center justify-between p-5 hover:bg-muted/20 transition-colors group"
                        >
                            {/* Provider icon + info */}
                            <div className="flex items-center gap-4">
                                <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border border-border/60 bg-background shadow-sm group-hover:shadow-md transition-shadow">
                                    {provider.icon}
                                </div>
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold">{provider.label}</p>
                                        {isConnected && (
                                            <Badge
                                                variant="secondary"
                                                className="text-[10px] h-4 px-1.5 font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                            >
                                                Connected
                                            </Badge>
                                        )}
                                    </div>
                                    {isConnected && connection.provider_email ? (
                                        <p className="text-xs text-muted-foreground">
                                            {connection.provider_email}
                                        </p>
                                    ) : (
                                        <p className="text-xs text-muted-foreground">
                                            {provider.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Action button */}
                            <div className="flex items-center gap-2">
                                {isConnected ? (
                                    <>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/5 hover:border-destructive/60 transition-colors"
                                            onClick={() => handleUnlink(provider.id)}
                                            disabled={isUnlinking || unlinkMutation.isPending}
                                        >
                                            {isUnlinking ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Link2Off className="h-3.5 w-3.5" />
                                            )}
                                            {isUnlinking ? 'Disconnecting…' : 'Disconnect'}
                                        </Button>
                                    </>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => handleConnect(provider.id)}
                                    >
                                        <Link2 className="h-3.5 w-3.5" />
                                        Connect
                                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Confirmation Dialog */}
            <AlertDialog
                open={!!pendingUnlink}
                onOpenChange={(open) => !open && setPendingUnlink(null)}
            >
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect account?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You are about to disconnect your{' '}
                            <strong>
                                {pendingUnlink
                                    ? pendingUnlink.charAt(0).toUpperCase() +
                                      pendingUnlink.slice(1)
                                    : ''}
                            </strong>{' '}
                            account. You will no longer be able to sign in using this provider
                            unless you reconnect it.
                            {!connectedMap.size || connectedMap.size <= 1 ? (
                                <span className="block mt-2 text-amber-600 dark:text-amber-400">
                                    Make sure you have a password set or another provider connected
                                    to keep access to your account.
                                </span>
                            ) : null}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmUnlink}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {unlinkMutation.isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                                    Disconnecting…
                                </>
                            ) : (
                                'Yes, disconnect'
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
