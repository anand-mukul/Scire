'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAuth, getLandingPageForRole } from '@/contexts/AuthContext';

interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
}

import { Logo } from '@/components/ui/logo';

function AuthLoadingScreen() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in-[0.98] duration-1000 ease-out">
                {/* Crisp, static logo (No glow, no blur) */}
                <Logo size="lg" showText={false} />
                
                {/* Minimalist status and SV-style loader */}
                <div className="flex flex-col items-center gap-4">
                    <span className="text-[13px] font-medium tracking-wide text-muted-foreground/90">Authenticating...</span>
                    
                    {/* Sleek SV-style fast indeterminate progress bar */}
                    <style>{`
                        @keyframes bounce-x {
                            0%, 100% { transform: translateX(0%); }
                            50% { transform: translateX(200%); }
                        }
                        .animate-bounce-x {
                            animation: bounce-x 0.85s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                        }
                    `}</style>
                    <div className="w-32 h-[2px] bg-secondary/40 rounded-full overflow-hidden relative shadow-inner backdrop-blur-sm">
                        {/* Glow layer */}
                        <div className="absolute inset-y-0 left-0 bg-primary/40 blur-[2px] rounded-full w-1/3 animate-bounce-x" />
                        {/* Solid core bar */}
                        <div className="absolute inset-y-0 left-0 bg-primary rounded-full w-1/3 animate-bounce-x shadow-[0_0_8px_theme(colors.primary.DEFAULT)]" />
                    </div>
                </div>
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

function GuestGuardInner({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isGuest, setIsGuest] = useState(false);

    useEffect(() => {
        // Wait for auth state to be determined
        if (isLoading) {
            setIsGuest(false);
            return;
        }

        // If authenticated, redirect to their landing page or redirect param
        if (isAuthenticated && user) {
            const redirectParam = searchParams.get('redirect');
            const landingPage = redirectParam || getLandingPageForRole(user.role);
            router.replace(landingPage);
            return;
        }

        // User is a guest (not authenticated)
        setIsGuest(true);
    }, [isLoading, isAuthenticated, user, router, searchParams]);

    // Show loading while checking auth or during redirect
    if (isLoading || !isGuest) {
        return <AuthLoadingScreen />;
    }

    return <>{children}</>;
}

// Redirect authenticated users away from auth pages
export function GuestGuard({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<AuthLoadingScreen />}>
            <GuestGuardInner>{children}</GuestGuardInner>
        </Suspense>
    );
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
