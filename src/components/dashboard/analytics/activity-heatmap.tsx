import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface ActivityHeatmapProps {
    data: {
        day: string;
        hour: string;
        value: number;
    }[];
}

export function ActivityHeatmap({ data }: ActivityHeatmapProps) {
    return (
        <Card className="shadow-sm border-border/60 bg-card/50">
            <CardHeader>
                <CardTitle>Platform Activity Heatmap</CardTitle>
                <CardDescription>User activity density by day and time</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-12 gap-1 p-4 rounded-md border border-border/50 bg-background/50 overflow-x-auto">
                    {/* Header Row - Times */}
                    <div className="col-span-1 text-xs text-muted-foreground font-medium"></div>
                    {['9am', '12pm', '3pm', '6pm', '9pm'].map(time => (
                        <div key={time} className="col-span-2 text-center text-xs text-muted-foreground font-medium">{time}</div>
                    ))}

                    {/* Rows for Days */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                        <React.Fragment key={day}>
                            <div className="col-span-1 text-xs text-muted-foreground font-medium flex items-center">{day}</div>
                            {['9am', '12pm', '3pm', '6pm', '9pm'].map(time => {
                                // Find data for this slot
                                const point = data.find(d => d.day === day && d.hour === time);
                                const value = point ? point.value : 0;

                                // Calculate intensity color using opacity of primary blue
                                let bgClass = 'bg-slate-100 dark:bg-slate-800'; // Default empty
                                let style = {};

                                // Using direct colors for reliability
                                if (value > 80) style = { backgroundColor: 'rgba(59, 130, 246, 1)' }; // Blue 500
                                else if (value > 60) style = { backgroundColor: 'rgba(59, 130, 246, 0.8)' };
                                else if (value > 40) style = { backgroundColor: 'rgba(59, 130, 246, 0.6)' };
                                else if (value > 20) style = { backgroundColor: 'rgba(59, 130, 246, 0.4)' };
                                else if (value > 5) style = { backgroundColor: 'rgba(59, 130, 246, 0.2)' };

                                return (
                                    <div key={`${day}-${time}`} className="col-span-2 h-10 flex items-center justify-center p-0.5" title={`${day} ${time}: ${value} users`}>
                                        <div
                                            className={cn("w-full h-full rounded-sm transition-all hover:scale-105 cursor-help", bgClass)}
                                            style={style}
                                        />
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>
                <div className="mt-4 flex items-center justify-end gap-2 text-xs text-muted-foreground">
                    <span>Less</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.2)' }}></div>
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.6)' }}></div>
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 1)' }}></div>
                    </div>
                    <span>More</span>
                </div>
            </CardContent>
        </Card>
    );
}
