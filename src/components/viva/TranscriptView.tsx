"use client";

import React, { useEffect, useRef } from 'react';
import { useSessionStore, TranscriptItem } from '@/lib/store/session-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TranscriptSpeaker } from '@/types/backend';

export const TranscriptView = () => {
    const transcripts = useSessionStore(state => state.transcripts);
    const scrollEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll
    useEffect(() => {
        scrollEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);

    return (
        <ScrollArea className="flex-1 px-4 py-2 h-full">
            <div className="flex flex-col space-y-4 pb-4">
                {transcripts.map((msg, idx) => (
                    <TranscriptBubble key={idx} message={msg} />
                ))}
                <div ref={scrollEndRef} />
            </div>
        </ScrollArea>
    );
};

const TranscriptBubble = ({ message }: { message: TranscriptItem }) => {
    const isAssistant = message.speaker === TranscriptSpeaker.AI;

    return (
        <div className={cn(
            "flex w-full mb-2",
            isAssistant ? "justify-start" : "justify-end"
        )}>
            <div className={cn(
                "max-w-[80%] rounded-2xl px-4 py-3 text-sm shadow-sm",
                isAssistant
                    ? "bg-secondary text-secondary-foreground rounded-tl-none"
                    : "bg-primary text-primary-foreground rounded-tr-none",
                !message.is_final && "opacity-70 animate-pulse"
            )}>
                {message.text}
                {!message.is_final && <span className="inline-block w-1 h-3 ml-1 bg-current animate-blink" />}
            </div>
        </div>
    );
};
