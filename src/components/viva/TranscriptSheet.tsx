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
import { TranscriptItem } from '@/lib/store/session-store';
import { TranscriptSpeaker } from '@/types/backend';

interface TranscriptSheetProps {
    transcripts: TranscriptItem[];
    className?: string;
}

export const TranscriptSheet: React.FC<TranscriptSheetProps> = ({ transcripts, className }) => {
    return (
        <Sheet>
            <SheetTrigger asChild>
                <button className={`${className} flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors text-sm text-neutral-400 hover:text-white`}>
                    <MessageCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Transcripts</span>
                    {transcripts.length > 0 && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-500/20 text-[10px] font-medium text-blue-400">
                            {transcripts.length}
                        </span>
                    )}
                </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[400px] sm:w-[540px] bg-neutral-900 border-l border-white/10 p-0 flex flex-col" aria-describedby={undefined}>
                <SheetHeader className="p-6 border-b border-white/5 bg-black/20">
                    <SheetTitle className="text-white font-mono flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-blue-500" />
                        Session Transcript
                    </SheetTitle>
                </SheetHeader>

                <ScrollArea className="flex-1 p-6 h-full overflow-y-auto">
                    <div className="space-y-6 pb-20">
                        {transcripts.length === 0 ? (
                            <div className="text-center text-neutral-500 py-20 flex flex-col items-center">
                                <div className="p-4 rounded-full bg-white/5 mb-4">
                                    <MessageCircle className="w-8 h-8 opacity-20" />
                                </div>
                                <p>No conversation yet.</p>
                                <p className="text-xs mt-2">Speak clearly to start the exam.</p>
                            </div>
                        ) : (
                            transcripts.map((msg, idx) => (
                                <div key={idx} className={`flex gap-4 ${msg.speaker === TranscriptSpeaker.STUDENT ? 'flex-row-reverse' : ''}`}>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 border border-white/5 ${msg.speaker === TranscriptSpeaker.ASSISTANT
                                        ? 'bg-blue-500/10 text-blue-400'
                                        : 'bg-emerald-500/10 text-emerald-400'
                                        }`}>
                                        {msg.speaker === TranscriptSpeaker.ASSISTANT ? <Bot size={16} /> : <User size={16} />}
                                    </div>
                                    <div className={`flex flex-col gap-1 max-w-[85%] ${msg.speaker === TranscriptSpeaker.STUDENT ? 'items-end' : 'items-start'}`}>
                                        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.speaker === TranscriptSpeaker.ASSISTANT
                                            ? 'bg-white/5 text-neutral-200 rounded-tl-none border border-white/5'
                                            : 'bg-emerald-600/20 text-emerald-100 rounded-tr-none border border-emerald-500/20'
                                            }`}>
                                            {msg.text}
                                        </div>
                                        <span className="text-[10px] text-neutral-600 px-1 font-mono">
                                            {msg.timestamp
                                                ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                : '—'}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    );
};
