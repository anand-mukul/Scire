'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth, getLandingPageForRole } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

// Loading component during auth check
function AuthLoadingScreen() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
                <p className="text-neutral-400">Verifying authentication...</p>
            </div>
        </div>
    );
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Wait for auth state to be determined
        if (isLoading) {
            setIsAuthorized(false);
            return;
        }

        // If not authenticated, redirect to login
        if (!isAuthenticated || !user) {
            const loginUrl = `/auth/login?redirect=${encodeURIComponent(pathname)}`;
            router.replace(loginUrl);
            return;
        }

        // If user's role is not in allowed roles, redirect to their appropriate page
        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
            const landingPage = getLandingPageForRole(user.role);
            router.replace(landingPage);
            return;
        }

        // User is authorized
        setIsAuthorized(true);
    }, [isLoading, isAuthenticated, user, router, pathname, allowedRoles]);

    // Show loading while checking auth or during redirect
    if (isLoading || !isAuthorized) {
        return <AuthLoadingScreen />;
    }

    return <>{children}</>;
}

// Redirect authenticated users away from auth pages
export function GuestGuard({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Wait for auth state to be determined
        if (isLoading) {
            setIsGuest(false);
            return;
        }

        // If authenticated, redirect to their landing page
        if (isAuthenticated && user) {
            const landingPage = getLandingPageForRole(user.role);
            router.replace(landingPage);
            return;
        }

        // User is a guest (not authenticated)
        setIsGuest(true);
    }, [isLoading, isAuthenticated, user, router]);

    // Show loading while checking auth or during redirect
    if (isLoading || !isGuest) {
        return <AuthLoadingScreen />;
    }

    return <>{children}</>;
}

// Hook to check if user has specific roles
export function useRequireRole(allowedRoles: string[]): {
    isAuthorized: boolean;
    isLoading: boolean;
    user: ReturnType<typeof useAuth>['user'];
} {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (isLoading) return;

        if (!isAuthenticated || !user) {
            router.replace(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
            return;
        }

        if (!allowedRoles.includes(user.role)) {
            router.replace(getLandingPageForRole(user.role));
        }
    }, [isLoading, isAuthenticated, user, allowedRoles, router, pathname]);

    return {
        isAuthorized: !!user && allowedRoles.includes(user.role),
        isLoading,
        user,
    };
}
