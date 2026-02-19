import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { motion } from 'framer-motion';

interface AIInsightsCardProps {
    insights: string[];
}

export function AIInsightsCard({ insights }: AIInsightsCardProps) {
    return (
        <Card className="md:col-span-3 lg:col-span-2 shadow-sm border-border/60 bg-gradient-to-b from-card/50 to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                    AI Insights
                </CardTitle>
                <CardDescription>Automated observations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {insights.length > 0 ? (
                    insights.map((insight, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-3 rounded-lg bg-background/80 border border-border/50 text-sm shadow-sm"
                        >
                            <p className="leading-relaxed text-card-foreground">{insight}</p>
                        </motion.div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        Not enough data yet for customized insights.
                    </div>
                )}
                <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground hover:text-primary mt-2">
                    View all insights
                </Button>
            </CardContent>
        </Card>
    );
}
