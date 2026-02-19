import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';

interface ExamPerformanceListProps {
    data: {
        title: string;
        avgScore: number;
        avgConfidence: number;
    }[];
    colors: any;
}

export function ExamPerformanceList({ data, colors }: ExamPerformanceListProps) {
    return (
        <Card className="col-span-1 shadow-sm border-border/60 bg-card/50">
            <CardHeader>
                <CardTitle className="text-lg">Exam Pass Rates & Confidence</CardTitle>
                <CardDescription>Average performance metrics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {data.map((exam, i) => (
                    <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="font-medium truncate max-w-[200px] text-foreground">{exam.title}</span>
                            <span className="text-muted-foreground">{exam.avgScore}% avg</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-secondary/50 overflow-hidden">
                            <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: colors.success }}
                                initial={{ width: 0 }}
                                animate={{ width: `${exam.avgScore}%` }}
                                transition={{ duration: 1, delay: 0.2 + (i * 0.1) }}
                            />
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>Confidence Score</span>
                            <span>{exam.avgConfidence}/1.0</span>
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    );
}
