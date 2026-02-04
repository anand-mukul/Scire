'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { Save, Upload, Settings as SettingsIcon, Shield, Palette, Brain, Radio, CheckCircle, AlertTriangle, CreditCard, Check } from 'lucide-react';
import RazorpayButton from '@/components/ui/razorpay-button';

import { api } from '@/lib/network/api';
import { useTenant } from '@/contexts/TenantContext';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TenantSettings } from '@/types/auth';

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
    compliance: {
        gdpr_mode: false,
        anonymize_after_days: 365,
        retain_transcripts: true,
        data_residency: 'us-east-1'
    }
};

export default function TenantSettingsPage() {
    const { tenantId, tenantName, tenantPrimaryColor, tenantLogoUrl } = useTenant();
    const queryClient = useQueryClient();
    const [logoFile, setLogoFile] = useState<File | null>(null);

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
    // We use a simpler state approach for nested settings or just one big form
    // Since we have nested objects, explicit state or separate forms per tab is cleaner.
    // Let's use one state object merged with defaults.
    const [settingsState, setSettingsState] = useState<TenantSettings>(DEFAULT_SETTINGS);

    useEffect(() => {
        if (currentSettings) {
            setSettingsState((prev) => ({
                ...prev,
                ...currentSettings,
                // Merge nested objects broadly (deep merge would be better but simple spread suffices for non-deeply nested)
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
                ...prev[section],
                [key]: value
            }
        }));
    };

    if (!tenantId) return <div className="p-10 text-center">Loading tenant context...</div>;

    return (
        <div className="relative min-h-screen p-6 pb-20 space-y-8">
            <AmbientGlow />

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                        <SettingsIcon className="w-8 h-8 text-primary" />
                        Tenant Settings
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage your organization's profile, branding, and system configurations.
                    </p>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full space-y-6">
                <TabsList className="bg-card/50 backdrop-blur border border-border/50 p-1 h-auto grid grid-cols-2 md:grid-cols-6 gap-2 w-full md:w-auto">
                    <TabsTrigger value="profile" className="gap-2"><Palette className="w-4 h-4" /> Profile</TabsTrigger>
                    <TabsTrigger value="viva" className="gap-2"><Radio className="w-4 h-4" /> Viva</TabsTrigger>
                    <TabsTrigger value="ai" className="gap-2"><Brain className="w-4 h-4" /> AI Model</TabsTrigger>
                    <TabsTrigger value="grading" className="gap-2"><CheckCircle className="w-4 h-4" /> Grading</TabsTrigger>
                    <TabsTrigger value="proctoring" className="gap-2"><Shield className="w-4 h-4" /> Proctoring</TabsTrigger>
                    <TabsTrigger value="compliance" className="gap-2"><AlertTriangle className="w-4 h-4" /> Compliance</TabsTrigger>
                    <TabsTrigger value="billing" className="gap-2"><CreditCard className="w-4 h-4" /> Billing</TabsTrigger>
                </TabsList>

                {/* === PROFILE TAB === */}
                <TabsContent value="profile" className="space-y-6">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Branding & Identity</CardTitle>
                            <CardDescription>Customize how your users see the platform.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Logo Upload */}
                            <div className="flex flex-col md:flex-row gap-6 items-start">
                                <div className="flex-shrink-0">
                                    <div className="w-24 h-24 rounded-xl border-2 border-dashed border-border flex items-center justify-center bg-accent/10 overflow-hidden relative group">
                                        {logoFile ? (
                                            <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-cover" />
                                        ) : tenantLogoUrl ? (
                                            <img src={tenantLogoUrl} alt="Logo" className="w-full h-full object-cover" />
                                        ) : (
                                            <Upload className="w-8 h-8 text-muted-foreground" />
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <label htmlFor="logo-upload" className="cursor-pointer text-xs text-white font-medium">Change</label>
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
                                <div className="space-y-2 flex-1">
                                    <h4 className="font-medium text-foreground">Organization Logo</h4>
                                    <p className="text-sm text-muted-foreground">Recommended size: 512x512px. Max 2MB. PNG or JPG.</p>
                                    {logoFile && (
                                        <Button size="sm" onClick={onLogoUpload} disabled={uploadLogoMutation.isPending}>
                                            {uploadLogoMutation.isPending ? 'Uploading...' : 'Save New Logo'}
                                        </Button>
                                    )}
                                </div>
                            </div>

                            <Separator />

                            {/* General details */}
                            <div className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="name">Organization Name</Label>
                                        <Input
                                            id="name"
                                            value={watchProfile('name')}
                                            onChange={(e) => setProfileValue('name', e.target.value)}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="color">Primary Brand Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="color"
                                                type="color"
                                                className="w-12 h-10 p-1 cursor-pointer"
                                                value={watchProfile('primary_color')}
                                                onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                            />
                                            <Input
                                                value={watchProfile('primary_color')}
                                                onChange={(e) => setProfileValue('primary_color', e.target.value)}
                                                placeholder="#000000"
                                                className="font-mono"
                                            />
                                        </div>
                                        <p className="text-xs text-muted-foreground">Select a color to update your tenant theme.</p>
                                    </div>
                                </div>

                                <Separator className="my-2" />

                                {/* Multi-Domain & Guest Access */}
                                <div className="space-y-4">
                                    <h4 className="font-medium flex items-center gap-2"><SettingsIcon className="w-4 h-4" /> Advanced Multi-Tenancy</h4>

                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label>Additional Domains</Label>
                                            <textarea
                                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                placeholder="e.g. cuchd.in, cumail.in (comma separated)"
                                                value={(settingsState as any).additional_domains?.join(', ') || ''}
                                                onChange={(e) => {
                                                    const domains = e.target.value.split(',').map(d => d.trim()).filter(d => d);
                                                    setSettingsState(prev => ({ ...prev, additional_domains: domains } as any));
                                                }}
                                            />
                                            <p className="text-xs text-muted-foreground">Users with these email domains will be auto-joined to your organization.</p>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                                <div className="space-y-0.5">
                                                    <Label className="text-base">Allow Guest Access</Label>
                                                    <p className="text-xs text-muted-foreground">Enable public exams for external users.</p>
                                                </div>
                                                <Switch
                                                    checked={(settingsState as any).allow_guests || false}
                                                    onCheckedChange={(c) => setSettingsState(prev => ({ ...prev, allow_guests: c } as any))}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-4 gap-2">
                                    <Button
                                        onClick={() => {
                                            // Handle Profile Save
                                            onProfileSubmit(watchProfile());
                                            // Handle Settings Save (for domains/guest)
                                            saveSettings();
                                        }}
                                        disabled={updateProfileMutation.isPending || updateSettingsMutation.isPending}
                                        className="bg-primary text-primary-foreground hover:bg-primary/90"
                                    >
                                        {updateProfileMutation.isPending ? 'Saving...' : 'Save All Changes'}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* === VIVA TAB === */}
                <TabsContent value="viva">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Viva Session Configuration</CardTitle>
                            <CardDescription>Default settings for new exams.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label>Max Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.max_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'max_duration_minutes', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Min Duration (Minutes)</Label>
                                    <Input
                                        type="number"
                                        value={settingsState.viva?.min_duration_minutes}
                                        onChange={(e) => updateSetting('viva', 'min_duration_minutes', parseInt(e.target.value))}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                    <Label>Allow Pause</Label>
                                    <Switch
                                        checked={settingsState.viva?.allow_pause}
                                        onCheckedChange={(c) => updateSetting('viva', 'allow_pause', c)}
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                    <Label>Allow Retry</Label>
                                    <Switch
                                        checked={settingsState.viva?.allow_retry}
                                        onCheckedChange={(c) => updateSetting('viva', 'allow_retry', c)}
                                    />
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Configuration</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === AI TAB === */}
                <TabsContent value="ai">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>AI Model Settings</CardTitle>
                            <CardDescription>Configure the underlying LLM behavior.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Default Model</Label>
                                <Select
                                    value={settingsState.ai?.model}
                                    onValueChange={(v) => updateSetting('ai', 'model', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gpt-4o">GPT-4o (Recommended)</SelectItem>
                                        <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo (Fastest)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Strictness (1-10)</Label>
                                <Input
                                    type="number"
                                    min="1" max="10"
                                    value={settingsState.ai?.strictness}
                                    onChange={(e) => updateSetting('ai', 'strictness', parseInt(e.target.value))}
                                />
                                <p className="text-xs text-muted-foreground">Higher values make the AI more critical of vague answers.</p>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>Enable RAG (Knowledge Base)</Label>
                                <Switch
                                    checked={settingsState.ai?.enable_rag}
                                    onCheckedChange={(c) => updateSetting('ai', 'enable_rag', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save AI Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === GRADING TAB === */}
                <TabsContent value="grading">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Grading Logic</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label>Pass Threshold (%)</Label>
                                <Input
                                    type="number"
                                    value={settingsState.grading?.pass_threshold}
                                    onChange={(e) => updateSetting('grading', 'pass_threshold', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Grade Rounding</Label>
                                <Select
                                    value={settingsState.grading?.grade_rounding}
                                    onValueChange={(v) => updateSetting('grading', 'grade_rounding', v)}
                                >
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="nearest_half">Nearest 0.5</SelectItem>
                                        <SelectItem value="nearest_int">Nearest Integer</SelectItem>
                                        <SelectItem value="none">Exact (Decimal)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>Require Manual Review if Flagged</Label>
                                <Switch
                                    checked={settingsState.grading?.require_manual_review_if_flagged}
                                    onCheckedChange={(c) => updateSetting('grading', 'require_manual_review_if_flagged', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Grading Rules</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === PROCTORING TAB === */}
                <TabsContent value="proctoring">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Proctoring & Security</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>Face Verification</Label>
                                <Switch
                                    checked={settingsState.proctoring?.face_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'face_verification_enabled', c)}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>Voice Verification</Label>
                                <Switch
                                    checked={settingsState.proctoring?.voice_verification_enabled}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'voice_verification_enabled', c)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tab Switch Limit (0 = Unlimited)</Label>
                                <Input
                                    type="number"
                                    value={settingsState.proctoring?.tab_switch_limit}
                                    onChange={(e) => updateSetting('proctoring', 'tab_switch_limit', parseInt(e.target.value))}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>Auto-Terminate on Violation</Label>
                                <Switch
                                    checked={settingsState.proctoring?.auto_terminate_on_violation}
                                    onCheckedChange={(c) => updateSetting('proctoring', 'auto_terminate_on_violation', c)}
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Security Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === COMPLIANCE TAB === */}
                <TabsContent value="compliance">
                    <Card className="bg-card/40 backdrop-blur-xl border-border/50">
                        <CardHeader>
                            <CardTitle>Compliance & Data Privacy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-accent/5">
                                <Label>GDPR Strict Mode</Label>
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
                                />
                            </div>
                        </CardContent>
                        <CardFooter className="justify-end border-t border-border/10 pt-4">
                            <Button onClick={saveSettings} disabled={updateSettingsMutation.isPending}><Save className="w-4 h-4 mr-2" /> Save Compliance Settings</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                {/* === BILLING TAB === */}
                <TabsContent value="billing">
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Current Plan */}
                        <Card className="bg-card/40 backdrop-blur-xl border-border/50 h-full flex flex-col">
                            <CardHeader>
                                <CardTitle>Current Plan</CardTitle>
                                <CardDescription>Your organization's subscription status.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="p-6 rounded-xl bg-primary/5 border border-primary/20 flex flex-col items-center text-center">
                                    <h3 className="text-2xl font-bold uppercase tracking-wider text-primary">
                                        {tenantDetails?.subscription_tier || 'FREE'}
                                    </h3>
                                    <p className="text-muted-foreground mt-2">
                                        {tenantDetails?.subscription_tier === 'pro'
                                            ? 'Unleash full potential with Pro features.'
                                            : 'Basic features for small teams.'}
                                    </p>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-widest">Includes</h4>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Multi-department support</li>
                                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Advanced Proctoring</li>
                                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Custom Domain</li>
                                    </ul>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Upgrade Option */}
                        <Card className={`bg-card/40 backdrop-blur-xl border-border/50 h-full flex flex-col ${tenantDetails?.subscription_tier === 'pro' ? 'opacity-50 pointer-events-none' : ''}`}>
                            <CardHeader>
                                <CardTitle>Upgrade to Pro</CardTitle>
                                <CardDescription>Get unlimited exams and priority support.</CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1 space-y-6">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold">$99</span>
                                    <span className="text-muted-foreground">/ month</span>
                                </div>
                                <ul className="space-y-2">
                                    <li className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Unlimited Exams</li>
                                    <li className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> 24/7 Priority Support</li>
                                    <li className="flex gap-2 text-sm"><CheckCircle className="w-4 h-4 text-green-500" /> Custom AI Models</li>
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {tenantDetails?.subscription_tier === 'pro' ? (
                                    <Button className="w-full" disabled variant="outline">Current Plan</Button>
                                ) : (
                                    <RazorpayButton
                                        currency="INR"
                                        planId="pro"
                                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-purple-500/20"
                                        onSuccess={() => {
                                            refetchTenant();
                                            toast.success("Welcome to Pro Plan!");
                                        }}
                                    >
                                        Upgrade to Pro (₹4,999/mo)
                                    </RazorpayButton>
                                )}
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
