import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Tooltip, ResponsiveContainer } from 'recharts';

interface SkillRadarChartProps {
    data: {
        subject: string;
        avgScore: number;
        topScore: number;
        fullMark: number;
    }[];
    category: string;
    colors: any;
}

export function SkillRadarChart({ data, category, colors }: SkillRadarChartProps) {
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
        <Card className="col-span-1 lg:col-span-1 shadow-sm border-border/60 bg-card/50">
            <CardHeader>
                <CardTitle className="text-lg">Skill Proficiency</CardTitle>
                <CardDescription>
                    {category !== 'all' ? `${category.toUpperCase()} Mastery` : "Subject Mastery Analysis"}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
                            <PolarGrid stroke={colors.grid} opacity={0.6} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: colors.axis, fontSize: 12, fontWeight: 500 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                            <Radar
                                name="Average"
                                dataKey="avgScore"
                                stroke={colors.primary}
                                fill={colors.primary}
                                fillOpacity={0.4}
                            />
                            <Radar
                                name="Top Performer"
                                dataKey="topScore"
                                stroke={colors.success}
                                fill="transparent"
                                fillOpacity={0.1}
                                strokeDasharray="4 4"
                            />
                            <Tooltip
                                contentStyle={tooltipStyle}
                                itemStyle={tooltipItemStyle}
                                labelStyle={tooltipLabelStyle}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
