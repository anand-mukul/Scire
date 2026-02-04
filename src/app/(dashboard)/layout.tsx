'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { MobileNav } from '@/components/layout/MobileNav';
import { useTenant } from '@/contexts/TenantContext';
import { Loader2 } from 'lucide-react';

/**
 * Dashboard Layout
 * 
 * Standard application layout with Sidebar and MobileNav.
 * Handles exact route layout variations (e.g. Exam Flow full-screen).
 * 
 * Tenant Context: provided by root TenantProvider + AuthGuard.
 * No URL parameter validation required (Path-based routing).
 */

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

    // Standard dashboard layout with sidebar
    return (
        <AuthGuard>
            <div className="flex h-screen w-full bg-background overflow-hidden">
                <aside className="hidden md:block">
                    <Sidebar />
                </aside>
                <MobileNav />
                <main className="flex-1 overflow-y-auto pt-16 px-4 pb-4 md:p-0">
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
