'use client';

import React, { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/network/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Bell, CheckCircle2, AlertCircle, Shield, UserCog, Mail, CreditCard, LayoutDashboard, Palette, Languages, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/dashboard/page-header';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { SubscriptionTab, getSubscriptionTabLabel, shouldShowSubscriptionTab } from '@/components/dashboard/settings/subscription-tab';
import { ConnectedAccounts } from '@/components/dashboard/settings/connected-accounts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreference } from '@/types/backend';

function SettingsContent() {
    const { user, refetch } = useAuth();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'general';

    // Form states
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Initial state sync
    React.useEffect(() => {
        if (user?.full_name) {
            setFullName(user.full_name);
        }
    }, [user?.full_name]);

    // Notification preferences (server-backed)
    const queryClient = useQueryClient();
    const { data: notifPrefs } = useQuery<NotificationPreference>({
        queryKey: ['notification-preferences'],
        queryFn: () => api.notificationPreferences.get(),
        staleTime: 60000,
    });

    const prefsMutation = useMutation({
        mutationFn: api.notificationPreferences.update,
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notification-preferences'] }),
    });

    const isValidPassword = newPassword.length >= 8;
    const passwordsMatch = newPassword === confirmPassword && newPassword !== '';
    const canSubmitPassword = currentPassword && isValidPassword && passwordsMatch;
    const canSubmitProfile = fullName.trim() !== '' && fullName !== user?.full_name;

    const handleUpdateProfile = async () => {
        if (!canSubmitProfile) return;

        setIsUpdatingProfile(true);
        try {
            await api.auth.updateProfile({ full_name: fullName });
            await refetch();
            toast.success('Profile updated successfully');
        } catch (error) {
            toast.error('Failed to update profile');
        } finally {
            setIsUpdatingProfile(false);
        }
    };

    const handlePasswordChange = async () => {
        if (!canSubmitPassword) return;

        setIsChangingPassword(true);
        try {
            await api.auth.changePassword({
                current_password: currentPassword,
                new_password: newPassword
            });
            toast.success('Password updated successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error) {
            toast.error('Failed to update password. Please check your current password.');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleToggleEmail = (checked: boolean) => {
        prefsMutation.mutate({ channel_email: checked });
        toast.dismiss();
        toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
    };

    const handleToggleInApp = (checked: boolean) => {
        prefsMutation.mutate({ channel_in_app: checked });
        toast.dismiss();
        toast.success(checked ? 'In-app notifications enabled' : 'In-app notifications disabled');
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Settings"
                description="Manage your account security and preferences."
            />

            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList>
                    <TabsTrigger value="general" className="gap-2">
                        <UserCog className="h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="security" className="gap-2">
                        <Shield className="h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications" className="gap-2">
                        <Bell className="h-4 w-4" />
                        Notifications
                    </TabsTrigger>
                    {shouldShowSubscriptionTab(user?.role) && (
                        <TabsTrigger value="billing" className="gap-2">
                            <CreditCard className="h-4 w-4" />
                            {getSubscriptionTabLabel(user?.role)}
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-start justify-between">
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight">General Settings</h2>
                            <p className="text-muted-foreground mt-1">Manage your public profile and interface preferences.</p>
                        </div>
                    </div>

                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                            <CardTitle className="text-base font-medium">Profile Information</CardTitle>
                            <CardDescription>Update your photo and personal details.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-8 pt-8">
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="flex-shrink-0 space-y-3">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Photo</label>
                                    <div className="relative group">
                                        <Avatar className="h-24 w-24 border-2 border-border shadow-sm cursor-pointer group-hover:border-primary/50 transition-colors">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`} />
                                            <AvatarFallback className="text-2xl font-bold bg-muted text-muted-foreground">
                                                {user?.full_name ? getInitials(user.full_name) : 'IT'}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                            <span className="text-xs font-medium">Change</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-6 max-w-md">
                                    <div className="grid gap-2">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="max-w-md focus-visible:ring-primary/20"
                                        />
                                        <p className="text-[0.8rem] text-muted-foreground">This is your public display name.</p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="email">Email Address</Label>
                                        <Input
                                            id="email"
                                            value={user?.email || ''}
                                            disabled
                                            className="max-w-md bg-muted/50"
                                        />
                                        <p className="text-[0.8rem] text-muted-foreground">Contact support to change your email.</p>
                                    </div>

                                    <div className="grid gap-2">
                                        <Label>Role</Label>
                                        <div className="flex">
                                            <Badge variant="secondary" className="px-2 py-1 text-sm font-normal">
                                                {user?.role || 'User'}
                                            </Badge>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end border-t pt-6 mt-6">
                                <Button
                                    onClick={handleUpdateProfile}
                                    disabled={!canSubmitProfile || isUpdatingProfile}
                                    className="cursor-pointer"
                                >
                                    {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isUpdatingProfile ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader>
                            <CardTitle>Appearance & Regional</CardTitle>
                            <CardDescription>Customize your interface experience.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/30 transition-colors border border-transparent hover:border-border/50">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background border rounded-md shadow-sm">
                                        <Palette className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Theme Preference</p>
                                        <p className="text-xs text-muted-foreground">Toggle between light and dark modes</p>
                                    </div>
                                </div>
                                <AnimatedThemeToggler />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between p-3 rounded-lg opacity-60 cursor-not-allowed">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-background border rounded-md shadow-sm">
                                        <Languages className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Language</p>
                                        <p className="text-xs text-muted-foreground">Select your preferred language</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-muted-foreground">English (US)</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Security &amp; Authentication</h2>
                            <p className="text-sm text-muted-foreground">Manage your password and linked sign-in methods.</p>
                        </div>
                    </div>

                    <Card className="border-border/50 shadow-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-base flex items-center justify-between">
                                Change Password
                                <Badge variant="outline" className="font-normal text-[10px] uppercase tracking-wider bg-background">Recommended</Badge>
                            </CardTitle>
                            <CardDescription>
                                Ensure your account is using a long, random password to stay secure.
                            </CardDescription>
                        </CardHeader>
                        <Separator />
                        <CardContent className="space-y-4 pt-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="focus-visible:ring-primary/20"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="focus-visible:ring-primary/20"
                                    />
                                    {newPassword && !isValidPassword && (
                                        <p className="text-xs text-amber-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Must be at least 8 characters
                                        </p>
                                    )}
                                </div>
                                <div className="col-span-full md:col-start-2 space-y-2">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="focus-visible:ring-primary/20"
                                    />
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={!canSubmitPassword || isChangingPassword}
                                    className="cursor-pointer"
                                >
                                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Connected Accounts */}
                    <Card className="border-border/50 shadow-sm overflow-hidden">
                        <CardHeader className="bg-muted/10 border-b border-border/50 pb-4">
                            <CardTitle className="text-base font-medium flex items-center gap-2">
                                Connected Accounts
                            </CardTitle>
                            <CardDescription>
                                Link your Google or Microsoft account to enable single sign-on.
                                You can connect multiple providers to the same account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ConnectedAccounts />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2.5 bg-primary/10 rounded-xl text-primary shadow-sm">
                            <Bell className="h-5 w-5" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold tracking-tight">Notification Preferences</h2>
                            <p className="text-sm text-muted-foreground">Choose what updates you want to receive.</p>
                        </div>
                    </div>

                    <Card className="border-border/50 shadow-sm divide-y">
                        <div className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors">
                            <div className="space-y-0.5">
                                <Label htmlFor="inapp-notifs" className="text-base font-medium cursor-pointer">In-App Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Show notification bell and alerts within the platform.
                                </p>
                            </div>
                            <Switch
                                id="inapp-notifs"
                                checked={notifPrefs?.channel_in_app ?? true}
                                onCheckedChange={handleToggleInApp}
                                disabled={prefsMutation.isPending}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 hover:bg-muted/10 transition-colors">
                            <div className="space-y-0.5">
                                <Label htmlFor="email-notifs" className="text-base font-medium cursor-pointer">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive emails about your account activity and platform updates.
                                </p>
                            </div>
                            <Switch
                                id="email-notifs"
                                checked={notifPrefs?.channel_email ?? true}
                                onCheckedChange={handleToggleEmail}
                                disabled={prefsMutation.isPending}
                                className="cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between p-6 opacity-50 cursor-not-allowed">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label className="text-base font-medium">Marketing Emails</Label>
                                    <Badge variant="secondary" className="text-[10px] h-5 font-normal">Coming Soon</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Receive news about new features and improvements.
                                </p>
                            </div>
                            <Switch disabled checked={false} />
                        </div>
                    </Card>
                </TabsContent>

                {/* Billing / Subscription / Usage Tab — role aware */}
                {shouldShowSubscriptionTab(user?.role) && (
                    <TabsContent value="billing" className="space-y-6 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SubscriptionTab />
                    </TabsContent>
                )}
            </Tabs>
        </main>
    );
}

export default function SettingsPage() {
    return (
        <React.Suspense fallback={
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        }>
            <SettingsContent />
        </React.Suspense>
    );
}
