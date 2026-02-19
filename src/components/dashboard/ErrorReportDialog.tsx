'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Bug, CheckCircle2, Loader2, AlertTriangle, Send } from 'lucide-react';
import { api } from '@/lib/network/api';
import { cn } from '@/lib/utils';

type Urgency = 'low' | 'medium' | 'high' | 'critical';

interface ErrorReportDialogProps {
    error: Error & { digest?: string };
    children?: React.ReactNode;
}

const urgencyConfig: Record<Urgency, { label: string; color: string; description: string }> = {
    low: {
        label: 'Low',
        color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 hover:bg-blue-500/20',
        description: 'Minor issue, not blocking',
    },
    medium: {
        label: 'Medium',
        color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 hover:bg-amber-500/20',
        description: 'Affects workflow',
    },
    high: {
        label: 'High',
        color: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/20',
        description: 'Blocking my work',
    },
    critical: {
        label: 'Critical',
        color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20 hover:bg-red-500/20',
        description: 'System is down',
    },
};

export function ErrorReportDialog({ error, children }: ErrorReportDialogProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [description, setDescription] = useState('');
    const [steps, setSteps] = useState('');
    const [urgency, setUrgency] = useState<Urgency>('medium');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [resultMessage, setResultMessage] = useState('');

    const getBrowserInfo = () => ({
        browser: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language,
        screen: `${window.screen.width}x${window.screen.height}`,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        timestamp: new Date().toISOString(),
    });

    const handleSubmit = async () => {
        setStatus('submitting');
        try {
            const result = await api.errorReports.submit({
                error_message: error.message,
                stack_trace: error.stack,
                url: typeof window !== 'undefined' ? window.location.href : undefined,
                user_description: description || undefined,
                steps_to_reproduce: steps || undefined,
                urgency,
                browser_info: getBrowserInfo(),
            });
            setStatus('success');
            setResultMessage(result.message);

            // Auto-close after 3 seconds on success
            setTimeout(() => {
                setIsOpen(false);
                // Reset form
                setTimeout(() => {
                    setStatus('idle');
                    setDescription('');
                    setSteps('');
                    setUrgency('medium');
                    setResultMessage('');
                }, 300);
            }, 2500);
        } catch (err) {
            setStatus('error');
            setResultMessage(
                err instanceof Error ? err.message : 'Failed to submit report. Please try again.'
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children || (
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/30 text-destructive dark:bg-destructive/10 dark:hover:bg-destructive/20 transition-all shadow-sm"
                    >
                        <Bug className="h-4 w-4" />
                        Report This Error
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg border-border/40 bg-card/95 dark:bg-card/90 backdrop-blur-xl shadow-2xl">
                {status === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-4">
                        <div className="p-3 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/20">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div className="text-center space-y-1.5">
                            <h3 className="text-lg font-semibold text-foreground">Report Submitted</h3>
                            <p className="text-sm text-muted-foreground/80 max-w-xs">
                                {resultMessage}
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <DialogHeader className="space-y-1.5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-destructive/10 dark:bg-destructive/20 border border-destructive/20">
                                    <Bug className="h-4 w-4 text-destructive" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-semibold tracking-tight">
                                        Report an Error
                                    </DialogTitle>
                                    <DialogDescription className="text-muted-foreground/80 text-sm">
                                        Help us fix this issue. Our engineering team will be notified immediately.
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="space-y-5 py-2">
                            {/* Auto-captured error */}
                            <div className="space-y-1.5">
                                <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                                    Detected Error
                                </Label>
                                <div className="p-3 rounded-lg bg-destructive/5 dark:bg-destructive/10 border border-destructive/15 dark:border-destructive/20">
                                    <p className="text-sm font-mono text-destructive dark:text-destructive break-all leading-relaxed">
                                        {error.message.length > 200
                                            ? `${error.message.slice(0, 200)}...`
                                            : error.message}
                                    </p>
                                </div>
                            </div>

                            {/* Urgency selector */}
                            <div className="space-y-2">
                                <Label className="text-xs font-medium text-muted-foreground/70 uppercase tracking-wider">
                                    How urgent is this?
                                </Label>
                                <div className="flex flex-wrap gap-2">
                                    {(Object.entries(urgencyConfig) as [Urgency, typeof urgencyConfig.low][]).map(
                                        ([key, config]) => (
                                            <Badge
                                                key={key}
                                                variant="outline"
                                                className={cn(
                                                    'cursor-pointer transition-all border px-3 py-1.5 text-xs font-medium',
                                                    urgency === key
                                                        ? config.color + ' ring-1 ring-offset-1 ring-offset-background'
                                                        : 'bg-muted/20 text-muted-foreground border-border/40 hover:bg-muted/40'
                                                )}
                                                onClick={() => setUrgency(key)}
                                            >
                                                {config.label}
                                            </Badge>
                                        )
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground/60">
                                    {urgencyConfig[urgency].description}
                                </p>
                            </div>

                            {/* User description */}
                            <div className="space-y-1.5">
                                <Label htmlFor="error-description" className="text-foreground/80 text-sm">
                                    What were you trying to do?
                                </Label>
                                <Textarea
                                    id="error-description"
                                    placeholder="e.g., I was trying to open an exam details page when this error appeared..."
                                    className="min-h-[80px] resize-none bg-muted/30 border-border/50 focus:bg-background dark:focus:bg-card focus:border-primary/50 transition-all shadow-sm text-sm"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    disabled={status === 'submitting'}
                                />
                            </div>

                            {/* Steps to reproduce */}
                            <div className="space-y-1.5">
                                <Label htmlFor="error-steps" className="text-foreground/80 text-sm">
                                    Steps to reproduce{' '}
                                    <span className="text-muted-foreground/50 font-normal">(optional)</span>
                                </Label>
                                <Textarea
                                    id="error-steps"
                                    placeholder={"1. Go to...\n2. Click on...\n3. Error appears"}
                                    className="min-h-[80px] resize-none bg-muted/30 border-border/50 focus:bg-background dark:focus:bg-card focus:border-primary/50 transition-all shadow-sm text-sm font-mono"
                                    value={steps}
                                    onChange={(e) => setSteps(e.target.value)}
                                    disabled={status === 'submitting'}
                                />
                            </div>

                            {/* Error message for submission failure */}
                            {status === 'error' && (
                                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 flex items-start gap-2">
                                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-destructive">{resultMessage}</p>
                                </div>
                            )}
                        </div>

                        <DialogFooter className="gap-3">
                            <Button
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={status === 'submitting'}
                                className="border-border/50 hover:bg-muted/50 dark:hover:bg-muted/30"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={status === 'submitting'}
                                className="gap-2 shadow-sm hover:shadow-md transition-all"
                            >
                                {status === 'submitting' ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4" />
                                )}
                                {status === 'submitting' ? 'Submitting...' : 'Send Report'}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
