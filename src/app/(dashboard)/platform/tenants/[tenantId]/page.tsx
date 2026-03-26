'use client';

import { use, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
    ArrowLeft,
    Loader2,
    Save,
    Building,
    Globe,
    CreditCard,
    Users,
    FileText,
    Building2
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from "@/components/ui/separator";
import Link from 'next/link';
import { PageHeader } from "@/components/dashboard/page-header";

const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    domain: z.string().optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'TRIAL', 'CHURNED']),
    subscription_tier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    max_students: z.coerce.number().min(1),
    max_exams_per_month: z.coerce.number().min(1),
});

const adminFormSchema = z.object({
    admin_email: z.string().email('Invalid email address'),
    admin_name: z.string().min(2, 'Name must be at least 2 characters'),
});

function AdminProvisioningForm({ tenantId }: { tenantId: string }) {
    const [isPending, setIsPending] = useState(false);

    const form = useForm<z.infer<typeof adminFormSchema>>({
        resolver: zodResolver(adminFormSchema) as any,
        defaultValues: {
            admin_email: '',
            admin_name: '',
        },
    });

    async function onSubmit(values: z.infer<typeof adminFormSchema>) {
        try {
            setIsPending(true);
            await api.platform.provisionTenantAdmin(tenantId, values);
            toast.success("Admin provisioned successfully. They will receive a welcome email.");
            form.reset();
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error.message || "Failed to provision admin");
        } finally {
            setIsPending(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 bg-muted/30 p-6 rounded-lg border border-border/50">
                <div className="grid gap-6 md:grid-cols-2 items-start">
                    <FormField
                        control={form.control}
                        name="admin_name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Admin Name</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ashok Kumar" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="admin_email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Admin Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="admin@example.com" {...field} />
                                </FormControl>
                                <FormDescription>A secure temporary password will be sent here.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>
                <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Provision Admin
                </Button>
            </form>
        </Form>
    );
}

export default function TenantDetailsPage({ params }: { params: Promise<{ tenantId: string }> }) {
    const { tenantId } = use(params);
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: tenant, isLoading } = useQuery({
        queryKey: ['tenant', tenantId],
        queryFn: () => api.platform.getTenant(tenantId),
    });

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            domain: undefined,
            status: 'ACTIVE',
            subscription_tier: 'STARTER',
            max_students: 100,
            max_exams_per_month: 10,
        },
    });

    // Reset form when data loads
    useEffect(() => {
        if (tenant) {
            form.reset({
                name: tenant.name,
                domain: tenant.domain || '',
                status: tenant.status,
                subscription_tier: tenant.subscription_tier,
                max_students: tenant.max_students,
                max_exams_per_month: tenant.max_exams_per_month,
            });
        }
    }, [tenant, form]);

    const selectedTier = form.watch('subscription_tier');

    // Auto-update limits when fixed plan is selected
    useEffect(() => {
        if (selectedTier === 'STARTER') {
            form.setValue('max_students', 50, { shouldValidate: true });
            form.setValue('max_exams_per_month', 10, { shouldValidate: true });
        } else if (selectedTier === 'PRO') {
            form.setValue('max_students', 500, { shouldValidate: true });
            form.setValue('max_exams_per_month', 100, { shouldValidate: true });
        }
    }, [selectedTier, form]);

    const updateMutation = useMutation({
        mutationFn: (values: z.infer<typeof formSchema>) =>
            api.platform.updateTenant(tenantId, values),
        onSuccess: () => {
            toast.success('Tenant updated successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
            queryClient.invalidateQueries({ queryKey: ['platform', 'tenants'] });
        },
        onError: (err: any) => toast.error(err.message || 'Update failed')
    });

    function onSubmit(values: z.infer<typeof formSchema>) {
        updateMutation.mutate(values);
    }

    if (isLoading) {
        return (
            <div className="flex flex-col gap-6 p-6 pb-20 max-w-5xl">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-9 w-48" />
                        <Skeleton className="h-4 w-72" />
                    </div>
                    <Skeleton className="h-7 w-20 rounded-full" />
                </div>
                <Separator />
                <div className="space-y-6">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="grid gap-6 md:grid-cols-2 items-start">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                </div>
                <div className="space-y-6 pt-2">
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-36" />
                        <Skeleton className="h-4 w-56" />
                    </div>
                    <Skeleton className="h-px w-full" />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-28 rounded-md" />
                        <Skeleton className="h-28 rounded-md" />
                        <Skeleton className="h-28 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-11 w-40" />
            </div>
        );
    }

    if (!tenant) {
        return <div>Tenant not found</div>;
    }

    return (
        <div className="flex flex-col gap-6 p-6 animate-fade-in pb-20">
            <PageHeader
                title="Manage Tenant"
                description={`Configure settings and subscription for ${tenant.name}`}
                actions={
                    <Badge variant="outline" className="text-sm py-1 px-3">
                        {tenant.slug}
                    </Badge>
                }
            />
            <Separator />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-5xl">

                    {/* Organization Settings */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Organization Settings
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Update organization details and status.</p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2 items-start">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>Organization Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="domain"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>Custom Domain</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormDescription>
                                            e.g. exams.acme.com
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="status"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="ACTIVE">Active</SelectItem>
                                                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                                                <SelectItem value="TRIAL">Trial</SelectItem>
                                                <SelectItem value="CHURNED">Churned</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* Subscription & Limits */}
                    <div className="space-y-6 pt-2">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Plan & Limits
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Manage subscription tier and usage limits.</p>
                        </div>
                        <Separator />

                        <FormField
                            control={form.control}
                            name="subscription_tier"
                            render={({ field }) => (
                                <FormItem className="space-y-3">
                                    <FormLabel>Subscription Plan</FormLabel>
                                    <FormControl>
                                        <RadioGroup
                                            onValueChange={field.onChange}
                                            value={field.value}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="STARTER" className="peer sr-only" />
                                                </FormControl>
                                                <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                                    <span className="text-xl font-bold">Starter</span>
                                                    <span className="text-sm text-muted-foreground mt-1">For small teams</span>
                                                    <span className="text-2xl font-bold mt-2">₹999<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="PRO" className="peer sr-only" />
                                                </FormControl>
                                                <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                                    <span className="text-xl font-bold">Pro</span>
                                                    <span className="text-sm text-muted-foreground mt-1">Growing organizations</span>
                                                    <span className="text-2xl font-bold mt-2">₹4,999<span className="text-xs font-normal text-muted-foreground">/mo</span></span>
                                                </FormLabel>
                                            </FormItem>
                                            <FormItem>
                                                <FormControl>
                                                    <RadioGroupItem value="ENTERPRISE" className="peer sr-only" />
                                                </FormControl>
                                                <FormLabel className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                                                    <span className="text-xl font-bold">Enterprise</span>
                                                    <span className="text-sm text-muted-foreground mt-1">Unlimited scale</span>
                                                    <span className="text-2xl font-bold mt-2">Custom</span>
                                                </FormLabel>
                                            </FormItem>
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid gap-6 md:grid-cols-2 pt-4">
                            <FormField
                                control={form.control}
                                name="max_students"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Max Students</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    className="pl-9" 
                                                    {...field} 
                                                    disabled={selectedTier !== 'ENTERPRISE'}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="max_exams_per_month"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Exams per Month</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input 
                                                    type="number" 
                                                    className="pl-9" 
                                                    {...field} 
                                                    disabled={selectedTier !== 'ENTERPRISE'}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    <div className="flex justify-start gap-4 pt-6">
                        <Button type="submit" disabled={updateMutation.isPending} size="lg" className="px-8 font-semibold">
                            {updateMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                            <Save className="h-4 w-4" />
                            Save Changes
                        </Button>
                        <Button type="button" variant="ghost" size="lg" asChild>
                            <Link href="/platform/tenants">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </Form>

            <div className="space-y-6 max-w-5xl mt-12">
                <div>
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Retroactive Admin Provisioning
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        If this tenant was created without an initial admin, you can provision one here.
                        They will receive an email with their login credentials.
                    </p>
                </div>
                <Separator />
                <AdminProvisioningForm tenantId={tenant.id} />
            </div>
        </div>
    );
}
