'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserRole } from '@/types/auth';

export default function ReviewerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={[UserRole.REVIEWER, UserRole.ADMIN, UserRole.PLATFORM_ADMIN]}>
            {children}
        </AuthGuard>
    );
}
