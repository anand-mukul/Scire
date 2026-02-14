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

    if (isSubmitted) {
        return (
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                        className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6"
                    >
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </motion.div>
                    <h2 className="text-2xl font-bold tracking-tight text-foreground">Check your email</h2>
                    <p className="mt-2 text-muted-foreground">
                        We have sent a password reset link to <span className="font-medium text-foreground">{submittedEmail}</span>
                    </p>
                </div>

                <div className="space-y-4">
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground">
                        <p>If you don't see the email, check your spam folder or try again.</p>
                    </div>

                    <Button
                        variant="outline"
                        className="w-full"
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
        );
    }

    return (
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Forgot password?</h1>
                <p className="mt-2 text-muted-foreground">
                    Enter your email address and we'll send you a link to reset your password.
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="email">Email address</Label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            id="email"
                            type="email"
                            placeholder="name@example.com"
                            className="pl-9"
                            {...register('email')}
                            disabled={isLoading}
                        />
                    </div>
                    {errors.email && (
                        <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                </div>

                <Button className="w-full" type="submit" disabled={isLoading}>
                    {isLoading ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending link...
                        </>
                    ) : (
                        'Send reset link'
                    )}
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
            </form>
        </div>
    );
}
