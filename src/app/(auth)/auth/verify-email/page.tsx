'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, ArrowRight, Mail, ExternalLink, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { api } from '@/lib/network/api';

import { VERIFICATION_EMAIL_SUBJECT } from '@/lib/constants';

function getMailProviderUrl(email: string): { name: string; url: string; searchable: boolean } | null {
    const domain = email.split('@')[1]?.toLowerCase();
    if (!domain) return null;

    const gmailUrl = `https://mail.google.com/mail/?authuser=${encodeURIComponent(email)}#search/subject%3Averify+your+email+address+newer_than%3A1d`;

    const yahooUrl = `https://mail.yahoo.com/d/search/keyword=${encodeURIComponent(VERIFICATION_EMAIL_SUBJECT)}`;

    const providers: Record<string, { name: string; url: string; searchable: boolean }> = {
        'gmail.com': { name: 'Gmail', url: gmailUrl, searchable: true },
        'googlemail.com': { name: 'Gmail', url: gmailUrl, searchable: true },
        'outlook.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox', searchable: false },
        'hotmail.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox', searchable: false },
        'live.com': { name: 'Outlook', url: 'https://outlook.live.com/mail/0/inbox', searchable: false },
        'yahoo.com': { name: 'Yahoo Mail', url: yahooUrl, searchable: true },
        'yahoo.in': { name: 'Yahoo Mail', url: yahooUrl, searchable: true },
        'icloud.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', searchable: false },
        'me.com': { name: 'iCloud Mail', url: 'https://www.icloud.com/mail', searchable: false },
        'protonmail.com': { name: 'ProtonMail', url: 'https://mail.proton.me', searchable: false },
        'proton.me': { name: 'ProtonMail', url: 'https://mail.proton.me', searchable: false },
        'zoho.com': { name: 'Zoho Mail', url: 'https://mail.zoho.com', searchable: false },
    };

    return providers[domain] || null;
}

function WaitingForVerification({ email }: { email: string }) {
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const mailProvider = getMailProviderUrl(email);

    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [cooldown]);

    const handleResend = async () => {
        if (isResending || cooldown > 0) return;
        setIsResending(true);
        try {
            await api.auth.resendVerification(email);
            toast.success('Verification email sent! Check your inbox.');
            setCooldown(30);
        } catch {
            toast.error('Failed to resend. Please try again.');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                <div className="p-8 md:p-10 text-center">
                    {/* Animated mail icon */}
                    <motion.div
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6"
                    >
                        <Mail className="w-8 h-8 text-emerald-500" />
                    </motion.div>

                    <h1 className="text-2xl font-bold text-foreground mb-2">Check Your Email</h1>
                    <p className="text-muted-foreground mb-6">
                        We&apos;ve sent a verification link to{' '}
                        <span className="font-semibold text-foreground">{email}</span>.
                        <br />Click the link to activate your account.
                    </p>

                    {/* Hint box */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 mb-6 text-left">
                        <p className="text-sm text-amber-700 dark:text-amber-400">
                            <strong>Didn&apos;t receive it?</strong> Check your spam/junk folder, or click below to resend.
                        </p>
                    </div>

                    {mailProvider && (
                        <a
                            href={mailProvider.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mb-3"
                        >
                            <Button
                                type="button"
                                className="w-full h-auto py-3 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold cursor-pointer flex flex-col items-center gap-0.5"
                            >
                                <span className="flex items-center gap-2">
                                    Open {mailProvider.name}
                                    <ExternalLink className="w-4 h-4" />
                                </span>
                                <span className="text-xs font-normal opacity-70">
                                    {mailProvider.searchable
                                        ? 'Find your verification email'
                                        : 'Check your inbox'}
                                </span>
                            </Button>
                        </a>
                    )}

                    {/* Resend button */}
                    <Button
                        onClick={handleResend}
                        disabled={isResending || cooldown > 0}
                        variant="outline"
                        className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 mb-3 cursor-pointer"
                    >
                        {isResending ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                Sending...
                            </>
                        ) : cooldown > 0 ? (
                            `Resend in ${cooldown}s`
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Resend Verification Email
                            </>
                        )}
                    </Button>

                    {/* Back to login */}
                    <Link href="/auth/login" className="block">
                        <Button
                            type="button"
                            variant="ghost"
                            className="w-full h-12 rounded-xl text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                            Back to Login
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                </div>
            </div>
        </motion.div>
    );
}


function TokenVerification({ token }: { token: string }) {
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    const verify = useCallback(async () => {
        try {
            const data = await api.auth.verifyEmail(token);
            setStatus('success');
            setMessage(data.message || 'Email verified successfully!');
        } catch (error) {
            setStatus('error');
            setMessage(error instanceof Error ? error.message : 'Verification failed. The link may have expired.');
        }
    }, [token]);

    useEffect(() => {
        verify();
    }, [verify]);

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                <div className="p-8 md:p-10 text-center">
                    {status === 'loading' && (
                        <>
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Verifying Email</h1>
                            <p className="text-muted-foreground">Please wait while we verify your email address...</p>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-6">
                                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
                            <p className="text-muted-foreground mb-8">{message}</p>
                            <Link href="/auth/login" className="block">
                                <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold cursor-pointer">
                                    Continue to Login
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </Link>
                        </>
                    )}

                    {status === 'error' && (
                        <>
                            <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                                <XCircle className="w-8 h-8 text-red-500" />
                            </div>
                            <h1 className="text-2xl font-bold text-foreground mb-2">Verification Failed</h1>
                            <p className="text-muted-foreground mb-8">{message}</p>
                            <div className="space-y-3">
                                <Link href="/auth/register" className="block">
                                    <Button variant="outline" className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 cursor-pointer">
                                        Register Again
                                    </Button>
                                </Link>
                                <Link href="/auth/login" className="block">
                                    <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold cursor-pointer">
                                        Go to Login
                                        <ArrowRight className="w-5 h-5 ml-2" />
                                    </Button>
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </motion.div>
    );
}


function VerifyEmailContent() {
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    // Mode 1: Came from registration — show "check your email" with Open Mail + Resend
    if (email && !token) {
        return <WaitingForVerification email={email} />;
    }

    // Mode 2: Clicked verification link from email — verify the token
    if (token) {
        return <TokenVerification token={token} />;
    }

    // Mode 3: No params — invalid access
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                <div className="p-8 md:p-10 text-center">
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6">
                        <XCircle className="w-8 h-8 text-red-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Link</h1>
                    <p className="text-muted-foreground mb-8">This verification link is invalid or has expired.</p>
                    <div className="space-y-3">
                        <Link href="/auth/register" className="block">
                            <Button variant="outline" className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 cursor-pointer">
                                Register Again
                            </Button>
                        </Link>
                        <Link href="/auth/login" className="block">
                            <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold cursor-pointer">
                                Go to Login
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}


function VerifyEmailFallback() {
    return (
        <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl border border-primary/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl p-8 md:p-10">
                <div className="flex items-center justify-center h-48">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </div>
        </div>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailFallback />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
