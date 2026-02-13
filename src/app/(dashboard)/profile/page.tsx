'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Shield, Calendar, User, Settings, LogOut, CheckCircle2, Copy, Check, Sparkles, GraduationCap } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const [copied, setCopied] = useState(false);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const handleCopyId = () => {
        if (user?.id) {
            navigator.clipboard.writeText(user.id);
            setCopied(true);
            toast.success('Account ID copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    <div className="text-muted-foreground text-sm font-mono tracking-widest uppercase">Loading profile...</div>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-muted-foreground">Unable to load profile</div>
            </div>
        );
    }

    const isStudent = (user.role as string) === 'STUDENT';

    return (
        <main className="relative min-h-screen w-full bg-background overflow-hidden text-foreground selection:bg-primary/20">
            {/* <AmbientGlow /> */}

            <div className="relative z-10 p-6 md:p-8 max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-3">
                        Profile & Settings
                    </h1>
                    <p className="text-muted-foreground max-w-2xl">
                        Manage your account details and preferences.
                    </p>
                </div>

                <div className="grid gap-8 lg:grid-cols-12 items-start">
                    {/* Main Profile Info */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="p-8 md:p-10 relative overflow-hidden group">

                            <div className="flex flex-col md:flex-row gap-8 items-start">
                                <div className="relative">
                                    <Avatar className="h-24 w-24 md:h-28 md:w-28 border-2 border-border shadow-sm">
                                        <AvatarFallback className="bg-muted text-foreground text-3xl font-bold">
                                            {getInitials(user.full_name)}
                                        </AvatarFallback>
                                    </Avatar>
                                </div>

                                <div className="flex-1 space-y-6">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h2 className="text-2xl font-bold text-foreground tracking-tight">{user.full_name}</h2>
                                            <Badge variant="secondary" className="font-medium">
                                                {isStudent ? 'Student Account' : user.role}
                                            </Badge>
                                        </div>
                                        <p className="text-muted-foreground text-sm flex items-center gap-2">
                                            <GraduationCap className="w-4 h-4" />
                                            {isStudent ? 'Standard Access' : 'Administrative Access'}
                                        </p>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                <Mail className="w-3 h-3" /> Email
                                            </div>
                                            <div className="text-foreground font-mono text-sm truncate" title={user.email}>
                                                {user.email}
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1 group/id relative hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                    <User className="w-3 h-3" /> Account ID
                                                </div>
                                                <button
                                                    onClick={handleCopyId}
                                                    className="opacity-0 group-hover/id:opacity-100 transition-opacity text-muted-foreground hover:text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
                                                    aria-label="Copy account ID to clipboard"
                                                >
                                                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                            </div>
                                            <div className="text-foreground font-mono text-sm flex items-center gap-2">
                                                {user.id.slice(0, 8)}...
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                <Shield className="w-3 h-3" /> Status
                                            </div>
                                            <div className="flex items-center gap-2 text-emerald-500 font-medium text-sm">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
                                                Verified
                                            </div>
                                        </div>

                                        <div className="p-3.5 rounded-xl border border-border bg-muted/40 space-y-1 hover:bg-muted/60 transition-colors">
                                            <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-wider font-semibold">
                                                <Calendar className="w-3 h-3" /> Joined
                                            </div>
                                            <div className="text-foreground font-mono text-sm">
                                                {new Date().getFullYear()}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Card>

                        {/* Capabilities Section */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-foreground px-1 flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-purple-500" />
                                Account Capabilities
                            </h3>
                            <div className="rounded-2xl border border-border bg-card/40 divide-y divide-border/50 overflow-hidden">
                                {isStudent ? (
                                    <>
                                        <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-500">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">Attend Oral Examinations</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Join live sessions with autonomous AI examiners.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                            <div className="p-2.5 rounded-full bg-blue-500/10 text-blue-500">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">Access Academic Records</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">View your exam history, transcripts, and detailed analytics.</p>
                                            </div>
                                        </div>
                                        <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                            <div className="p-2.5 rounded-full bg-purple-500/10 text-purple-500">
                                                <CheckCircle2 className="w-5 h-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">Secure & Proctored Environment</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Sessions are monitored for quality assurance and integrity.</p>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <div className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                                                <CheckCircle2 className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-foreground">System Access</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Authorized capability set for {user.role}.</p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Quick Actions */}
                    <div className="lg:col-span-4 space-y-6">
                        <Card className="p-6">
                            <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
                                <Settings className="w-4 h-4 text-muted-foreground" />
                                Management
                            </h3>

                            <div className="space-y-3">
                                <Link href="/settings" className="block">
                                    <Button variant="outline" className="w-full justify-start h-auto py-3 px-4 border-border bg-background/50 hover:bg-muted text-muted-foreground hover:text-foreground group transition-all">
                                        <div className="flex flex-col items-start gap-1">
                                            <span className="text-sm font-medium text-foreground">Account Settings</span>
                                            <span className="text-[10px] text-muted-foreground/80 font-normal">Update password and security</span>
                                        </div>
                                    </Button>
                                </Link>

                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start h-auto py-3 px-4 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive group mt-4 transition-all"
                                        >
                                            <div className="flex flex-col items-start gap-1">
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <LogOut className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
                                                    Sign Out
                                                </span>
                                            </div>
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="bg-card border-border text-foreground">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Sign Out</AlertDialogTitle>
                                            <AlertDialogDescription className="text-muted-foreground">
                                                Are you sure you want to sign out of your account?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="border-border hover:bg-muted text-foreground">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={logout} className="bg-foreground text-background hover:bg-foreground/90">Sign Out</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </Card>

                        <div className="p-6 rounded-2xl border border-border bg-card/30 backdrop-blur-sm">
                            <h4 className="font-medium text-foreground mb-2 text-sm">Need Help?</h4>
                            <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                                For security reasons, sensitive details must be updated by an administrator.
                            </p>
                            <a href="mailto:support@scira.com" className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
                                <Mail className="w-3 h-3" />
                                Contact Support
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
