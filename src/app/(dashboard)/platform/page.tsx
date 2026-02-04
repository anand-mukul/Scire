'use client';

/**
 * Platform Admin Dashboard
 * 
 * Cross-tenant management for PLATFORM_ADMIN users only.
 * Displays tenant list, system metrics, and management actions.
 */

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { redirect } from 'next/navigation';
import { Building2, Users, Activity, Plus, Settings, BarChart3, LucideIcon } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types/auth';

export default function PlatformAdminPage() {
    const { user, isLoading: authLoading } = useAuth();

    // Fetch tenant list
    const { data: tenants, isLoading: tenantsLoading } = useQuery({
        queryKey: ['platform', 'tenants'],
        queryFn: () => api.platform.listTenants({ limit: 50 }),
        enabled: user?.role === UserRole.PLATFORM_ADMIN,
    });

    // Loading state
    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 w-12 animate-pulse rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Unauthorized check
    if (!user || user.role !== UserRole.PLATFORM_ADMIN) {
        redirect('/unauthorized');
    }

    // Stats from tenant data
    const totalTenants = tenants?.length || 0;
    const activeTenants = tenants?.filter((t: { status: string }) => t.status === 'active').length || 0;
    const trialTenants = tenants?.filter((t: { status: string }) => t.status === 'trial').length || 0;

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Platform Administration</h1>
                    <p className="mt-1 text-muted-foreground">
                        Manage tenants, monitor system health, and configure platform settings
                    </p>
                </div>
                <Link
                    href="/platform/tenants/new"
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                >
                    <Plus className="h-4 w-4" />
                    New Tenant
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 md:grid-cols-4">
                <StatCard
                    icon={Building2}
                    label="Total Tenants"
                    value={totalTenants}
                    color="blue"
                />
                <StatCard
                    icon={Activity}
                    label="Active"
                    value={activeTenants}
                    color="green"
                />
                <StatCard
                    icon={Users}
                    label="Trial"
                    value={trialTenants}
                    color="purple"
                />
                <StatCard
                    icon={BarChart3}
                    label="This Month"
                    value={totalTenants}
                    color="orange"
                />
            </div>

            {/* Tenant List */}
            <div className="rounded-2xl border border-white/10 bg-card/40 p-6 shadow-xl backdrop-blur-xl">
                <h2 className="mb-4 text-xl font-semibold">Tenants</h2>

                {tenantsLoading ? (
                    <div className="flex h-40 items-center justify-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                ) : !tenants?.length ? (
                    <div className="flex h-40 flex-col items-center justify-center text-muted-foreground">
                        <Building2 className="mb-2 h-8 w-8" />
                        <p>No tenants found</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/10 text-left text-sm text-muted-foreground">
                                    <th className="pb-3 font-medium">Tenant</th>
                                    <th className="pb-3 font-medium">Slug</th>
                                    <th className="pb-3 font-medium">Status</th>
                                    <th className="pb-3 font-medium">Plan</th>
                                    <th className="pb-3 font-medium">Created</th>
                                    <th className="pb-3 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {tenants.map((tenant: { id: string; name: string; slug: string; status: string; subscription_tier: string; created_at: string }) => (
                                    <tr key={tenant.id} className="border-b border-white/5 hover:bg-white/5">
                                        <td className="py-4 font-medium">{tenant.name}</td>
                                        <td className="py-4 text-muted-foreground">{tenant.slug}</td>
                                        <td className="py-4">
                                            <StatusBadge status={tenant.status} />
                                        </td>
                                        <td className="py-4 capitalize text-muted-foreground">
                                            {tenant.subscription_tier}
                                        </td>
                                        <td className="py-4 text-muted-foreground">
                                            {new Date(tenant.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4">
                                            <Link
                                                href={`/platform/tenants/${tenant.id}`}
                                                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                                            >
                                                <Settings className="h-4 w-4" />
                                                Manage
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    icon: Icon,
    label,
    value,
    color,
}: {
    icon: any;
    label: string;
    value: number;
    color: 'blue' | 'green' | 'purple' | 'orange';
}) {
    const colorClasses = {
        blue: 'bg-blue-500/10 text-blue-500',
        green: 'bg-green-500/10 text-green-500',
        purple: 'bg-purple-500/10 text-purple-500',
        orange: 'bg-orange-500/10 text-orange-500',
    };

    return (
        <div className="rounded-xl border border-white/10 bg-card/40 p-4 backdrop-blur-xl">
            <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${colorClasses[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground">{label}</p>
                </div>
            </div>
        </div>
    );
}

// Status Badge Component
function StatusBadge({ status }: { status: string }) {
    const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
        active: { bg: 'bg-green-500/10', text: 'text-green-500', label: 'Active' },
        suspended: { bg: 'bg-red-500/10', text: 'text-red-500', label: 'Suspended' },
        trial: { bg: 'bg-purple-500/10', text: 'text-purple-500', label: 'Trial' },
        churned: { bg: 'bg-gray-500/10', text: 'text-gray-500', label: 'Churned' },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}>
            {config.label}
        </span>
    );
}
