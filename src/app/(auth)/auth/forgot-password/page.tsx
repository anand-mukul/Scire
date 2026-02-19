'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const forgotPasswordSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
    const { forgotPassword } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submittedEmail, setSubmittedEmail] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<ForgotPasswordFormData>({
        resolver: zodResolver(forgotPasswordSchema),
    });

    const onSubmit = async (data: ForgotPasswordFormData) => {
        setIsLoading(true);
        try {
            await forgotPassword(data.email);
            setSubmittedEmail(data.email);
            setIsSubmitted(true);
            toast.success('Reset link sent', {
                description: 'If an account exists with this email, you will receive a password reset link.',
            });
        } catch (error) {
            toast.error('Failed to send reset link', {
                description: 'Please try again later.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const content = (
        <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                {/* Glow Effect */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                <div className="p-8 md:p-10">
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-6"
                        >
                            <Mail className="w-8 h-8 text-primary" />
                        </motion.div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h1>
                        <p className="mt-2 text-muted-foreground">
                            Enter your email address and we'll send you a link to reset your password.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-foreground/90 font-medium">Email address</Label>
                            <div className="relative group/input">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    className="pl-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('email')}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-sm text-red-500 font-medium">{errors.email.message}</p>
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
                                    Sending link...
                                </>
                            ) : (
                                'Send reset link'
                            )}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="text-sm font-medium text-primary hover:text-primary/90 flex items-center justify-center gap-2 transition-colors"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );

    const successContent = (
        <div className="w-full max-w-md">
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300 hover:shadow-primary/10">
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                <div className="p-8 md:p-10">
                    <div className="text-center">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                            className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6"
                        >
                            <CheckCircle2 className="w-8 h-8 text-green-500" />
                        </motion.div>
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h2>
                        <p className="mt-2 text-muted-foreground">
                            We have sent a password reset link to <span className="font-medium text-foreground">{submittedEmail}</span>
                        </p>
                    </div>

                    <div className="space-y-6 mt-8">
                        <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl text-sm text-muted-foreground text-center">
                            <p>If you don't see the email, check your spam folder or try again.</p>
                        </div>

                        <Button
                            variant="outline"
                            className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 text-foreground hover:bg-primary/5 dark:hover:bg-white/5 transition-all font-medium"
                            onClick={() => setIsSubmitted(false)}
                        >
                            Try another email
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/auth/login"
                                className="text-sm font-medium text-primary hover:text-primary/90 flex items-center justify-center gap-2"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to login
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            {isSubmitted ? successContent : content}
        </motion.div>
    );
}
