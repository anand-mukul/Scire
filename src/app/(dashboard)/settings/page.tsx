'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Lock, Bell, ArrowLeft, CheckCircle2, AlertCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();

    // Form states
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Notification preferences
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [sessionAlerts, setSessionAlerts] = useState(true);

    const isValidPassword = newPassword.length >= 8;
    const passwordsMatch = newPassword === confirmPassword && newPassword !== '';
    const canSubmit = currentPassword && isValidPassword && passwordsMatch;

    const handlePasswordChange = async () => {
        if (!canSubmit) return;

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
        setEmailNotifications(checked);
        toast.dismiss();
        toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled', {
            duration: 1500,
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        });
    };

    const handleToggleSession = (checked: boolean) => {
        setSessionAlerts(checked);
        toast.dismiss();
        toast.success(checked ? 'Session alerts enabled' : 'Session alerts disabled', {
            duration: 1500,
            icon: <CheckCircle2 className="w-4 h-4 text-emerald-500" />
        });
    };

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/20">
            {/* <AmbientGlow /> */}

            <div className="relative z-10 p-6 md:p-8 max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col gap-6">
                    <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors w-fit group focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded" onClick={() => router.back()} aria-label="Go back to profile">
                        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" />
                        <span className="text-sm font-medium">Back to Profile</span>
                    </button>

                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                            Settings
                            <div className="p-2 rounded-full bg-primary/10 text-primary" aria-hidden="true">
                                <Shield className="w-5 h-5" />
                            </div>
                        </h1>
                        <p className="text-muted-foreground text-sm mt-2 max-w-xl">
                            Update your security and notification preferences to suit your needs.
                        </p>
                    </div>
                </div>

                {/* Security Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 px-1">
                        <Lock className="w-4 h-4 text-blue-500" />
                        Security
                    </h2>

                    <Card className="p-6 md:p-8">
                        <div className="space-y-6 max-w-lg">
                            <div>
                                <h3 className="text-base font-medium text-foreground">Password Update</h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Your password is used only to secure your account.
                                </p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword" className="text-foreground">Current Password</Label>
                                    <Input
                                        id="currentPassword"
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="bg-background/50 border-input text-foreground focus:border-primary/50"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword" className="text-foreground">New Password</Label>
                                    <Input
                                        id="newPassword"
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="bg-background/50 border-input text-foreground focus:border-primary/50"
                                    />
                                    {newPassword && !isValidPassword && (
                                        <p className="text-xs text-amber-500 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Must be at least 8 characters
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="bg-background/50 border-input text-foreground focus:border-primary/50"
                                    />
                                    {confirmPassword && !passwordsMatch && (
                                        <p className="text-xs text-destructive flex items-center gap-1.5 animate-in fade-in slide-in-from-top-1">
                                            <AlertCircle className="w-3 h-3" />
                                            Passwords do not match
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="pt-2">
                                <Button
                                    onClick={handlePasswordChange}
                                    disabled={!canSubmit || isChangingPassword}
                                    className="bg-foreground text-background hover:bg-foreground/90 w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isChangingPassword ? 'Updating...' : 'Update Password'}
                                </Button>
                            </div>
                        </div>
                    </Card>
                </section>

                {/* Notifications Section */}
                <section className="space-y-4">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 px-1">
                        <Bell className="w-4 h-4 text-amber-400" />
                        Notifications
                    </h2>

                    <Card className="p-0 overflow-hidden divide-y divide-border/50">
                        <div className="p-6 md:p-8 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                            <div className="space-y-1">
                                <Label className="text-foreground text-base font-medium cursor-pointer" htmlFor="email-notifs">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get important updates sent to <span className="text-foreground">{user?.email}</span>
                                </p>
                            </div>
                            <Switch
                                id="email-notifs"
                                checked={emailNotifications}
                                onCheckedChange={handleToggleEmail}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input"
                            />
                        </div>

                        <div className="p-6 md:p-8 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                            <div className="space-y-1">
                                <Label className="text-foreground text-base font-medium cursor-pointer" htmlFor="session-alerts">Session Alerts</Label>
                                <p className="text-sm text-muted-foreground">
                                    Get notified when your exam session is about to start
                                </p>
                            </div>
                            <Switch
                                id="session-alerts"
                                checked={sessionAlerts}
                                onCheckedChange={handleToggleSession}
                                className="data-[state=checked]:bg-emerald-500 data-[state=unchecked]:bg-input"
                            />
                        </div>
                    </Card>
                </section>
            </div>
        </main>
    );
}
