'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserRole } from '@/types/auth';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={[UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.PLATFORM_ADMIN]}>
            {children}
        </AuthGuard>
    );
}
