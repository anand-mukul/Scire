import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export function AnalyticsSkeleton() {
    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-pulse pb-24">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-3 w-full sm:w-auto">
                    <Skeleton className="h-8 w-48 rounded-md" />
                    <Skeleton className="h-4 w-64 max-w-full rounded-md" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Skeleton className="h-9 w-full sm:w-[180px] rounded-md" />
                    <Skeleton className="h-9 w-full sm:w-[190px] rounded-md" />
                    <Skeleton className="h-9 w-32 rounded-md hidden sm:block" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="w-full">
                <Skeleton className="h-10 w-full sm:w-[480px] rounded-lg" />
            </div>

            {/* KPI Cards Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-32 rounded-xl shadow-sm border border-border/40" />
                ))}
            </div>

            {/* Main Content Area - Top Row */}
            <div className="grid gap-6 md:grid-cols-7 h-[400px]">
                {/* Main Chart Placeholder */}
                <div className="md:col-span-4 lg:col-span-5 h-full">
                    <Skeleton className="h-full w-full rounded-xl shadow-sm border border-border/40" />
                </div>
                {/* Insights Side Panel */}
                <div className="md:col-span-3 lg:col-span-2 h-full flex flex-col gap-4">
                    <Skeleton className="h-full w-full rounded-xl shadow-sm border border-border/40" />
                </div>
            </div>

            {/* Bottom Row - Additional Charts */}
            <div className="grid gap-6 md:grid-cols-2 h-[350px]">
                <Skeleton className="h-full w-full rounded-xl shadow-sm border border-border/40" />
                <Skeleton className="h-full w-full rounded-xl shadow-sm border border-border/40" />
            </div>
        </div>
    );
}
