'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Camera, CheckCircle, AlertCircle, RefreshCw, ShieldCheck, ChevronRight } from 'lucide-react';
import { useSessionStore } from '@/lib/store/session-store';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '@/lib/network/api';

type OnboardingStep = 'tnc' | 'media_setup' | 'snapshot' | 'ready';

const CountDown20 = () => {
    const [seconds, setSeconds] = useState(20);

    useEffect(() => {
        const timer = setInterval(() => {
            setSeconds(s => Math.max(0, s - 1));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="font-mono text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-500 animate-pulse">
            00:{seconds.toString().padStart(2, '0')}
        </div>
    );
};

export const CalibrationPhase = ({ stream }: { stream: MediaStream | null }) => {
    const onboardingAccepted = useSessionStore(state => state.onboardingAccepted);
    const [step, setStep] = useState<OnboardingStep>(onboardingAccepted ? 'ready' : 'tnc');
    const [tncAccepted, setTncAccepted] = useState(onboardingAccepted);

    // Media State
    // stream is passed as prop
    const userVolume = useSessionStore(state => state.userVolume); // Use store volume
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // Snapshot State
    const [snapshot, setSnapshot] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [detectionError, setDetectionError] = useState<string | null>(null);

    const sessionId = useSessionStore(state => state.sessionId);
    const setMicStatus = useSessionStore(state => state.setMicStatus);
    const setUserVolume = useSessionStore(state => state.setUserVolume);

    // Attach stream to video when available and in correct step
    useEffect(() => {
        if (stream && videoRef.current && !videoRef.current.srcObject) {
            videoRef.current.srcObject = stream;
        }
    }, [stream, step]);

    // 1. Media Setup (Transition only)
    const handleAgree = async () => {
        setStep('media_setup');
        // We assume stream is ready from MediaManager, or will be shortly.
        // We set mic status to true to ensure MediaManager keeps recording if needed? 
        // MediaManager manages recording sending, but here we just want "Mic Active" state visually?
        // Actually setMicStatus is used by MediaManager to start/stop. 
        // We can set it to true to hint we want it?
        // MediaManager logic: `if (shouldRecord && !isMicActive)`.
        // Calibration Phase is "CALIBRATION". MediaManager should handle it.
    };

    // 2. Snapshot & Face "Detection" (Simple Heuristic)
    const takeSnapshot = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;

        // Draw video frame to canvas
        ctx.drawImage(videoRef.current, 0, 0, 640, 480);

        // Face Detection Heuristic: Analyze center of image for brightness/contrast
        const frame = ctx.getImageData(160, 120, 320, 240); // Center crop
        const data = frame.data;
        let r, g, b, avg;
        let brightnessSum = 0;
        let minBrightness = 255;
        let maxBrightness = 0;

        for (let i = 0; i < data.length; i += 4) {
            r = data[i]; g = data[i + 1]; b = data[i + 2];
            avg = (r + g + b) / 3;
            brightnessSum += avg;
            if (avg < minBrightness) minBrightness = avg;
            if (avg > maxBrightness) maxBrightness = avg;
        }

        const avgBrightness = brightnessSum / (data.length / 4);
        const contrast = maxBrightness - minBrightness;

        // Thresholds
        if (avgBrightness < 30) {
            setDetectionError("Lighting is too dark. Please find a well-lit area.");
            return;
        }
        if (contrast < 40) {
            setDetectionError("Face not clearly detected (Low Contrast). Please face the camera.");
            return;
        }

        // Passed checks
        setDetectionError(null);
        const dataUrl = canvasRef.current.toDataURL('image/png');
        setSnapshot(dataUrl);
    };

    // 3. Submit
    const confirmOnboarding = async () => {
        if (!snapshot || !sessionId) return;
        setUploading(true);

        try {
            // Convert DataURL to Blob
            const res = await fetch(snapshot);
            const blob = await res.blob();
            await api.sessions.submitOnboarding(sessionId, blob);
            setStep('ready');
            // Trigger next phase? Usually backend sends 'state_update' via WS after onboarding.
            // We can wait or manually call a store update if backend doesn't trigger immediately.
        } catch (e) {
            console.error("Onboarding failed", e);
            setDetectionError("Upload failed. Please try again.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="w-full flex justify-center">
            <AnimatePresence mode="wait">

                {/* STEP 1: Terms & Conditions */}
                {step === 'tnc' && (
                    <motion.div
                        key="tnc"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="w-full max-w-2xl"
                    >
                        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-2xl p-8 space-y-6">
                            <div className="flex items-center gap-4 text-amber-500 mb-4">
                                <ShieldCheck className="w-10 h-10" />
                                <h2 className="text-2xl font-bold text-foreground">Exam Integrity Policy</h2>
                            </div>
                            <div className="prose prose-neutral dark:prose-invert prose-sm bg-muted/50 p-6 rounded-lg h-60 overflow-y-auto border border-border/30">
                                <h3 className="text-foreground mt-0">Academic Honesty Agreement</h3>
                                <p>By proceeding, you agree to the following conditions:</p>
                                <ul className="text-muted-foreground space-y-2">
                                    <li>You are the registered student for this record.</li>
                                    <li>No external aids (phones, notes, secondary screens) are permitted.</li>
                                    <li>Your microphone and camera will be active for the duration of the session.</li>
                                    <li>AI-based proctoring systems will monitor focus and audio patterns.</li>
                                    <li>Any detected malpractice will result in immediate termination of the session.</li>
                                </ul>
                            </div>
                            <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg border border-border/30 hover:bg-muted/50 transition-colors">
                                <Checkbox id="tnc" checked={tncAccepted} onCheckedChange={(c) => setTncAccepted(c === true)} className="border-border data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                                <label htmlFor="tnc" className="text-sm font-medium text-muted-foreground cursor-pointer select-none">
                                    I have read and accept the Terms & Conditions
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleAgree}
                                    disabled={!tncAccepted}
                                    className="bg-blue-600 hover:bg-blue-500 text-white"
                                >
                                    Agree & Continue <ChevronRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* STEP 2: Media Setup & Snapshot */}
                {(step === 'media_setup' || step === 'snapshot') && (
                    <motion.div
                        key="media"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="w-full max-w-2xl"
                    >
                        <Card className="bg-card/60 backdrop-blur-xl border-border/30 shadow-2xl p-8 space-y-6 flex flex-col items-center">
                            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Camera className="w-6 h-6 text-blue-400" /> Camera & Audio Check
                            </h2>

                            <div className="relative w-full max-w-md aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-border/30 group">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity ${snapshot ? 'opacity-0' : 'opacity-100'}`}
                                />

                                {/* Visualizer Overlay */}
                                <div className="absolute bottom-4 right-4 flex gap-1 items-end h-8">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i}
                                            className="w-1 bg-emerald-500 rounded-full transition-all duration-75"
                                            style={{ height: `${Math.max(4, (userVolume || 0) * 100 * (Math.random() + 0.5))}px` }}
                                        />
                                    ))}
                                </div>

                                {/* Snapshot Result Overlay */}
                                {snapshot && (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img src={snapshot} className="absolute inset-0 w-full h-full object-cover" alt="Snapshot" />
                                )}

                                <canvas ref={canvasRef} className="hidden" width={640} height={480} />
                            </div>

                            {/* Error Message */}
                            {detectionError && (
                                <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg text-sm animate-shake">
                                    <AlertCircle className="w-4 h-4" /> {detectionError}
                                </div>
                            )}

                            <div className="flex gap-4">
                                {!snapshot ? (
                                    <Button onClick={takeSnapshot} className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8">
                                        <Camera className="w-4 h-4 mr-2" /> Take Photo
                                    </Button>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button onClick={() => { setSnapshot(null); setDetectionError(null); }} variant="outline" className="border-border hover:bg-muted text-foreground">
                                            <RefreshCw className="w-4 h-4 mr-2" /> Retake
                                        </Button>
                                        <Button onClick={confirmOnboarding} disabled={uploading} className="bg-emerald-600 hover:bg-emerald-500 text-white">
                                            {uploading ? 'Verifying...' : 'Confirm & Join'}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            <div className="text-xs text-neutral-500 max-w-xs text-center">
                                Ensure your face is clearly visible. This photo will be used for session verification.
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* STEP 3: Ready (Calibration Active) - Minimal UI, No Card */}
                {step === 'ready' && (
                    <motion.div
                        key="ready"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center p-4 space-y-6 w-full"
                    >
                        <div className="space-y-4 text-center">
                            <CountDown20 />
                            <p className="text-2xl font-light text-foreground">
                                &quot;Are you ready?&quot;
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Say anything to begin the exam
                            </p>
                        </div>

                        {/* Volume Bar Visualizer - Prominent */}
                        <div className="flex gap-2 h-16 items-end justify-center w-full max-w-[300px] mt-8">
                            {Array.from({ length: 12 }).map((_, i) => {
                                const height = Math.max(15, (userVolume || 0) * 100 * (Math.random() * 0.5 + 0.8));
                                return (
                                    <div
                                        key={i}
                                        className="w-3 bg-primary/80 rounded-full transition-all duration-75 ease-out"
                                        style={{ height: `${height}%`, opacity: 0.5 + ((userVolume || 0) * 0.5) }}
                                    />
                                );
                            })}
                        </div>
                    </motion.div>
                )}

            </AnimatePresence>
        </div>
    );
};
