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

function TenantLoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading organization...</p>
            </div>
        </div>
    );
}

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
        return <TenantLoadingScreen />;
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

    // Breadcrumbs Logic (Basic implementation based on path)
    const pathSegments = pathname.split('/').filter(Boolean);
    const breadcrumbs = pathSegments.map((segment, index) => {
        const href = `/${pathSegments.slice(0, index + 1).join('/')}`;
        const isLast = index === pathSegments.length - 1;
        return {
            label: segment.charAt(0).toUpperCase() + segment.slice(1),
            href,
            isLast
        };
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
                                            <BreadcrumbItem className="hidden md:block">
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
                    <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </AuthGuard>
    );
}
