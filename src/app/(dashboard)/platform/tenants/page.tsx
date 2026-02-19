'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { redirect } from 'next/navigation';
import { Building2, Plus, Search, Settings, Filter, MoreHorizontal, Activity, Users, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { UserRole } from '@/types/auth';
import { Tenant, TenantStatus } from '@/types/backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { KPICard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/dashboard/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

export default function TenantsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch tenant list
    const { data: tenants, isLoading: tenantsLoading } = useQuery({
        queryKey: ['platform', 'tenants'],
        queryFn: async () => {
            const data = await api.platform.listTenants({ limit: 100 });
            return data as Tenant[];
        },
        enabled: user?.role === UserRole.PLATFORM_ADMIN,
    });

    // Loading state
    if (authLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    // Unauthorized check
    if (!user || user.role !== UserRole.PLATFORM_ADMIN) {
        redirect('/unauthorized');
    }

    // Filter tenants
    const filteredTenants = tenants?.filter(tenant =>
        tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

    // KPI Calculations
    const totalTenants = tenants?.length || 0;
    const activeTenants = tenants?.filter(t => t.status === TenantStatus.ACTIVE).length || 0;
    const trialTenants = tenants?.filter(t => t.status === TenantStatus.TRIAL).length || 0;
    const estimatedRevenue = tenants?.reduce((acc, t) => {
        if (t.subscription_tier === 'ENTERPRISE') return acc + 4999;
        if (t.subscription_tier === 'PRO') return acc + 999;
        return acc;
    }, 0) || 0;

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header */}
            <PageHeader
                title="Tenants"
                description="Manage your platform's organizations and subscriptions."
                actions={
                    <Button asChild className="shrink-0">
                        <Link href="/platform/tenants/new">
                            <Plus className="h-4 w-4" />
                            Create Tenant
                        </Link>
                    </Button>
                }
            />

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <KPICard
                    title="Total Tenants"
                    value={totalTenants}
                    description={`${trialTenants} on trial`}
                    icon={Building2}
                    loading={tenantsLoading}
                />
                <KPICard
                    title="Active Subscriptions"
                    value={activeTenants}
                    description={`${totalTenants > 0 ? Math.round((activeTenants / totalTenants) * 100) : 0}% of total`}
                    icon={Activity}
                    loading={tenantsLoading}
                />
                <KPICard
                    title="Monthly Revenue (Est.)"
                    value={`₹${estimatedRevenue.toLocaleString('en-IN')}`}
                    description={`From ${tenants?.filter(t => ['PRO', 'ENTERPRISE'].includes(t.subscription_tier)).length || 0} paid tenants`}
                    icon={DollarSign}
                    loading={tenantsLoading}
                />
            </div>

            {/* Filters & Actions */}
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-1 items-center gap-2">
                    <div className="relative flex-1 md:max-w-sm">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tenants..."
                            className="pl-9 bg-card"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="h-9">
                        <Filter className="h-4 w-4" />
                        Status
                    </Button>
                    <Button variant="outline" size="sm" className="h-9">
                        <DollarSign className="h-4 w-4" />
                        Plan
                    </Button>
                </div>
            </div>

            {/* Tenants Table */}
            {/* Tenants Table */}
            <Card className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle>All Organizations</CardTitle>
                    <CardDescription>A list of all registered tenants on the platform.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[250px] pl-6">Organization</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Subscription</TableHead>
                                    <TableHead>Users</TableHead>
                                    <TableHead>Created</TableHead>
                                    <TableHead className="text-right pr-6">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tenantsLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell>
                                                <div className="space-y-2">
                                                    <Skeleton className="h-4 w-[180px]" />
                                                    <Skeleton className="h-3 w-[120px]" />
                                                </div>
                                            </TableCell>
                                            <TableCell><Skeleton className="h-6 w-[80px] rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-6 w-[100px] rounded-full" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[40px]" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                                            <TableCell><Skeleton className="h-8 w-8 ml-auto rounded-md" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : !filteredTenants.length ? (
                                    <TableRow>
                                        <TableCell colSpan={6}>
                                            <EmptyState
                                                icon={Building2}
                                                title="No tenants found"
                                                description={searchTerm ? "Consider adjusting your search filters to find what you're looking for." : "Get started by creating your first organization to manage users and exams."}
                                                action={!searchTerm ? {
                                                    label: "Create Tenant",
                                                    href: "/platform/tenants/new"
                                                } : undefined}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTenants.map((tenant) => (
                                        <TableRow key={tenant.id} className="card-hover hover:bg-muted/40 border-border/40 transition-colors">
                                            <TableCell className="pl-6">
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-foreground">{tenant.name}</span>
                                                    <span className="text-xs text-muted-foreground">{tenant.slug}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <StatusBadge status={tenant.status} />
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize font-normal">
                                                    {tenant.subscription_tier.toLowerCase().replace('_', ' ')}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Users className="h-3 w-3" />
                                                    <span>-</span> {/* Placeholder for user count if not available */}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-sm">
                                                {new Date(tenant.created_at).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric'
                                                })}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Open menu</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem asChild>
                                                            <Link href={`/platform/tenants/${tenant.id}`}>
                                                                <Settings className="h-4 w-4" />
                                                                Settings
                                                            </Link>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Activity className="h-4 w-4" />
                                                            View Activity
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:text-destructive">
                                                            Suspend Tenant
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}


