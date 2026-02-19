import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ScoreScatterChartProps {
    data: any[];
    colors: any;
}

export function ScoreScatterChart({ data, colors }: ScoreScatterChartProps) {
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
        <Card className="col-span-1 lg:col-span-2 shadow-sm border-border/60 bg-card/50">
            <CardHeader>
                <CardTitle className="text-lg">Score vs. Duration</CardTitle>
                <CardDescription>Correlation between time spent and exam score</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={colors.grid} opacity={0.6} />
                            <XAxis type="number" dataKey="duration" name="Duration" unit="m" tick={{ fill: colors.axis, fontSize: 12 }} stroke={colors.grid} axisLine={false} tickLine={false} />
                            <YAxis type="number" dataKey="score" name="Score" unit="%" tick={{ fill: colors.axis, fontSize: 12 }} stroke={colors.grid} axisLine={false} tickLine={false} />
                            <Tooltip
                                cursor={{ strokeDasharray: '3 3' }}
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                                labelStyle={tooltipLabelStyle}
                            />
                            <Scatter name="Student Exams" data={data} fill={colors.secondary} />
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
