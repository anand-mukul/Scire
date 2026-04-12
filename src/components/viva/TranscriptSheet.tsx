'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Bot, User } from 'lucide-react';
import { TranscriptItem, useSessionStore } from '@/lib/store/session-store';
import { TranscriptSpeaker } from '@/types/backend';

interface TranscriptSheetProps {
    transcripts: TranscriptItem[];
    className?: string;
}

export const TranscriptSheet: React.FC<TranscriptSheetProps> = ({ transcripts, className }) => {
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const currentPartial = useSessionStore((state) => state.currentPartialTranscript);

    // Auto-scroll to bottom when new transcripts arrive
    React.useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [transcripts.length, currentPartial]);

    // Group transcripts into Q&A pairs for visual separation
    const groupedTranscripts = React.useMemo(() => {
        const groups: { items: TranscriptItem[]; questionIndex: number }[] = [];
        let currentGroup: TranscriptItem[] = [];
        let qIndex = 0;

        transcripts.forEach((t) => {
            if (t.speaker === TranscriptSpeaker.ASSISTANT && currentGroup.length > 0) {
                // Start a new group when assistant speaks (new question)
                groups.push({ items: currentGroup, questionIndex: qIndex });
                currentGroup = [t];
                qIndex++;
            } else {
                currentGroup.push(t);
            }
        });

        if (currentGroup.length > 0) {
            groups.push({ items: currentGroup, questionIndex: qIndex });
        }

        return groups;
    }, [transcripts]);

    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className={`${className} flex items-center gap-2 px-3 py-1.5 rounded-full bg-foreground/5 hover:bg-foreground/10 border border-foreground/10 transition-all text-sm text-muted-foreground hover:text-foreground`}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Transcript</span>
                    {transcripts.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-mono font-medium text-primary">
                            {transcripts.filter(t => t.speaker === TranscriptSpeaker.ASSISTANT).length}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[480px] bg-card border-l border-border p-0 flex flex-col" aria-describedby={undefined}>
                <SheetHeader className="p-5 border-b border-border">
                    <SheetTitle className="text-foreground text-sm font-medium flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-primary" />
                        Session Transcript
                        <span className="ml-auto text-xs text-muted-foreground font-mono">
                            {transcripts.filter(t => t.speaker === TranscriptSpeaker.ASSISTANT).length} exchanges
                        </span>
                    </SheetTitle>
                </SheetHeader>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5">
                    <div className="space-y-1 pb-20">
                        {transcripts.length === 0 ? (
                            <div className="text-center text-muted-foreground py-20 flex flex-col items-center">
                                <div className="p-4 rounded-full bg-muted/50 mb-4">
                                    <MessageCircle className="w-6 h-6 opacity-30" />
                                </div>
                                <p className="text-sm">No conversation yet.</p>
                                <p className="text-xs mt-1 text-muted-foreground/60">The transcript will appear here as you speak.</p>
                            </div>
                        ) : (
                            <>
                                {groupedTranscripts.map((group, groupIdx) => (
                                    <div key={groupIdx} className="space-y-3">
                                        {/* Separator between Q&A groups */}
                                        {groupIdx > 0 && (
                                            <div className="flex items-center gap-3 py-2">
                                                <div className="flex-1 h-px bg-border" />
                                                <span className="text-[10px] text-muted-foreground/50 font-mono uppercase tracking-wider">Q{group.questionIndex}</span>
                                                <div className="flex-1 h-px bg-border" />
                                            </div>
                                        )}

                                        {group.items.map((msg, idx) => (
                                            <div
                                                key={`${groupIdx}-${idx}`}
                                                className={`flex gap-3 animate-in fade-in duration-200 ${msg.speaker === TranscriptSpeaker.STUDENT ? 'flex-row-reverse' : ''}`}
                                            >
                                                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${msg.speaker === TranscriptSpeaker.ASSISTANT
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-emerald-500/10 text-emerald-500'
                                                    }`}>
                                                    {msg.speaker === TranscriptSpeaker.ASSISTANT ? <Bot size={14} /> : <User size={14} />}
                                                </div>
                                                <div className={`flex flex-col gap-0.5 max-w-[80%] ${msg.speaker === TranscriptSpeaker.STUDENT ? 'items-end' : 'items-start'}`}>
                                                    <div className={`px-3.5 py-2 rounded-2xl text-sm leading-relaxed ${msg.speaker === TranscriptSpeaker.ASSISTANT
                                                            ? 'bg-muted/60 text-foreground rounded-tl-sm'
                                                            : 'bg-primary/10 text-foreground rounded-tr-sm'
                                                        }`}>
                                                        {msg.text}
                                                    </div>
                                                    <span className="text-[10px] text-muted-foreground/40 px-1 font-mono">
                                                        {msg.timestamp
                                                            ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                            : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))}

                                {/* Live partial transcript indicator */}
                                {currentPartial && (
                                    <div className="flex gap-3 animate-in fade-in duration-200">
                                        <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-emerald-500/10 text-emerald-500">
                                            <User size={14} />
                                        </div>
                                        <div className="px-3.5 py-2 rounded-2xl rounded-tr-sm bg-primary/5 text-foreground/70 text-sm border border-primary/10 border-dashed">
                                            {currentPartial}
                                            <span className="inline-block w-0.5 h-4 bg-primary ml-1 animate-pulse align-middle rounded-full" />
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
