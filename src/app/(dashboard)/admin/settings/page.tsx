'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
    Save,
    Upload,
    Shield,
    Palette,
    Brain,
    Radio,
    CheckCircle,
    AlertTriangle,
    Globe,
    Lock,
    Loader2,
    Info,
    Clock,
    Zap,
    Eye,
    Mic,
    Monitor,
    ArrowLeftRight,
    FileText,
    Database,
    Timer,
    BarChart3,
    Hash,
    Sparkles,
    BookOpen,
    Settings2,
    Scale,
    CalendarClock
} from 'lucide-react';

import { api } from '@/lib/network/api';
import { useTenant } from '@/contexts/TenantContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TenantSettings, UserRole } from '@/types/auth';
import { PageHeader } from '@/components/dashboard/page-header';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';


const DEFAULT_SETTINGS: TenantSettings = {
    viva: {
        max_duration_minutes: 30,
        min_duration_minutes: 10,
        allow_pause: false,
        allow_retry: true,
        retry_cooldown_hours: 24
    },
    ai: {
        strictness: 0.7,
        model: 'gpt-4',
        temperature: 0.3,
        enable_rag: true,
        context_window_size: 5
    },
    grading: {
        pass_threshold: 0.6,
        auto_grade_enabled: true,
        require_manual_review_if_flagged: true,
        grade_rounding: 'nearest_half'
    },
    proctoring: {
        face_verification_enabled: true,
        voice_verification_enabled: true,
        tab_switch_limit: 3,
        auto_terminate_on_violation: false
    },
    exceptions: {
        instructor_self_approve_window_days: 0,
        auto_approve_enabled: false,
        auto_approve_delay_hours: 12
    },
    compliance: {
        gdpr_mode: false,
        anonymize_after_days: 90,
        retain_transcripts: true,
        data_residency: undefined
    }
};

const strictnessToUI = (v?: number) => Math.round((v ?? 0.7) * 10);
const strictnessFromUI = (v: number) => Math.min(1.0, Math.max(0.0, v / 10));

const thresholdToUI = (v?: number) => Math.round((v ?? 0.6) * 100);
const thresholdFromUI = (v: number) => Math.min(1.0, Math.max(0.0, v / 100));

function SettingRow({ icon: Icon, iconColor, title, description, children, className, danger }: {
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    title: string;
    description: string;
    children: React.ReactNode;
    className?: string;
    danger?: boolean;
}) {
    return (
        <div className={cn(
            "flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border transition-all",
            danger
                ? "border-destructive/20 bg-destructive/5 hover:border-destructive/30"
                : "border-border/50 bg-background/40 hover:border-primary/20",
            className
        )}>
            <div className="flex items-center gap-4">
                <div className={cn(
                    "p-2.5 rounded-lg shadow-sm shrink-0",
                    danger ? "bg-destructive/10 text-destructive" : iconColor || "bg-primary/10 text-primary"
                )}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="space-y-0.5">
                    <p className={cn(
                        "font-semibold tracking-tight text-[15px]",
                        danger ? "text-destructive" : "text-foreground"
                    )}>{title}</p>
                    <p className="text-[13px] text-muted-foreground leading-relaxed">{description}</p>
                </div>
            </div>
            <div className="ml-14 sm:ml-0 shrink-0">
                {children}
            </div>
        </div>
    );
}

function InputGroup({ icon: Icon, iconColor, label, description, children }: {
    icon: React.ComponentType<{ className?: string }>;
    iconColor?: string;
    label: string;
    description?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-background/40">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-lg shadow-sm", iconColor || "bg-primary/10 text-primary")}>
                    <Icon className="h-4 w-4" />
                </div>
                <div>
                    <Label className="text-[15px] font-semibold tracking-tight">{label}</Label>
                    {description && <p className="text-[12px] text-muted-foreground mt-0.5">{description}</p>}
                </div>
            </div>
            <div className="pl-11">
                {children}
            </div>
        </div>
    );
}

/* ─── Section Card ─── */
function SectionCard({ title, description, icon: Icon, children, footer, className }: {
    title: string;
    description?: string;
    icon?: React.ComponentType<{ className?: string }>;
    children: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
}) {
    return (
        <Card className={cn("border-border/50 shadow-sm overflow-hidden bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl", className)}>
            <CardHeader className="pb-6 px-8 pt-8">
                <CardTitle className="text-xl font-semibold tracking-tight flex items-center gap-2.5">
                    {Icon && <Icon className="h-5 w-5 text-primary" />}
                    {title}
                </CardTitle>
                {description && (
                    <CardDescription className="text-[15px]">{description}</CardDescription>
                )}
            </CardHeader>
            <Separator className="border-border/40" />
            <CardContent className="px-8 py-8">
                {children}
            </CardContent>
            {footer && (
                <div className="px-8 py-4 flex items-center justify-between border-t border-border/40 bg-muted/10">
                    {footer}
                </div>
            )}
        </Card>
    );
}


export default function TenantSettingsPage() {
    const { tenantId, tenantName, tenantPrimaryColor, tenantLogoUrl } = useTenant();
    const { user, refetch: refetchAuth } = useAuth();
    const queryClient = useQueryClient();
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN;

    const { data: tenantDetails, refetch: refetchTenant } = useQuery({
        queryKey: ['tenant-details', tenantId],
        queryFn: api.tenant.getCurrent,
        enabled: !!tenantId,
    });

    const { data: currentSettings, isLoading: isSettingsLoading } = useQuery({
        queryKey: ['tenant-settings', tenantId],
        queryFn: () => tenantId ? api.tenant.getSettings(tenantId) : null,
        enabled: !!tenantId,
    });

    const { register: registerProfile, handleSubmit: handleProfileSubmit, watch: watchProfile, setValue: setProfileValue } = useForm({
        defaultValues: {
            name: tenantName || '',
            primary_color: tenantPrimaryColor || '#6366f1'
        }
    });

    const [settingsState, setSettingsState] = useState<TenantSettings>(DEFAULT_SETTINGS);
    const [settingsSeeded, setSettingsSeeded] = useState(false);

    useEffect(() => {
        if (currentSettings) {
            setSettingsState((prev) => ({
                ...prev,
                ...currentSettings,
                viva: { ...prev.viva, ...currentSettings.viva },
                ai: { ...prev.ai, ...currentSettings.ai },
                grading: { ...prev.grading, ...currentSettings.grading },
                proctoring: { ...prev.proctoring, ...currentSettings.proctoring },
                exceptions: { ...prev.exceptions, ...currentSettings.exceptions },
                compliance: { ...prev.compliance, ...currentSettings.compliance },
            }));
            setSettingsSeeded(true);
        }
    }, [currentSettings]);

    useEffect(() => {
        if (tenantDetails) {
            setSettingsState(prev => ({
                ...prev,
                allow_guests: tenantDetails.allow_guests ?? false,
                additional_domains: tenantDetails.additional_domains ?? [],
            }));
        }
    }, [tenantDetails]);

    useEffect(() => {
        if (tenantName) setProfileValue('name', tenantName);
        if (tenantPrimaryColor) setProfileValue('primary_color', tenantPrimaryColor);
    }, [tenantName, tenantPrimaryColor, setProfileValue]);

    // Mutations
    const updateProfileMutation = useMutation({
        mutationFn: api.tenant.updateProfile,
        onSuccess: () => {
            toast.success('Tenant profile updated');
            refetchAuth();
            queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
        },
        onError: () => toast.error('Failed to update profile')
    });

    const uploadLogoMutation = useMutation({
        mutationFn: api.tenant.uploadLogo,
        onSuccess: () => {
            toast.success('Logo uploaded successfully');
            refetchAuth();
            queryClient.invalidateQueries({ queryKey: ['tenant-details', tenantId] });
            setLogoFile(null);
        },
        onError: () => toast.error('Failed to upload logo')
    });

    const updateSettingsMutation = useMutation({
        mutationFn: (data: TenantSettings) => api.tenant.updateSettings(tenantId!, data as Record<string, unknown>),
        onSuccess: () => {
            toast.success('Settings saved successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-settings'] });
        },
        onError: () => toast.error('Failed to save settings')
    });

    const onProfileSubmit = (data: { name: string; primary_color: string }) => {
        updateProfileMutation.mutate(data);
    };

    const onLogoUpload = () => {
        if (!logoFile) return;
        uploadLogoMutation.mutate(logoFile);
    };

    const saveSettings = () => {
        if (!tenantId) return;
        updateSettingsMutation.mutate(settingsState);
    };

    const updateSetting = (section: keyof TenantSettings, key: string, value: any) => {
        setSettingsState(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as Record<string, any> || {}),
                [key]: value
            }
        }));
    };

    const SaveButton = ({ label }: { label: string }) => (
        <>
            <p className="text-[13px] text-muted-foreground hidden sm:block">Changes apply to newly created exams only.</p>
            <Button
                onClick={saveSettings}
                disabled={updateSettingsMutation.isPending}
                className="cursor-pointer font-medium px-6 shadow-sm"
            >
                {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {updateSettingsMutation.isPending ? 'Saving...' : label}
            </Button>
        </>
    );

    if (!tenantId || isSettingsLoading) return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Tenant Settings"
                description="Manage your organization's profile, branding, and system configurations."
            />
            <div className="flex h-[40vh] flex-col items-center justify-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/60" />
                <p className="text-sm font-medium text-muted-foreground/80">Loading settings...</p>
            </div>
        </main>
    );

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">

            <PageHeader
                title="Tenant Settings"
                description="Manage your organization's profile, branding, and system configurations."
            />

            {/* Configuration Scope Banner */}
            <div className="flex items-start gap-4 p-5 rounded-xl border border-primary/20 bg-primary/5">
                <div className="p-2.5 bg-primary/10 rounded-lg shrink-0 mt-0.5">
                    <Info className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1">
                    <p className="font-semibold text-foreground text-[15px]">Configuration Scope</p>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">
                        Settings configured here act as <strong className="text-foreground">baseline defaults</strong> for newly created exams.
                        Existing exams retain their original settings. Instructors can also override these defaults on a per-exam basis.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
                <TabsList className="overflow-x-auto max-w-full w-full sm:w-fit justify-start flex sm:inline-flex">
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                    <TabsTrigger value="viva">Viva</TabsTrigger>
                    <TabsTrigger value="ai">AI Model</TabsTrigger>
                    <TabsTrigger value="grading">Grading</TabsTrigger>
                    <TabsTrigger value="proctoring">Security</TabsTrigger>
                    <TabsTrigger value="exceptions">Extensions</TabsTrigger>
                    <TabsTrigger value="compliance">Compliance</TabsTrigger>
                </TabsList>

                {/* ═══════════ PROFILE TAB ═══════════ */}
                <TabsContent value="profile" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="grid gap-8 lg:grid-cols-3">
                        {/* Column 1: Branding & Identity */}
                        <SectionCard
                            title="Branding & Identity"
                            description="Customize how your users see the platform."
                            icon={Palette}
                            className="lg:col-span-2"
                            footer={
                                <>
                                    <p className="text-[13px] text-muted-foreground hidden sm:block">Brand changes propagate to all users.</p>
                                    <Button
                                        onClick={() => onProfileSubmit(watchProfile())}
                                        disabled={updateProfileMutation.isPending}
                                        className="cursor-pointer font-medium px-6 shadow-sm"
                                    >
                                        {updateProfileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-8">
                                {/* Logo Upload */}
                                <div className="flex flex-col sm:flex-row gap-6 items-start">
                                    <div className="flex-shrink-0">
                                        <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-border/60 flex items-center justify-center bg-muted/20 overflow-hidden relative group hover:border-primary/50 transition-colors">
                                            {logoFile ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                                            ) : tenantLogoUrl ? (
                                                /* eslint-disable-next-line @next/next/no-img-element */
                                                <img src={tenantLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                                            ) : (
                                                <Upload className="w-8 h-8 text-muted-foreground/50" />
                                            )}
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[1px]">
                                                <label htmlFor="logo-upload" className="cursor-pointer text-xs text-white font-medium px-3 py-1.5 bg-white/10 rounded-full border border-white/20 hover:bg-white/20 transition-all">Change Logo</label>
                                            </div>
                                        </div>
                                        <input
                                            id="logo-upload"
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                                        />
                                    </div>
                                    <div className="space-y-3 flex-1">
                                        <div>
                                            <h4 className="font-semibold text-foreground">Organization Logo</h4>
                                            <p className="text-[13px] text-muted-foreground mt-1">Recommended size: 512×512px. Max 2MB.</p>
                                        </div>
                                        {logoFile && (
                                            <Button size="sm" onClick={onLogoUpload} disabled={uploadLogoMutation.isPending} className="bg-primary text-primary-foreground">
                                                {uploadLogoMutation.isPending ? 'Uploading...' : 'Save New Logo'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <Separator className="border-border/30" />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="name" className="text-sm font-semibold tracking-wide text-foreground">Organization Name</Label>
                                        <Input
                                            id="name"
                                            value={watchProfile('name')}
                                            onChange={(e) => setProfileValue('name', e.target.value)}
                                            className="focus-visible:ring-primary/30 focus-visible:border-primary/50 bg-background/50 h-11 text-[15px] shadow-sm transition-all"
                                        />
                                    </div>
                                    <div className="grid gap-2.5">
                                        <Label htmlFor="color" className="text-sm font-semibold tracking-wide text-foreground">Brand Color</Label>
                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <Input
                                                    id="color"
                                                    type="color"
                                                    className="w-12 h-11 p-0.5 cursor-pointer rounded-lg border-2 border-border overflow-hidden"
                                                    value={watchProfile('primary_color')}
                                                    onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                value={watchProfile('primary_color')}
                                                onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                                placeholder="#000000"
                                                className="font-mono flex-1 bg-background/50 h-11 text-[15px] shadow-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </SectionCard>

                        {/* Column 2: Access Control */}
                        <SectionCard
                            title="Access Control"
                            description="Multi-tenancy settings."
                            icon={Globe}
                            footer={
                                <>
                                    <span />
                                    <Button
                                        onClick={saveSettings}
                                        disabled={updateSettingsMutation.isPending}
                                        variant="outline"
                                        className="w-full cursor-pointer font-medium shadow-sm"
                                    >
                                        {updateSettingsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Update Access Rules
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-sm font-semibold tracking-wide text-foreground">Allowed Domains</Label>
                                    <Textarea
                                        className="min-h-[100px] bg-background/50 resize-none text-sm font-mono shadow-sm"
                                        placeholder="e.g. college.edu, student.college.edu"
                                        value={(settingsState as any).additional_domains?.join(', ') || ''}
                                        onChange={(e) => {
                                            const domains = e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d);
                                            setSettingsState(prev => ({ ...prev, additional_domains: domains } as any));
                                        }}
                                    />
                                    <p className="text-[12px] text-muted-foreground">Comma separated domains for auto-join.</p>
                                </div>

                                <Separator className="border-border/30" />

                                <SettingRow
                                    icon={Globe}
                                    iconColor="bg-emerald-500/10 text-emerald-600"
                                    title="Allow Guest Access"
                                    description="Enable public exam links."
                                >
                                    <Switch
                                        checked={(settingsState as any).allow_guests || false}
                                        onCheckedChange={(c) => setSettingsState(prev => ({ ...prev, allow_guests: c } as any))}
                                    />
                                </SettingRow>
                            </div>
                        </SectionCard>
                    </div>
                </TabsContent>

                {/* ═══════════ VIVA TAB ═══════════ */}
                <TabsContent value="viva" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="Viva Configuration"
                        description="Set defaults for new examination sessions."
                        icon={Radio}
                        footer={<SaveButton label="Save Configuration" />}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup icon={Timer} iconColor="bg-blue-500/10 text-blue-600" label="Max Duration" description="Maximum minutes per session.">
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.max_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'max_duration_minutes', parseInt(e.target.value))}
                                        className="bg-background/50 h-11 text-[15px] shadow-sm"
                                    />
                                </InputGroup>
                                <InputGroup icon={Clock} iconColor="bg-violet-500/10 text-violet-600" label="Min Duration" description="Minimum minutes per session.">
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.min_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'min_duration_minutes', parseInt(e.target.value))}
                                        className="bg-background/50 h-11 text-[15px] shadow-sm"
                                    />
                                </InputGroup>
                            </div>

                            <SettingRow
                                icon={Timer}
                                iconColor="bg-amber-500/10 text-amber-600"
                                title="Allow Pause"
                                description="Students can pause the timer mid-session."
                            >
                                <Switch
                                    checked={settingsState.viva?.allow_pause}
                                    onCheckedChange={(c) => updateSetting('viva', 'allow_pause', c)}
                                />
                            </SettingRow>

                            <SettingRow
                                icon={ArrowLeftRight}
                                iconColor="bg-emerald-500/10 text-emerald-600"
                                title="Allow Retry"
                                description="Students can re-attempt failed exams."
                            >
                                <Switch
                                    checked={settingsState.viva?.allow_retry}
                                    onCheckedChange={(c) => updateSetting('viva', 'allow_retry', c)}
                                />
                            </SettingRow>
                        </div>
                    </SectionCard>
                </TabsContent>

                {/* ═══════════ AI TAB ═══════════ */}
                <TabsContent value="ai" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="AI Model Settings"
                        description="Configure the underlying LLM behavior for examinations."
                        icon={Brain}
                        footer={<SaveButton label="Save AI Settings" />}
                    >
                        <div className="space-y-6">
                            <InputGroup icon={Sparkles} iconColor="bg-violet-500/10 text-violet-600" label="Default Model" description="Select the AI model used for exam generation.">
                                <Select
                                    value={settingsState.ai?.model}
                                    onValueChange={(v) => updateSetting('ai', 'model', v)}
                                >
                                    <SelectTrigger className="bg-background/50 h-11 text-[15px] shadow-sm">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </InputGroup>

                            <div className="p-5 rounded-xl border border-border/50 bg-background/40 space-y-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg shadow-sm bg-orange-500/10 text-orange-600">
                                        <BarChart3 className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <Label className="text-[15px] font-semibold tracking-tight">Strictness Level</Label>
                                            <Badge variant="secondary" className="font-mono text-xs px-2.5 py-0.5 bg-muted/50">
                                                {strictnessToUI(settingsState.ai?.strictness)}/10
                                            </Badge>
                                        </div>
                                        <p className="text-[12px] text-muted-foreground mt-0.5">Higher values make the AI more critical of vague answers.</p>
                                    </div>
                                </div>
                                <div className="pl-11">
                                    <Input
                                        type="range"
                                        min="1" max="10"
                                        value={strictnessToUI(settingsState.ai?.strictness)}
                                        onChange={(e) => updateSetting('ai', 'strictness', strictnessFromUI(parseInt(e.target.value)))}
                                        className="cursor-pointer"
                                    />
                                </div>
                            </div>

                            <SettingRow
                                icon={BookOpen}
                                iconColor="bg-cyan-500/10 text-cyan-600"
                                title="Enable RAG (Knowledge Base)"
                                description="AI will use uploaded documents for context-aware grading."
                            >
                                <Switch
                                    checked={settingsState.ai?.enable_rag}
                                    onCheckedChange={(c) => updateSetting('ai', 'enable_rag', c)}
                                />
                            </SettingRow>
                        </div>
                    </SectionCard>
                </TabsContent>

                {/* ═══════════ GRADING TAB ═══════════ */}
                <TabsContent value="grading" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="Grading Logic"
                        description="Define how exam scores are calculated and rounded."
                        icon={CheckCircle}
                        footer={<SaveButton label="Save Grading Rules" />}
                    >
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup icon={Hash} iconColor="bg-emerald-500/10 text-emerald-600" label="Pass Threshold (%)" description="Minimum score required to pass.">
                                    <Input
                                        type="number"
                                        min="0" max="100"
                                        value={thresholdToUI(settingsState.grading?.pass_threshold)}
                                        onChange={(e) => updateSetting('grading', 'pass_threshold', thresholdFromUI(parseInt(e.target.value) || 0))}
                                        className="bg-background/50 h-11 text-[15px] shadow-sm"
                                    />
                                </InputGroup>
                                <InputGroup icon={Scale} iconColor="bg-indigo-500/10 text-indigo-600" label="Grade Rounding" description="How decimal scores are rounded.">
                                    <Select
                                        value={settingsState.grading?.grade_rounding}
                                        onValueChange={(v) => updateSetting('grading', 'grade_rounding', v)}
                                    >
                                        <SelectTrigger className="bg-background/50 h-11 text-[15px] shadow-sm">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nearest_half">Nearest 0.5</SelectItem>
                                            <SelectItem value="nearest_int">Nearest Integer</SelectItem>
                                            <SelectItem value="none">Exact (Decimal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </InputGroup>
                            </div>

                            <SettingRow
                                icon={Eye}
                                iconColor="bg-amber-500/10 text-amber-600"
                                title="Require Manual Review if Flagged"
                                description="Hold grades for manual review when proctoring detects suspicious activity."
                            >
                                <Switch
                                    checked={settingsState.grading?.require_manual_review_if_flagged}
                                    onCheckedChange={(c) => updateSetting('grading', 'require_manual_review_if_flagged', c)}
                                />
                            </SettingRow>
                        </div>
                    </SectionCard>
                </TabsContent>

                {/* ═══════════ PROCTORING TAB ═══════════ */}
                <TabsContent value="proctoring" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="Proctoring & Security"
                        description="Control exam integrity enforcement mechanisms."
                        icon={Shield}
                        footer={<SaveButton label="Save Security Settings" />}
                    >
                        <div className="space-y-6">
                            <SettingRow
                                icon={Eye}
                                iconColor="bg-blue-500/10 text-blue-600"
                                title="Face Verification"
                                description="Verify student identity via webcam before and during exams."
                            >
                                <Switch
                                    checked={settingsState.proctoring?.face_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'face_verification_enabled', c)}
                                />
                            </SettingRow>

                            <SettingRow
                                icon={Mic}
                                iconColor="bg-violet-500/10 text-violet-600"
                                title="Voice Verification"
                                description="Ensure only the registered student is speaking during the exam."
                            >
                                <Switch
                                    checked={settingsState.proctoring?.voice_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'voice_verification_enabled', c)}
                                />
                            </SettingRow>

                            <InputGroup icon={Monitor} iconColor="bg-orange-500/10 text-orange-600" label="Tab Switch Limit" description="Set to 0 for unlimited. Exceeding triggers a warning.">
                                <Input
                                    type="number"
                                    value={settingsState.proctoring?.tab_switch_limit}
                                    onChange={(e) => updateSetting('proctoring', 'tab_switch_limit', parseInt(e.target.value))}
                                    className="bg-background/50 h-11 text-[15px] shadow-sm"
                                />
                            </InputGroup>

                            <SettingRow
                                icon={Zap}
                                danger
                                title="Auto-Terminate on Violation"
                                description="Immediately end the exam when integrity rules are broken."
                            >
                                <Switch
                                    checked={settingsState.proctoring?.auto_terminate_on_violation}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'auto_terminate_on_violation', c)}
                                />
                            </SettingRow>
                        </div>
                    </SectionCard>
                </TabsContent>

                {/* ═══════════ EXCEPTIONS TAB ═══════════ */}
                <TabsContent value="exceptions" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="Deadline Extensions"
                        description="Configure how student extension requests are handled."
                        icon={CalendarClock}
                        footer={<SaveButton label="Save Extension Rules" />}
                    >
                        <div className="space-y-6">
                            <InputGroup icon={Clock} iconColor="bg-blue-500/10 text-blue-600" label="Instructor Self-Approve Window (Days)" description="Extensions within this window past exam end time skip admin review.">
                                <Input
                                    type="number"
                                    value={settingsState.exceptions?.instructor_self_approve_window_days}
                                    onChange={(e) => updateSetting('exceptions', 'instructor_self_approve_window_days', parseInt(e.target.value))}
                                    className="bg-background/50 h-11 text-[15px] shadow-sm"
                                />
                            </InputGroup>

                            <SettingRow
                                icon={Zap}
                                iconColor="bg-emerald-500/10 text-emerald-600"
                                title="Auto-Approve Requests"
                                description="Automatically approve requests after a delay if admins don't act."
                            >
                                <Switch
                                    checked={settingsState.exceptions?.auto_approve_enabled}
                                    onCheckedChange={(c) => updateSetting('exceptions', 'auto_approve_enabled', c)}
                                />
                            </SettingRow>

                            <InputGroup icon={Timer} iconColor="bg-amber-500/10 text-amber-600" label="Auto-Approve Delay (Hours)" description="Set to 0 for instant approval.">
                                <Input
                                    type="number"
                                    min="0"
                                    disabled={!settingsState.exceptions?.auto_approve_enabled}
                                    value={settingsState.exceptions?.auto_approve_delay_hours}
                                    onChange={(e) => updateSetting('exceptions', 'auto_approve_delay_hours', parseInt(e.target.value))}
                                    className={cn(
                                        "bg-background/50 h-11 text-[15px] shadow-sm",
                                        !settingsState.exceptions?.auto_approve_enabled && "opacity-50 cursor-not-allowed"
                                    )}
                                />
                            </InputGroup>
                        </div>
                    </SectionCard>
                </TabsContent>

                {/* ═══════════ COMPLIANCE TAB ═══════════ */}
                <TabsContent value="compliance" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <SectionCard
                        title="Compliance & Data Privacy"
                        description="Configure data retention, anonymization, and regulatory compliance."
                        icon={Lock}
                        footer={<SaveButton label="Save Compliance Settings" />}
                    >
                        <div className="space-y-6">
                            <SettingRow
                                icon={Shield}
                                iconColor="bg-rose-500/10 text-rose-600"
                                title="GDPR Strict Mode"
                                description="Enable strict data privacy controls compliant with EU regulations."
                            >
                                <Switch
                                    checked={settingsState.compliance?.gdpr_mode}
                                    onCheckedChange={(c) => updateSetting('compliance', 'gdpr_mode', c)}
                                />
                            </SettingRow>

                            <InputGroup icon={Database} iconColor="bg-blue-500/10 text-blue-600" label="Anonymize Data After (Days)" description="Personal data will be anonymized after this period.">
                                <Input
                                    type="number"
                                    value={settingsState.compliance?.anonymize_after_days}
                                    onChange={(e) => updateSetting('compliance', 'anonymize_after_days', parseInt(e.target.value))}
                                    className="bg-background/50 h-11 text-[15px] shadow-sm"
                                />
                            </InputGroup>

                            <SettingRow
                                icon={FileText}
                                iconColor="bg-emerald-500/10 text-emerald-600"
                                title="Retain Transcripts"
                                description="Keep full exam transcripts after the anonymization period."
                            >
                                <Switch
                                    checked={settingsState.compliance?.retain_transcripts}
                                    onCheckedChange={(c) => updateSetting('compliance', 'retain_transcripts', c)}
                                />
                            </SettingRow>
                        </div>
                    </SectionCard>
                </TabsContent>

            </Tabs>
        </main>
    );
}
