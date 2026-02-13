'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/network/api';
// import { AmbientGlow } from '@/components/ui/ambient-glow';

const requestSchema = z.object({
    full_name: z.string().min(2, "Name is required"),
    email: z.string().email("Invalid email address"),
    name: z.string().min(2, "Organization name is required"),
    slug: z.string()
        .min(3, "Slug must be at least 3 characters")
        .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
    phone: z.string().optional(),
    use_case: z.string().optional(),
});

type RequestFormValues = z.infer<typeof requestSchema>;

export default function RequestAccessPage() {
    const router = useRouter();
    const { register, handleSubmit, formState: { errors } } = useForm<RequestFormValues>({
        resolver: zodResolver(requestSchema)
    });

    const mutation = useMutation({
        mutationFn: api.onboarding.requestAccess,
        onSuccess: () => {
            toast.success("Request submitted successfully!");
            // Redirect to a specific success page or just show a message state
            setSubmitted(true);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to submit request");
        }
    });

    const [submitted, setSubmitted] = React.useState(false);

    const onSubmit = (data: RequestFormValues) => {
        mutation.mutate(data);
    };

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
                {/* <AmbientGlow /> */}
                <Card className="max-w-md w-full backdrop-blur-3xl bg-card/30 border-white/10 shadow-2xl">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
                            Request Received
                        </CardTitle>
                        <CardDescription>
                            Thank you for your interest! We have received your request and will contact you shortly at your provided email address.
                        </CardDescription>
                    </CardHeader>
                    <CardFooter className="justify-center">
                        <Link href="/">
                            <Button variant="outline">Return to Home</Button>
                        </Link>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* <AmbientGlow /> */}

            <div className="w-full max-w-lg space-y-8 relative z-10">
                <div className="text-center space-y-2">
                    <h1 className="text-4xl font-bold tracking-tight">Get Early Access</h1>
                    <p className="text-muted-foreground">Join the next generation of academic integrity.</p>
                </div>

                <Card className="backdrop-blur-3xl bg-card/30 border-white/10 shadow-2xl">
                    <CardHeader>
                        <CardTitle>Organization Details</CardTitle>
                        <CardDescription>Tell us about your institution.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="full_name">Your Name</Label>
                                    <Input id="full_name" {...register('full_name')} placeholder="Dr. Jane Doe" />
                                    {errors.full_name && <p className="text-red-500 text-xs">{errors.full_name.message}</p>}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone (Optional)</Label>
                                    <Input id="phone" {...register('phone')} placeholder="+1 ..." />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <Input id="email" type="email" {...register('email')} placeholder="jane@university.edu" />
                                {errors.email && <p className="text-red-500 text-xs">{errors.email.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Organization Name</Label>
                                <Input id="name" {...register('name')} placeholder="Acme University" />
                                {errors.name && <p className="text-red-500 text-xs">{errors.name.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="slug">Desired Subdomain</Label>
                                <div className="flex">
                                    <Input
                                        id="slug"
                                        {...register('slug')}
                                        placeholder="acme-uni"
                                        className="rounded-r-none border-r-0"
                                    />
                                    <div className="bg-muted border border-l-0 border-input rounded-r-md px-3 flex items-center text-sm text-muted-foreground">
                                        .scira.app
                                    </div>
                                </div>
                                <p className="text-xs text-muted-foreground">This will be your login URL.</p>
                                {errors.slug && <p className="text-red-500 text-xs">{errors.slug.message}</p>}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="use_case">Use Case (Optional)</Label>
                                <Textarea
                                    id="use_case"
                                    {...register('use_case')}
                                    placeholder="We need to proctor 500 remote exams..."
                                />
                            </div>

                            <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white" disabled={mutation.isPending}>
                                {mutation.isPending ? "Submitting..." : "Submit Request"}
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-center border-t border-white/5 pt-4">
                        <p className="text-sm text-muted-foreground">
                            Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Log in</Link>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
