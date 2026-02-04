'use client';

/**
 * TenantContext: Provides multi-tenant context throughout the application.
 * Extracts tenant information from the authenticated user's JWT claims.
 * 
 * Usage:
 *   const { tenantId, tenantSlug, tenantSettings, isSuspended } = useTenant();
 * 
 * Must be wrapped inside AuthProvider.
 */

import { createContext, useContext, ReactNode, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TenantStatus, TenantSettings, UserRole } from '@/types/auth';
// ... imports

export interface TenantContextType {
    // ... (unchanged)
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    tenantStatus: TenantStatus | null;
    tenantLogoUrl: string | null;
    tenantPrimaryColor: string | null;
    tenantSettings: TenantSettings | null;
    isLoading: boolean;
    isSuspended: boolean;
    isTrial: boolean;
    isPlatformAdmin: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
    children: ReactNode;
}

export function TenantProvider({ children }: TenantProviderProps) {
    const { user, isLoading: authLoading } = useAuth();

    const tenantContext = useMemo<TenantContextType>(() => {
        // ... (unchanged logic)
        // Not authenticated yet
        if (!user) {
            return {
                tenantId: null,
                tenantSlug: null,
                tenantName: null,
                tenantStatus: null,
                tenantLogoUrl: null,
                tenantPrimaryColor: null,
                tenantSettings: null,
                isLoading: authLoading,
                isSuspended: false,
                isTrial: false,
                isPlatformAdmin: false,
            };
        }

        const isPlatformAdmin = user.role === UserRole.PLATFORM_ADMIN;
        const tenantStatus = user.tenant_status || null;

        return {
            tenantId: user.tenant_id || null,
            tenantSlug: user.tenant_slug || null,
            tenantName: user.tenant_name || null,
            tenantStatus,
            tenantLogoUrl: user.tenant_logo_url || null,
            tenantPrimaryColor: user.tenant_primary_color || null,
            tenantSettings: null, // Fetched separately if needed via API
            isLoading: authLoading,
            isSuspended: tenantStatus === TenantStatus.SUSPENDED,
            isTrial: tenantStatus === TenantStatus.TRIAL,
            isPlatformAdmin,
        };
    }, [user, authLoading]);

    // Apply tenant branding
    useEffect(() => {
        if (tenantContext.tenantPrimaryColor) {
            const color = tenantContext.tenantPrimaryColor;
            document.documentElement.style.setProperty('--primary', color);
            document.documentElement.style.setProperty('--ring', color);
            document.documentElement.style.setProperty('--sidebar-primary', color);
            // Optional: Set brand-primary for consistency if used explicitly
            document.documentElement.style.setProperty('--brand-primary', color);
        } else {
            document.documentElement.style.removeProperty('--primary');
            document.documentElement.style.removeProperty('--ring');
            document.documentElement.style.removeProperty('--sidebar-primary');
            document.documentElement.style.removeProperty('--brand-primary');
        }
    }, [tenantContext.tenantPrimaryColor]);

    return (
        <TenantContext.Provider value={tenantContext}>
            {children}
        </TenantContext.Provider>
    );
}

/**
 * Hook to access tenant context.
 * Must be used within a TenantProvider.
 */
export function useTenant(): TenantContextType {
    const context = useContext(TenantContext);
    if (context === undefined) {
        throw new Error('useTenant must be used within a TenantProvider');
    }
    return context;
}

/**
 * Hook to require tenant context (throws if not in a tenant context).
 * Use this when tenant is required for the component to function.
 */
export function useRequiredTenant(): Omit<TenantContextType, 'tenantId' | 'tenantSlug'> & {
    tenantId: string;
    tenantSlug: string;
} {
    const tenant = useTenant();

    if (!tenant.tenantId || !tenant.tenantSlug) {
        throw new Error('Tenant context is required but not available');
    }

    return tenant as Omit<TenantContextType, 'tenantId' | 'tenantSlug'> & {
        tenantId: string;
        tenantSlug: string;
    };
}
