'use client';

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

/**
 * Reusable page-level skeleton components for consistent loading states.
 * All use the Skeleton component which has the brand shimmer effect.
 */

/* ── Page Header Skeleton ─────────────────────────── */
export function HeaderSkeleton() {
    return (
        <div className="flex items-center justify-between">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-72" />
            </div>
            <Skeleton className="h-8 w-36 rounded-full" />
        </div>
    );
}

/* ── KPI Cards Row Skeleton ───────────────────────── */
export function KPIRowSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: count }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                    <div className="p-6 space-y-3">
                        <div className="flex items-center justify-between">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-4 rounded-full" />
                        </div>
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </Card>
            ))}
        </div>
    );
}

/* ── Card Skeleton ────────────────────────────────── */
export function CardSkeleton({ className }: { className?: string }) {
    return (
        <Card className={`p-6 space-y-4 ${className || ''}`}>
            <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                </div>
                <Skeleton className="h-6 w-16 rounded-full" />
            </div>
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-9 w-full" />
        </Card>
    );
}

/* ── Activity / List Feed Skeleton ────────────────── */
export function ListSkeleton({ rows = 4 }: { rows?: number }) {
    return (
        <div className="bg-card/30 border border-border/40 rounded-2xl overflow-hidden">
            <div className="divide-y divide-border/40">
                {Array.from({ length: rows }).map((_, i) => (
                    <div key={i} className="p-5 flex gap-4">
                        <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Status Card Skeleton (Live Status) ───────────── */
export function StatusCardSkeleton() {
    return (
        <div className="grid gap-5 sm:grid-cols-2">
            {[1, 2].map((i) => (
                <div key={i} className="p-6 rounded-2xl border border-border/50 bg-card/40 flex items-center gap-5">
                    <Skeleton className="w-14 h-14 rounded-xl flex-shrink-0" />
                    <div className="space-y-2 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-7 w-32" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Quick Actions Skeleton ───────────────────────── */
export function QuickActionsSkeleton({ count = 3 }: { count?: number }) {
    return (
        <div className="bg-card/30 border border-border/40 rounded-2xl p-2.5 space-y-1.5">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-3.5 rounded-xl">
                    <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                    <div className="space-y-1.5 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-40" />
                    </div>
                </div>
            ))}
        </div>
    );
}

/* ── Full Dashboard Page Skeleton ─────────────────── */
export function DashboardSkeleton() {
    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 pb-24">
            <HeaderSkeleton />
            <KPIRowSkeleton />
            <div className="grid gap-10 lg:grid-cols-3">
                <div className="lg:col-span-2 space-y-10">
                    <div className="space-y-5">
                        <Skeleton className="h-6 w-32" />
                        <StatusCardSkeleton />
                    </div>
                    <div className="space-y-5">
                        <Skeleton className="h-6 w-36" />
                        <ListSkeleton rows={3} />
                    </div>
                </div>
                <div className="space-y-10">
                    <div className="space-y-5">
                        <Skeleton className="h-6 w-28" />
                        <QuickActionsSkeleton />
                    </div>
                    <div className="space-y-5">
                        <Skeleton className="h-6 w-32" />
                        <Card className="p-6 space-y-5">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}
