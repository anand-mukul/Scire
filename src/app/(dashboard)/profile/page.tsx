'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Mail, Calendar, User, Settings, LogOut, Check, Copy, GraduationCap, CheckCircle2, Shield, MapPin, Link as LinkIcon, CreditCard } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/dashboard/page-header';
import { SUPPORT_MAIL } from '@/lib/constants';
import { ProtectedMailLink } from '@/components/ui/protected-mail-link';
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
            <main className="flex flex-col gap-8 p-6 md:p-8 pb-24">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-32" />
                        <Skeleton className="h-4 w-64" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                </div>
                <div className="grid gap-6 md:grid-cols-12">
                    <div className="md:col-span-4">
                        <Card className="overflow-hidden">
                            <div className="h-28 bg-muted/20" />
                            <div className="p-6 pt-14 space-y-4">
                                <Skeleton className="h-7 w-40" />
                                <div className="flex gap-2">
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                    <Skeleton className="h-5 w-16 rounded-full" />
                                </div>
                                <div className="space-y-3 pt-2">
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-36" />
                                    <Skeleton className="h-4 w-28" />
                                </div>
                                <div className="flex gap-3 pt-4">
                                    <Skeleton className="h-9 flex-1" />
                                    <Skeleton className="h-9 flex-1" />
                                </div>
                            </div>
                        </Card>
                    </div>
                    <div className="md:col-span-8 space-y-6">
                        <Card className="p-6 space-y-4">
                            <Skeleton className="h-6 w-40" />
                            <Skeleton className="h-4 w-64" />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Skeleton className="h-24 rounded-lg" />
                                <Skeleton className="h-24 rounded-lg" />
                            </div>
                        </Card>
                        <Card className="p-6 space-y-4">
                            <Skeleton className="h-6 w-48" />
                            <div className="space-y-3">
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                                <Skeleton className="h-12 w-full" />
                            </div>
                        </Card>
                    </div>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <div className="flex h-screen items-center justify-center">
                <p className="text-muted-foreground">Unable to load profile</p>
            </div>
        );
    }

    const isStudent = (user.role as string) === 'STUDENT';
    const roleColor = isStudent ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : 'bg-purple-500/10 text-purple-500 hover:bg-purple-500/20';

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Profile"
                description="Manage your personal information and account details."
                actions={
                    <Button variant="outline" asChild>
                        <Link href="/settings">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Link>
                    </Button>
                }
            />

            <div className="grid gap-6 md:grid-cols-12">
                {/* Left Column: User Identity */}
                <div className="md:col-span-4 space-y-6">
                    <Card className="overflow-hidden border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80">
                        <div className="h-32 bg-gradient-to-r from-primary/10 via-background to-background border-b relative">
                            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] mix-blend-overlay"></div>
                        </div>
                        <CardContent className="relative pt-0">
                            <div className="absolute -top-12 left-6">
                                <Avatar className="h-24 w-24 border-4 border-background shadow-md">
                                    {user.profile_photo_url && (
                                        <AvatarImage src={user.profile_photo_url} alt={user.full_name} />
                                    )}
                                    <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-inner">
                                        {getInitials(user.full_name)}
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div className="mt-14 space-y-4">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">{user.full_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="secondary" className={`font-medium ${roleColor} border-0 px-2 py-0.5`}>
                                            {isStudent ? 'Student' : user.role}
                                        </Badge>
                                        <div className="flex items-center text-xs text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                            <CheckCircle2 className="w-3 h-3 mr-1" />
                                            Verified
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-3 pt-2">
                                    <div className="flex items-center text-sm text-muted-foreground group cursor-default">
                                        <Mail className="w-4 h-4 mr-3 opacity-70 group-hover:text-primary transition-colors" />
                                        <span className="truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <User className="w-4 h-4 mr-3 opacity-70" />
                                        <span className="font-mono text-xs bg-muted/50 px-1.5 py-0.5 rounded border flex items-center gap-2">
                                            {user.id.substring(0, 12)}...
                                            <button
                                                onClick={handleCopyId}
                                                className="hover:text-primary transition-colors cursor-pointer p-0.5 rounded-md hover:bg-background"
                                                title="Copy ID"
                                            >
                                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                            </button>
                                        </span>
                                    </div>
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        <Calendar className="w-4 h-4 mr-3 opacity-70" />
                                        <span>Joined {new Date().getFullYear()}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <Button variant="outline" size="sm" asChild className="w-full sm:flex-1 cursor-pointer hover:bg-muted/50">
                                    <ProtectedMailLink email={SUPPORT_MAIL || 'support@example.com'}>
                                        <Mail className="mr-2 h-4 w-4" />
                                        Contact Support
                                    </ProtectedMailLink>
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={logout}
                                    className="w-full sm:flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 cursor-pointer shadow-none border border-transparent hover:border-destructive/20"
                                >
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Sign Out
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Details & Stats */}
                <div className="md:col-span-8 space-y-6">
                    <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80">
                        <CardHeader className="pb-4">
                            <CardTitle>Account Overview</CardTitle>
                            <CardDescription>Your account status and role-specific information.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid gap-6 sm:grid-cols-2">
                            <div className="flex items-start space-x-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-border hover:border-primary/20 transition-all">
                                <div className="p-2.5 bg-background shadow-sm border border-border rounded-xl text-primary">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-foreground">Security Level</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">Standard encryption and protection enabled for your account.</p>
                                </div>
                            </div>
                            <div className="flex items-start space-x-4 p-5 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-border hover:border-primary/20 transition-all">
                                <div className="p-2.5 bg-background shadow-sm border border-border rounded-xl text-primary">
                                    <GraduationCap className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="font-medium text-sm text-foreground">Academic Standing</p>
                                    <p className="text-xs text-muted-foreground">{isStudent ? 'Active Student' : 'Faculty Member'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-border/50 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border/80">
                        <CardHeader>
                            <CardTitle>Capabilities & Permissions</CardTitle>
                            <CardDescription>
                                Features accessible to your <strong>{user.role}</strong> account.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isStudent ? (
                                    <>
                                        <CapabilityRow
                                            icon={CheckCircle2}
                                            title="Oral Examinations"
                                            description="Join live sessions with autonomous AI examiners"
                                        />
                                        <Separator />
                                        <CapabilityRow
                                            icon={CheckCircle2}
                                            title="Academic Records"
                                            description="View your exam history and transcripts"
                                        />
                                        <Separator />
                                        <CapabilityRow
                                            icon={CheckCircle2}
                                            title="Study Materials"
                                            description="Access course content and preparation guides"
                                        />
                                    </>
                                ) : (
                                    <>
                                        <CapabilityRow
                                            icon={Shield}
                                            title="Administrative Dashboard"
                                            description="Full access to platform management tools"
                                        />
                                        <Separator />
                                        <CapabilityRow
                                            icon={User}
                                            title="User Management"
                                            description="Create, edit, and manage user accounts"
                                        />
                                        <Separator />
                                        <CapabilityRow
                                            icon={Settings}
                                            title="System Configuration"
                                            description="Modify global platform settings and parameters"
                                        />
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}

function CapabilityRow({ icon: Icon, title, description }: { icon: any, title: string, description: string }) {
    return (
        <div className="flex items-start gap-4">
            <div className="mt-1">
                <Icon className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    );
}
