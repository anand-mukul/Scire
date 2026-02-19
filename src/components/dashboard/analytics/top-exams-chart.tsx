import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface TopExamsChartProps {
    data: {
        title: string;
        attempts: number;
    }[];
    colors: any;
}

export function TopExamsChart({ data, colors }: TopExamsChartProps) {
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
        <Card className="col-span-1 shadow-sm border-border/60 bg-card/50">
            <CardHeader>
                <CardTitle className="text-lg">Top Exams by Attempts</CardTitle>
                <CardDescription>Most popular assessments this month</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 40, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={colors.grid} opacity={0.6} />
                            <XAxis type="number" tick={{ fill: colors.axis, fontSize: 12 }} fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis type="category" dataKey="title" width={140} tick={{ fill: colors.axis, fontSize: 12, fontWeight: 500 }} fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => value.length > 20 ? `${value.substring(0, 20)}...` : value} />
                            <Tooltip
                                cursor={{ fill: 'hsl(var(--muted))', opacity: 0.3 }}
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                                labelStyle={tooltipLabelStyle}
                            />
                            <Bar dataKey="attempts" fill={colors.secondary} radius={[0, 4, 4, 0]} barSize={24} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
