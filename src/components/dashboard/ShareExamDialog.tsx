'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from 'sonner';
import {
    Copy,
    Check,
    Mail,
    MessageCircle,
    Link2,
    Hash,
    Send,
    ExternalLink,
    Smartphone,
    Globe
} from 'lucide-react';
import { formatToLocalDateTimeWithTZ } from '@/lib/date-utils';
import { Separator } from '@/components/ui/separator';

interface ShareExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examTitle: string;
    examCode: string;
    startTime?: string | null;
    endTime?: string | null;
    durationMinutes?: number;
}

export default function ShareExamDialog({
    open,
    onOpenChange,
    examTitle,
    examCode,
    startTime,
    endTime,
    durationMinutes,
}: ShareExamDialogProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const joinLink = typeof window !== 'undefined'
        ? `${window.location.origin}/student/join?code=${examCode}`
        : '';

    const startStr = startTime ? formatToLocalDateTimeWithTZ(startTime) : 'Flexible';
    const endStr = endTime ? formatToLocalDateTimeWithTZ(endTime) : 'Flexible';

    const shareMessage = `You are invited to take the exam: ${examTitle}
    
Code: ${examCode}
Link: ${joinLink}
Schedule: ${startStr} - ${endStr}
Duration: ${durationMinutes || 'N/A'} mins

Requirements: Desktop/Laptop, Camera, Mic.`;

    const handleCopy = async (text: string, field: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedField(field);
            toast.success('Copied to clipboard');
            setTimeout(() => setCopiedField(null), 2000);
        } catch {
            toast.error('Failed to copy');
        }
    };

    const handleWhatsApp = () => {
        const text = encodeURIComponent(shareMessage);
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Exam Invitation: ${examTitle}`);
        const body = encodeURIComponent(shareMessage);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const CopyButton = ({ text, field, className }: { text: string; field: string, className?: string }) => (
        <Button
            variant="ghost"
            size="icon"
            className={`h-8 w-8 hover:bg-background/80 transition-all ${className}`}
            onClick={() => handleCopy(text, field)}
        >
            {copiedField === field
                ? <Check className="h-3.5 w-3.5 text-emerald-500 scale-100 transition-all" />
                : <Copy className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground scale-100 transition-all" />
            }
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 text-card-foreground p-0 gap-0 w-[95vw] sm:max-w-md rounded-2xl overflow-hidden shadow-2xl">

                <div className="p-6 pb-2 space-y-1">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                            Share Exam
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground leading-normal">
                            Invite candidates to <span className="font-medium text-foreground">{examTitle}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="link" className="w-full">
                    <div className="px-6 pb-2">
                        <TabsList className="grid w-full grid-cols-2 h-9 p-1 bg-muted/50 rounded-lg">
                            <TabsTrigger value="link" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Link & Code</TabsTrigger>
                            <TabsTrigger value="invite" className="text-xs rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Invitation Preview</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 pt-2 space-y-6">
                        <TabsContent value="link" className="space-y-5 m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Exam Code Section */}
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pl-1">Exam Code</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Hash className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <Input
                                        readOnly
                                        value={examCode}
                                        className="pl-9 pr-12 font-mono text-lg font-bold tracking-widest bg-secondary/30 border-transparent hover:border-border/60 focus:border-primary/50 transition-all h-12 shadow-sm"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center">
                                        <CopyButton text={examCode} field="code" />
                                    </div>
                                </div>
                            </div>

                            {/* Join Link Section */}
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pl-1">Direct Link</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                        <Link2 className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <Input
                                        readOnly
                                        value={joinLink}
                                        className="pl-9 pr-12 font-mono text-sm text-muted-foreground bg-secondary/30 border-transparent hover:border-border/60 focus:border-primary/50 transition-all h-11 text-ellipsis shadow-sm"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center">
                                        <CopyButton text={joinLink} field="link" />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleEmail} className="w-full justify-start gap-2 h-10 border-border/60 hover:bg-blue-500/5 hover:text-blue-500 hover:border-blue-500/20 transition-all group">
                                    <div className="p-1.5 rounded-md bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium">Email Invite</span>
                                </Button>
                                <Button variant="outline" onClick={handleWhatsApp} className="w-full justify-start gap-2 h-10 border-border/60 hover:bg-emerald-500/5 hover:text-emerald-500 hover:border-emerald-500/20 transition-all group">
                                    <div className="p-1.5 rounded-md bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
                                        <MessageCircle className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium">WhatsApp</span>
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="invite" className="m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="relative rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                                <div className="absolute top-3 right-3 z-10">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        className="h-7 text-xs gap-1.5 shadow-sm bg-background/80 backdrop-blur hover:bg-background"
                                        onClick={() => handleCopy(shareMessage, 'message')}
                                    >
                                        {copiedField === 'message' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                        {copiedField === 'message' ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <Textarea
                                    readOnly
                                    value={shareMessage}
                                    className="min-h-[280px] w-full resize-none border-0 bg-transparent p-4 font-mono text-xs leading-relaxed focus-visible:ring-0 text-muted-foreground"
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>

                <div className="bg-muted/30 p-3 border-t border-border/50 text-center">
                    <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1.5">
                        <Smartphone className="h-3 w-3 opacity-70" />
                        Mobile devices are not supported for candidates.
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
