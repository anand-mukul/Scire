'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useSessionStore, DialogueState } from '@/lib/store/session-store';
import { vivaWebSocket } from '@/lib/network/websocket-client';
import { audioManager } from '@/services/audioManager';
import { integrityService } from '@/services/integrityService';
import { faceVerificationService } from '@/services/biometrics/faceVerificationService';
import { toast } from 'sonner';
import { Logger } from '@/lib/logger';
import { rtcConfig } from '@/lib/network/webrtc-config';

interface MediaManagerProps {
    onStreamReady?: (stream: MediaStream) => void;
}

export const MediaManager: React.FC<MediaManagerProps> = ({ onStreamReady }) => {
    const fsmState = useSessionStore((state) => state.fsmState);
    const setMicStatus = useSessionStore((state) => state.setMicStatus);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const monitoringVideoRef = useRef<HTMLVideoElement>(null);
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

                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        channelCount: 1,
                        // NOTE: Do NOT specify sampleRate here — let the browser
                        // use native rate. Downsampling to 16kHz is handled by
                        // the recorder-processor.js AudioWorklet.
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
            faceVerificationService.stopMonitoring();
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
                setStream(null);
            }
        }
    }, [fsmState]);

    // Start face monitoring when stream is available
    useEffect(() => {
        const videoElement = monitoringVideoRef.current;
        if (stream && videoElement) {
            videoElement.srcObject = stream;
            videoElement.play().then(() => {
                // Ensure baseline was set from onboarding (which should have happened via backend or local state)
                // Even without backend persistence hooked up locally yet, starting it allows the 'FACE_MISSING' logic
                // to trigger if no face is detected at all (similarity=0).
                faceVerificationService.startMonitoring(videoElement, 3000);
            }).catch(e => console.error('Face monitoring play failed', e));

            return () => {
                faceVerificationService.stopMonitoring();
            };
        }
    }, [stream]);

    // Lifecycle: Cleanup & Integrity Monitoring
    useEffect(() => {
        integrityService.startMonitoring();

        return () => {
            integrityService.stopMonitoring();
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

    // Handle incoming WebRTC signals from Instructors
    const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
    useEffect(() => {
        const handleWebRTCSignal = async (e: Event) => {
            const customEvent = e as CustomEvent;
            const message = customEvent.detail;
            const { signalData, senderId, senderRole } = message;
            
            // Only respond to Instructor signals to avoid Echoing our own
            if (!senderId || senderRole === 'STUDENT') return;

            if (signalData.type === 'offer') {
                try {
                    const pc = new RTCPeerConnection(rtcConfig);
                    peerConnections.current.set(senderId, pc);

                    // Attach only video stream
                    if (stream) {
                        const videoTracks = stream.getVideoTracks();
                        if (videoTracks.length > 0) {
                            pc.addTrack(videoTracks[0], stream);
                        }
                    }

                    pc.onicecandidate = (event) => {
                        if (event.candidate) {
                            vivaWebSocket.send({
                                type: 'WEBRTC_SIGNAL',
                                signalData: { type: 'candidate', candidate: event.candidate },
                                senderRole: 'STUDENT',
                                senderId: senderId // reply to the specific instructor
                            });
                        }
                    };

                    await pc.setRemoteDescription(new RTCSessionDescription(signalData));
                    const answer = await pc.createAnswer();
                    await pc.setLocalDescription(answer);

                    vivaWebSocket.send({
                        type: 'WEBRTC_SIGNAL',
                        signalData: pc.localDescription,
                        senderRole: 'STUDENT',
                        senderId: senderId
                    });
                } catch (err) {
                    Logger.error("WebRTC offer negotiation failed", err);
                    peerConnections.current.get(senderId)?.close();
                    peerConnections.current.delete(senderId);
                }
            } else if (signalData.type === 'candidate') {
                const pc = peerConnections.current.get(senderId);
                if (pc && signalData.candidate) {
                    try {
                        await pc.addIceCandidate(new RTCIceCandidate(signalData.candidate));
                    } catch (err) {
                        Logger.error("Failed to add ICE candidate", err);
                    }
                }
            }
        };

        window.addEventListener('viva:webrtc_signal', handleWebRTCSignal);
        return () => {
            window.removeEventListener('viva:webrtc_signal', handleWebRTCSignal);
            // Cleanup RTCPeerConnections on unmount/stream drop
            peerConnections.current.forEach(pc => pc.close());
            peerConnections.current.clear();
        };
    }, [stream]);

    // Manage Audio Transmission
    // IMPORTANT: Keep mic active at ALL TIMES during interactive phases.
    // Stopping recording sends CloseStream to Deepgram, permanently killing the STT WebSocket.
    // Echo filtering is handled server-side in websocket.py (stream_manager.is_speaking check).
    useEffect(() => {
        if (!stream) return;

        const shouldRecord = (
            fsmState === DialogueState.CALIBRATION ||
            fsmState === DialogueState.QUESTION ||
            fsmState === DialogueState.THINK ||
            fsmState === DialogueState.LISTENING ||
            fsmState === DialogueState.SCAFFOLD ||
            fsmState === DialogueState.EVALUATION ||
            fsmState === DialogueState.TRANSFER
        );

        if (shouldRecord) {
            const currentMic = useSessionStore.getState().isMicActive;
            if (!currentMic) {
                useSessionStore.getState().setMicStatus(true);
                audioManager.startRecording();
            }
        } else {
            const currentMic = useSessionStore.getState().isMicActive;
            if (currentMic) {
                useSessionStore.getState().setMicStatus(false);
                audioManager.stopRecording();
            }
        }
    }, [stream, fsmState]);

    // Auto-mute push-to-talk when entering non-speaking phases
    // Mic unmute is only allowed during LISTENING (user clicks mic button)
    useEffect(() => {
        const autoMuteStates = [
            DialogueState.QUESTION,
            DialogueState.THINK,
            DialogueState.EVALUATION,
            DialogueState.TRANSFER,
            DialogueState.END,
            DialogueState.TERMINATED,
        ];
        if (autoMuteStates.includes(fsmState)) {
            const currentUnmuted = useSessionStore.getState().isMicUnmuted;
            if (currentUnmuted) {
                useSessionStore.getState().setMicUnmuted(false);
            }
        }
    }, [fsmState]);

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
        <div className="absolute opacity-0 pointer-events-none w-1 h-1 overflow-hidden z-[-1]">
            <video ref={monitoringVideoRef} autoPlay muted playsInline />
            <canvas ref={canvasRef} width={320} height={240} />
        </div>
    );
};
