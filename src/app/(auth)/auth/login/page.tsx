'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth, getLandingPageForRole } from '@/contexts/AuthContext';
import { UserRole, SSOProvider } from '@/types/auth';
import { api } from '@/lib/network/api';


const loginSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

// Google Icon SVG
function GoogleIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
    );
}

// Microsoft Icon SVG
function MicrosoftIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
        </svg>
    );
}

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [ssoProviders, setSsoProviders] = useState<SSOProvider[]>([]);
    const [ssoLoading, setSsoLoading] = useState(true);

    const redirectParam = searchParams.get('redirect');

    // Fetch SSO providers on mount
    useEffect(() => {
        const fetchProviders = async () => {
            try {
                const { providers, sso_enabled } = await api.sso.getProviders();
                if (sso_enabled && providers.length > 0) {
                    setSsoProviders(providers);
                }
            } catch (err) {
                // SSO not configured - silently continue with email/password only
                console.debug('SSO providers not available:', err);
            } finally {
                setSsoLoading(false);
            }
        };
        fetchProviders();
    }, []);

    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const handleSSOLogin = (provider: 'google' | 'microsoft') => {
        // Redirect to backend SSO endpoint
        const loginUrl = api.sso.getLoginUrl(provider);
        window.location.href = loginUrl;
    };

    const onSubmit = async (data: LoginFormData) => {
        setIsLoading(true);
        try {
            const user = await login(data);
            toast.success('Welcome back!');
            reset();

            const targetPath = redirectParam || getLandingPageForRole(user.role);

            // Platform admins go to /platform (no subdomain)
            if (user.role === UserRole.PLATFORM_ADMIN) {
                router.push(targetPath);
                router.refresh();
                return;
            }

            // Redirect to target path
            router.push(targetPath);
            router.refresh();
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Invalid email or password';
            if (msg.toLowerCase().includes('email not verified') || msg.toLowerCase().includes('not verified')) {
                toast.warning('Your email is not yet verified. Please check your inbox for the verification link.');
            } else {
                toast.error(msg);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            {/* Card Container */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                {/* Glow Effect */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                <div className="p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Welcome Back</h1>
                        <p className="text-muted-foreground">Sign in to continue to Scire</p>
                    </div>

                    {/* SSO Buttons */}
                    {!ssoLoading && ssoProviders.length > 0 && (
                        <>
                            <div className="space-y-3 mb-6">
                                {ssoProviders.map((provider) => (
                                    <Button
                                        key={provider.id}
                                        type="button"
                                        variant="outline"
                                        onClick={() => handleSSOLogin(provider.id)}
                                        className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 bg-white/50 dark:bg-white/5 hover:bg-primary/5 dark:hover:bg-white/10 transition-all font-medium text-foreground"
                                    >
                                        {provider.id === 'google' ? (
                                            <GoogleIcon className="w-5 h-5 mr-3" />
                                        ) : (
                                            <MicrosoftIcon className="w-5 h-5 mr-3" />
                                        )}
                                        Continue with {provider.name}
                                    </Button>
                                ))}
                            </div>

                            {/* Divider between SSO and email/password */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-border" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground">
                                    <span className="px-4 bg-white/60 dark:bg-black/40">or continue with email</span>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground/90 font-medium">
                                Email Address
                            </Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="pl-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('email')}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground/90 font-medium">
                                Password
                            </Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-11 pr-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                            )}
                            <div className="flex justify-end">
                                <Link
                                    href="/auth/forgot-password"
                                    className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_-5px_var(--primary)/0.3] hover:shadow-primary/50 transition-all hover:scale-[1.02] font-semibold text-lg"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Signing in...
                                </>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-8">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase tracking-widest text-muted-foreground">
                            <span className="px-4 bg-transparent backdrop-blur-sm">New to Scire?</span>
                        </div>
                    </div>

                    {/* Register Link */}
                    <Link href="/auth/register" className="block">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 text-foreground hover:bg-primary/5 dark:hover:bg-white/5 transition-all font-medium"
                        >
                            Create an Account
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                By signing in, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors font-medium">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors font-medium">
                    Privacy Policy
                </Link>
            </p>
        </motion.div>
    );
}

function LoginFormFallback() {
    return (
        <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-neutral-900/50 backdrop-blur-xl shadow-2xl p-8 md:p-10">
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={<LoginFormFallback />}>
            <LoginForm />
        </Suspense>
    );
}
