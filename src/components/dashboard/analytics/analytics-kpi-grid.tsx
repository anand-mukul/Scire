import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Users, GraduationCap, TrendingUp, ArrowUpRight } from 'lucide-react';

interface AnalyticsData {
    usage: {
        exams_created_this_month: number;
        sessions_conducted_this_month: number;
    };
    engagement: {
        total_students: number;
        active_students_30d: number;
        engagement_rate: number;
    };
    performance_trend: {
        avgScore: number;
    }[];
}

interface AnalyticsKPIGridProps {
    data: AnalyticsData;
    category: string;
}

export function AnalyticsKPIGrid({ data, category }: AnalyticsKPIGridProps) {
    const { usage, engagement, performance_trend } = data;

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KPICard
                title="Active Students"
                value={engagement.active_students_30d}
                subtext={`${engagement.engagement_rate}% engagement rate`}
                icon={Users}
                color="text-blue-500"
                trend={category !== 'all' ? undefined : "+12%"}
            />
            <KPICard
                title="Sessions this Month"
                value={usage.sessions_conducted_this_month}
                subtext="vs. last month"
                icon={Activity}
                color="text-emerald-500"
                trend={category !== 'all' ? undefined : "+5%"}
            />
            <KPICard
                title="New Exams"
                value={usage.exams_created_this_month}
                subtext="created this month"
                icon={GraduationCap}
                color="text-purple-500"
                trend={category !== 'all' ? undefined : "+2"}
            />
            <KPICard
                title="Avg Performance"
                value={`${performance_trend.length > 0 ? performance_trend[performance_trend.length - 1].avgScore : 0}%`}
                subtext="across all exams"
                icon={TrendingUp}
                color="text-amber-500"
                trend={category !== 'all' ? undefined : "+1.2%"}
            />
        </div>
    );
}

function KPICard({ title, value, subtext, icon: Icon, color, trend }: any) {
    return (
        <Card className="shadow-sm border-border/60 hover:shadow-md transition-shadow bg-card/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                    {title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${color}`} />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="flex items-center text-xs text-muted-foreground mt-1">
                    {trend && (
                        <span className="text-emerald-500 font-medium mr-1 flex items-center">
                            {trend} <ArrowUpRight className="h-3 w-3 inline" />
                        </span>
                    )}
                    <span className="truncate">{subtext}</span>
                </div>
            </CardContent>
        </Card>
    );
}
