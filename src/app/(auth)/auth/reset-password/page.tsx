'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Lock, Eye, EyeOff, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const resetPasswordSchema = z.object({
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

function ResetPasswordForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const { resetPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ResetPasswordFormData>({
        resolver: zodResolver(resetPasswordSchema),
    });

    const onSubmit = async (data: ResetPasswordFormData) => {
        if (!token) {
            toast.error('Invalid request', {
                description: 'Reset token is missing.',
            });
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword(token, data.password);
            setIsSuccess(true);
            toast.success('Password reset successfully');
        } catch (error) {
            toast.error('Failed to reset password', {
                description: 'The link may have expired or is invalid. Please request a new one.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="w-full max-w-md space-y-8 text-center">
                <h1 className="text-2xl font-bold text-destructive">Invalid Link</h1>
                <p className="text-muted-foreground mb-4">
                    The password reset link is invalid or missing a token.
                </p>
                <Button asChild>
                    <Link href="/auth/forgot-password">Request new link</Link>
                </Button>
            </div>
        );
    }

    if (isSuccess) {
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
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </motion.div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Password reset complete</h1>
                        <p className="text-muted-foreground mt-2 mb-8">
                            Your password has been successfully updated. You can now login with your new password.
                        </p>
                        <Button className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 font-semibold text-lg" asChild>
                            <Link href="/auth/login">
                                Go to Login <ArrowRight className="ml-2 h-5 w-5" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-md"
        >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Set new password</h1>
                        <p className="mt-2 text-muted-foreground">
                            Please enter your new password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-foreground/90 font-medium">New Password</Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="pl-11 pr-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('password')}
                                    disabled={isLoading}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-foreground/90 font-medium">Confirm Password</Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    className="pl-11 pr-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('confirmPassword')}
                                    disabled={isLoading}
                                    placeholder="••••••••"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500 font-medium">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        <Button
                            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_-5px_var(--primary)/0.3] hover:shadow-primary/50 transition-all hover:scale-[1.02] font-semibold text-lg"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                'Reset Password'
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </motion.div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex justify-center items-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
