'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Mail, Lock, Eye, EyeOff, User, ArrowRight, GraduationCap, Check, X, Shield } from 'lucide-react';
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
        .regex(/[A-Z]/, 'Must contain an uppercase letter')
        .regex(/[a-z]/, 'Must contain a lowercase letter')
        .regex(/[0-9]/, 'Must contain a number'),
    confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

/* ─── Password strength helpers ──────────────────────────────── */
const PASSWORD_RULES = [
    { label: '8+ chars', test: (v: string) => v.length >= 8 },
    { label: 'A-Z', test: (v: string) => /[A-Z]/.test(v) },
    { label: 'a-z', test: (v: string) => /[a-z]/.test(v) },
    { label: '0-9', test: (v: string) => /[0-9]/.test(v) },
] as const;

function usePasswordStrength(password: string) {
    return useMemo(() => {
        const passed = PASSWORD_RULES.filter(r => r.test(password)).length;
        const ratio = passed / PASSWORD_RULES.length;
        const color = ratio <= 0.25 ? 'bg-red-500' : ratio <= 0.5 ? 'bg-orange-500' : ratio <= 0.75 ? 'bg-yellow-500' : 'bg-emerald-500';
        const label = ratio <= 0.25 ? 'Weak' : ratio <= 0.5 ? 'Fair' : ratio <= 0.75 ? 'Good' : 'Strong';
        return { passed, total: PASSWORD_RULES.length, ratio, color, label, rules: PASSWORD_RULES };
    }, [password]);
}

/* ─── Stagger animation variants ─────────────────────────────── */
const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
} as const;
const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

/* ═══════════════════════════════════════════════════════════════ */
export default function RegisterPage() {
    const { register: registerUser } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [passwordValue, setPasswordValue] = useState('');

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<RegisterFormData>({
        resolver: zodResolver(registerSchema),
    });

    const strength = usePasswordStrength(passwordValue);

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
            className="w-full max-w-lg"
        >
            {/* Card Container */}
            <div className="group/card relative overflow-hidden rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-white/25 hover:shadow-primary/10">
                {/* Top edge glow — intensifies on hover */}
                <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50 group-hover/card:opacity-80 transition-opacity duration-500" />
                {/* Bottom subtle glow */}
                <div className="absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover/card:opacity-60 transition-opacity duration-500" />

                <div className="p-6 md:p-8">
                    {/* Staggered content */}
                    <motion.div variants={containerVariants} initial="hidden" animate="visible">

                        {/* Header */}
                        <motion.div variants={itemVariants} className="text-center mb-5">
                            <h1 className="text-2xl font-bold text-foreground mb-1 tracking-tight">Create Account</h1>
                            <p className="text-sm text-muted-foreground">Join Scire and start your journey</p>
                        </motion.div>

                        {/* Student Role Notice — compact inline badge */}
                        <motion.div
                            variants={itemVariants}
                            className="mb-5 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-primary/5 border border-primary/10 dark:border-primary/20"
                        >
                            <GraduationCap className="w-4 h-4 text-primary shrink-0" />
                            <p className="text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">Student Account</span> — all new accounts are registered as students
                            </p>
                        </motion.div>

                        {/* Form */}
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <motion.div variants={containerVariants} className="space-y-3.5">

                                {/* Row 1: Name + Email */}
                                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="full_name" className="text-foreground/90 font-medium text-sm">
                                            Full Name
                                        </Label>
                                        <div className="relative group/input">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-200" />
                                            <Input
                                                id="full_name"
                                                type="text"
                                                placeholder="Ashok Kumar"
                                                className="pl-9 h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all duration-200 text-sm hover:border-white/20"
                                                {...register('full_name')}
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {errors.full_name && (
                                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {errors.full_name.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="email" className="text-foreground/90 font-medium text-sm">
                                            Email Address
                                        </Label>
                                        <div className="relative group/input">
                                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-200" />
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="you@example.com"
                                                className="pl-9 h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all duration-200 text-sm hover:border-white/20"
                                                {...register('email')}
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {errors.email && (
                                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {errors.email.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>

                                {/* Row 2: Password + Confirm Password */}
                                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                                    {/* Password */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="password" className="text-foreground/90 font-medium text-sm">
                                            Password
                                        </Label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-200" />
                                            <Input
                                                id="password"
                                                type={showPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="pl-9 pr-9 h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all duration-200 text-sm hover:border-white/20"
                                                {...register('password', {
                                                    onChange: (e) => setPasswordValue(e.target.value),
                                                })}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {errors.password && (
                                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {errors.password.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Confirm Password */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="confirm_password" className="text-foreground/90 font-medium text-sm">
                                            Confirm Password
                                        </Label>
                                        <div className="relative group/input">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within/input:text-primary transition-colors duration-200" />
                                            <Input
                                                id="confirm_password"
                                                type={showConfirmPassword ? 'text' : 'password'}
                                                placeholder="••••••••"
                                                className="pl-9 pr-9 h-10 bg-white/5 border-white/10 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 rounded-xl transition-all duration-200 text-sm hover:border-white/20"
                                                {...register('confirm_password')}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors duration-200 cursor-pointer"
                                            >
                                                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        <AnimatePresence>
                                            {errors.confirm_password && (
                                                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="text-xs text-red-400 font-medium flex items-center gap-1">
                                                    <X className="w-3 h-3" /> {errors.confirm_password.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                </motion.div>

                                {/* Password strength bar + rule badges */}
                                <motion.div variants={itemVariants}>
                                    <AnimatePresence>
                                        {passwordValue.length > 0 ? (
                                            <motion.div
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="space-y-1.5"
                                            >
                                                {/* Strength bar */}
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                                                        <motion.div
                                                            className={`h-full rounded-full ${strength.color}`}
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${strength.ratio * 100}%` }}
                                                            transition={{ duration: 0.3, ease: 'easeOut' }}
                                                        />
                                                    </div>
                                                    <span className={`text-[10px] font-semibold ${strength.color.replace('bg-', 'text-')} min-w-[36px] text-right`}>
                                                        {strength.label}
                                                    </span>
                                                </div>
                                                {/* Rule badges */}
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {strength.rules.map((rule) => {
                                                        const ok = rule.test(passwordValue);
                                                        return (
                                                            <span
                                                                key={rule.label}
                                                                className={`inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-md transition-colors duration-200 ${ok ? 'bg-emerald-500/15 text-emerald-400' : 'bg-white/5 text-muted-foreground/60'
                                                                    }`}
                                                            >
                                                                {ok ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                                                                {rule.label}
                                                            </span>
                                                        );
                                                    })}
                                                </div>
                                            </motion.div>
                                        ) : (
                                            <motion.p
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="text-xs text-muted-foreground/60 flex items-center gap-1"
                                            >
                                                <Shield className="w-3 h-3" />
                                                Min 8 characters with uppercase, lowercase, and number
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Submit Button — animated gradient */}
                                <motion.div variants={itemVariants}>
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="relative w-full h-10 rounded-xl font-semibold cursor-pointer overflow-hidden bg-gradient-to-r from-primary via-primary/90 to-primary text-primary-foreground shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {/* Shimmer overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/card:translate-x-full transition-transform duration-1000 ease-in-out" />
                                        <span className="relative flex items-center justify-center gap-2">
                                            {isLoading ? (
                                                <>
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                    Creating Account...
                                                </>
                                            ) : (
                                                <>
                                                    Create Account
                                                    <ArrowRight className="w-4 h-4 group-hover/card:translate-x-0.5 transition-transform duration-200" />
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                </motion.div>
                            </motion.div>
                        </form>

                        {/* Footer */}
                        <motion.div variants={itemVariants} className="mt-5 pt-4 border-t border-white/10 space-y-2 text-center">
                            <p className="text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link href="/auth/login" className="text-primary hover:text-primary/80 transition-colors duration-200 font-semibold cursor-pointer hover:underline underline-offset-4">
                                    Sign In
                                </Link>
                            </p>
                            <p className="text-[11px] text-muted-foreground/50">
                                By creating an account, you agree to our{' '}
                                <Link href="/terms" className="text-muted-foreground/70 hover:text-primary/80 transition-colors duration-200 font-medium cursor-pointer">Terms</Link>
                                {' '}&{' '}
                                <Link href="/privacy" className="text-muted-foreground/70 hover:text-primary/80 transition-colors duration-200 font-medium cursor-pointer">Privacy Policy</Link>
                            </p>
                        </motion.div>

                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
}
