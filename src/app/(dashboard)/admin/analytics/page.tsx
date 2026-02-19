'use client';

import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { AlertCircle, Filter } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/page-header';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';

// Custom Components
import { AnalyticsSkeleton } from '@/components/dashboard/analytics/analytics-skeleton';
import { AnalyticsFilters } from '@/components/dashboard/analytics/analytics-filters';
import { AnalyticsKPIGrid } from '@/components/dashboard/analytics/analytics-kpi-grid';
import { PerformanceTrendChart } from '@/components/dashboard/analytics/performance-trend-chart';
import { AIInsightsCard } from '@/components/dashboard/analytics/ai-insights-card';
import { TopExamsChart } from '@/components/dashboard/analytics/top-exams-chart';
import { ExamPerformanceList } from '@/components/dashboard/analytics/exam-performance-list';
import { SkillRadarChart } from '@/components/dashboard/analytics/skill-radar-chart';
import { ScoreScatterChart } from '@/components/dashboard/analytics/score-scatter-chart';
import { ActivityHeatmap } from '@/components/dashboard/analytics/activity-heatmap';

// Types
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
        date: string;
        avgScore: number;
        sessions: number;
    }[];
    top_exams: {
        title: string;
        attempts: number;
        avgScore: number;
        avgConfidence: number;
        subject?: string; // Added for filtering
    }[];
    insights: string[];
    skill_radar: {
        subject: string;
        avgScore: number;
        topScore: number;
        fullMark: number;
    }[];
    activity_heatmap: {
        day: string;
        hour: string;
        value: number;
    }[];
    score_dispersion: {
        duration: number | string; // minutes; string for "59.6" edge case
        score: number;
        student: string;
        subject?: string; // Added for filtering
    }[];
}

export default function AnalyticsPage() {
    // State for filtering
    const [date, setDate] = React.useState<DateRange | undefined>({
        from: addDays(new Date(), -30),
        to: new Date(),
    });
    const [category, setCategory] = React.useState<string>("all");

    // Fetch Subjects for Filter
    const { data: subjects = [] } = useQuery({
        queryKey: ['subjects'],
        queryFn: api.subjects.getAll,
        staleTime: 1000 * 60 * 60, // 1 hour
    });

    // Fetch Real Data
    const { data, isLoading, error } = useQuery<AnalyticsData>({
        queryKey: ['advanced-analytics', category, date?.from, date?.to],
        queryFn: () => api.analytics.getAdvancedStats({
            category: category === 'all' ? undefined : category,
            start_date: date?.from?.toISOString(),
            end_date: date?.to?.toISOString()
        }),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Memoize and parse score dispersion data to ensure duration is a number
    const scoreDispersionData = useMemo(() => {
        if (!data?.score_dispersion) return [];
        return data.score_dispersion.map(item => ({
            ...item,
            duration: typeof item.duration === 'string' ? parseFloat(item.duration) : item.duration
        }));
    }, [data]);

    if (isLoading) {
        return <AnalyticsSkeleton />;
    }

    if (error || !data) {
        return (
            <div className="flex h-[50vh] flex-col items-center justify-center gap-4 text-center p-8">
                <div className="rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/30">
                    <AlertCircle className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-semibold text-foreground">Access Denied / Error</h2>
                <p className="text-muted-foreground w-full max-w-sm">
                    {(error as any)?.message || "Unable to load analytics data. Please try again later."}
                </p>
                <Button variant="outline" onClick={() => window.location.reload()}>
                    Retry
                </Button>
            </div>
        );
    }

    const { usage, engagement, performance_trend, top_exams, insights } = data;
    const hasData = top_exams.length > 0 || data.skill_radar.length > 0;

    // Explicit professional colors to ensure visibility regardless of theme defaults
    const colors = {
        primary: "#3b82f6",   // Blue 500
        secondary: "#8b5cf6", // Violet 500
        success: "#10b981",   // Emerald 500
        axis: "#6b7280",      // Gray 500
        grid: "#e5e7eb",      // Gray 200
    };

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header with Visual Polish */}
            <PageHeader
                title="Analytics"
                description="Deep dive into student performance, engagement metrics, and platform usage trends."
                actions={
                    <AnalyticsFilters
                        category={category}
                        setCategory={setCategory}
                        date={date}
                        setDate={setDate}
                        subjects={subjects}
                    />
                }
            />

            {!hasData ? (
                <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/5 animate-fade-in">
                    <div className="rounded-full bg-muted p-4 mb-4">
                        <Filter className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">No data found</h3>
                    <p className="text-muted-foreground max-w-sm mt-1 mb-6">
                        There are no analytics available for the selected category within this date range.
                    </p>
                    <Button variant="outline" onClick={() => setCategory('all')}>
                        Clear Filters
                    </Button>
                </div>
            ) : (
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-muted/50 border border-border/40 p-1 w-fit inline-flex justify-start">
                        <TabsTrigger value="overview" className="px-6">Overview</TabsTrigger>
                        <TabsTrigger value="performance" className="px-6">Broad Performance</TabsTrigger>
                        <TabsTrigger value="engagement" className="px-6">Engagement Details</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        {/* KPI Cards */}
                        <AnalyticsKPIGrid data={data} category={category} />

                        <div className="grid gap-6 md:grid-cols-7">
                            {/* Main Chart */}
                            <PerformanceTrendChart data={performance_trend} colors={colors} />

                            {/* AI Insights Sidebar */}
                            <AIInsightsCard insights={insights} />
                        </div>

                        {/* Top Exams Table/Chart */}
                        <div className="grid gap-6 md:grid-cols-2">
                            <TopExamsChart data={top_exams} colors={colors} />
                            <ExamPerformanceList data={top_exams} colors={colors} />
                        </div>
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {/* Radar Chart */}
                            <SkillRadarChart data={data.skill_radar} category={category} colors={colors} />

                            {/* Scatter Plot */}
                            <ScoreScatterChart data={scoreDispersionData} colors={colors} />
                        </div>
                    </TabsContent>

                    <TabsContent value="engagement" className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 fade-in">
                        <ActivityHeatmap data={data.activity_heatmap} />
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
