"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { SessionProvider } from "@/components/viva/SessionProvider";
import { TranscriptView } from "@/components/viva/TranscriptView";
import { useSessionStore } from '@/lib/store/session-store';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Loader2, Mic, MicOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import AIOrb from "@/components/visuals/AIOrb";
import { SessionTimer } from "@/components/viva/SessionTimer";

// Internal component to consume store (must be inside Provider)
const ExamSessionContent = () => {
    const connectionState = useSessionStore(s => s.connectionState);
    const error = useSessionStore(s => s.error);
    const fsmState = useSessionStore(s => s.fsmState);
    const isMicActive = useSessionStore(s => s.isMicActive);

    // Integrity Monitoring
    useEffect(() => {
        let cleanup: (() => void) | undefined;
        import("@/services/integrityService").then(({ integrityService }) => {
            if (connectionState === 'CONNECTED') {
                integrityService.startMonitoring();
            } else {
                integrityService.stopMonitoring();
            }
            cleanup = () => integrityService.stopMonitoring();
        });
        return () => {
            if (cleanup) cleanup();
        };
    }, [connectionState]);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full p-8 space-y-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button onClick={() => window.location.reload()}>Retry Connection</Button>
            </div>
        );
    }

    if (connectionState === 'CONNECTING' || connectionState === 'IDLE') {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground">Connecting to Intelligent Proctor...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-3 h-[calc(100vh-4rem)] gap-4 p-4 overflow-hidden">

            {/* Left Col: AI Visuals */}
            <div className="flex-1 lg:h-auto lg:col-span-2 flex flex-col relative rounded-xl overflow-hidden bg-gradient-to-b from-background to-muted/20 border min-h-[50vh]">
                {/* Connection Header */}
                <div className="absolute top-4 left-4 z-10 flex gap-2">
                    <Badge variant={connectionState === 'CONNECTED' ? 'default' : 'destructive'} className="animate-in fade-in">
                        {connectionState === 'CONNECTED' ? 'LIVE' : 'OFFLINE'}
                    </Badge>
                    <Badge variant="outline">{fsmState}</Badge>
                    <SessionTimer />
                </div>

                {/* Main Orb Area */}
                <div className="flex-1 flex items-center justify-center min-h-[400px]">
                    <AIOrb />
                </div>

                {/* Mic Status Component (Visual Only) */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-background/80 backdrop-blur border shadow-sm">
                    {isMicActive ? <Mic className="w-4 h-4 text-green-500 animate-pulse" /> : <MicOff className="w-4 h-4 text-muted-foreground" />}
                    <span className="text-xs font-medium uppercase tracking-wider">
                        {isMicActive ? "Microphone Active" : "Microphone Muted"}
                    </span>
                </div>
            </div>

            {/* Right Col: Transcript & Tools */}
            <Card className="lg:col-span-1 flex flex-col h-full bg-card/50 backdrop-blur">
                <div className="p-4 border-b bg-muted/30">
                    <h3 className="font-semibold tracking-tight">Session Transcript</h3>
                </div>
                <TranscriptView />
                {/* Future: Integrity snapshot logs or debugging tools here */}
            </Card>

        </div>
    );
};

export default function ExamSessionPage() {
    const params = useParams();
    const router = useRouter();
    const { token, isLoading: isAuthLoading } = useAuth(); // Assuming existing useAuth hook
    const sessionId = params.id as string;

    if (isAuthLoading) {
        return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
    }

    if (!token) {
        router.push("/login?redirect=/student/exam/" + sessionId);
        return null;
    }

    return (
        <SessionProvider sessionId={sessionId} token={token}>
            <ExamSessionContent />
        </SessionProvider>
    );
}
