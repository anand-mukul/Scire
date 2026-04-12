import React, { useEffect } from 'react';
import { useLiveBehaviorSummary, useLiveBehaviorTimeline } from '@/hooks/use-dashboard-data';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, EyeOff, LayoutTemplate, VolumeX, MicOff, Activity, Clock, User } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { DashboardSession } from '@/app/(dashboard)/instructor/monitor/page';

interface LiveMonitorDetailsProps {
    session: DashboardSession | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const EVENT_ICONS: Record<string, any> = {
    TAB_SWITCH: LayoutTemplate,
    FOCUS_LOSS: EyeOff,
    FACE_MISSING: User,
    VOICE_MISMATCH: MicOff,
    NOISE_SPIKE: VolumeX,
    SNAPSHOT_REUSE: AlertCircle,
    GAZE_DEVIATION: EyeOff,
    ILLUMINATION_SPIKE: AlertCircle,
};

const EVENT_COLORS: Record<string, string> = {
    TAB_SWITCH: 'text-amber-500 bg-amber-500/10',
    FOCUS_LOSS: 'text-amber-500 bg-amber-500/10',
    FACE_MISSING: 'text-rose-500 bg-rose-500/10',
    VOICE_MISMATCH: 'text-rose-500 bg-rose-500/10',
    NOISE_SPIKE: 'text-orange-500 bg-orange-500/10',
    SNAPSHOT_REUSE: 'text-destructive bg-destructive/10',
    GAZE_DEVIATION: 'text-purple-500 bg-purple-500/10',
    ILLUMINATION_SPIKE: 'text-blue-500 bg-blue-500/10',
};

export function LiveMonitorDetails({ session, open, onOpenChange }: LiveMonitorDetailsProps) {
    const { data: summary } = useLiveBehaviorSummary(session?.id ?? '', { refetchInterval: 5000 });
    const { data: timeline } = useLiveBehaviorTimeline(session?.id ?? '', 50, { refetchInterval: 5000 });

    if (!session) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-md md:max-w-lg overflow-hidden flex flex-col p-0 border-l border-border/50">
                <div className="p-6 pb-4 border-b border-border/50 bg-muted/20">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2">
                            <Activity className="h-5 w-5 text-primary" />
                            Live Session Insights
                        </SheetTitle>
                        <SheetDescription>
                            Real-time behavior analytics for {session.student?.full_name || session.student_name}
                        </SheetDescription>
                    </SheetHeader>
                </div>

                <ScrollArea className="flex-1 p-6">
                    <div className="space-y-6">
                        {/* Summary Cards */}
                        <div>
                            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wider">Aggregated Metrics</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <MetricCard 
                                    title="Face Missing" 
                                    value={summary?.face_missing_count ?? 0} 
                                    icon={EyeOff}
                                    dangerThreshold={5}
                                />
                                <MetricCard 
                                    title="Voice Mismatch" 
                                    value={summary?.voice_mismatch_count ?? 0} 
                                    icon={MicOff}
                                    dangerThreshold={3}
                                />
                                <MetricCard 
                                    title="Tab Switches" 
                                    value={summary?.tab_switches ?? 0} 
                                    icon={LayoutTemplate}
                                    dangerThreshold={2}
                                />
                                <MetricCard 
                                    title="Gaze Deviations" 
                                    value={summary?.gaze_deviations ?? 0} 
                                    icon={EyeOff}
                                    dangerThreshold={8}
                                />
                                <MetricCard 
                                    title="Noise Spikes" 
                                    value={summary?.noise_spikes ?? 0} 
                                    icon={VolumeX}
                                    dangerThreshold={10}
                                />
                            </div>
                        </div>

                        {/* Event Timeline */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Event Timeline</h3>
                                <Badge variant="outline" className="text-xs bg-muted/50 border-border/50">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Live
                                </Badge>
                            </div>
                            
                            {!timeline || timeline.length === 0 ? (
                                <div className="text-center p-8 border border-dashed rounded-xl border-border/50 bg-muted/10">
                                    <Activity className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                                    <p className="text-sm text-muted-foreground">No suspicious behavior detected.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-border before:to-transparent">
                                    {timeline.map((event: any, idx: number) => {
                                        const eventType = event.type;
                                        const Icon = EVENT_ICONS[eventType] || AlertCircle;
                                        const colorClass = EVENT_COLORS[eventType] || 'text-muted-foreground bg-muted';
                                        
                                        return (
                                            <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                                                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-background bg-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                                                    <div className={cn("w-full h-full rounded-full flex items-center justify-center", colorClass)}>
                                                        <Icon className="w-4 h-4" />
                                                    </div>
                                                </div>
                                                <Card className="w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-3 shadow-none border-border/50 bg-muted/10 hover:bg-muted/30 transition-colors">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-semibold text-sm capitalize">{eventType.replace('_', ' ').toLowerCase()}</span>
                                                        <span className="text-xs text-muted-foreground">{format(new Date(event.timestamp), 'HH:mm:ss')}</span>
                                                    </div>
                                                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                        <p className="text-xs text-muted-foreground line-clamp-1">
                                                            {Object.entries(event.metadata)
                                                                .map(([k, v]) => `${k.replace(/_/g, ' ')}: ${typeof v === 'number' ? (v as number).toFixed(3) : String(v).slice(0, 50)}`)
                                                                .join(' · ')}
                                                        </p>
                                                    )}
                                                </Card>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>
                
                <div className="p-4 border-t border-border/50 bg-muted/20 mt-auto">
                    <p className="text-xs text-center text-muted-foreground">
                        Metrics are captured securely via Redis logic.
                    </p>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function MetricCard({ title, value, icon: Icon, dangerThreshold }: { title: string, value: number, icon: any, dangerThreshold: number }) {
    const isDanger = value >= dangerThreshold;
    const isWarn = value > 0 && value < dangerThreshold;
    
    return (
        <Card className={cn(
            "p-4 border transition-colors",
            isDanger ? "border-rose-500/30 bg-rose-500/5" : 
            isWarn ? "border-amber-500/30 bg-amber-500/5" : 
            "border-border/50 bg-muted/10"
        )}>
            <div className="flex justify-between items-start mb-2">
                <Icon className={cn(
                    "w-4 h-4",
                    isDanger ? "text-rose-500" : 
                    isWarn ? "text-amber-500" : 
                    "text-muted-foreground"
                )} />
                <span className={cn(
                    "text-xl font-bold font-mono tracking-tight leading-none",
                    isDanger ? "text-rose-500" : 
                    isWarn ? "text-amber-500" : 
                    "text-foreground"
                )}>
                    {value}
                </span>
            </div>
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
        </Card>
    );
}
