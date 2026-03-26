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
    Link2,
    Linkedin,
    Twitter
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

interface ShareCredentialDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examTitle: string;
    credentialLink: string;
}

export default function ShareCredentialDialog({
    open,
    onOpenChange,
    examTitle,
    credentialLink,
}: ShareCredentialDialogProps) {
    const [copiedField, setCopiedField] = useState<string | null>(null);

    const shareMessage = `I just completed the exam: ${examTitle} and earned my official qualification credential!\n\nVerify my result here:\n${credentialLink}`;

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

    const handleLinkedIn = () => {
        const url = encodeURIComponent(credentialLink);
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
    };

    const handleTwitter = () => {
        const text = encodeURIComponent(`I just earned my official credential for ${examTitle}! Verify my result here:`);
        const url = encodeURIComponent(credentialLink);
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
    };
    
    const handleEmail = () => {
        const subject = encodeURIComponent(`My Exam Credential: ${examTitle}`);
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
            <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50 text-card-foreground p-0 gap-0 w-[95vw] sm:max-w-md rounded-2xl shadow-2xl overflow-hidden overflow-y-auto max-h-[90vh]">

                <div className="p-6 pb-2 space-y-1">
                    <DialogHeader className="text-left space-y-1">
                        <DialogTitle className="text-lg font-semibold tracking-tight flex items-center gap-2">
                            Share Credential
                        </DialogTitle>
                        <DialogDescription className="text-sm text-muted-foreground leading-normal break-words">
                            Share your verified result for <span className="font-medium text-foreground">{examTitle}</span>
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <Tabs defaultValue="link" className="w-full min-w-0 flex-1">
                    <div className="px-6 pb-2 w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="link" className="text-xs truncate">Direct Link</TabsTrigger>
                            <TabsTrigger value="social" className="text-xs truncate">Message Preview</TabsTrigger>
                        </TabsList>
                    </div>

                    <div className="p-6 pt-2 space-y-6 w-full">
                        <TabsContent value="link" className="space-y-4 m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-left-4 duration-300 w-full min-w-0">
                            
                            {/* Join Link Section */}
                            <div className="space-y-2 w-full">
                                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pl-1">Public Link</Label>
                                <div className="relative group w-full flex">
                                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none z-10">
                                        <Link2 className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                    <Input
                                        readOnly
                                        value={credentialLink}
                                        className="pl-9 pr-12 font-mono text-sm text-muted-foreground bg-secondary/30 border-transparent hover:border-border/60 focus:border-primary/50 transition-all h-11 shadow-sm w-full min-w-0 truncate"
                                    />
                                    <div className="absolute inset-y-0 right-2 flex items-center z-10">
                                        <CopyButton text={credentialLink} field="link" />
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/40" />

                            <div className="grid grid-cols-2 gap-3 w-full">
                                <Button variant="outline" onClick={handleLinkedIn} className="w-full justify-start gap-2 h-10 border-border/60 hover:bg-[#0A66C2]/10 hover:text-[#0A66C2] hover:border-[#0A66C2]/20 transition-all group overflow-hidden">
                                    <div className="p-1.5 rounded-md bg-[#0A66C2]/10 group-hover:bg-[#0A66C2]/20 transition-colors shrink-0">
                                        <Linkedin className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium truncate">LinkedIn</span>
                                </Button>
                                <Button variant="outline" onClick={handleTwitter} className="w-full justify-start gap-2 h-10 border-border/60 hover:bg-[#1DA1F2]/10 hover:text-[#1DA1F2] hover:border-[#1DA1F2]/20 transition-all group overflow-hidden">
                                    <div className="p-1.5 rounded-md bg-[#1DA1F2]/10 group-hover:bg-[#1DA1F2]/20 transition-colors shrink-0">
                                        <Twitter className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium truncate">Twitter</span>
                                </Button>
                                <Button variant="outline" onClick={handleEmail} className="col-span-2 w-full justify-start gap-2 h-10 border-border/60 hover:bg-foreground/5 hover:border-foreground/20 transition-all group overflow-hidden">
                                    <div className="p-1.5 rounded-md bg-foreground/5 group-hover:bg-foreground/10 transition-colors shrink-0">
                                        <Mail className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="text-xs font-medium truncate">Email</span>
                                </Button>
                            </div>
                        </TabsContent>

                        <TabsContent value="social" className="m-0 focus-visible:ring-0 outline-none animate-in fade-in slide-in-from-right-4 duration-300 w-full min-w-0">
                            <div className="relative rounded-xl border border-border/60 bg-muted/20 overflow-hidden w-full">
                                <div className="absolute top-3 right-3 z-10">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5 shadow-sm bg-background/95 backdrop-blur hover:bg-accent hover:text-accent-foreground z-20"
                                        onClick={() => handleCopy(shareMessage, 'message')}
                                    >
                                        {copiedField === 'message' ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                                        {copiedField === 'message' ? 'Copied' : 'Copy'}
                                    </Button>
                                </div>
                                <Textarea
                                    readOnly
                                    value={shareMessage}
                                    className="min-h-[220px] w-full resize-none border-0 bg-transparent p-4 pr-4 font-mono text-xs leading-relaxed focus-visible:ring-0 text-muted-foreground break-all whitespace-pre-wrap"
                                />
                            </div>
                        </TabsContent>
                    </div>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}
