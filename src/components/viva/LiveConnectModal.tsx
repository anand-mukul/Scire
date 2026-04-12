'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert, Ear, WifiOff, RefreshCw, Volume2, VolumeX } from 'lucide-react';
import { getAccessToken } from '@/lib/auth-token';
import { rtcConfig } from '@/lib/network/webrtc-config';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────
const WS_RECONNECT_DELAY_MS = 2000;
const RTC_RETRY_MAX = 2;

type RTCState = 'NEW' | 'CONNECTING' | 'CONNECTED' | 'FAILED' | 'CLOSED';

interface LiveConnectModalProps {
    sessionId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LiveConnectModal({ sessionId, open, onOpenChange }: LiveConnectModalProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    const [wsConnected, setWsConnected] = useState(false);
    const [rtcState, setRtcState] = useState<RTCState>('NEW');
    const [transcripts, setTranscripts] = useState<{ role: string; text: string }[]>([]);
    const [isMuted, setIsMuted] = useState(true);
    const [retryCount, setRetryCount] = useState(0);

    // Unique ID for this instructor connection instance
    const instructorId = useRef(crypto.randomUUID());

    // ── Auto-scroll transcripts ──────────────────────────────────
    useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [transcripts]);

    // ── WebRTC Initialization ────────────────────────────────────
    const initWebRTC = useCallback((ws: WebSocket) => {
        // Cleanup previous connection if any
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }

        const pc = new RTCPeerConnection(rtcConfig);
        pcRef.current = pc;
        setRtcState('CONNECTING');

        // Receive-only video transceiver
        pc.addTransceiver('video', { direction: 'recvonly' });

        // ── Track WebRTC Connection State (the CORE fix) ─────────
        pc.onconnectionstatechange = () => {
            const state = pc.connectionState;
            switch (state) {
                case 'connecting':
                    setRtcState('CONNECTING');
                    break;
                case 'connected':
                    setRtcState('CONNECTED');
                    break;
                case 'failed':
                    setRtcState('FAILED');
                    break;
                case 'disconnected':
                case 'closed':
                    setRtcState('CLOSED');
                    break;
            }
        };

        // Fallback for browsers that don't fire connectionstatechange reliably
        pc.oniceconnectionstatechange = () => {
            const iceState = pc.iceConnectionState;
            if (iceState === 'connected' || iceState === 'completed') {
                setRtcState('CONNECTED');
            } else if (iceState === 'failed') {
                setRtcState('FAILED');
            } else if (iceState === 'disconnected') {
                // ICE disconnected doesn't mean failed — it may recover
                // Only set CLOSED if connectionState also confirms
                if (pc.connectionState === 'closed' || pc.connectionState === 'failed') {
                    setRtcState('CLOSED');
                }
            }
        };

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
                    senderRole: 'INSTRUCTOR',
                }));
            }
        };

        // Create and send offer
        pc.createOffer()
            .then((offer) => pc.setLocalDescription(offer))
            .then(() => {
                if (ws.readyState === WebSocket.OPEN && pc.localDescription) {
                    ws.send(JSON.stringify({
                        type: 'WEBRTC_SIGNAL',
                        signalData: pc.localDescription,
                        senderId: instructorId.current,
                        senderRole: 'INSTRUCTOR',
                    }));
                }
            })
            .catch((err) => {
                console.error('WebRTC offer creation failed:', err);
                setRtcState('FAILED');
            });

        return pc;
    }, []);

    // ── WebSocket + Signaling Connection ─────────────────────────
    const connectNetwork = useCallback(() => {
        if (!sessionId) return;

        const token = getAccessToken();
        if (!token) {
            toast.error('Authentication required.');
            onOpenChange(false);
            return;
        }

        const rawWsUrl = process.env.NEXT_PUBLIC_WS_URL || 'wss://localhost:8000/api/v1/ws';
        const wsBase = rawWsUrl.replace(/\/session\/?$/, '');
        const fullUrl = `${wsBase}/session/${sessionId}`;

        const ws = new WebSocket(fullUrl, [token]);
        wsRef.current = ws;

        ws.onopen = () => {
            setWsConnected(true);
            setRetryCount(0);
            toast.success('Signaling channel established');
            initWebRTC(ws);
        };

        ws.onmessage = async (event) => {
            try {
                const msg = JSON.parse(event.data);

                if (msg.type === 'TRANSCRIPT') {
                    if (msg.is_final) {
                        setTranscripts((prev) => [...prev, { role: msg.role, text: msg.text }]);
                    }
                } else if (msg.type === 'WEBRTC_SIGNAL') {
                    // Only process signals from the STUDENT side replying to us
                    if (msg.senderId !== instructorId.current || msg.senderRole !== 'STUDENT') return;

                    const pc = pcRef.current;
                    if (!pc) return;

                    const signal = msg.signalData;
                    if (signal.type === 'answer') {
                        await pc.setRemoteDescription(new RTCSessionDescription(signal));
                    } else if (signal.type === 'candidate') {
                        // Queue candidates if remote description not yet set (Safari resilience)
                        if (pc.remoteDescription) {
                            try {
                                await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                            } catch (e) {
                                console.error('Error adding remote ICE candidate', e);
                            }
                        } else {
                            // Wait briefly for remote description, then retry
                            setTimeout(async () => {
                                try {
                                    if (pc.remoteDescription) {
                                        await pc.addIceCandidate(new RTCIceCandidate(signal.candidate));
                                    }
                                } catch (e) {
                                    console.error('Deferred ICE candidate failed', e);
                                }
                            }, 500);
                        }
                    }
                } else if (msg.type === 'ERROR') {
                    toast.error(`Remote Error: ${msg.message}`);
                    if (msg.code === 'INSTRUCTOR_TERMINATED') {
                        onOpenChange(false);
                    }
                } else if (msg.type === 'INTEGRITY_ALERT') {
                    toast.warning(`Alert: ${msg.reason}`);
                }
            } catch (err) {
                console.error('Failed to parse WS message', err);
            }
        };

        ws.onclose = () => {
            setWsConnected(false);
            setRtcState('CLOSED');
            pcRef.current?.close();
            pcRef.current = null;
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
        };
    }, [sessionId, onOpenChange, initWebRTC]);

    // ── Auto-retry WebRTC on failure ─────────────────────────────
    const retryWebRTC = useCallback(() => {
        if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
            toast.error('Signaling channel lost. Reconnecting...');
            connectNetwork();
            return;
        }
        if (retryCount >= RTC_RETRY_MAX) {
            toast.error('WebRTC connection failed. The student may be behind a strict firewall.');
            return;
        }
        setRetryCount((c) => c + 1);
        toast.info('Retrying video connection...');
        initWebRTC(wsRef.current);
    }, [retryCount, connectNetwork, initWebRTC]);

    // Auto-retry once on first failure
    useEffect(() => {
        if (rtcState === 'FAILED' && retryCount === 0) {
            const timer = setTimeout(() => retryWebRTC(), WS_RECONNECT_DELAY_MS);
            return () => clearTimeout(timer);
        }
    }, [rtcState, retryCount, retryWebRTC]);

    // ── Lifecycle ────────────────────────────────────────────────
    useEffect(() => {
        if (open) {
            setTranscripts([]);
            setRtcState('NEW');
            setRetryCount(0);
            connectNetwork();
        } else {
            wsRef.current?.close();
            pcRef.current?.close();
            pcRef.current = null;
            setWsConnected(false);
            setRtcState('CLOSED');
        }
    }, [open, connectNetwork]);

    // ── Intervention Actions ─────────────────────────────────────
    const sendIntervention = (action: 'WARN' | 'TERMINATE', reasonText: string) => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify({
                type: 'INSTRUCTOR_INTERVENTION',
                action,
                reason: reasonText,
            }));
            toast.success(`Action ${action} dispatched`);
            if (action === 'TERMINATE') {
                setTimeout(() => onOpenChange(false), 500);
            }
        }
    };

    // ── Toggle Mute ──────────────────────────────────────────────
    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !videoRef.current.muted;
            setIsMuted(videoRef.current.muted);
        }
    };

    // ── Status Helpers ───────────────────────────────────────────
    const getStatusBadge = () => {
        switch (rtcState) {
            case 'NEW':
            case 'CONNECTING':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-400 animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                        Establishing P2P Bridge...
                    </span>
                );
            case 'CONNECTED':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        Stream Active
                    </span>
                );
            case 'FAILED':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-400">
                        <WifiOff className="h-3 w-3" />
                        Connection Failed
                    </span>
                );
            case 'CLOSED':
                return (
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                        <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />
                        Disconnected
                    </span>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0 overflow-hidden bg-background border-border/50">
                {/* ── Header ──────────────────────────────────── */}
                <DialogHeader className="px-5 py-4 border-b border-border/50 shrink-0 flex flex-row items-center justify-between bg-muted/10">
                    <div>
                        <DialogTitle className="text-lg flex items-center gap-2 font-semibold">
                            <Ear className="w-4.5 h-4.5 text-primary" />
                            Live Connect
                        </DialogTitle>
                        <DialogDescription className="mt-0.5 flex items-center gap-2 text-xs">
                            Discreetly monitoring candidate environment
                            <span className="text-border">·</span>
                            {getStatusBadge()}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                {/* ── Content Grid ─────────────────────────────── */}
                <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-5">
                    {/* Left Pane: Video (3/5 width) */}
                    <div className="md:col-span-3 bg-neutral-950 relative flex items-center justify-center">
                        {/* Connection Overlay */}
                        {rtcState !== 'CONNECTED' && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-neutral-950/90 backdrop-blur-sm">
                                {rtcState === 'FAILED' ? (
                                    <div className="flex flex-col items-center gap-4 text-center px-6">
                                        <div className="h-14 w-14 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                                            <WifiOff className="w-6 h-6 text-rose-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-rose-300">P2P Connection Failed</p>
                                            <p className="text-xs text-muted-foreground mt-1 max-w-[280px]">
                                                The student&apos;s network may be blocking WebRTC (strict firewall/NAT).
                                            </p>
                                        </div>
                                        {retryCount < RTC_RETRY_MAX && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="gap-1.5 text-xs border-rose-500/30 hover:bg-rose-500/10 text-rose-300"
                                                onClick={retryWebRTC}
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" />
                                                Retry Connection
                                            </Button>
                                        )}
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
                                        <p className="text-sm text-muted-foreground">
                                            {!wsConnected ? 'Connecting to signaling server...' : 'Negotiating P2P video bridge...'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted={isMuted}
                            className="w-full h-full object-contain"
                        />

                        {/* Floating audio toggle */}
                        {rtcState === 'CONNECTED' && (
                            <button
                                onClick={toggleMute}
                                className="absolute bottom-3 right-3 z-20 h-8 w-8 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center hover:bg-black/80 transition-colors"
                                title={isMuted ? 'Unmute audio' : 'Mute audio'}
                            >
                                {isMuted ? (
                                    <VolumeX className="w-3.5 h-3.5 text-white/70" />
                                ) : (
                                    <Volume2 className="w-3.5 h-3.5 text-white/70" />
                                )}
                            </button>
                        )}
                    </div>

                    {/* Right Pane: Transcripts & Controls (2/5 width) */}
                    <div className="md:col-span-2 flex flex-col border-l border-border/50">
                        {/* Transcript Feed */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {transcripts.map((t, idx) => (
                                <div
                                    key={idx}
                                    className={cn(
                                        'p-3 rounded-lg text-sm leading-relaxed',
                                        t.role === 'ASSISTANT'
                                            ? 'bg-primary/5 border border-primary/10 mr-6'
                                            : 'bg-muted/50 border border-border/50 ml-6'
                                    )}
                                >
                                    <span className="font-semibold block text-[10px] uppercase tracking-wider mb-1 opacity-50">
                                        {t.role === 'ASSISTANT' ? 'AI Examiner' : 'Student'}
                                    </span>
                                    {t.text}
                                </div>
                            ))}
                            {transcripts.length === 0 && (
                                <div className="flex flex-col items-center justify-center h-full text-center px-4">
                                    <Ear className="w-8 h-8 text-muted-foreground/20 mb-3" />
                                    <p className="text-sm text-muted-foreground">Awaiting dialogue...</p>
                                    <p className="text-xs text-muted-foreground/60 mt-1">
                                        Transcripts will appear here in real-time
                                    </p>
                                </div>
                            )}
                            {/* Invisible scroll anchor */}
                            <div ref={transcriptEndRef} />
                        </div>

                        {/* Intervention Controls */}
                        <div className="shrink-0 border-t border-border/50 bg-muted/5 p-4 flex flex-col gap-3">
                            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                                Emergency Interventions
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs h-9 bg-amber-500/90 hover:bg-amber-500 text-white shadow-sm"
                                    onClick={() =>
                                        sendIntervention('WARN', 'Instructor Warning: Please look at the screen.')
                                    }
                                >
                                    Send Warning
                                </Button>
                                <Button
                                    size="sm"
                                    className="flex-1 text-xs h-9"
                                    variant="destructive"
                                    onClick={() =>
                                        sendIntervention(
                                            'TERMINATE',
                                            'Instructor terminated the exam due to severe integrity violations.'
                                        )
                                    }
                                >
                                    <ShieldAlert className="w-3.5 h-3.5 mr-1.5" />
                                    Terminate
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
