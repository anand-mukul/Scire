'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';

export default function ProfileLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // All authenticated users can access their profile
    return (
        <AuthGuard>
            {children}
        </AuthGuard>
    );
}
