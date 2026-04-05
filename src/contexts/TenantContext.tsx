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

/**
 * Calculates accessible foreground color (black/white) based on background hex luminance.
 */
function getContrastForeground(hexcolor: string): string {
    if (!hexcolor) return '#ffffff';
    let hex = hexcolor.replace('#', '');
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }
    
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    if (isNaN(r) || isNaN(g) || isNaN(b)) return '#ffffff';
    
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? '#000000' : '#ffffff';
}
// ... imports

export interface TenantContextType {
    // ... (unchanged)
    tenantId: string | null;
    tenantSlug: string | null;
    tenantName: string | null;
    tenantStatus: TenantStatus | null;
    tenantLogoUrl: string | null;
    tenantPrimaryColor: string | null;
    subscriptionTier: string | null;
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
                subscriptionTier: null,
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
            subscriptionTier: user.subscription_tier || null, // Ensure this exists in User type or JWT
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
            const fgColor = getContrastForeground(color);
            const root = document.documentElement;
            
            root.style.setProperty('--primary', color);
            root.style.setProperty('--primary-foreground', fgColor);
            root.style.setProperty('--ring', color);
            
            root.style.setProperty('--sidebar-primary', color);
            root.style.setProperty('--sidebar-primary-foreground', fgColor);
            root.style.setProperty('--brand-primary', color);
            
            // Generate visual derivatives
            root.style.setProperty('--brand-gradient-text', `linear-gradient(to right, ${color}, color-mix(in oklch, ${color} 60%, white))`);
        } else {
            const root = document.documentElement;
            root.style.removeProperty('--primary');
            root.style.removeProperty('--primary-foreground');
            root.style.removeProperty('--ring');
            root.style.removeProperty('--sidebar-primary');
            root.style.removeProperty('--sidebar-primary-foreground');
            root.style.removeProperty('--brand-primary');
            root.style.removeProperty('--brand-gradient-text');
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
