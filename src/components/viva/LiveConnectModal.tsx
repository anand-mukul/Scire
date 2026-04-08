'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Ear } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-token';
import { rtcConfig } from '@/lib/network/webrtc-config';
import { toast } from 'sonner';

interface LiveConnectModalProps {
    sessionId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LiveConnectModal({ sessionId, open, onOpenChange }: LiveConnectModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    
    const [isConnected, setIsConnected] = useState(false);
    const [transcripts, setTranscripts] = useState<{ role: string, text: string }[]>([]);
    
    // Unique ID for this instructor connection instance (so student knows who to reply to)
    const instructorId = useRef(crypto.randomUUID());

    const connectNetwork = useCallback(() => {
        if (!sessionId) return;
        
        const token = getAccessToken();
        if (!token) {
            toast.error("Authentication required.");
            onOpenChange(false);
            return;
        }

        const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:8000/api/v1/ws';
        const fullUrl = `${wsUrl}/session/${sessionId}`;
        
        const ws = new WebSocket(fullUrl, [token]);
        wsRef.current = ws;

        ws.onopen = () => {
            setIsConnected(true);
            toast.success("Connected to student session");
            initWebRTC(ws);
        };

        ws.onmessage = async (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === 'TRANSCRIPT') {
                    if (msg.is_final) {
                        setTranscripts(prev => [...prev, { role: msg.role, text: msg.text }]);
                    }
                } else if (msg.type === 'WEBRTC_SIGNAL') {
                    // Only process signals intended for us (reply from student)
                    if (msg.senderId !== instructorId.current || msg.senderRole !== 'STUDENT') return;
                    
                    const pc = pcRef.current;
                    if (!pc) return;

                    const signal = msg.signalData;
                    if (signal.type === 'answer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    } else if (signal.type === 'candidate') {
                        try {
                            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                        } catch (e) {
                            console.error("Error adding remote ICE candidate", e);
                        }
                    }
                } else if (msg.type === 'ERROR') {
                    toast.error(`Remote Error: ${msg.message}`);
                    if (msg.code === 'INSTRUCTOR_TERMINATED') {
                        onOpenChange(false);
                    }
                } else if (msg.type === 'INTEGRITY_ALERT') {
                    toast.warning(`Alert triggered: ${msg.reason}`);
                }
            } catch (err) {
                console.error("Failed to parse WS message", err);
            }
        };

        ws.onclose = () => {
            setIsConnected(false);
            pcRef.current?.close();
            pcRef.current = null;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };

    }, [sessionId, onOpenChange]);

    const initWebRTC = async (ws: WebSocket) => {
        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;

        // Because we configured student to only send Video, we just attach transceivers
        pc.addTransceiver('video', { direction: 'recvonly' });

        pc.ontrack = (event) => {
            if (videoRef.current && event.streams[0]) {
                videoRef.current.srcObject = event.streams[0];
            }
        };

        pc.onicecandidate = (event) => {
            if (event.candidate && ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                    type: 'WEBRTC_SIGNAL',
                    signalData: { type: 'candidate', candidate: event.candidate },
                    senderId: instructorId.current,
                    senderRole: 'INSTRUCTOR'
                }));
            }
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'WEBRTC_SIGNAL',
                signalData: pc.localDescription,
                senderId: instructorId.current,
                senderRole: 'INSTRUCTOR'
            }));
        }
    };

    useEffect(() => {
        if (open) {
            setTranscripts([]);
            connectNetwork();
        } else {
            wsRef.current?.close();
            pcRef.current?.close();
            setIsConnected(false);
        }
    }, [open, connectNetwork]);

    const sendIntervention = (action: 'WARN' | 'TERMINATE', reasonText: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'INSTRUCTOR_INTERVENTION',
                action,
                reason: reasonText
            }));
            toast.success(`Action ${action} dispatched`);
            if (action === 'TERMINATE') {
                setTimeout(() => onOpenChange(false), 500);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
                <DialogHeader className="p-4 md:p-6 border-b shrink-0 flex flex-row items-center justify-between">
                    <div>
                        <DialogTitle className="text-xl flex items-center gap-2">
                            <Ear className="w-5 h-5 text-primary" />
                            Live Connect
                        </DialogTitle>
                        <DialogDescription className="mt-1">
                            Discreetly monitoring candidate environment
                            {isConnected ? <span className="ml-2 text-emerald-500 font-medium animate-pulse">● Live Stream Active</span> : <span className="ml-2 text-muted-foreground">Connecting...</span>}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-2">
                    {/* Left Pane: Video */}
                    <div className="bg-black/95 relative flex items-center justify-center p-4">
                        {!isConnected && (
                            <div className="absolute flex flex-col items-center justify-center text-muted-foreground z-10">
                                <Loader2 className="w-8 h-8 animate-spin mb-4" />
                                <p>Establishing P2P Bridge...</p>
                            </div>
                        )}
                        <video 
                            ref={videoRef}
                            autoPlay 
                            playsInline 
                            muted
                            className="w-full h-full object-contain rounded-md"
                        />
                    </div>

                    {/* Right Pane: Transcripts & Controls */}
                    <div className="flex flex-col bg-muted/10 border-l">
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {transcripts.map((t, idx) => (
                                <div key={idx} className={`p-3 rounded-lg text-sm ${t.role === 'ASSISTANT' ? 'bg-primary/10 mr-8 text-primary/90' : 'bg-muted ml-8 text-foreground'}`}>
                                    <span className="font-semibold block text-xs mb-1 opacity-70">
                                        {t.role === 'ASSISTANT' ? 'AI Agent' : 'Student'}
                                    </span>
                                    {t.text}
                                </div>
                            ))}
                            {transcripts.length === 0 && (
                                <div className="text-center text-muted-foreground pt-12 text-sm">
                                    Awaiting dialogue...
                                </div>
                            )}
                        </div>
                        
                        <div className="shrink-0 border-t bg-background p-4 flex flex-col gap-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase">Emergency Interventions</p>
                            <div className="flex gap-2">
                                <Button 
                                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white" 
                                    onClick={() => sendIntervention('WARN', 'Instructor Warning: Please look at the screen.')}
                                >
                                    Send Warning
                                </Button>
                                <Button 
                                    className="flex-1" 
                                    variant="destructive"
                                    onClick={() => sendIntervention('TERMINATE', 'Instructor terminated the exam due to severe integrity violations.')}
                                >
                                    <ShieldAlert className="w-4 h-4 mr-2" /> Terminate Exam
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
