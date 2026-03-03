'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AppSidebar } from '@/components/layout/app-sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { NotificationSheet } from '@/components/layout/notification-sheet';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const { isLoading: tenantLoading } = useTenant();

    // Check if this is an exam session (full-screen mode)
    const isExamSession = pathname?.includes('/student/exam') && pathname?.includes('/session');
    const isExamFlow = pathname?.includes('/student/exam');

    // Show loading while validating tenant info
    if (tenantLoading) {
        return (
            <div className="flex h-dvh bg-background">
                {/* Sidebar skeleton */}
                <div className="hidden md:flex w-64 flex-col border-r border-sidebar-border bg-sidebar p-4 gap-4">
                    <div className="h-8 w-32 rounded-lg bg-muted/30 animate-pulse" />
                    <div className="h-9 w-full rounded-lg bg-muted/20 animate-pulse mt-4" />
                    <div className="space-y-2 mt-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-8 rounded-md bg-muted/15 animate-pulse" style={{ width: `${70 + Math.random() * 30}%` }} />
                        ))}
                    </div>
                </div>
                {/* Content skeleton */}
                <div className="flex-1 flex flex-col">
                    <div className="h-14 border-b border-border flex items-center px-4 gap-4">
                        <div className="h-5 w-40 rounded bg-muted/20 animate-pulse" />
                    </div>
                    <div className="flex-1 flex items-center justify-center">
                        <div className="flex flex-col items-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">Loading organization...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Exam session: full-screen layout without sidebar
    if (isExamFlow) {
        const isActiveSession = pathname?.includes('/session');

        return (
            <AuthGuard>
                <main className={`h-screen w-full bg-background relative ${isActiveSession ? 'overflow-hidden' : 'overflow-y-auto'}`}>
                    {children}
                </main>
            </AuthGuard>
        );
    }

    // Breadcrumbs Logic with human-readable label mapping
    const BREADCRUMB_LABELS: Record<string, string> = {
        student: 'Student Portal',
        instructor: 'Instructor',
        admin: 'Admin',
        platform: 'Platform',
        reviewer: 'Reviewer',
        exam: 'Exam',
        session: 'Session',
        history: 'History',
        help: 'Help & Rules',
        practice: 'Practice',
        join: 'Join Exam',
        exams: 'Exams',
        create: 'Create',
        monitor: 'Live Monitor',
        rubrics: 'Rubrics',
        users: 'Users',
        subjects: 'Subjects',
        system: 'System',
        settings: 'Settings',
        analytics: 'Analytics',
        profile: 'Profile',
        result: 'Result',
        'forgot-password': 'Forgot Password',
        'reset-password': 'Reset Password',
        'verify-email': 'Verify Email',
    };

    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        const label = BREADCRUMB_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
        return { label, href, isLast };
    });


    // Standard dashboard layout with Shadcn Sidebar
    return (
        <AuthGuard>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center justify-between px-6 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b bg-background/50 backdrop-blur-md sticky top-0 z-10">
                        <div className="flex items-center gap-2">
                            <SidebarTrigger className="-ml-1" />
                            <Separator orientation="vertical" className="mr-2 h-4" />
                            <Breadcrumb>
                                <BreadcrumbList>
                                    {breadcrumbs.map((item, index) => (
                                        <React.Fragment key={item.href}>
                                            <BreadcrumbItem className={!item.isLast ? 'hidden md:block' : ''}>
                                                {item.isLast ? (
                                                    <BreadcrumbPage className="font-bold text-foreground">{item.label}</BreadcrumbPage>
                                                ) : (
                                                    <BreadcrumbLink href={item.href} className="text-muted-foreground/60 transition-colors hover:text-foreground">
                                                        {item.label}
                                                    </BreadcrumbLink>
                                                )}
                                            </BreadcrumbItem>
                                            {!item.isLast && <BreadcrumbSeparator className="hidden md:block opacity-30" />}
                                        </React.Fragment>
                                    ))}
                                </BreadcrumbList>
                            </Breadcrumb>
                        </div>

                        <div className="flex items-center gap-4">
                            <NotificationSheet />
                        </div>
                    </header>
                    <div id="main-content" className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
