'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { audioManager } from '@/services/audioManager';
import { integrityService } from '@/services/integrityService';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Logger } from '@/lib/logger';

interface MediaManagerProps {
    onStreamReady?: (stream: MediaStream) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ onStreamReady }) => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const setMicStatus = useSessionStore((state) => state.setMicStatus);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // 1. Acquire Persistent Stream (Audio + Video)
    useEffect(() => {
        let mounted = true;

        const initMedia = async () => {
            try {
                // If we already have a stream, check if it's active
                if (stream && stream.active) return;

                Logger.log('MediaManager: Requesting User Media...');
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: true,
                        noiseSuppression: true,
                        autoGainControl: true,
                        channelCount: 1,
                        sampleRate: 16000
                    },
                    video: {
                        width: 320,  // Low internal res for snapshots is fine
                        height: 240,
                        frameRate: 15
                    }
                });

                if (mounted) {
                    setStream(mediaStream);
                    if (onStreamReady) onStreamReady(mediaStream);
                    Logger.log('MediaManager: Stream Active');

                    // Share with AudioManager for transmission
                    audioManager.setStream(mediaStream);

                    // Connect to Analysis Service for Visuals
                    import('@/services/AudioAnalysisService').then(({ AudioAnalysisService }) => {
                        AudioAnalysisService.getInstance().connectMicrophone(mediaStream);
                    });
                } else {
                    mediaStream.getTracks().forEach(t => t.stop());
                }
            } catch (err) {
                Logger.error('MediaManager Error:', err);
                toast.error("Failed to access camera/microphone. Please check permissions.");
            }
        };

        // Initialize media during CALIBRATION (mic check) and main exam phases
        // Only skip during AUTH (pre-connect) and END (session over)
        if (fsmState !== DialogueState.AUTH && fsmState !== DialogueState.END) {
            initMedia();
        }

        return () => {
            mounted = false;
            // We do NOT stop the stream here on unmount immediately if we navigate?
            // Actually, we SHOULD stop it if this component is unmounted (e.g. session end).
            if (stream) {
                // For now, let's keep it tied to component lifecycle.
                // stream.getTracks().forEach(t => t.stop());
                // setStream(null);
            }
        };
    }, [fsmState]); // Re-run if state changes significantly? No, just once. 

    // Lifecycle: Cleanup & Integrity Monitoring
    useEffect(() => {
        integrityService.startMonitoring();

        return () => {
            integrityService.stopMonitoring();
            if (stream) {
                Logger.log('MediaManager: Stopping Stream');
                stream.getTracks().forEach(t => t.stop());
            }
            if (audioContextRef.current) {
                audioContextRef.current.close();
            }
            setMicStatus(false);
        };
    }, [stream]); // Dependent on stream? stream changes? 
    // Ideally this effect should be dependent on [stream] for stream cleanup, but [integrity] is global.
    // Mixing them is fine if we accept start/stop on stream change (rare).

    useEffect(() => {
        if (!stream) return;
        if (fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) return;

        const interval = setInterval(() => {
            captureAndSendSnapshot();
        }, 30000); // Every 30 seconds

        return () => clearInterval(interval);
    }, [stream, fsmState]);

    // Manage Audio Transmission (Mic Management)
    const isAgentSpeaking = useSessionStore(s => s.isAgentSpeaking);
    useEffect(() => {
        if (!stream) return;

        const shouldRecord = !isAgentSpeaking && (
            fsmState === DialogueState.CALIBRATION ||
            fsmState === DialogueState.QUESTION ||
            fsmState === DialogueState.LISTENING ||
            fsmState === DialogueState.SCAFFOLD
        );

        if (shouldRecord) {
            const currentMic = useSessionStore.getState().isMicActive;
            if (!currentMic) {
                Logger.log("MediaManager: Starting Audio Transmission");
                useSessionStore.getState().setMicStatus(true);
                audioManager.startRecording();
            }
        } else {
            const currentMic = useSessionStore.getState().isMicActive;
            if (currentMic) {
                Logger.log("MediaManager: Stopping Audio Transmission");
                useSessionStore.getState().setMicStatus(false);
                audioManager.stopRecording();
            }
        }
    }, [stream, fsmState, isAgentSpeaking]);

    const captureAndSendSnapshot = () => {
        if (!stream || !canvasRef.current) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack || !videoTrack.enabled) return;

        // Create a temporary video element to grab frame
        const video = document.createElement('video');
        video.srcObject = stream;
        video.play().then(() => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) {
                ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.5); // Low quality is enough

                const metrics = integrityService.getMetrics();
                vivaWebSocket.sendIntegritySnapshot({
                    timestamp: new Date().toISOString(),
                    data: dataUrl,
                    ...metrics
                } as any);
                // console.log('Sent Integrity Snapshot');
            }
            // Cleanup video element? It's not attached to DOM.
            video.srcObject = null;
        }).catch(e => Logger.error("Snapshot failed", e));
    };



    return (
        <div className="hidden">
            <canvas ref={canvasRef} width={320} height={240} />
            {/* We could render a small preview here if we wanted to debug */}
        </div>
    );
};
