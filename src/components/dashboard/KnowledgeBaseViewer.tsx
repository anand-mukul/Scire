import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { PremiumCard } from '@/components/ui/premium-card';
import { CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';
import { Search, Database, FileText, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface KnowledgeBaseViewerProps {
    examId: string;
}

export default function KnowledgeBaseViewer({ examId }: KnowledgeBaseViewerProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const { data: chunks, isLoading, error } = useQuery({
        queryKey: ['knowledge-base', examId],
        queryFn: () => api.exams.getKnowledgeBase(examId),
    });

    const filteredChunks = chunks?.filter((chunk: any) =>
        chunk.content_chunk.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-4" />
                <p>Loading indexed content...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 text-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
                <p>Failed to load knowledge base.</p>
                <p className="text-xs mt-2 opacity-70">{(error as Error).message}</p>
            </div>
        );
    }

    if (!chunks || chunks.length === 0) {
        return (
            <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-lg border-border bg-muted/10">
                <Database className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-lg font-medium">No content indexed yet</p>
                <p className="text-sm">The syllabus needs to be processed. Try re-uploading if this persists.</p>
            </div>
        );
    }

    return (
        <PremiumCard className="bg-card/40 border-border backdrop-blur-md mt-6">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Database className="h-5 w-5 text-primary" />
                        <CardTitle className="text-lg">Indexed Content ({chunks.length} chunks)</CardTitle>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search inside syllabus content..."
                        className="pl-9 bg-card/50 border-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <ScrollArea className="h-[400px] pr-4">
                    {filteredChunks?.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No matching content found.
                        </div>
                    ) : (
                        <Accordion type="single" collapsible className="w-full space-y-2">
                            {filteredChunks?.map((chunk: any, index: number) => (
                                <AccordionItem
                                    key={chunk.id}
                                    value={chunk.id}
                                    className="border border-border rounded-lg px-2 bg-card/30"
                                >
                                    <AccordionTrigger className="hover:no-underline py-3">
                                        <div className="flex items-center gap-3 text-left w-full overflow-hidden">
                                            <Badge variant="outline" className="shrink-0 bg-primary/10 text-primary border-primary/20">
                                                #{index + 1}
                                            </Badge>
                                            <span className="truncate text-sm text-foreground font-mono">
                                                {chunk.content_chunk.slice(0, 60)}...
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-3 pt-1">
                                        <div className="p-3 bg-muted/50 rounded-md text-sm text-muted-foreground font-mono whitespace-pre-wrap leading-relaxed border border-border">
                                            {chunk.content_chunk}
                                        </div>
                                        <div className="flex justify-end mt-2 text-xs text-muted-foreground">
                                            <span>Indexed {formatDistanceToNow(new Date(chunk.created_at))} ago</span>
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    )}
                </ScrollArea>
            </CardContent>
        </PremiumCard>
    );
}
