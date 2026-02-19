'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetFooter,
} from "@/components/ui/sheet";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
    Clock,
    User,
    Building2,
    Globe,
    ExternalLink,
    Copy,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { ErrorReport } from './types';
import { STATUS_CONFIG, URGENCY_STYLES } from './constants';

interface ErrorDetailsSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    report: ErrorReport | null;
    onStatusUpdate: (id: string, newStatus: string) => void;
}

function formatUserAgent(uaString?: string) {
    if (!uaString) return 'Unknown';

    let browser = 'Unknown Browser';
    if (uaString.includes('Firefox')) browser = 'Firefox';
    else if (uaString.includes('Chrome')) browser = 'Chrome';
    else if (uaString.includes('Safari')) browser = 'Safari';
    else if (uaString.includes('Edge')) browser = 'Edge';
    else if (uaString.includes('Opera')) browser = 'Opera';

    let os = 'Unknown OS';
    if (uaString.includes('Windows')) os = 'Windows';
    else if (uaString.includes('Mac')) os = 'macOS';
    else if (uaString.includes('Linux')) os = 'Linux';
    else if (uaString.includes('Android')) os = 'Android';
    else if (uaString.includes('iPhone') || uaString.includes('iPad')) os = 'iOS';

    return `${browser} on ${os}`;
}

export function ErrorDetailsSheet({ open, onOpenChange, report, onStatusUpdate }: ErrorDetailsSheetProps) {
    const [copiedField, setCopiedField] = React.useState<string | null>(null);

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
        setCopiedField(label);
        setTimeout(() => setCopiedField(null), 2000);
    };

    // Prepare data safely to avoid runtime errors if report is null during closure
    const statusConfig = report ? (STATUS_CONFIG[report.status] || STATUS_CONFIG.new) : STATUS_CONFIG.new;
    const formattedUA = report ? formatUserAgent(report.browser_info?.browser) : '';

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-xl w-full flex flex-col p-0 gap-0 border-l border-border/40 shadow-2xl bg-background/95 backdrop-blur-xl">
                {report ? (
                    <>
                        <SheetHeader className="p-6 border-b bg-muted/10 sticky top-0 z-10 backdrop-blur-md">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <Badge variant="secondary" className={cn("gap-1.5 px-2.5 py-0.5 font-medium transition-colors cursor-default", statusConfig.color, statusConfig.bg, statusConfig.ring, "ring-1 inset-0 border-0")}>
                                        {statusConfig.icon && <statusConfig.icon className="h-3.5 w-3.5" />}
                                        {statusConfig.label}
                                    </Badge>
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono bg-muted/50 px-2 py-1 rounded cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                                                    onClick={() => copyToClipboard(report.id, 'ID')}
                                                >
                                                    <span>{report.id.slice(0, 8)}</span>
                                                    {copiedField === 'ID' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3 opacity-50" />}
                                                </div>
                                            </TooltipTrigger>
                                            <TooltipContent>Copy ID: {report.id}</TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 bg-muted/30 px-2 py-1 rounded border border-border/20">
                                    <Clock className="h-3.5 w-3.5" />
                                    {new Date(report.created_at).toLocaleString(undefined, {
                                        month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit'
                                    })}
                                </div>
                            </div>
                            <SheetTitle className="text-lg font-semibold leading-snug break-words tracking-tight text-foreground/90 select-text">
                                {report.error_message}
                            </SheetTitle>
                        </SheetHeader>

                        <ScrollArea className="flex-1 h-full">
                            <div className="p-6 space-y-8 pb-10">
                                {/* Key Info Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {/* Reporter */}
                                    <div className="space-y-2 p-4 rounded-xl border bg-card/40 hover:bg-card/60 transition-colors group">
                                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-2">
                                            <User className="h-3 w-3" /> Reporter
                                        </h4>
                                        <div>
                                            <div className="text-sm font-medium text-foreground">{report.reporter_name || 'Unknown User'}</div>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div
                                                            className="text-xs text-muted-foreground break-all cursor-pointer hover:text-primary transition-colors inline-block mt-0.5"
                                                            onClick={() => copyToClipboard(report.reporter_email || '', 'Email')}
                                                        >
                                                            {report.reporter_email}
                                                        </div>
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        {copiedField === 'Email' ? 'Copied!' : 'Click to copy email'}
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                    </div>

                                    {/* Tenant */}
                                    <div className="space-y-2 p-4 rounded-xl border bg-card/40 hover:bg-card/60 transition-colors group">
                                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-2">
                                            <Building2 className="h-3 w-3" /> Tenant
                                        </h4>
                                        <div className="text-sm font-medium text-foreground break-words flex items-center gap-2">
                                            {report.tenant_name || 'Global'}
                                        </div>
                                    </div>

                                    {/* Environment & Context */}
                                    <div className="sm:col-span-2 space-y-2 p-4 rounded-xl border bg-card/40 hover:bg-card/60 transition-colors group">
                                        <h4 className="text-[10px] uppercase font-bold text-muted-foreground/70 tracking-wider flex items-center gap-2">
                                            <Globe className="h-3 w-3" /> Context
                                        </h4>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-1">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">BROWSER / OS</span>
                                                <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                                                    {formattedUA}
                                                </div>
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <span className="text-[11px] text-muted-foreground break-all leading-tight opacity-60 truncate cursor-help max-w-full block">
                                                                {report.browser_info?.browser}
                                                            </span>
                                                        </TooltipTrigger>
                                                        <TooltipContent className="max-w-[300px] break-all">
                                                            {report.browser_info?.browser}
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            </div>
                                            <div className="flex flex-col gap-1 overflow-hidden">
                                                <span className="text-[10px] text-muted-foreground/60 font-medium">PAGE URL</span>
                                                <div className="flex items-center gap-1.5 overflow-hidden">
                                                    <a
                                                        href={report.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-primary hover:underline hover:text-primary/80 truncate flex-1 transition-colors"
                                                    >
                                                        {report.url ? new URL(report.url).pathname : 'N/A'}
                                                    </a>
                                                    <ExternalLink className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <Separator className="bg-border/40" />

                                {/* User Description - only show if present */}
                                {report.user_description && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                            User Description
                                        </h4>
                                        <div className="relative group">
                                            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 rounded-lg blur opacity-0 group-hover:opacity-100 transition duration-500"></div>
                                            <div className="relative p-4 bg-muted/20 rounded-lg text-sm italic border border-primary/5 text-muted-foreground leading-relaxed selection:bg-indigo-500/10">
                                                &quot;{report.user_description}&quot;
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Steps to Reproduce - only show if present */}
                                {report.steps_to_reproduce && (
                                    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-3 duration-500 delay-75">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                            Steps to Reproduce
                                        </h4>
                                        <div className="bg-card/50 border rounded-lg overflow-hidden shadow-sm">
                                            <pre className="p-4 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-x-auto bg-muted/10 selection:bg-amber-500/10">
                                                {report.steps_to_reproduce}
                                            </pre>
                                        </div>
                                    </div>
                                )}

                                {/* Stack Trace */}
                                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" />
                                            Stack Trace
                                        </h4>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => copyToClipboard(report.stack_trace || '', 'Stack trace')}
                                            className="h-6 text-[10px] gap-1.5 hover:bg-muted hover:text-foreground transition-all px-2"
                                        >
                                            {copiedField === 'Stack trace' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                            {copiedField === 'Stack trace' ? 'Copied' : 'Copy Trace'}
                                        </Button>
                                    </div>
                                    <div className="relative rounded-lg border bg-[#0d0d0d] shadow-inner overflow-hidden group ring-1 ring-white/5">
                                        <ScrollArea className="h-[350px] w-full">
                                            <pre className="p-4 text-[11px] font-mono leading-relaxed text-slate-300/90 whitespace-pre-wrap break-all selection:bg-white/10">
                                                {report.stack_trace || 'No stack trace available.'}
                                            </pre>
                                        </ScrollArea>
                                    </div>
                                </div>
                            </div>
                        </ScrollArea>

                        <SheetFooter className="p-4 border-t bg-muted/10 sticky bottom-0 z-10 backdrop-blur-md">
                            <div className="flex w-full gap-3 justify-end items-center">
                                <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">Close</Button>
                                {report.status !== 'resolved' ? (
                                    <Button
                                        onClick={() => onStatusUpdate(report.id, 'resolved')}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20 transition-all font-medium"
                                    >
                                        <Check className="h-4 w-4 mr-2" />
                                        Mark as Resolved
                                    </Button>
                                ) : (
                                    <Button disabled variant="outline" className="opacity-50 cursor-not-allowed border-emerald-500/20 text-emerald-600 bg-emerald-500/5">
                                        <Check className="h-4 w-4 mr-2" />
                                        Resolved
                                    </Button>
                                )}
                            </div>
                        </SheetFooter>
                    </>
                ) : (
                    <div className="h-full w-full" />
                )}
            </SheetContent>
        </Sheet>
    );
}
