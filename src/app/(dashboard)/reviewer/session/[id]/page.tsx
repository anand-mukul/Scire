'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { TranscriptSpeaker } from '@/types/backend';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { VivaSession, GradingDetail, ReviewStatus } from '@/types/backend';
// import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';

import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { cn } from '@/lib/utils';
import { PageHeader } from '@/components/dashboard/page-header';

export default function ReviewSessionPage() {
    const params = useParams();
    const router = useRouter();
    const queryClient = useQueryClient();
    const sessionId = params.id as string;

    // Fetch Session Data
    const { data: session, isLoading: sessionLoading } = useQuery<VivaSession>({
        queryKey: ['session', sessionId],
        queryFn: () => api.sessions.getStatus(sessionId),
    });

    // Fetch Grading Details
    const { data: gradingDetails, isLoading: gradingLoading } = useQuery<GradingDetail[]>({
        queryKey: ['grading', sessionId],
        queryFn: () => api.grading.getDetails(sessionId),
        enabled: !!sessionId,
    });

    // Mutation for Submitting Review
    const reviewMutation = useMutation({
        mutationFn: (data: { status: string; notes?: string; final_score_override?: number }) =>
            api.grading.submitReview(sessionId, data),
        onSuccess: () => {
            toast.success('Review submitted successfully');
            queryClient.invalidateQueries({ queryKey: ['session', sessionId] });
            router.push('/reviewer');
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to submit review');
        }
    });

    const [notes, setNotes] = React.useState('');
    const [overrideScore, setOverrideScore] = React.useState<string>('');

    if (sessionLoading || gradingLoading) {
        return (
            <div className="flex items-center justify-center py-32 text-muted-foreground">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!session) {
        return <div className="flex items-center justify-center py-32 text-muted-foreground">Session not found</div>;
    }

    const handleApprove = () => {
        reviewMutation.mutate({
            status: ReviewStatus.APPROVED,
            notes: notes || 'Approved by reviewer',
            final_score_override: overrideScore ? parseFloat(overrideScore) : undefined
        });
    };

    const handleReject = () => {
        reviewMutation.mutate({
            status: ReviewStatus.REJECTED,
            notes: notes || 'Rejected by reviewer',
        });
    };

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            {/* Header */}
            {/* Header */}
            <PageHeader
                title="Session Review"
                description={`${session.student?.full_name} • ${session.exam?.title} • ${formatToLocalDateTime(session.created_at)}`}
                backButton={true}
                actions={
                    <div className="flex items-center gap-6">
                        <div className="text-right hidden sm:block">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Current Score</div>
                            <div className="text-2xl font-bold text-foreground">
                                {session.final_score?.toFixed(1) || '0.0'}%
                            </div>
                        </div>
                        <Badge variant={session.integrity_flag ? 'destructive' : 'secondary'} className="capitalize h-8 px-3 text-sm">
                            {session.integrity_flag ? 'Integrity Flag' : 'Clean Session'}
                        </Badge>
                    </div>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Grading Breakdown */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-card border-border backdrop-blur-sm">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-muted-foreground" />
                                Grading Breakdown
                            </CardTitle>
                            <CardDescription>AI evaluation per rubric criterion.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Tabs defaultValue="grading" className="w-full">
                                <TabsList className="bg-muted border border-border p-1 mb-6">
                                    <TabsTrigger value="grading" className="data-[state=active]:bg-background shadow-sm">Grading Breakdown</TabsTrigger>
                                    <TabsTrigger value="transcript" className="data-[state=active]:bg-background shadow-sm">Transcript</TabsTrigger>
                                </TabsList>

                                <TabsContent value="grading">
                                    <Accordion type="single" collapsible className="w-full">
                                        {gradingDetails?.map((detail) => (
                                            <AccordionItem key={detail.id} value={detail.id} className="border-border">
                                                <AccordionTrigger className="hover:no-underline">
                                                    <div className="flex items-center justify-between w-full pr-4">
                                                        <span className="text-sm font-medium text-foreground">
                                                            Rubric ID: {detail.rubric_id.slice(0, 8)}...
                                                        </span>
                                                        <div className="flex items-center gap-3">
                                                            <span className="text-xs text-muted-foreground">
                                                                Score: {detail.score_awarded.toFixed(1)}
                                                            </span>
                                                            {detail.passed ? (
                                                                <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border-0">Pass</Badge>
                                                            ) : (
                                                                <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0">Fail</Badge>
                                                            )}
                                                        </div>
                                                    </div>
                                                </AccordionTrigger>
                                                <AccordionContent className="text-muted-foreground space-y-2 pt-2">
                                                    <div className="p-3 rounded-lg bg-muted/50 border border-border text-sm">
                                                        <span className="font-semibold text-foreground">Reasoning: </span>
                                                        {detail.ai_reasoning}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        ))}
                                    </Accordion>
                                </TabsContent>

                                <TabsContent value="transcript" className="space-y-4">
                                    {session.transcripts && session.transcripts.length > 0 ? (
                                        <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                            {session.transcripts
                                                .sort((a, b) => a.turn_index - b.turn_index)
                                                .map((turn) => (
                                                    <div key={turn.id} className={`flex gap-4 ${turn.speaker === TranscriptSpeaker.STUDENT ? 'flex-row-reverse' : ''}`}>
                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${turn.speaker === TranscriptSpeaker.AI ? 'bg-muted text-muted-foreground border border-border' : 'bg-muted text-foreground border border-border'}`}>
                                                            {turn.speaker === TranscriptSpeaker.AI ? 'AI' : 'U'}
                                                        </div>
                                                        <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${turn.speaker === TranscriptSpeaker.AI ? 'bg-muted border border-border rounded-tl-none' : 'bg-muted/50 border border-border text-foreground rounded-tr-none'}`}>
                                                            <p>{turn.text_content}</p>
                                                            <div className="mt-2 text-[10px] opacity-50 flex items-center gap-2">
                                                                <span>{new Date(turn.created_at).toLocaleTimeString()}</span>
                                                                {turn.latency_ms && <span>• {turn.latency_ms}ms</span>}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-12 text-muted-foreground flex flex-col items-center">
                                            <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                                            <p>No transcript data available for this session.</p>
                                        </div>
                                    )}
                                </TabsContent>
                            </Tabs>

                            {(!gradingDetails || gradingDetails.length === 0) && (
                                <div className="text-center py-8 text-muted-foreground italic">
                                    No grading details available.
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Review Controls */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="bg-card border-border backdrop-blur-sm sticky top-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-foreground" />
                                Review Decision
                            </CardTitle>
                            <CardDescription>Override score or validate status.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="score">Override Score (0-100)</Label>
                                <Input
                                    id="score"
                                    type="number"
                                    placeholder={session.final_score?.toString() || "0"}
                                    value={overrideScore}
                                    onChange={(e) => setOverrideScore(e.target.value)}
                                    className="bg-muted border-border"
                                />
                                <p className="text-xs text-muted-foreground">Leave empty to keep AI score.</p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notes">Review Notes</Label>
                                <Textarea
                                    id="notes"
                                    placeholder="Add internal notes for this review..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="bg-muted border-border min-h-[100px]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3 pt-4">
                                <Button
                                    onClick={handleReject}
                                    variant="outline"
                                    className="border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                    disabled={reviewMutation.isPending}
                                >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={handleApprove}
                                    disabled={reviewMutation.isPending}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Approve
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
