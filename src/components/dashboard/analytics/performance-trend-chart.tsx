import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface PerformanceTrendChartProps {
    data: {
        date: string;
        avgScore: number;
        sessions: number;
    }[];
    colors: any;
}

export function PerformanceTrendChart({ data, colors }: PerformanceTrendChartProps) {
    const tooltipStyle = {
        backgroundColor: 'hsl(var(--background) / 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderColor: 'hsl(var(--border) / 0.5)',
        borderWidth: '1px',
        borderRadius: '12px',
        color: 'hsl(var(--foreground))',
        boxShadow: '0 12px 24px -4px rgb(0 0 0 / 0.2)',
        padding: '12px',
        fontSize: '13px',
        fontWeight: '500',
        outline: 'none',
    };

    const tooltipLabelStyle = {
        color: 'hsl(var(--muted-foreground))',
        fontSize: '12px',
        fontWeight: '500',
        marginBottom: '4px',
    };

    const tooltipItemStyle = {
        color: 'hsl(var(--foreground))',
        fontSize: '13px',
        fontWeight: '500',
        padding: '2px 0',
    };

    return (
        <Card className="md:col-span-4 lg:col-span-5 shadow-sm border-border/60 bg-card/50 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="text-lg">Performance Trend</CardTitle>
                <CardDescription>Average student scores over the last 6 months.</CardDescription>
            </CardHeader>
            <CardContent className="pl-0">
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={colors.primary} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={colors.primary} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={colors.grid} opacity={0.6} />
                            <XAxis
                                dataKey="date"
                                tick={{ fill: colors.axis, fontSize: 12 }}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                tick={{ fill: colors.axis, fontSize: 12 }}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}%`}
                                dx={-10}
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                                labelStyle={tooltipLabelStyle}
                                formatter={(value: number) => [`${value}%`, 'Avg Score']}
                            />
                            <Area
                                type="monotone"
                                dataKey="avgScore"
                                stroke={colors.primary}
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorScore)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
