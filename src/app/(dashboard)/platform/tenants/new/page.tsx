'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft,
    Loader2,
    Building,
    Globe,
    CreditCard,
    Users,
    FileText,
    Building2,
    Clock,
    ShieldCheck,
    Zap,
    Crown,
    Sparkles,
    ChevronDown,
    AlertTriangle,
} from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import Link from 'next/link';
import { PageHeader } from '@/components/dashboard/page-header';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible"

// ─── Plan configuration (mirrors backend PLAN_DETAILS) ───────────────
const PLAN_CONFIG = {
    STARTER: {
        name: 'Starter',
        subtitle: 'Essential features for small teams',
        price: '₹999',
        period: '/mo',
        icon: Zap,
        limits: { max_students: 50, max_exams_per_month: 5 },
        color: 'text-blue-500',
        borderColor: 'border-blue-500/40',
        bgGlow: 'bg-blue-500/5',
    },
    PRO: {
        name: 'Pro',
        subtitle: 'For growing organizations',
        price: '₹4,999',
        period: '/mo',
        icon: Crown,
        limits: { max_students: 1000, max_exams_per_month: 100 },
        color: 'text-amber-500',
        borderColor: 'border-amber-500/40',
        bgGlow: 'bg-amber-500/5',
    },
    ENTERPRISE: {
        name: 'Enterprise',
        subtitle: 'Custom solutions at scale',
        price: 'Custom',
        period: '',
        icon: Sparkles,
        limits: { max_students: 100000, max_exams_per_month: 10000 },
        color: 'text-violet-500',
        borderColor: 'border-violet-500/40',
        bgGlow: 'bg-violet-500/5',
    },
} as const;

type PlanKey = keyof typeof PLAN_CONFIG;

const TRIAL_OPTIONS = [
    { value: '14', label: '14 days', description: 'Standard trial' },
    { value: '30', label: '30 days', description: 'Extended trial' },
    { value: '0', label: 'No trial', description: 'Start as Active immediately' },
] as const;

// ─── Form schema ────────────────────────────────────────────────────
const formSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    slug: z.string()
        .min(3, 'Slug must be at least 3 characters')
        .regex(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/, 'Must start/end with letter or digit, only lowercase alphanumeric and hyphens'),
    domain: z.string().optional(),
    subscription_tier: z.enum(['STARTER', 'PRO', 'ENTERPRISE']),
    trial_days: z.string(),
    provisioning_note: z.string().optional(),
    override_limits: z.boolean(),
    max_students: z.coerce.number().int().min(0).optional(),
    max_exams_per_month: z.coerce.number().int().min(0).optional(),
    admin_email: z.string().email('Invalid email address').optional().or(z.literal('')),
    admin_name: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof formSchema>;

export default function NewTenantPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [overrideOpen, setOverrideOpen] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            name: '',
            slug: '',
            domain: '',
            subscription_tier: 'STARTER',
            trial_days: '14',
            provisioning_note: '',
            override_limits: false,
            max_students: PLAN_CONFIG.STARTER.limits.max_students,
            max_exams_per_month: PLAN_CONFIG.STARTER.limits.max_exams_per_month,
            admin_email: '',
            admin_name: '',
        },
    });

    // Watch plan changes → auto-populate limits
    const selectedPlan = useWatch({ control: form.control, name: 'subscription_tier' });
    const overrideLimits = useWatch({ control: form.control, name: 'override_limits' });
    const trialDays = useWatch({ control: form.control, name: 'trial_days' });

    useEffect(() => {
        if (!overrideLimits && selectedPlan) {
            const planLimits = PLAN_CONFIG[selectedPlan as PlanKey]?.limits;
            if (planLimits) {
                form.setValue('max_students', planLimits.max_students);
                form.setValue('max_exams_per_month', planLimits.max_exams_per_month);
            }
        }
    }, [selectedPlan, overrideLimits, form]);

    // Auto-generate slug from name
    const autoSlug = useCallback((name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 50);
    }, []);

    const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

    async function onSubmit(values: FormValues) {
        setIsLoading(true);
        try {
            await api.platform.createTenant({
                name: values.name,
                slug: values.slug,
                domain: values.domain || undefined,
                subscription_tier: values.subscription_tier,
                trial_days: parseInt(values.trial_days),
                provisioning_note: values.provisioning_note || undefined,
                override_limits: values.override_limits,
                max_students: values.override_limits ? values.max_students : undefined,
                max_exams_per_month: values.override_limits ? values.max_exams_per_month : undefined,
                admin_email: values.admin_email || undefined,
                admin_name: values.admin_name || undefined,
            });
            toast.success('Tenant created successfully');
            router.push('/platform/tenants');
        } catch (error: any) {
            toast.error(error?.response?.data?.detail || error.message || 'Failed to create tenant');
        } finally {
            setIsLoading(false);
        }
    }

    const activePlan = PLAN_CONFIG[selectedPlan as PlanKey] || PLAN_CONFIG.STARTER;
    const isSkipTrial = trialDays === '0';

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in w-full max-w-5xl mx-auto">
            <Breadcrumb>
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/platform">Platform</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbLink href="/platform/tenants">Tenants</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    <BreadcrumbItem>
                        <BreadcrumbPage>New Tenant</BreadcrumbPage>
                    </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <PageHeader
                title="Provision Tenant"
                description="Create a new organization. This is an administrative action — billing is handled offline."
            />

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10 max-w-5xl">

                    {/* ── Section 1: Organization Details ──────────────────── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-primary" />
                                Organization Details
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">Basic information about the tenant.</p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>Organization Name</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Building className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input
                                                    placeholder="Acme University"
                                                    className="pl-9"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        if (!slugManuallyEdited) {
                                                            form.setValue('slug', autoSlug(e.target.value));
                                                        }
                                                    }}
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="slug"
                                render={({ field }) => (
                                    <FormItem className="col-span-2 md:col-span-1">
                                        <FormLabel>Slug</FormLabel>
                                        <FormControl>
                                            <div className="flex rounded-md shadow-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                                                <span className="flex select-none items-center pl-3 text-sm text-muted-foreground bg-muted/50 rounded-l-md border border-r-0 px-3 h-9">
                                                    scire.in/
                                                </span>
                                                <Input
                                                    placeholder="acme-university"
                                                    className="rounded-l-none border-l-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none h-9"
                                                    {...field}
                                                    onChange={(e) => {
                                                        field.onChange(e);
                                                        setSlugManuallyEdited(true);
                                                    }}
                                                />
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
                                    <FormItem className="col-span-2">
                                        <FormLabel>Custom Domain <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Globe className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                <Input placeholder="exams.acme.edu" className="pl-9" {...field} />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* ── Section 2: Subscription Plan ─────────────────────── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Plan & Entitlements
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Select the plan for this tenant. Limits are auto-applied from the plan configuration.
                            </p>
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
                                            defaultValue={field.value}
                                            className="grid grid-cols-1 md:grid-cols-3 gap-4"
                                        >
                                            {(Object.entries(PLAN_CONFIG) as [PlanKey, typeof PLAN_CONFIG[PlanKey]][]).map(([key, plan]) => {
                                                const Icon = plan.icon;
                                                const isSelected = field.value === key;
                                                return (
                                                    <FormItem key={key}>
                                                        <FormControl>
                                                            <RadioGroupItem value={key} className="peer sr-only" />
                                                        </FormControl>
                                                        <FormLabel className={`flex flex-col items-center justify-between rounded-xl border-2 p-5 cursor-pointer transition-all duration-200 ${isSelected
                                                            ? `${plan.borderColor} ${plan.bgGlow} shadow-sm`
                                                            : 'border-muted bg-popover hover:bg-accent/50 hover:text-accent-foreground'
                                                            } peer-data-[state=checked]:${plan.borderColor} [&:has([data-state=checked])]:${plan.borderColor}`}>
                                                            <Icon className={`h-7 w-7 mb-2 ${isSelected ? plan.color : 'text-muted-foreground'}`} />
                                                            <span className="text-lg font-bold">{plan.name}</span>
                                                            <span className="text-xs text-muted-foreground mt-0.5 text-center">{plan.subtitle}</span>
                                                            <span className="text-2xl font-bold mt-3">
                                                                {plan.price}
                                                                {plan.period && <span className="text-xs font-normal text-muted-foreground">{plan.period}</span>}
                                                            </span>
                                                            <div className="flex gap-3 mt-3 text-[11px] text-muted-foreground">
                                                                <span>{plan.limits.max_students.toLocaleString()} students</span>
                                                                <span>•</span>
                                                                <span>{plan.limits.max_exams_per_month.toLocaleString()} exams/mo</span>
                                                            </div>
                                                        </FormLabel>
                                                    </FormItem>
                                                );
                                            })}
                                        </RadioGroup>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Plan limits display */}
                        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <ShieldCheck className="h-4 w-4 text-muted-foreground" />
                                    Resolved Limits
                                </h4>
                                {!overrideLimits && (
                                    <Badge variant="secondary" className="text-[10px]">Auto from plan</Badge>
                                )}
                                {overrideLimits && (
                                    <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-500">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Custom override
                                    </Badge>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="flex items-center gap-3 text-sm">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Max Students:</span>
                                    <span className="font-semibold">{form.watch('max_students')?.toLocaleString()}</span>
                                </div>
                                <div className="flex items-center gap-3 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">Exams / Month:</span>
                                    <span className="font-semibold">{form.watch('max_exams_per_month')?.toLocaleString()}</span>
                                </div>
                            </div>

                            {/* Override toggle */}
                            <Collapsible open={overrideOpen} onOpenChange={setOverrideOpen}>
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-xs text-muted-foreground p-0 h-auto hover:text-foreground">
                                        <ChevronDown className={`h-3 w-3 mr-1 transition-transform ${overrideOpen ? 'rotate-180' : ''}`} />
                                        Custom limit override
                                    </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="pt-3 space-y-4">
                                    <FormField
                                        control={form.control}
                                        name="override_limits"
                                        render={({ field }) => (
                                            <FormItem className="flex items-center gap-3 space-y-0">
                                                <FormControl>
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                </FormControl>
                                                <FormLabel className="text-sm font-normal cursor-pointer">
                                                    Override plan defaults with custom limits
                                                </FormLabel>
                                            </FormItem>
                                        )}
                                    />

                                    {overrideLimits && (
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <FormField
                                                control={form.control}
                                                name="max_students"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel className="text-xs">Max Students</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <Users className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input type="number" className="pl-9" {...field} />
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
                                                        <FormLabel className="text-xs">Exams per Month</FormLabel>
                                                        <FormControl>
                                                            <div className="relative">
                                                                <FileText className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                <Input type="number" className="pl-9" {...field} />
                                                            </div>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        </div>
                    </div>

                    {/* ── Section 3: Trial & Provisioning ──────────────────── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Clock className="h-5 w-5 text-primary" />
                                Trial & Provisioning
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                Configure the initial status and provide an audit reason.
                            </p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="trial_days"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Trial Duration</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select trial period" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {TRIAL_OPTIONS.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        <div className="flex items-center gap-2">
                                                            <span>{opt.label}</span>
                                                            <span className="text-muted-foreground text-xs">— {opt.description}</span>
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormDescription>
                                            {isSkipTrial ? (
                                                <span className="text-emerald-500 font-medium">Tenant starts as Active (no trial)</span>
                                            ) : (
                                                <span>Tenant starts on Trial, auto-suspends after {trialDays} days</span>
                                            )}
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Status badge preview */}
                            <div className="flex items-center justify-center md:justify-start pt-6">
                                <div className="flex items-center gap-2 rounded-lg border px-4 py-2.5 bg-muted/30">
                                    <span className="text-sm text-muted-foreground">Initial Status:</span>
                                    {isSkipTrial ? (
                                        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20">
                                            Active
                                        </Badge>
                                    ) : (
                                        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20">
                                            Trial ({trialDays}d)
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <FormField
                            control={form.control}
                            name="provisioning_note"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Provisioning Note
                                        <span className="text-muted-foreground font-normal ml-1">(Recommended)</span>
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="e.g., Contract #INV-2024-001, Partner onboarding for IIT Delhi, Internal test environment..."
                                            className="resize-none min-h-[80px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        This is logged in the audit trail. Include contract ID, partner name, or reason for provisioning.
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    {/* ── Section 4: Initial Admin Provisioning ───────────────── */}
                    <div className="space-y-6">
                        <div>
                            <h2 className="text-xl font-semibold flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Initial Admin Provisioning
                            </h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                By providing an email address, an initial admin user will be automatically created and invited.
                            </p>
                        </div>
                        <Separator />

                        <div className="grid gap-6 md:grid-cols-2">
                            <FormField
                                control={form.control}
                                name="admin_name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Admin Name <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
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
                                        <FormLabel>Admin Email <span className="text-muted-foreground font-normal">(Optional)</span></FormLabel>
                                        <FormControl>
                                            <Input type="email" placeholder="admin@example.com" {...field} />
                                        </FormControl>
                                        <FormDescription>
                                            A secure temporary password will be sent to this email.
                                        </FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>

                    {/* ── Actions ──────────────────────────────────────────── */}
                    <div className="flex justify-start gap-4 pt-4">
                        <Button type="submit" disabled={isLoading} size="lg" className="px-8 font-semibold shadow-md">
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                            Provision Tenant
                        </Button>
                        <Button type="button" variant="ghost" size="lg" asChild>
                            <Link href="/platform/tenants">Cancel</Link>
                        </Button>
                    </div>
                </form>
            </Form>
        </div>
    );
}
