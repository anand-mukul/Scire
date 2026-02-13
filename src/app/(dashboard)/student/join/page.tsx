'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
// import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/network/api';
import { ArrowRight, Loader2, AlertCircle, Clock } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatToLocalDateTime } from '@/lib/date-utils';

import { useSearchParams } from 'next/navigation';

export default function JoinExamPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <JoinPageContent />
        </Suspense>
    );
}

function JoinPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [examCode, setExamCode] = useState(searchParams.get('code') || '');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            const session = await api.exams.join(examCode);
            router.push(`/student/exam/${session.id}/onboarding`);
        } catch (err: unknown) {
            console.error('Failed to join exam:', err);
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Failed to join exam. Please check the code and try again.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const formatError = (msg: string) => {
        if (!msg) return '';
        const match = msg.match(/Starts at (.+)/);
        if (match && match[1]) {
            return `Exam has not started yet. Starts at ${formatToLocalDateTime(match[1])}`;
        }
        return msg;
    };

    return (
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground flex items-center justify-center p-4">
            {/* <AmbientGlow /> */}

            <div className="w-full max-w-md animate-in fade-in duration-300">
                <Card className="p-8">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-semibold text-foreground mb-2">Join Exam</h1>
                        <p className="text-muted-foreground">Enter the unique code provided by your instructor to start your assessment.</p>
                    </div>

                    <form onSubmit={handleJoin} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                placeholder="EXAM-CODE"
                                value={examCode}
                                onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                                className="bg-secondary/20 border-border text-center text-2xl tracking-[0.2em] font-mono uppercase h-16 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold placeholder:tracking-normal"
                                maxLength={10}
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <Alert variant={error.toLowerCase().includes('not started') ? "default" : "destructive"}
                                className={`${error.toLowerCase().includes('not started') ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
                                {error.toLowerCase().includes('not started') ? <Clock className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertTitle className="font-bold ml-2">{error.toLowerCase().includes('not started') ? "Scheduled" : "Error"}</AlertTitle>
                                <AlertDescription className="ml-2 mt-1">{formatError(error)}</AlertDescription>
                            </Alert>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-12 text-lg font-semibold"
                            disabled={!examCode || isLoading}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Joining...
                                </>
                            ) : (
                                <>
                                    Start Assessment
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-xs text-muted-foreground">
                            By joining, you agree to the <span className="text-primary hover:underline cursor-pointer">Terms of Service</span> and <span className="text-primary hover:underline cursor-pointer">Privacy Policy</span>.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    );
}
