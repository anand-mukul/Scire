'use client';

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface KPICardProps {
    title: string;
    value: string | number;
    change?: string;
    trend?: 'up' | 'down' | 'neutral';
    data?: { value: number }[];
    icon?: LucideIcon;
    loading?: boolean;
    description?: string;
    className?: string;
}

export function KPICard({ title, value, change, trend, data, icon: Icon, loading, description, className }: KPICardProps) {
    if (loading) {
        return (
            <Card className={cn("overflow-hidden", className)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-4 rounded-full" />
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-32" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    const isPositive = trend === 'up';
    const isNegative = trend === 'down';

    // Default mock data if none provided, to show a subtle line
    const chartData = data || [
        { value: 10 }, { value: 20 }, { value: 15 }, { value: 25 }, { value: 30 }, { value: 40 }, { value: 35 }
    ];

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
            </CardHeader>
            <CardContent>
                <div className="flex items-baseline justify-between">
                    <div className="flex flex-col">
                        <div className="text-2xl font-bold">{value}</div>
                        {change && (
                            <div className={`text-xs flex flex-wrap items-baseline mt-1 gap-1 ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : isNegative ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'
                                }`}>
                                <span className="font-medium">{isPositive ? '+' : ''}{change}</span>
                            </div>
                        )}
                        {description && (
                            <p className="text-xs text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    {data && (
                        <div className="h-[60px] w-[80px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id={`colorValue-${title}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={isPositive || !trend ? "var(--primary)" : isNegative ? "var(--destructive)" : "var(--muted-foreground)"} stopOpacity={0.3} />
                                            <stop offset="95%" stopColor={isPositive || !trend ? "var(--primary)" : isNegative ? "var(--destructive)" : "var(--muted-foreground)"} stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={isPositive || !trend ? "var(--primary)" : isNegative ? "var(--destructive)" : "var(--muted-foreground)"}
                                        fillOpacity={1}
                                        fill={`url(#colorValue-${title})`}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
