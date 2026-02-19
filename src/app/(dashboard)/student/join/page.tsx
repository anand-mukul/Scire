'use client';

import React, { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/dashboard/page-header';
import { api } from '@/lib/network/api';
import { ArrowRight, Loader2, AlertCircle, Clock, KeyRound, ShieldCheck, Mic } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { formatToLocalDateTime } from '@/lib/date-utils';

import { useSearchParams } from 'next/navigation';

export default function JoinExamPage() {
    return (
        <Suspense fallback={
            <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
                <div className="flex items-center justify-center flex-1 min-h-[60vh]">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            </main>
        }>
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
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Join Exam"
                description="Enter the unique code provided by your instructor to begin."
            />

            <div className="flex items-start justify-center flex-1 pt-4 md:pt-8">
                <div className="w-full max-w-lg space-y-6">
                    {/* Main Join Card */}
                    <Card className="relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-sm shadow-md">
                        {/* Accent gradient stripe */}
                        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary/80 via-primary to-primary/80" />

                        <div className="p-8 pt-10 space-y-8">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                                    <KeyRound className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold tracking-tight">Enter Exam Code</h2>
                                    <p className="text-sm text-muted-foreground">Your instructor will share the code with you.</p>
                                </div>
                            </div>

                            <form onSubmit={handleJoin} className="space-y-6">
                                <div className="space-y-2">
                                    <Input
                                        placeholder="e.g. EXAM-ABCD"
                                        value={examCode}
                                        onChange={(e) => setExamCode(e.target.value.toUpperCase())}
                                        className="bg-muted/30 border-border/60 text-center text-2xl tracking-[0.2em] font-mono uppercase h-16 focus:ring-primary/20 focus:border-primary/50 transition-all font-bold placeholder:text-base placeholder:tracking-normal placeholder:font-normal placeholder:text-muted-foreground/40"
                                        maxLength={10}
                                        disabled={isLoading}
                                    />
                                </div>

                                {error && (
                                    <Alert variant={error.toLowerCase().includes('not started') ? "default" : "destructive"}
                                        className={`${error.toLowerCase().includes('not started')
                                            ? "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                            : "bg-destructive/10 border-destructive/20 text-destructive"}`}>
                                        {error.toLowerCase().includes('not started')
                                            ? <Clock className="h-4 w-4" />
                                            : <AlertCircle className="h-4 w-4" />}
                                        <AlertTitle className="font-bold ml-2">
                                            {error.toLowerCase().includes('not started') ? "Scheduled" : "Error"}
                                        </AlertTitle>
                                        <AlertDescription className="ml-2 mt-1">{formatError(error)}</AlertDescription>
                                    </Alert>
                                )}

                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-12 text-base font-semibold button-press gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                                    disabled={!examCode || isLoading}
                                >
                                    {isLoading ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Joining...
                                        </>
                                    ) : (
                                        <>
                                            Start Assessment
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </Card>

                    {/* Checklist hints */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { icon: Mic, label: "Microphone ready" },
                            { icon: ShieldCheck, label: "Proctoring enabled" },
                            { icon: Clock, label: "Timed session" },
                        ].map(({ icon: Icon, label }) => (
                            <div key={label} className="flex flex-col items-center gap-2 rounded-lg border border-border/40 bg-card/20 p-3 text-center">
                                <Icon className="h-4 w-4 text-muted-foreground/60" />
                                <span className="text-xs text-muted-foreground">{label}</span>
                            </div>
                        ))}
                    </div>

                    <p className="text-center text-xs text-muted-foreground/60">
                        By joining, you agree to the{' '}
                        <span className="text-primary/70 hover:text-primary hover:underline cursor-pointer transition-colors">Terms of Service</span>
                        {' '}and{' '}
                        <span className="text-primary/70 hover:text-primary hover:underline cursor-pointer transition-colors">Privacy Policy</span>.
                    </p>
                </div>
            </div>
        </main>
    );
}
