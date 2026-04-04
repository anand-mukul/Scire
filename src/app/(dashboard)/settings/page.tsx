'use client';

import React, { useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/network/api';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Bell, CheckCircle2, AlertCircle, Shield, UserCog, Mail, CreditCard, LayoutDashboard, Palette, Languages, Loader2, User, Upload, Image as ImageIcon, Info, Sun, Moon, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { PageHeader } from '@/components/dashboard/page-header';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { SubscriptionTab, getSubscriptionTabLabel, shouldShowSubscriptionTab } from '@/components/dashboard/settings/subscription-tab';
import { ConnectedAccounts } from '@/components/dashboard/settings/connected-accounts';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { NotificationPreference } from '@/types/backend';
import { AvatarUploadDialog } from '@/components/dashboard/settings/avatar-upload-dialog';

function SettingsContent() {
    const { user, refetch } = useAuth();
    const searchParams = useSearchParams();
    const initialTab = searchParams.get('tab') || 'general';
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    // Form states
    const [fullName, setFullName] = useState(user?.full_name || '');
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    
    // Avatar Dialog States
    const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
    const [selectedAvatarFile, setSelectedAvatarFile] = useState<File | null>(null);
    
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

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

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Basic frontend validation
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB');
            if (e.target) e.target.value = '';
            return;
        }

        if (!file.type.startsWith('image/')) {
            toast.error('File must be an image');
            if (e.target) e.target.value = '';
            return;
        }

        setSelectedAvatarFile(file);
        setIsAvatarDialogOpen(true);
        if (e.target) e.target.value = '';
    };

    const handleDialogUpload = async (blob: Blob) => {
        setIsUploadingAvatar(true);
        try {
            // Convert Blob to File
            const uploadFile = new File([blob], selectedAvatarFile?.name || 'avatar.jpg', { type: blob.type });
            await api.auth.uploadAvatar(uploadFile);
            await refetch();
            toast.success('Strict identity verification passed. Profile photo updated successfully.');
        } catch (error) {
            // Dialog component itself will display the AWS backend error messages dynamically
            throw error; 
        } finally {
            setIsUploadingAvatar(false);
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

    const defaultInitialsUrl = `https://api.dicebear.com/7.x/initials/svg?seed=${user?.full_name}`;
    const avatarSrc = user?.profile_photo_url || defaultInitialsUrl;

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Account Settings"
                description="Manage your account settings, security preferences, and details."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/profile">
                            <User className="mr-2 h-4 w-4" />
                            View Public Profile
                        </Link>
                    </Button>
                }
            />

            <Tabs defaultValue={initialTab} className="w-full">
                <TabsList className="overflow-x-auto max-w-full w-full sm:w-fit justify-start flex sm:inline-flex">
                    <TabsTrigger value="general">
                        General
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        Notifications
                    </TabsTrigger>
                    {shouldShowSubscriptionTab(user?.role) && (
                        <TabsTrigger value="billing">
                            {getSubscriptionTabLabel(user?.role)}
                        </TabsTrigger>
                    )}
                </TabsList>

                {/* General Tab */}
                <TabsContent value="general" className="space-y-10 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* 1. Public Profile Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl">
                        <div className="flex flex-col md:flex-row">
                            {/* Left Side: Avatar Panel */}
                            <div className="flex flex-col flex-shrink-0 items-center justify-center p-8 md:w-72 bg-muted/10 border-b md:border-b-0 md:border-r border-border/40">
                                <div className="space-y-6 flex flex-col items-center">
                                    <div className="relative group rounded-full p-1 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent shadow-sm">
                                        <Avatar className="h-32 w-32 border-4 border-background shadow-md transition-all group-hover:border-primary/20">
                                            {isUploadingAvatar ? (
                                                <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px] z-10 rounded-full">
                                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                                </div>
                                            ) : null}
                                            <AvatarImage src={avatarSrc} className="object-cover" />
                                            <AvatarFallback className="text-4xl font-light bg-muted text-muted-foreground">
                                                {user?.full_name ? getInitials(user.full_name) : 'IT'}
                                            </AvatarFallback>
                                        </Avatar>
                                        
                                        <button 
                                            type="button"
                                            disabled={isUploadingAvatar}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="absolute inset-1 flex flex-col items-center justify-center bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer backdrop-blur-[2px] disabled:cursor-not-allowed"
                                        >
                                            <Upload className="h-6 w-6 mb-1" strokeWidth={2} />
                                            <span className="text-[11px] font-medium tracking-wider uppercase">Update</span>
                                        </button>
                                        
                                        {/* Unstyled file input */}
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp,image/gif"
                                            className="hidden"
                                            ref={fileInputRef}
                                            onChange={handleFileSelect}
                                            disabled={isUploadingAvatar}
                                        />
                                    </div>
                                    <div className="text-center w-full space-y-1.5">
                                        <h3 className="font-semibold text-foreground">Profile Picture</h3>
                                        <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[200px]">
                                            JPEG, PNG, or GIF.<br/>Maximum file size 5MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Form Details */}
                            <div className="flex-1 flex flex-col">
                                <CardHeader className="pb-4 px-8 pt-8">
                                    <CardTitle className="text-xl font-semibold tracking-tight">Personal Information</CardTitle>
                                    <CardDescription className="text-[15px]">
                                        Update your personal details and how we can reach you.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="px-8 pb-8 flex-1">
                                    <div className="space-y-8 max-w-xl">
                                        <div className="grid gap-2.5">
                                            <Label htmlFor="full_name" className="text-sm font-semibold tracking-wide text-foreground">Display Name</Label>
                                            <Input
                                                id="full_name"
                                                placeholder="Jane Doe"
                                                value={fullName}
                                                onChange={(e) => setFullName(e.target.value)}
                                                className="focus-visible:ring-primary/30 focus-visible:border-primary/50 bg-background/50 h-11 text-[15px] shadow-sm transition-all"
                                            />
                                            <p className="text-[13px] text-muted-foreground ml-1">
                                                This name appears on your public profile and exams.
                                            </p>
                                        </div>
                                        <div className="grid gap-2.5">
                                            <Label htmlFor="email" className="text-sm font-semibold tracking-wide text-foreground">
                                                Email Address
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="email"
                                                    value={user?.email || ''}
                                                    disabled
                                                    className="bg-muted/40 border-muted-foreground/20 cursor-not-allowed opacity-80 h-11 text-[15px] pl-10"
                                                />
                                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            </div>
                                            <div className="flex items-start gap-2 mt-1 ml-1">
                                                <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                                                <p className="text-[13px] text-muted-foreground">
                                                    Email is managed by your organization's identity provider.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                                <div className="mt-auto px-8 py-4 flex items-center justify-between border-t border-border/40 bg-muted/10">
                                    <p className="text-[13px] text-muted-foreground hidden sm:block">Changes will be saved securely to your account.</p>
                                    <Button
                                        onClick={handleUpdateProfile}
                                        disabled={!canSubmitProfile || isUpdatingProfile}
                                        className="cursor-pointer font-medium px-6 shadow-sm"
                                    >
                                        {isUpdatingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        {isUpdatingProfile ? 'Saving...' : 'Save Details'}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* 2. Account Role Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl">
                        <CardHeader className="pb-6 border-b border-border/40 px-8 pt-8 flex flex-row items-start justify-between gap-4">
                            <div className="space-y-1.5">
                                <CardTitle className="text-xl font-semibold tracking-tight">Role & Permissions</CardTitle>
                                <CardDescription className="text-[15px]">
                                    Review your designated access level and capabilities.
                                </CardDescription>
                            </div>
                            <Badge variant="secondary" className="px-3.5 py-1.5 text-[13px] font-semibold bg-primary/15 text-primary border-primary/20 shadow-sm">
                                {user?.role || 'User'} Access
                            </Badge>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border/40">
                                {(user?.role as string) === 'STUDENT' ? (
                                    <>
                                        <div className="p-8 space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg w-fit mb-4">
                                                <CheckCircle2 className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-semibold text-foreground tracking-tight">Oral Examinations</h4>
                                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                                Join live interactive sessions with AI examiners and complete assessments.
                                            </p>
                                        </div>
                                        <div className="p-8 space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-lg w-fit mb-4">
                                                <LayoutDashboard className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-semibold text-foreground tracking-tight">Academic Records</h4>
                                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                                View your exam performance history, scores, and official transcripts.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-8 space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="p-3 bg-rose-500/10 text-rose-600 rounded-lg w-fit mb-4">
                                                <Shield className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-semibold text-foreground tracking-tight">Administrative Controls</h4>
                                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                                Full access to tenant management tools, billing, and strict configuration settings.
                                            </p>
                                        </div>
                                        <div className="p-8 space-y-3 bg-muted/5 hover:bg-muted/10 transition-colors">
                                            <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-lg w-fit mb-4">
                                                <UserCog className="h-6 w-6" />
                                            </div>
                                            <h4 className="font-semibold text-foreground tracking-tight">User Management</h4>
                                            <p className="text-[14px] text-muted-foreground leading-relaxed">
                                                Create, edit, suspend, and manage all accounts within your organization.
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                        <div className="px-8 py-3.5 bg-amber-500/5 border-t border-amber-500/20 flex items-center text-amber-600/90 gap-3">
                            <AlertCircle className="w-[18px] h-[18px] shrink-0" />
                            <p className="text-[13px] font-medium tracking-wide">Administrator escalation is required to modify or elevate role assignments.</p>
                        </div>
                    </Card>

                    {/* 3. Platform Preferences Card */}
                    <Card className="border-border/50 shadow-sm overflow-hidden bg-gradient-to-b from-card/80 to-card/30 backdrop-blur-xl">
                        <CardHeader className="pb-6 px-8 pt-8">
                            <CardTitle className="text-xl font-semibold tracking-tight">Platform Preferences</CardTitle>
                            <CardDescription className="text-[15px]">Customize your reading experience and localization settings.</CardDescription>
                        </CardHeader>
                        <Separator className="border-border/40" />
                        <CardContent className="px-8 py-8">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-full">
                                {/* Interface Theme */}
                                <div className="flex flex-col justify-between p-6 rounded-xl border border-border/60 bg-background/60 shadow-sm hover:border-primary/30 transition-all gap-6 group">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-primary/10 text-primary rounded-lg shadow-sm group-hover:scale-105 transition-transform duration-300">
                                            <Palette className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground tracking-tight">Interface Theme</p>
                                            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                                                Select or customize your optimal UI reading environment.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-2 w-full">
                                        <div className="grid grid-cols-3 items-center p-1 border border-border/50 bg-muted/30 rounded-lg">
                                            <button
                                                onClick={() => setTheme("light")}
                                                className={`flex justify-center items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${mounted && theme === 'light' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                            >
                                                <Sun className="w-4 h-4 shrink-0" />
                                                <span className="truncate">Light</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme("dark")}
                                                className={`flex justify-center items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${mounted && theme === 'dark' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                            >
                                                <Moon className="w-4 h-4 shrink-0" />
                                                <span className="truncate">Dark</span>
                                            </button>
                                            <button
                                                onClick={() => setTheme("system")}
                                                className={`flex justify-center items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${mounted && theme === 'system' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                                            >
                                                <Monitor className="w-4 h-4 shrink-0" />
                                                <span className="truncate">System</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Display Language */}
                                <div className="flex flex-col justify-between p-6 rounded-xl border border-border/60 bg-background/60 shadow-sm opacity-90 transition-all gap-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-muted text-muted-foreground rounded-lg shadow-sm">
                                            <Languages className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-foreground tracking-tight flex items-center gap-2">
                                                System Language
                                                <Lock className="w-3.5 h-3.5 text-muted-foreground/70" />
                                            </p>
                                            <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">
                                                Globally locked to your organization's primary language.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-auto pt-2 w-full">
                                        <Select disabled defaultValue="en">
                                            <SelectTrigger className="w-full bg-muted/40 cursor-not-allowed opacity-80 h-[42px] border-muted-foreground/20 font-medium text-[14px]">
                                                <SelectValue placeholder="English (US)" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="en">English (US)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* Password Change Card */}
                    <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium">Change Password</CardTitle>
                            <CardDescription>
                                Secure your account by periodically changing your password.
                            </CardDescription>
                        </CardHeader>
                        <Separator className="border-border/50" />
                        <CardContent className="space-y-6 pt-6">
                            <div className="grid gap-6 md:grid-cols-3 w-full">
                                <div className="space-y-3">
                                    <Label htmlFor="currentPassword">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        placeholder="Enter current password"
                                        className="focus-visible:ring-primary/20 bg-background"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="newPassword">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Enter new password"
                                        className="focus-visible:ring-primary/20 bg-background"
                                    />
                                    {newPassword && !isValidPassword && (
                                        <p className="text-xs text-amber-500 flex items-center gap-1.5 animate-in fade-in transition-all">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            Must be at least 8 characters
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="Confirm new password"
                                        className="focus-visible:ring-primary/20 bg-background"
                                    />
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in transition-all">
                                            <AlertCircle className="w-3 h-3 shrink-0" />
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                        <CardFooter className="px-6 pb-6 pt-0 flex justify-end">
                            <Button
                                onClick={handlePasswordChange}
                                disabled={!canSubmitPassword || isChangingPassword}
                                className="cursor-pointer"
                            >
                                {isChangingPassword ? 'Updating...' : 'Update Password'}
                            </Button>
                        </CardFooter>
                    </Card>

                    {/* Connected Accounts */}
                    <Card className="border-border/60 shadow-sm overflow-hidden bg-card/50 backdrop-blur-sm">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium">
                                Connected Accounts
                            </CardTitle>
                            <CardDescription>
                                Link your external accounts like Google/Microsoft for one-click access.
                            </CardDescription>
                        </CardHeader>
                        <Separator className="border-border/50" />
                        <CardContent className="p-0 bg-background/30 w-full">
                            <ConnectedAccounts />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications Tab */}
                <TabsContent value="notifications" className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    <Card className="border-border/60 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg font-medium">Notification Preferences</CardTitle>
                            <CardDescription>Fine-tune how and when you want to receive alerts.</CardDescription>
                        </CardHeader>
                        <Separator className="border-border/50" />
                        
                        <div className="divide-y divide-border/50">
                            <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                <div className="space-y-1 pr-4">
                                    <Label htmlFor="inapp-notifs" className="text-base font-medium cursor-pointer">In-App Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Show notification bell and alerts within the platform interface seamlessly.
                                    </p>
                                </div>
                                <Switch
                                    id="inapp-notifs"
                                    checked={notifPrefs?.channel_in_app ?? true}
                                    onCheckedChange={handleToggleInApp}
                                    disabled={prefsMutation.isPending}
                                    className="cursor-pointer shadow-sm"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-6 hover:bg-muted/30 transition-colors">
                                <div className="space-y-1 pr-4">
                                    <Label htmlFor="email-notifs" className="text-base font-medium cursor-pointer">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Receive important emails about your account activity and critical security updates.
                                    </p>
                                </div>
                                <Switch
                                    id="email-notifs"
                                    checked={notifPrefs?.channel_email ?? true}
                                    onCheckedChange={handleToggleEmail}
                                    disabled={prefsMutation.isPending}
                                    className="cursor-pointer shadow-sm"
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-6 opacity-60 cursor-not-allowed bg-muted/10">
                                <div className="space-y-1 pr-4">
                                    <div className="flex items-center gap-3">
                                        <Label className="text-base font-medium">Product Newsletter</Label>
                                        <Badge variant="secondary" className="font-normal border-transparent bg-background/50">Coming Soon</Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                        Receive news about new features, improvements, and company updates.
                                    </p>
                                </div>
                                <Switch disabled checked={false} />
                            </div>
                        </div>
                    </Card>
                </TabsContent>

                {/* Billing / Subscription / Usage Tab - role aware */}
                {shouldShowSubscriptionTab(user?.role) && (
                    <TabsContent value="billing" className="space-y-8 mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <SubscriptionTab />
                    </TabsContent>
                )}
            </Tabs>

            {/* Strict Identity Verification Dialog */}
            <AvatarUploadDialog 
                open={isAvatarDialogOpen} 
                onOpenChange={setIsAvatarDialogOpen} 
                file={selectedAvatarFile} 
                onUpload={handleDialogUpload} 
            />
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
