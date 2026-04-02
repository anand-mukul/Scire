'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
    Lock
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
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';


// Define default settings structure matching backend interface
const DEFAULT_SETTINGS: TenantSettings = {
    viva: {
        max_duration_minutes: 45,
        min_duration_minutes: 10,
        allow_pause: false,
        allow_retry: true,
        retry_cooldown_hours: 24
    },
    ai: {
        strictness: 5,
        model: 'gpt-4o',
        temperature: 0.7,
        enable_rag: true,
        context_window_size: 4096
    },
    grading: {
        pass_threshold: 60,
        auto_grade_enabled: true,
        require_manual_review_if_flagged: true,
        grade_rounding: 'nearest_half'
    },
    proctoring: {
        face_verification_enabled: true,
        voice_verification_enabled: true,
        tab_switch_limit: 3,
        auto_terminate_on_violation: true
    },
    exceptions: {
        instructor_self_approve_window_days: 2,
        auto_approve_enabled: false,
        auto_approve_delay_hours: 12
    },
    compliance: {
        gdpr_mode: false,
        anonymize_after_days: 365,
        retain_transcripts: true,
        data_residency: 'us-east-1'
    }
};

export default function TenantSettingsPage() {
    const { tenantId, tenantName, tenantPrimaryColor, tenantLogoUrl } = useTenant();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [logoFile, setLogoFile] = useState<File | null>(null);

    const isPlatformAdmin = user?.role === UserRole.PLATFORM_ADMIN;

    // Fetch tenant details (for subscription status)
    const { data: tenantDetails, refetch: refetchTenant } = useQuery({
        queryKey: ['tenant-details', tenantId],
        queryFn: api.tenant.getCurrent,
        enabled: !!tenantId,
    });



    // Fetch existing settings
    const { data: currentSettings, isLoading: isSettingsLoading } = useQuery({
        queryKey: ['tenant-settings', tenantId],
        queryFn: () => tenantId ? api.tenant.getSettings(tenantId) : null,
        enabled: !!tenantId,
    });

    // Profile Form
    const { register: registerProfile, handleSubmit: handleProfileSubmit, watch: watchProfile, setValue: setProfileValue } = useForm({
        defaultValues: {
            name: tenantName || '',
            primary_color: tenantPrimaryColor || '#6366f1' // Default Indigo
        }
    });

    // Settings Form
    const [settingsState, setSettingsState] = useState<TenantSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (currentSettings) {
            setSettingsState((prev) => ({
                ...prev,
                ...currentSettings,
                viva: { ...prev.viva, ...currentSettings.viva },
                ai: { ...prev.ai, ...currentSettings.ai },
                grading: { ...prev.grading, ...currentSettings.grading },
                proctoring: { ...prev.proctoring, ...currentSettings.proctoring },
                compliance: { ...prev.compliance, ...currentSettings.compliance },
            }));
        }
    }, [currentSettings]);

    // Also sync profile form when tenant context updates
    useEffect(() => {
        if (tenantName) setProfileValue('name', tenantName);
        if (tenantPrimaryColor) setProfileValue('primary_color', tenantPrimaryColor);
    }, [tenantName, tenantPrimaryColor, setProfileValue]);


    // Mutations
    const updateProfileMutation = useMutation({
        mutationFn: api.tenant.updateProfile,
        onSuccess: () => {
            toast.success('Tenant profile updated');
            queryClient.invalidateQueries({ queryKey: ['auth-user'] }); // Refresh context
        },
        onError: () => toast.error('Failed to update profile')
    });

    const uploadLogoMutation = useMutation({
        mutationFn: api.tenant.uploadLogo,
        onSuccess: () => {
            toast.success('Logo uploaded successfully');
            queryClient.invalidateQueries({ queryKey: ['auth-user'] });
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

    // Helper to update nested settings
    const updateSetting = (section: keyof TenantSettings, key: string, value: any) => {
        setSettingsState(prev => ({
            ...prev,
            [section]: {
                ...(prev[section] as Record<string, any> || {}),
                [key]: value
            }
        }));
    };

    if (!tenantId) return <div className="p-10 text-center">Loading tenant context...</div>;

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">

            <PageHeader
                title="Tenant Settings"
                description="Manage your organization's profile, branding, and system configurations."
            />

            <Tabs defaultValue="profile" className="w-full space-y-8">
                <TabsList className="flex flex-wrap gap-1 w-full">
                    <TabsTrigger value="profile" className="gap-2"><Palette className="w-3.5 h-3.5" /> Profile</TabsTrigger>
                    <TabsTrigger value="viva" className="gap-2"><Radio className="w-3.5 h-3.5" /> Viva</TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2"><Brain className="w-3.5 h-3.5" /> AI Model</TabsTrigger>
                    <TabsTrigger value="grading" className="gap-2"><CheckCircle className="w-3.5 h-3.5" /> Grading</TabsTrigger>
                    <TabsTrigger value="proctoring" className="gap-2"><Shield className="w-3.5 h-3.5" /> Security</TabsTrigger>
                    <TabsTrigger value="exceptions" className="gap-2"><AlertTriangle className="w-3.5 h-3.5" /> Exceptions</TabsTrigger>
                    <TabsTrigger value="compliance" className="gap-2"><Lock className="w-3.5 h-3.5" /> Compliance</TabsTrigger>
                </TabsList>

                {/* === PROFILE TAB === */}
                <TabsContent value="profile" className="space-y-6 focus-visible:outline-none focus-visible:ring-0">
                    <div className="grid gap-6 md:grid-cols-3">
                        {/* Column 1: Identity */}
                        <Card className="md:col-span-2 border-border/60 bg-card/40 backdrop-blur-sm shadow-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Palette className="w-5 h-5 text-primary" /> Branding & Identity</CardTitle>
                                <CardDescription>Customize how your users see the platform.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-8">
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
                                            <p className="text-sm text-muted-foreground mt-1">Recommended size: 512x512px. Max 2MB.</p>
                                        </div>
                                        {logoFile && (
                                            <Button size="sm" onClick={onLogoUpload} disabled={uploadLogoMutation.isPending} className="bg-primary text-primary-foreground">
                                                {uploadLogoMutation.isPending ? 'Uploading...' : 'Save New Logo'}
                                            </Button>
                                        )}
                                    </div>
                                </div>

                                <Separator />

                                <div className="grid gap-6 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Organization Name</Label>
                                        <Input
                                            id="name"
                                            value={watchProfile('name')}
                                            onChange={(e) => setProfileValue('name', e.target.value)}
                                            className="bg-background/50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Brand Color</Label>
                                        <div className="flex gap-3">
                                            <div className="relative">
                                                <Input
                                                    id="color"
                                                    type="color"
                                                    className="w-12 h-10 p-0.5 cursor-pointer rounded-lg border-2 border-border overflow-hidden"
                                                    value={watchProfile('primary_color')}
                                                    onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                                />
                                            </div>
                                            <Input
                                                value={watchProfile('primary_color')}
                                                onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                                placeholder="#000000"
                                                className="font-mono flex-1 bg-background/50"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button
                                        onClick={() => onProfileSubmit(watchProfile())}
                                        disabled={updateProfileMutation.isPending}
                                        className=""
                                    >
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Column 2: Access */}
                        <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm h-fit">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg"><Globe className="w-5 h-5 text-primary" /> Access Control</CardTitle>
                                <CardDescription>Multi-tenancy settings.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label>Allowed Domains</Label>
                                    <Textarea
                                        className="min-h-[100px] bg-background/50 resize-none text-sm font-mono"
                                        placeholder="e.g. college.edu, student.college.edu"
                                        value={(settingsState as any).additional_domains?.join(', ') || ''}
                                        onChange={(e) => {
                                            const domains = e.target.value.split(',').map((d: string) => d.trim()).filter((d: string) => d);
                                            setSettingsState(prev => ({ ...prev, additional_domains: domains } as any));
                                        }}
                                    />
                                    <p className="text-xs text-muted-foreground">Comma separated domains for auto-join.</p>
                                </div>

                                <Separator />

                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base">Allow Guest Access</Label>
                                        <p className="text-xs text-muted-foreground mr-2">Public exam links.</p>
                                    </div>
                                    <Switch
                                        checked={(settingsState as any).allow_guests || false}
                                        onCheckedChange={(c) => setSettingsState(prev => ({ ...prev, allow_guests: c } as any))}
                                    />
                                </div>

                                <Button
                                    onClick={saveSettings}
                                    disabled={updateSettingsMutation.isPending}
                                    className="w-full mt-2"
                                    variant="outline"
                                >
                                    Update Access Rules
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* === VIVA TAB === */}
                <TabsContent value="viva">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Viva Configuration</CardTitle>
                            <CardDescription>Set defaults for new exams.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Max Duration (Min)</Label>
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.max_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'max_duration_minutes', parseInt(e.target.value))}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Min Duration (Min)</Label>
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.min_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'min_duration_minutes', parseInt(e.target.value))}
                                        className="bg-background/50"
                                    />
                                </div>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow Pause</Label>
                                    <p className="text-xs text-muted-foreground">Students can pause the timer.</p>
                                </div>
                                <Switch
                                    checked={settingsState.viva?.allow_pause}
                                    onCheckedChange={(c) => updateSetting('viva', 'allow_pause', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Allow Retry</Label>
                                    <p className="text-xs text-muted-foreground">Students can re-attempt failed exams.</p>
                                </div>
                                <Switch
                                    checked={settingsState.viva?.allow_retry}
                                    onCheckedChange={(c) => updateSetting('viva', 'allow_retry', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4" /> Save Configuration</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === AI TAB === */}
                <TabsContent value="ai">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>AI Model Settings</CardTitle>
                            <CardDescription>Configure the underlying LLM behavior.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Default Model</Label>
                                <Select
                                    value={settingsState.ai?.model}
                                    onValueChange={(v) => updateSetting('ai', 'model', v)}
                                >
                                    <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <Label>Strictness Level</Label>
                                    <span className="text-sm text-muted-foreground font-medium">{settingsState.ai?.strictness}/10</span>
                                </div>
                                <Input
                                    type="range"
                                    min="1" max="10"
                                    value={settingsState.ai?.strictness}
                                    onChange={(e) => updateSetting('ai', 'strictness', parseInt(e.target.value))}
                                    className="cursor-pointer"
                                />
                                <p className="text-xs text-muted-foreground">Higher values make the AI more critical of vague answers.</p>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base font-medium">Enable RAG (Knowledge Base)</Label>
                                    <p className="text-xs text-muted-foreground">AI will use uploaded documents for context.</p>
                                </div>
                                <Switch
                                    checked={settingsState.ai?.enable_rag}
                                    onCheckedChange={(c) => updateSetting('ai', 'enable_rag', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4" /> Save AI Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === GRADING TAB === */}
                <TabsContent value="grading">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Grading Logic</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Pass Threshold (%)</Label>
                                    <Input
                                        type="number"
                                        value={settingsState.grading?.pass_threshold}
                                        onChange={(e) => updateSetting('grading', 'pass_threshold', parseInt(e.target.value))}
                                        className="bg-background/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Grade Rounding</Label>
                                    <Select
                                        value={settingsState.grading?.grade_rounding}
                                        onValueChange={(v) => updateSetting('grading', 'grade_rounding', v)}
                                    >
                                        <SelectTrigger className="bg-background/50"><SelectValue /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="nearest_half">Nearest 0.5</SelectItem>
                                            <SelectItem value="nearest_int">Nearest Integer</SelectItem>
                                            <SelectItem value="none">Exact (Decimal)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Require Manual Review if Flagged</Label>
                                    <p className="text-xs text-muted-foreground">If proctoring flags suspicious activity, hold grade.</p>
                                </div>
                                <Switch
                                    checked={settingsState.grading?.require_manual_review_if_flagged}
                                    onCheckedChange={(c) => updateSetting('grading', 'require_manual_review_if_flagged', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4" /> Save Grading Rules</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === PROCTORING TAB === */}
                <TabsContent value="proctoring">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Proctoring & Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Face Verification</Label>
                                    <p className="text-xs text-muted-foreground">Verify student identity via webcam.</p>
                                </div>
                                <Switch
                                    checked={settingsState.proctoring?.face_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'face_verification_enabled', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Voice Verification</Label>
                                    <p className="text-xs text-muted-foreground">Ensure only the student is speaking.</p>
                                </div>
                                <Switch
                                    checked={settingsState.proctoring?.voice_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'voice_verification_enabled', c)}
                                />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label>Tab Switch Limit (0 = Unlimited)</Label>
                                <Input
                                    type="number"
                                    value={settingsState.proctoring?.tab_switch_limit}
                                    onChange={(e) => updateSetting('proctoring', 'tab_switch_limit', parseInt(e.target.value))}
                                    className="bg-background/50"
                                />
                            </div>
                            <div className="flex items-center justify-between p-4 border border-destructive/20 bg-destructive/5 rounded-xl">
                                <div className="space-y-0.5">
                                    <Label className="text-base text-destructive font-medium">Auto-Terminate on Violation</Label>
                                    <p className="text-xs text-muted-foreground">End exam automatically if rules are broken.</p>
                                </div>
                                <Switch
                                    checked={settingsState.proctoring?.auto_terminate_on_violation}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'auto_terminate_on_violation', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Security Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === EXCEPTIONS TAB === */}
                <TabsContent value="exceptions">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Deadline Extensions (Exceptions)</CardTitle>
                            <CardDescription>Configure how student Late Tickets are handled.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Instructor Self-Approve Window (Days)</Label>
                                <Input
                                    type="number"
                                    value={settingsState.exceptions?.instructor_self_approve_window_days}
                                    onChange={(e) => updateSetting('exceptions', 'instructor_self_approve_window_days', parseInt(e.target.value))}
                                    className="bg-background/50"
                                />
                                <p className="text-xs text-muted-foreground">Extensions within this window past exam end time skip admin review.</p>
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Auto-Approve Requests</Label>
                                    <p className="text-xs text-muted-foreground">Automatically approve requests after a delay if admins don't acting.</p>
                                </div>
                                <Switch
                                    checked={settingsState.exceptions?.auto_approve_enabled}
                                    onCheckedChange={(c) => updateSetting('exceptions', 'auto_approve_enabled', c)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Auto-Approve Delay (Hours)</Label>
                                <Input
                                    type="number"
                                    min="0"
                                    disabled={!settingsState.exceptions?.auto_approve_enabled}
                                    value={settingsState.exceptions?.auto_approve_delay_hours}
                                    onChange={(e) => updateSetting('exceptions', 'auto_approve_delay_hours', parseInt(e.target.value))}
                                    className="bg-background/50"
                                />
                                <p className="text-xs text-muted-foreground">Set to 0 for instant approval.</p>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Exception Rules</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === COMPLIANCE TAB === */}
                <TabsContent value="compliance">
                    <Card className="border-border/60 bg-card/40 backdrop-blur-sm shadow-sm max-w-2xl mx-auto">
                        <CardHeader>
                            <CardTitle>Compliance & Data Privacy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-muted/20">
                                <div className="space-y-0.5">
                                    <Label className="text-base">GDPR Strict Mode</Label>
                                    <p className="text-xs text-muted-foreground">Enable strict data privacy controls.</p>
                                </div>
                                <Switch
                                    checked={settingsState.compliance?.gdpr_mode}
                                    onCheckedChange={(c) => updateSetting('compliance', 'gdpr_mode', c)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Anonymize Data After (Days)</Label>
                                <Input
                                    type="number"
                                    value={settingsState.compliance?.anonymize_after_days}
                                    onChange={(e) => updateSetting('compliance', 'anonymize_after_days', parseInt(e.target.value))}
                                    className="bg-background/50"
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4 bg-muted/20">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Compliance Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>


            </Tabs>
        </div>
    );
}
