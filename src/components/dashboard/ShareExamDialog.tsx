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
    Clock,
    Monitor,
    ShieldAlert
} from 'lucide-react';
import { formatToLocalDateTimeWithTZ } from '@/lib/date-utils';

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

    const shareMessage = [
        `📢 OFFICIAL EXAMINATION NOTICE`,
        `----------------------------------------`,
        `Subject: ${examTitle}`,
        ``,
        `You are invited to take the following assessment. Please ensure you are prepared with a compatible desktop/laptop environment.`,
        ``,
        `📝 EXAM DETAILS`,
        `• Code: ${examCode}`,
        `• Schedule: ${startStr} — ${endStr}`,
        `• Duration: ${durationMinutes || 'N/A'} minutes`,
        ``,
        `🔗 ACCESS LINK`,
        `${joinLink}`,
        ``,
        `⚠️ REQUIREMENTS`,
        `• Desktop or Laptop Computer (Mobile devices not supported)`,
        `• Working Camera and Microphone`,
        `• Stable Internet Connection`,
        ``,
        `Please log in 10 minutes before the scheduled start time.`,
    ].join('\n');

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
        const text = encodeURIComponent(shareMessage.replace(/\*/g, ''));
        window.open(`https://wa.me/?text=${text}`, '_blank');
    };

    const handleEmail = () => {
        const subject = encodeURIComponent(`Exam Invitation: ${examTitle}`);
        const body = encodeURIComponent(shareMessage.replace(/\*/g, ''));
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const CopyButton = ({ text, field }: { text: string; field: string }) => (
        <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => handleCopy(text, field)}
        >
            {copiedField === field
                ? <Check className="h-3.5 w-3.5 text-emerald-500" />
                : <Copy className="h-3.5 w-3.5 text-muted-foreground" />
            }
        </Button>
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>

            <DialogContent className="bg-card w-[95vw] sm:max-w-lg overflow-y-auto max-h-[90vh] border-border text-card-foreground p-4 sm:p-6 rounded-xl sm:rounded-2xl gap-4">
                <DialogHeader className="space-y-2 text-left">
                    <DialogTitle className="flex items-center gap-2 text-lg">
                        <Send className="h-5 w-5 text-primary shrink-0" />
                        Share Exam
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-sm">
                        Share <span className="text-foreground font-medium break-all">{examTitle}</span> with students
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-2">
                    {/* Exam Code */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Hash className="h-3 w-3" /> Exam Code
                        </Label>
                        <div className="flex items-center gap-2 p-3 bg-background/50 border border-border rounded-lg">
                            <code className="flex-1 text-xl font-mono font-bold tracking-[0.2em] text-foreground">
                                {examCode}
                            </code>
                            <CopyButton text={examCode} field="code" />
                        </div>
                    </div>

                    {/* Join Link */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                            <Link2 className="h-3 w-3" /> Join Link
                        </Label>
                        <div className="flex items-center gap-2 p-3 bg-background/50 border border-border rounded-lg">
                            <Input
                                readOnly
                                value={joinLink}
                                className="border-0 bg-transparent p-0 h-auto text-sm font-mono text-muted-foreground focus-visible:ring-0"
                            />
                            <CopyButton text={joinLink} field="link" />
                        </div>
                    </div>

                    {/* Share Message Preview */}
                    <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                            Message Preview
                        </Label>
                        <Textarea
                            readOnly
                            value={shareMessage.replace(/\*/g, '')}
                            className="bg-background/50 border-border text-sm text-muted-foreground resize-none font-mono leading-relaxed"
                            rows={6}
                        />
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs text-muted-foreground hover:text-foreground"
                                onClick={() => handleCopy(shareMessage.replace(/\*/g, ''), 'message')}
                            >
                                {copiedField === 'message' ? (
                                    <><Check className="h-3 w-3 mr-1 text-emerald-500" /> Copied</>
                                ) : (
                                    <><Copy className="h-3 w-3 mr-1" /> Copy Message</>
                                )}
                            </Button>
                        </div>
                    </div>

                    {/* Quick Share Actions */}
                    <div className="flex gap-3 pt-2 border-t border-border">
                        <Button
                            variant="outline"
                            className="flex-1 gap-2 border-border hover:bg-emerald-500/10 hover:text-emerald-500 hover:border-emerald-500/30 transition-all"
                            onClick={handleWhatsApp}
                        >
                            <MessageCircle className="h-4 w-4" />
                            WhatsApp
                            <ExternalLink className="h-3 w-3 opacity-50" />
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1 gap-2 border-border hover:bg-blue-500/10 hover:text-blue-500 hover:border-blue-500/30 transition-all"
                            onClick={handleEmail}
                        >
                            <Mail className="h-4 w-4" />
                            Email
                            <ExternalLink className="h-3 w-3 opacity-50" />
                        </Button>
                    </div>

                    {/* Info badge */}
                    <div className="flex items-center justify-center">
                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border font-normal">
                            Students must use a desktop/laptop with camera & mic
                        </Badge>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
