'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';
import { UserRole } from '@/types/auth';

export default function InstructorLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard allowedRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN, UserRole.PLATFORM_ADMIN]}>
            {children}
        </AuthGuard>
    );
}
