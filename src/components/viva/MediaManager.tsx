'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { audioManager } from '@/services/audioManager';
import { integrityService } from '@/services/integrityService';
import { toast } from 'sonner';
import { Logger } from '@/lib/logger';

interface MediaManagerProps {
    onStreamReady?: (stream: MediaStream) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ onStreamReady }) => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const setMicStatus = useSessionStore((state) => state.setMicStatus);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    // Persistent video element for snapshot capture — avoids creating temp elements each time
    const snapshotVideoRef = useRef<HTMLVideoElement | null>(null);

    // 1. Acquire Persistent Stream (Audio + Video) — ONCE
    // Stream is acquired on mount and only released on unmount or session end.
    // DO NOT include fsmState in deps — it causes repeated stream re-initialization.
    useEffect(() => {
        let mounted = true;

        const initMedia = async () => {
            try {
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
                        width: 320,
                        height: 240,
                        frameRate: 15
                    }
                });

                if (mounted) {
                    setStream(mediaStream);
                    if (onStreamReady) onStreamReady(mediaStream);
                    Logger.log('MediaManager: Stream Active');

                    audioManager.setStream(mediaStream);

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

        initMedia();

        return () => {
            mounted = false;
        };
    }, []); // Acquire ONCE — no fsmState dep

    // Release stream on END/TERMINATED or unmount
    useEffect(() => {
        if (fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) {
            if (stream) {
                Logger.log('MediaManager: Releasing stream on session end');
                stream.getTracks().forEach(t => t.stop());
                setStream(null);
            }
        }
    }, [fsmState]);

    // Lifecycle: Cleanup & Integrity Monitoring
    useEffect(() => {
        integrityService.startMonitoring();

        return () => {
            integrityService.stopMonitoring();
            Logger.log('MediaManager: Cleaning up AudioManager');
            audioManager.cleanup();
            setMicStatus(false);

            // Cleanup snapshot video element
            if (snapshotVideoRef.current) {
                snapshotVideoRef.current.srcObject = null;
                snapshotVideoRef.current = null;
            }
        };
    }, []);

    // Periodic integrity snapshots
    useEffect(() => {
        if (!stream) return;
        if (fsmState === DialogueState.END || fsmState === DialogueState.TERMINATED) return;

        const interval = setInterval(() => {
            captureAndSendSnapshot();
        }, 30000);

        return () => clearInterval(interval);
    }, [stream, fsmState]);

    // Manage Audio Transmission
    // IMPORTANT: Keep mic active at ALL TIMES during interactive phases.
    // Stopping recording sends CloseStream to Deepgram, permanently killing the STT WebSocket.
    // Echo filtering is handled server-side in websocket.py (stream_manager.is_speaking check).
    useEffect(() => {
        if (!stream) return;

        const shouldRecord = (
            fsmState === DialogueState.CALIBRATION ||
            fsmState === DialogueState.QUESTION ||
            fsmState === DialogueState.LISTENING ||
            fsmState === DialogueState.SCAFFOLD ||
            fsmState === DialogueState.EVALUATION ||
            fsmState === DialogueState.TRANSFER
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
    }, [stream, fsmState]);

    // Reuse a persistent video element for snapshot capture instead of creating new ones each call
    const captureAndSendSnapshot = useCallback(() => {
        if (!stream || !canvasRef.current) return;

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack || !videoTrack.enabled) return;

        // Reuse or create the video element
        if (!snapshotVideoRef.current) {
            snapshotVideoRef.current = document.createElement('video');
            snapshotVideoRef.current.muted = true;
            snapshotVideoRef.current.playsInline = true;
        }

        const video = snapshotVideoRef.current;

        // Only update srcObject if stream changed
        if (video.srcObject !== stream) {
            video.srcObject = stream;
        }

        video.play().then(() => {
            const ctx = canvasRef.current?.getContext('2d');
            if (ctx && canvasRef.current) {
                ctx.drawImage(video, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const dataUrl = canvasRef.current.toDataURL('image/jpeg', 0.5);

                const metrics = integrityService.getMetrics();
                vivaWebSocket.sendIntegritySnapshot({
                    data: dataUrl,
                    ...metrics
                } as any);
            }
        }).catch(e => Logger.error("Snapshot failed", e));
    }, [stream]);


    return (
        <div className="hidden">
            <canvas ref={canvasRef} width={320} height={240} />
        </div>
    );
};
