'use client';

import React, { useCallback, useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
    Building2,
    User,
    Mail,
    Phone,
    Globe,
    FileText,
    ArrowRight,
    CheckCircle2,
    Sparkles,
    Shield,
    Zap,
    BarChart3,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/network/api';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { Logo } from '@/components/ui/logo';

// ============= Validation Schema =============

const requestSchema = z.object({
    full_name: z.string().min(2, 'Name is required'),
    email: z
        .string()
        .email('Invalid email address')
        .refine((v) => !v.endsWith('gmail.com') && !v.endsWith('yahoo.com') && !v.endsWith('hotmail.com'), {
            message: 'Please use a work or institutional email',
        }),
    name: z.string().min(2, 'Organization name is required'),
    slug: z
        .string()
        .min(3, 'Slug must be at least 3 characters')
        .max(50, 'Slug must be at most 50 characters')
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Must start and end with a letter or digit; only lowercase, numbers, hyphens'),
    phone: z.string().optional(),
    use_case: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

// ============= Animation Variants =============

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.08, delayChildren: 0.1 },
    },
} as const;

const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    },
} as const;

// ============= Feature Pills =============

const features = [
    { icon: Shield, label: 'AI-Powered Proctoring' },
    { icon: Zap, label: 'Real-time Viva' },
    { icon: BarChart3, label: 'Advanced Analytics' },
] as const;

// ============= Slug Generator =============

function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 50);
}

// ============= Success View =============

function SuccessView() {
    return (
        <AuthBackground>
            <div className="flex min-h-full items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full max-w-md"
                >
                    <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl">
                        {/* Top edge highlight */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-emerald-400/40 to-transparent" />

                        <div className="p-8 text-center">
                            {/* Animated checkmark */}
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, duration: 0.5, type: 'spring', stiffness: 200 }}
                                className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 ring-1 ring-emerald-500/20"
                            >
                                <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                            </motion.div>

                            <motion.h2
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.35, duration: 0.4 }}
                                className="text-2xl font-bold text-white mb-3"
                            >
                                Request Received
                            </motion.h2>

                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.45, duration: 0.4 }}
                                className="text-sm text-white/60 leading-relaxed mb-8"
                            >
                                Thank you for your interest! Our team will review your
                                application and get back to you within 24–48 hours at your provided email address.
                            </motion.p>

                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.55, duration: 0.4 }}
                                className="space-y-3"
                            >
                                <Link href="/">
                                    <Button className="w-full h-11 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] text-white transition-all duration-300">
                                        Return to Home
                                    </Button>
                                </Link>
                                <Link href="/auth/login">
                                    <Button variant="ghost" className="w-full h-11 rounded-xl text-white/50 hover:text-white/80 hover:bg-transparent">
                                        Already have credentials? Sign in
                                    </Button>
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AuthBackground>
    );
}

// ============= Main Page Component =============

export default function RequestAccessPage() {
    const {
        register,
        handleSubmit,
        setValue,
        control,
        formState: { errors },
    } = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema),
        defaultValues: { slug: '' },
    });

    const [submitted, setSubmitted] = React.useState(false);
    const [slugManuallyEdited, setSlugManuallyEdited] = React.useState(false);

    // Watch org name for auto-slugifying
    const orgName = useWatch({ control, name: 'name' });

    // Auto-generate slug from org name unless user manually edited it
    useEffect(() => {
        if (orgName && !slugManuallyEdited) {
            setValue('slug', slugify(orgName), { shouldValidate: orgName.length >= 2 });
        }
    }, [orgName, slugManuallyEdited, setValue]);

    const mutation = useMutation({
        mutationFn: api.onboarding.requestAccess,
        onSuccess: () => {
            toast.success('Request submitted successfully!');
            setSubmitted(true);
        },
        onError: (error: any) => {
            const msg =
                error?.response?.data?.detail || error.message || 'Failed to submit request';
            toast.error(msg);
        },
    });

    const onSubmit = (data: RequestFormValues) => {
        mutation.mutate(data);
    };

    if (submitted) {
        return <SuccessView />;
    }

    return (
        <AuthBackground>
            {/* Fixed top-left logo */}
            <div className="fixed top-6 left-6 z-50">
                <Logo size="md" href="/" showText textClassName="text-white" />
            </div>

            {/* Main content — centered */}
            <div className="flex min-h-full items-center justify-center px-4 py-16">
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-lg"
                >
                    {/* Header */}
                    <motion.div variants={itemVariants} className="text-center mb-6">
                        <div className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-xs text-white/50 mb-4 backdrop-blur-sm">
                            <Sparkles className="h-3 w-3 text-amber-400" />
                            14-day free trial • No credit card required
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-2">
                            Get Early Access
                        </h1>
                        <p className="text-sm text-white/50">
                            Set up your institution in minutes. AI-powered assessments at scale.
                        </p>
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div variants={itemVariants} className="flex items-center justify-center gap-3 mb-6">
                        {features.map(({ icon: Icon, label }) => (
                            <div
                                key={label}
                                className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/40"
                            >
                                <Icon className="h-3 w-3 text-white/30" />
                                {label}
                            </div>
                        ))}
                    </motion.div>

                    {/* Card */}
                    <motion.div
                        variants={itemVariants}
                        className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.04] backdrop-blur-2xl shadow-2xl transition-all duration-500 hover:border-white/[0.12] hover:shadow-primary/5"
                    >
                        {/* Top edge highlight */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

                        {/* Ambient glow on hover */}
                        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-64 w-64 rounded-full bg-primary/5 blur-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />

                        <div className="p-6 md:p-7">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                {/* — Personal Details — */}
                                <motion.div variants={itemVariants} className="space-y-1">
                                    <p className="text-[11px] font-medium uppercase tracking-wider text-white/30">
                                        Contact Information
                                    </p>
                                </motion.div>

                                <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
                                    {/* Full Name */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="full_name" className="text-xs text-white/60">
                                            Full Name
                                        </Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                            <Input
                                                id="full_name"
                                                {...register('full_name')}
                                                placeholder="Dr. Priya Sharma"
                                                className="h-10 pl-9 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
                                            />
                                        </div>
                                        <AnimatePresence>
                                            {errors.full_name && (
                                                <motion.p
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="text-red-400/80 text-[11px]"
                                                >
                                                    {errors.full_name.message}
                                                </motion.p>
                                            )}
                                        </AnimatePresence>
                                    </div>

                                    {/* Phone */}
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone" className="text-xs text-white/60">
                                            Phone <span className="text-white/20">(optional)</span>
                                        </Label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                            <Input
                                                id="phone"
                                                {...register('phone')}
                                                placeholder="+91 ..."
                                                className="h-10 pl-9 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
                                            />
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Email */}
                                <motion.div variants={itemVariants} className="space-y-1.5">
                                    <Label htmlFor="email" className="text-xs text-white/60">
                                        Work Email
                                    </Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                        <Input
                                            id="email"
                                            type="email"
                                            {...register('email')}
                                            placeholder="priya.sharma@university.edu.in"
                                            className="h-10 pl-9 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {errors.email && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400/80 text-[11px]"
                                            >
                                                {errors.email.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Divider */}
                                <motion.div variants={itemVariants} className="relative">
                                    <div className="absolute inset-0 flex items-center">
                                        <div className="w-full border-t border-white/[0.06]" />
                                    </div>
                                    <div className="relative flex justify-center">
                                        <span className="bg-transparent px-2 text-[11px] font-medium uppercase tracking-wider text-white/30">
                                            Organization
                                        </span>
                                    </div>
                                </motion.div>

                                {/* Org Name */}
                                <motion.div variants={itemVariants} className="space-y-1.5">
                                    <Label htmlFor="name" className="text-xs text-white/60">
                                        Organization Name
                                    </Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                        <Input
                                            id="name"
                                            {...register('name')}
                                            placeholder="Delhi University"
                                            className="h-10 pl-9 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200"
                                        />
                                    </div>
                                    <AnimatePresence>
                                        {errors.name && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400/80 text-[11px]"
                                            >
                                                {errors.name.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Slug */}
                                <motion.div variants={itemVariants} className="space-y-1.5">
                                    <Label htmlFor="slug" className="text-xs text-white/60">
                                        Subdomain
                                    </Label>
                                    <div className="flex">
                                        <div className="relative flex-1">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/20" />
                                            <Input
                                                id="slug"
                                                {...register('slug', {
                                                    onChange: () => setSlugManuallyEdited(true),
                                                })}
                                                placeholder="du"
                                                className="h-10 pl-9 rounded-r-none border-r-0 rounded-l-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200 font-mono text-sm"
                                            />
                                        </div>
                                        <div className="flex items-center rounded-r-xl border border-l-0 border-white/[0.06] bg-white/[0.02] px-3 text-xs text-white/30 font-mono">
                                            .scire.in
                                        </div>
                                    </div>
                                    <AnimatePresence>
                                        {errors.slug && (
                                            <motion.p
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: 'auto' }}
                                                exit={{ opacity: 0, height: 0 }}
                                                className="text-red-400/80 text-[11px]"
                                            >
                                                {errors.slug.message}
                                            </motion.p>
                                        )}
                                    </AnimatePresence>
                                </motion.div>

                                {/* Use Case */}
                                <motion.div variants={itemVariants} className="space-y-1.5">
                                    <Label htmlFor="use_case" className="text-xs text-white/60">
                                        How will you use Scire?{' '}
                                        <span className="text-white/20">(optional)</span>
                                    </Label>
                                    <div className="relative">
                                        <FileText className="absolute left-3 top-3 h-3.5 w-3.5 text-white/20" />
                                        <Textarea
                                            id="use_case"
                                            {...register('use_case')}
                                            placeholder="We need to proctor 500 remote exams per semester..."
                                            rows={3}
                                            className="pl-9 rounded-xl bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.06] transition-all duration-200 resize-none"
                                        />
                                    </div>
                                </motion.div>

                                {/* Submit Button */}
                                <motion.div variants={itemVariants}>
                                    <Button
                                        type="submit"
                                        disabled={mutation.isPending}
                                        className="relative w-full h-11 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium shadow-lg shadow-blue-500/20 transition-all duration-300 group overflow-hidden"
                                    >
                                        {/* Shimmer */}
                                        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />

                                        <span className="relative flex items-center justify-center gap-2">
                                            {mutation.isPending ? (
                                                <>
                                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                    Submitting...
                                                </>
                                            ) : (
                                                <>
                                                    Request Early Access
                                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                                </>
                                            )}
                                        </span>
                                    </Button>
                                </motion.div>

                                {/* Trial info */}
                                <motion.p
                                    variants={itemVariants}
                                    className="text-center text-[11px] text-white/30"
                                >
                                    You&apos;ll start with a <span className="text-white/50 font-medium">14-day free trial</span> on
                                    the Starter plan. Upgrade anytime.
                                </motion.p>
                            </form>
                        </div>

                        {/* Footer */}
                        <div className="border-t border-white/[0.06] px-6 py-4 text-center">
                            <p className="text-xs text-white/40">
                                Already have an account?{' '}
                                <Link
                                    href="/auth/login"
                                    className="text-white/70 hover:text-white transition-colors underline underline-offset-4 decoration-white/20"
                                >
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </motion.div>

                    {/* Bottom legal */}
                    <motion.p variants={itemVariants} className="text-center text-[10px] text-white/20 mt-4">
                        By submitting, you agree to our{' '}
                        <Link href="/terms" className="underline underline-offset-2 hover:text-white/30 transition-colors">
                            Terms
                        </Link>{' '}
                        and{' '}
                        <Link href="/privacy" className="underline underline-offset-2 hover:text-white/30 transition-colors">
                            Privacy Policy
                        </Link>
                        .
                    </motion.p>
                </motion.div>
            </div>
        </AuthBackground>
    );
}
