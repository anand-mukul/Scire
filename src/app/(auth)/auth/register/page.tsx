'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, User, ArrowRight, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least one number'),
    confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterFormData) => {
        setIsLoading(true);
        try {
            await registerUser({
                full_name: data.full_name,
                email: data.email,
                password: data.password,
            });
            toast.success('Account created! Please verify your email.');
            router.push(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Registration failed. Please try again.');
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
            <div className="relative overflow-hidden rounded-3xl border border-primary/10 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-xl shadow-2xl transition-all duration-300 hover:shadow-primary/5">
                {/* Glow Effect */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-50" />

                <div className="p-8 md:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-foreground mb-2 tracking-tight">Create Account</h1>
                        <p className="text-muted-foreground">Join Scire and start your journey</p>
                    </div>

                    {/* Student Role Notice */}
                    <div className="mb-6 p-4 rounded-2xl bg-primary/5 border border-primary/10 dark:border-primary/20">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                                <GraduationCap className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-foreground">Student Account</p>
                                <p className="text-xs text-muted-foreground mt-0.5">All new accounts are registered as students</p>
                            </div>
                        </div>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Full Name Field */}
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-foreground/90 font-medium">
                                Full Name
                            </Label>
                            <div className="relative group/input">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="full_name"
                                    type="text"
                                    placeholder="Ashok Kumar"
                                    className="pl-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('full_name')}
                                />
                            </div>
                            {errors.full_name && (
                                <p className="text-sm text-red-500 font-medium">{errors.full_name.message}</p>
                            )}
                        </div>

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
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-sm text-red-500 font-medium">{errors.password.message}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Min 8 characters with uppercase, lowercase, and number
                            </p>
                        </div>

                        {/* Confirm Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="text-foreground/90 font-medium">
                                Confirm Password
                            </Label>
                            <div className="relative group/input">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
                                <Input
                                    id="confirm_password"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    className="pl-11 pr-11 h-12 bg-primary/5 dark:bg-white/5 border-primary/10 dark:border-white/10 text-foreground placeholder:text-muted-foreground/70 focus:border-primary/50 focus:ring-primary/20 rounded-xl transition-all"
                                    {...register('confirm_password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                                >
                                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.confirm_password && (
                                <p className="text-sm text-red-500 font-medium">{errors.confirm_password.message}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-12 rounded-xl bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_20px_-5px_var(--primary)/0.3] hover:shadow-primary/50 transition-all hover:scale-[1.02] font-semibold text-lg cursor-pointer"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                                    Creating Account...
                                </>
                            ) : (
                                <>
                                    Create Account
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
                            <span className="px-4 bg-transparent backdrop-blur-sm">Already have an account?</span>
                        </div>
                    </div>

                    {/* Login Link */}
                    <Link href="/auth/login" className="block cursor-pointer">
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full h-12 rounded-xl border-primary/10 dark:border-white/10 text-foreground hover:bg-primary/5 dark:hover:bg-white/5 transition-all font-medium cursor-pointer"
                        >
                            Sign In Instead
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Terms */}
            <p className="mt-6 text-center text-xs text-muted-foreground">
                By creating an account, you agree to our{' '}
                <Link href="/terms" className="text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer">
                    Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-primary hover:text-primary/80 transition-colors font-medium cursor-pointer">
                    Privacy Policy
                </Link>
            </p>
        </motion.div>
    );
}
