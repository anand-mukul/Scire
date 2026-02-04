'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

import { api } from '@/lib/network/api';
import { getLandingPageForRole } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';


function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [debugInfo, setDebugInfo] = useState<any>({});

    useEffect(() => {
        const handleCallback = async () => {
            // Capture debug info immediately
            const info = {
                href: window.location.href,
                host: window.location.host,
                hostname: window.location.hostname,
                protocol: window.location.protocol,
                referrer: document.referrer,
                userAgent: navigator.userAgent
            };
            setDebugInfo(info);
            console.log('SSO Callback Debug:', info);

            const success = searchParams.get('success');
            const error = searchParams.get('error');

            if (error) {
                // ... error handling
                setStatus('error');
                setErrorMessage(error || 'Authentication failed');
                return;
            }

            if (success === 'true') {
                try {
                    const user = await api.auth.me();
                    if (!user) throw new Error('Failed to fetch user data');

                    const targetPath = getLandingPageForRole(user.role);

                    router.push(targetPath);
                } catch (err) {
                    console.error('SSO callback error:', err);
                    setStatus('error');
                    setErrorMessage(err instanceof Error ? err.message : 'Authentication failed');
                }
            } else {
                setStatus('error');
                setErrorMessage('Invalid callback - no success parameter');
            }
        };

        handleCallback();
    }, [router, searchParams]);

    // RENDER includes debug info at the bottom
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative overflow-hidden rounded-3xl border border-primary/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl p-8 md:p-12"
        >
            {/* ... Glow Effect ... */}
            <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

            <div className="flex flex-col items-center justify-center text-center space-y-6">
                {/* ... existing status specific UI ... */}
                {status === 'loading' && (
                    /* ... copy existing loading UI ... */
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 blur-xl bg-gradient-to-r from-blue-500/30 to-purple-500/30 rounded-full" />
                            <Loader2 className="relative w-16 h-16 animate-spin text-primary" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Completing Sign In</h2>
                            <p className="text-muted-foreground">Setting up your session...</p>
                        </div>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 blur-xl bg-green-500/30 rounded-full" />
                            <CheckCircle2 className="relative w-16 h-16 text-green-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Success!</h2>
                            <p className="text-muted-foreground">Redirecting...</p>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="relative">
                            <div className="absolute inset-0 blur-xl bg-red-500/30 rounded-full" />
                            <XCircle className="relative w-16 h-16 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-foreground mb-2">Sign In Failed</h2>
                            <p className="text-muted-foreground">{errorMessage}</p>
                            <p className="text-sm text-muted-foreground mt-2">Redirecting to login...</p>
                        </div>
                    </>
                )}
            </div>

            {/* DEBUG SECTION */}
            <div className="mt-8 p-4 bg-black/50 rounded text-xs text-left font-mono text-muted-foreground overflow-auto max-w-lg">
                <p className="font-bold text-white mb-2">Debug Info:</p>
                <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
        </motion.div>
    );
}

function CallbackFallback() {
    return (
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl shadow-2xl p-8 md:p-12">
            <div className="flex flex-col items-center justify-center space-y-6">
                <Loader2 className="w-16 h-16 animate-spin text-blue-500" />
                <p className="text-muted-foreground">Loading...</p>
            </div>
        </div>
    );
}

export default function SSOCallbackPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <Suspense fallback={<CallbackFallback />}>
                <CallbackContent />
            </Suspense>
        </div>
    );
}
