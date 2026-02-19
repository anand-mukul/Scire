'use client';

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { api } from '@/lib/network/api';
import { User, LoginCredentials, RegisterData, AuthContextType, UserRole, TenantStatus } from '@/types/auth';
import { setAccessToken, clearAccessToken } from '@/lib/auth-token';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Role-based landing pages (keys must match backend UserRole enum - UPPERCASE)
const ROLE_LANDING_PAGES: Record<string, string> = {
    [UserRole.PLATFORM_ADMIN]: '/platform', // Cross-tenant platform admin
    [UserRole.ADMIN]: '/admin',             // Tenant admin
    [UserRole.INSTRUCTOR]: '/instructor',
    [UserRole.REVIEWER]: '/reviewer',
    [UserRole.STUDENT]: '/student',
};

export function getLandingPageForRole(role: string): string {
    return ROLE_LANDING_PAGES[role] || '/student';
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const initialized = useRef(false);
    const fetchingRef = useRef(false);

    /**
     * Attempt to silently refresh the access token using httpOnly cookie.
     * Called on app initialization to restore session after page refresh.
     */
    const silentRefresh = useCallback(async (): Promise<string | null> => {
        try {
            const tokens = await api.auth.refresh();
            if (tokens.access_token) {
                setAccessToken(tokens.access_token);
                return tokens.access_token;
            }
        } catch {
            // Refresh failed - user needs to login again
            clearAccessToken();
        }
        return null;
    }, []);

    const fetchUser = useCallback(async (): Promise<User | null> => {
        // Prevent concurrent fetches
        if (fetchingRef.current) return user;
        fetchingRef.current = true;


        try {
            // DEVELOPER AUTH BYPASS
            // Controlled by NEXT_PUBLIC_DEV_AUTH_BYPASS env var
            if (process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS === 'true') {
                const envRole = process.env.NEXT_PUBLIC_DEV_AUTH_ROLE as UserRole;
                const role = Object.values(UserRole).includes(envRole) ? envRole : UserRole.PLATFORM_ADMIN;

                console.warn(`⚠️ AUTH BYPASS ENABLED: Using mock ${role} user`);

                const mockUser: User = {
                    id: 'dev-bypass-user',
                    email: 'dev@example.com',
                    role: role,
                    full_name: 'Developer Mode',
                    is_active: true,
                    is_anonymized: false,
                    tenant_id: 'dev-tenant',
                    tenant_slug: 'dev',
                    tenant_name: 'Development Tenant',
                    tenant_status: TenantStatus.ACTIVE,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };
                setUser(mockUser);
                return mockUser;
            }

            setError(null);

            // First, try to get a fresh token via silent refresh
            // This uses the httpOnly refresh cookie
            await silentRefresh();

            const userData = await api.auth.me();
            setUser(userData);
            return userData;
        } catch (err) {
            // Only clear user on 401/403, not on network errors
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            if (errorMessage.includes('401') || errorMessage.includes('403') || errorMessage.includes('Unauthorized')) {
                setUser(null);
                clearAccessToken();
            } else {
                // Log network errors but don't clear user state
                console.warn('Failed to fetch user:', errorMessage);
                setError(errorMessage);
            }
            return null;
        } finally {
            setIsLoading(false);
            fetchingRef.current = false;
        }
    }, [user, silentRefresh]);

    useEffect(() => {
        // Prevent multiple initializations (React Strict Mode)
        if (initialized.current) return;
        initialized.current = true;
        fetchUser();
    }, [fetchUser]);

    // Sync logout across browser tabs
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === 'auth_logout_event') {
                // Another tab logged out, clear state and redirect
                setUser(null);
                clearAccessToken();
                // Clear tenant branding CSS variables
                if (typeof document !== 'undefined') {
                    document.documentElement.style.removeProperty('--primary');
                    document.documentElement.style.removeProperty('--ring');
                    document.documentElement.style.removeProperty('--sidebar-primary');
                    document.documentElement.style.removeProperty('--brand-primary');
                }
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            return () => window.removeEventListener('storage', handleStorageChange);
        }
    }, []);

    const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
        setIsLoading(true);
        setError(null);
        try {
            const tokens = await api.auth.login(credentials);

            // Store access token in secure memory (not localStorage!)
            // This is safe from XSS attacks
            if (tokens.access_token) {
                setAccessToken(tokens.access_token);
            }

            // Fetch user data after login to get role
            const userData = await api.auth.me();
            if (!userData) {
                throw new Error('Failed to fetch user data after login');
            }
            setUser(userData);
            return userData;
        } catch (err) {
            setUser(null);
            clearAccessToken();
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const register = useCallback(async (data: RegisterData): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await api.auth.register(data);
            // Registration now requires email verification before login.
            // The register page will show a "check your email" message.
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const forgotPassword = useCallback(async (email: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await api.auth.forgotPassword(email);
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const resetPassword = useCallback(async (token: string, password: string): Promise<void> => {
        setIsLoading(true);
        setError(null);
        try {
            await api.auth.resetPassword(token, password);
        } catch (err) {
            throw err;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await api.auth.logout();
        } catch {
            // Continue logout even if API call fails
        } finally {
            // Clear in-memory token
            clearAccessToken();
            setUser(null);
            setError(null);

            // Clear tenant branding CSS variables
            if (typeof document !== 'undefined') {
                document.documentElement.style.removeProperty('--primary');
                document.documentElement.style.removeProperty('--ring');
                document.documentElement.style.removeProperty('--sidebar-primary');
                document.documentElement.style.removeProperty('--brand-primary');
            }

            // Broadcast logout to other tabs
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('auth_logout_event', Date.now().toString());
                localStorage.removeItem('auth_logout_event');
            }

            // Redirect to login after logout
            if (typeof window !== 'undefined') {
                window.location.href = '/auth/login';
            }
        }
    }, []);

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        forgotPassword,
        resetPassword,
        logout,
        refetch: fetchUser,
    };

    // Log auth errors in development
    if (process.env.NODE_ENV === 'development' && error) {
        console.debug('Auth error:', error);
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
