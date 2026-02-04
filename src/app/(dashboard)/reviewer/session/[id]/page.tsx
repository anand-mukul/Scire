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
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, MessageSquare } from 'lucide-react';
import { VivaSession, GradingDetail } from '@/types/backend';
import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';

import { toast } from 'sonner';

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
            <div className="min-h-screen flex items-center justify-center bg-background text-neutral-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        return <div className="min-h-screen flex items-center justify-center bg-background text-neutral-400">Session not found</div>;
    }

    const handleApprove = () => {
        reviewMutation.mutate({
            status: 'approved',
            notes: notes || 'Approved by reviewer',
            final_score_override: overrideScore ? parseFloat(overrideScore) : undefined
        });
    };

    const handleReject = () => {
        reviewMutation.mutate({
            status: 'rejected',
            notes: notes || 'Rejected by reviewer',
        });
    };

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground p-6 md:p-12">
            <BackgroundBeams className="-z-10 opacity-20" />

            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="text-neutral-400 hover:text-white">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-white tracking-tight">Session Review</h1>
                            <p className="text-neutral-500 text-sm">
                                {session.student?.full_name} • {session.exam?.title} • {new Date(session.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-neutral-500">Current Score</div>
                            <div className="text-2xl font-bold text-white">
                                {session.final_score?.toFixed(1) || '0.0'}%
                            </div>
                        </div>
                        <Badge variant="outline" className={`capitalize ${session.integrity_flag ? 'border-white text-white' : 'border-neutral-700 text-neutral-400'
                            }`}>
                            {session.integrity_flag ? 'Integrity Flag' : 'Clean Session'}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Grading Breakdown */}
                    <div className="lg:col-span-2 space-y-6">
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-blue-400" />
                                    Grading Breakdown
                                </CardTitle>
                                <CardDescription>AI evaluation per rubric criterion.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Tabs defaultValue="grading" className="w-full">
                                    <TabsList className="bg-neutral-950 border border-neutral-800 p-1 mb-6">
                                        <TabsTrigger value="grading" className="data-[state=active]:bg-neutral-800">Grading Breakdown</TabsTrigger>
                                        <TabsTrigger value="transcript" className="data-[state=active]:bg-neutral-800">Transcript</TabsTrigger>
                                    </TabsList>

                                    <TabsContent value="grading">
                                        <Accordion type="single" collapsible className="w-full">
                                            {gradingDetails?.map((detail) => (
                                                <AccordionItem key={detail.id} value={detail.id} className="border-neutral-800">
                                                    <AccordionTrigger className="hover:no-underline">
                                                        <div className="flex items-center justify-between w-full pr-4">
                                                            <span className="text-sm font-medium text-neutral-300">
                                                                Rubric ID: {detail.rubric_id.slice(0, 8)}...
                                                            </span>
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-xs text-neutral-500">
                                                                    Score: {detail.score_awarded.toFixed(1)}
                                                                </span>
                                                                {detail.passed ? (
                                                                    <Badge className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 border-0">Pass</Badge>
                                                                ) : (
                                                                    <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border-0">Fail</Badge>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </AccordionTrigger>
                                                    <AccordionContent className="text-neutral-400 space-y-2 pt-2">
                                                        <div className="p-3 rounded-lg bg-neutral-950/50 border border-neutral-800 text-sm">
                                                            <span className="font-semibold text-blue-400">Reasoning: </span>
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
                                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${turn.speaker === TranscriptSpeaker.AI ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-neutral-300 border border-white/10'}`}>
                                                                {turn.speaker === TranscriptSpeaker.AI ? 'AI' : 'U'}
                                                            </div>
                                                            <div className={`p-4 rounded-2xl max-w-[80%] text-sm ${turn.speaker === TranscriptSpeaker.AI ? 'bg-neutral-950 border border-neutral-800 rounded-tl-none' : 'bg-blue-500/5 border border-blue-500/20 text-neutral-200 rounded-tr-none'}`}>
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
                                            <div className="text-center py-12 text-neutral-500 flex flex-col items-center">
                                                <MessageSquare className="w-10 h-10 mb-3 opacity-20" />
                                                <p>No transcript data available for this session.</p>
                                            </div>
                                        )}
                                    </TabsContent>
                                </Tabs>

                                {(!gradingDetails || gradingDetails.length === 0) && (
                                    <div className="text-center py-8 text-neutral-500 italic">
                                        No grading details available.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column: Review Controls */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="bg-neutral-900/50 border-neutral-800 backdrop-blur-sm sticky top-8">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-neutral-300" />
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
                                        className="bg-neutral-950 border-neutral-700"
                                    />
                                    <p className="text-xs text-neutral-500">Leave empty to keep AI score.</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes">Review Notes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Add internal notes for this review..."
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="bg-neutral-950 border-neutral-700 min-h-[100px]"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-4">
                                    <Button
                                        onClick={handleReject}
                                        variant="outline"
                                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                        disabled={reviewMutation.isPending}
                                    >
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                    </Button>
                                    <Button
                                        onClick={handleApprove}
                                        className="bg-blue-600 text-white hover:bg-blue-500"
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
            </div>
        </div>
    );
}
