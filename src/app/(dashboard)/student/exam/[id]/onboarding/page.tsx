'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/network/api';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { cn } from '@/lib/utils';
import {
    CheckCircle, AlertCircle,
    ArrowRight, RefreshCw, Aperture, ShieldCheck,
    FileText, ScanFace, Info, Sun, UserCheck, Focus, Laptop, Minimize, Maximize, MonitorSmartphone, Smartphone, Users, MicOff
} from 'lucide-react';
import { AxiosError } from 'axios';
import { CameraOverlay } from '@/components/viva/CameraOverlay';
import MobileBlockScreen from '@/components/viva/MobileBlockScreen';
import { faceVerificationService } from '@/services/biometrics/faceVerificationService';



export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: sessionId } = React.use(params);
    const streamRef = useRef<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement | null>(null);

    // Use a callback ref to ensure the video stream is automatically attached 
    // whenever React safely mounts the <video> element into the DOM.
    const videoRefCallback = useCallback((node: HTMLVideoElement | null) => {
        videoRef.current = node;
        if (node && streamRef.current && streamRef.current.active) {
            node.srcObject = streamRef.current;
            node.play().catch(e => console.warn("Auto-play failed after remount:", e));
        }
    }, []);

    const [step, setStep] = useState(1);
    // Media State
    const [hasMediaAccess, setHasMediaAccess] = useState(false);

    // Capture State
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [scanMessage, setScanMessage] = useState("Position your face. Security checks active.");

    // --- Media Logic (Simplified) ---
    const startMedia = async () => {
        try {
            setError(null);

            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            streamRef.current = stream;
            setHasMediaAccess(true);

            // AudioContext access ensured

        } catch (err) {
            console.error('Media Access Error:', err);
            setHasMediaAccess(false);
            setError('Could not access camera. Please allow permissions.');
        }
    };

    // Attach stream to video when it mounts
    useEffect(() => {
        if (hasMediaAccess && streamRef.current && videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(e => console.error("Auto-play failed", e));
        }
    }, [hasMediaAccess]);

    useEffect(() => {
        if (step === 3) {
            startMedia();
            setScanStatus('idle');
            setScanMessage("Position your face. Security checks active.");
        }
        return () => {
            if (streamRef.current && step !== 3) {
                // Keep stream alive if we are just switching back and forth, 
                // but actually we only mount local tracking on step 3. 
                // For safety, cleanup on unmount.
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [step]);

    // --- Actions ---
    const goToStep = (newStep: number) => {
        setStep(newStep);
    };

    const handleSmartRetry = () => {
        setError(null);
        setCapturedImage(null);
        setScanStatus('idle');

        // Only restart media if the stream is broken
        if (!streamRef.current || !streamRef.current.active) {
            startMedia();
        }
        // If it is active, dropping capturedImage will remount <video>
        // and videoRefCallback will handle the play() automatically.
    };

    const handleCapture = async () => {
        if (!videoRef.current || !hasMediaAccess) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw directly (unmirrored for ML processing, but CSS flips it visually for UI)
        ctx.drawImage(videoRef.current, 0, 0);

        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;


        let r, g, b, avg;
        let brightnessSum = 0;
        let varianceSum = 0;

        // Focus on center 50%
        const startX = Math.floor(canvas.width * 0.25);
        const endX = Math.floor(canvas.width * 0.75);
        const startY = Math.floor(canvas.height * 0.25);
        const endY = Math.floor(canvas.height * 0.75);

        let pixelCount = 0;

        for (let y = startY; y < endY; y += 4) { // Sample every 4th row
            for (let x = startX; x < endX; x += 4) { // Sample every 4th col
                const i = (y * canvas.width + x) * 4;

                r = data[i];
                g = data[i + 1];
                b = data[i + 2];
                avg = (r + g + b) / 3;

                brightnessSum += avg;

                // Simple Edge/Texture Detection (Difference from neighbor)
                // Compare with pixel 4 steps to the right
                if (x + 4 < endX) {
                    const i2 = (y * canvas.width + (x + 4)) * 4;
                    const avg2 = (data[i2] + data[i2 + 1] + data[i2 + 2]) / 3;
                    varianceSum += Math.abs(avg - avg2);
                }

                pixelCount++;
            }
        }

        const avgBrightness = brightnessSum / pixelCount;
        const avgVariance = varianceSum / pixelCount;



        // Check 1: Too Dark
        if (avgBrightness < 20) {
            setError("Lighting is too poor. Please face a light source.");
            return;
        }

        // Check 2: Too Bright / Whiteout
        if (avgBrightness > 240) {
            setError("Too much backlighting. Please adjust your position.");
            return;
        }

        // Check 3: Flat Image (Wall/Solid Color, low variance)
        if (avgVariance < 3.5) {
            setError("No face detected. Please ensure your face is clearly visible and centered.");
            return;
        }

        const dataUrl = canvas.toDataURL('image/png');

        setScanStatus('scanning');
        setScanMessage("Analyzing facial features...");

        // Real ML face detection instead of fake delay
        try {
            await faceVerificationService.initialize();
            const detection = await faceVerificationService.captureBaseline(videoRef.current);

            if (!detection.detected || !detection.descriptor) {
                setError("We couldn't clearly detect your face. Please ensure you are well-lit and looking directly at the camera.");
                setScanStatus('idle');
                return;
            }
        } catch (err) {
            console.error("ML Face detection failed to load or run:", err);
            // If the models fail to load entirely (e.g. adblocker blocking jsdelivr), 
            // we don't block the user, we just capture the image without embeddings.
        }

        setCapturedImage(dataUrl);
        setScanStatus('success');
        setScanMessage("Identity Verified");
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setScanStatus('idle');
        setScanMessage("Position your face. Security checks active.");
        // React will remount <video>, the videoRefCallback handles stream re-attachment.
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;
        setIsLoading(true);
        setError(null);

        try {
            // Request full screen
            if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen().catch(err => {
                    console.warn(`Error attempting to enable fullscreen: ${err.message}`);
                });
            }

            const res = await fetch(capturedImage);
            const blob = await res.blob();

            // Get the descriptor if ML detection succeeded
            const descriptor = faceVerificationService.getBaseline() || undefined;

            await api.sessions.submitOnboarding(sessionId, blob, descriptor);
            router.push(`/student/exam/${sessionId}/session`);
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || 'Submission failed.');
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-full min-h-screen w-full overflow-hidden bg-background flex items-center justify-center font-sans p-4 md:p-6 text-foreground">
            {/* Mobile Device Blocker — must be first */}
            <MobileBlockScreen />



            {/* Main Card Container */}
            <div
                className="w-full max-w-[900px] min-h-[600px] md:min-h-[550px] h-auto max-h-[90vh] bg-card/40 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative group animate-in fade-in zoom-in-95 duration-300"
            >
                {/* Glow Effect */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />

                {/* Left Sidebar: Stepper */}
                <div className="w-full md:w-72 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col justify-between z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-lg shadow-primary/20">
                                <ShieldCheck size={18} />
                            </div>
                            <span className="font-bold text-lg text-foreground tracking-tight">ExamGuard</span>
                        </div>

                        <nav className="space-y-1">
                            {[
                                { id: 1, label: 'Agreement', icon: FileText },
                                { id: 2, label: 'Integrity Rules', icon: Info },
                                { id: 3, label: 'Identity Check', icon: ScanFace }
                            ].map((s) => (
                                <div
                                    key={s.id}
                                    className={cn(
                                        "flex items-center gap-3 p-3 rounded-xl transition-all duration-300",
                                        step === s.id
                                            ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                                            : step > s.id
                                                ? 'text-primary/70'
                                                : 'text-muted-foreground'
                                    )}
                                >
                                    <div className="relative">
                                        {step > s.id ? (
                                            <CheckCircle size={18} />
                                        ) : (
                                            <s.icon size={18} />
                                        )}
                                        {step === s.id && (
                                            <div
                                                className="absolute -inset-1 rounded-full bg-primary/20 blur-sm"
                                            />
                                        )}
                                    </div>
                                    <span className="font-medium text-sm">{s.label}</span>
                                </div>
                            ))}
                        </nav>
                    </div>

                    <div className="text-xs text-muted-foreground font-mono opacity-60">
                        SID: {sessionId.slice(0, 8)}
                    </div>
                </div>

                {/* Right Content Area */}
                <div className="flex-1 relative overflow-hidden flex flex-col">
                    <div
                        key={step}
                        className="flex-1 h-full p-6 md:p-10 flex flex-col animate-in fade-in duration-200"
                    >
                        {/* Step 1: Policy */}
                        {step === 1 && (
                            <div className="h-full flex flex-col">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-foreground mb-2">Academic Integrity</h2>
                                    <p className="text-muted-foreground">Review and accept the session terms to proceed.</p>
                                </div>

                                <ScrollArea className="flex-1 h-full bg-muted/10 rounded-xl border border-border p-5 mb-6">
                                    <div className="space-y-6">
                                        <p className="font-semibold text-foreground">By proceeding, you agree to the following conditions:</p>

                                        <div className="space-y-4">
                                            <div className="flex gap-4 items-start">
                                                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg"><UserCheck className="w-5 h-5 text-primary" /></div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-foreground">Identity Verification</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">You must be the registered student for this assessment. Your session will be biometrically matched against your baseline profile.</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 items-start">
                                                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg"><MonitorSmartphone className="w-5 h-5 text-primary" /></div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-foreground">Continuous Monitoring</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">Your webcam, microphone, head pose, and ambient lighting will be continuously monitored by our AI tracking engine.</p>
                                                </div>
                                            </div>

                                            <div className="flex gap-4 items-start">
                                                <div className="mt-0.5 bg-primary/10 p-2 rounded-lg"><Maximize className="w-5 h-5 text-primary" /></div>
                                                <div>
                                                    <h4 className="text-sm font-semibold text-foreground">Environment Control</h4>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">The exam requires Fullscreen mode. Exiting fullscreen, switching tabs, or using external devices may result in immediate termination.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <p className="text-xs text-muted-foreground/70 pt-4 border-t border-border mt-4 italic">
                                            * This session is recorded for automated proctoring analysis. Data is processed securely according to our privacy policy.
                                        </p>
                                    </div>
                                </ScrollArea>

                                <div className="flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3">
                                        <Checkbox
                                            id="terms"
                                            checked={termsAccepted}
                                            onCheckedChange={(c) => setTermsAccepted(!!c)}
                                            className="border-primary/50 data-[state=checked]:bg-primary"
                                        />
                                        <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer select-none">
                                            I accept the academic integrity policy
                                        </label>
                                    </div>
                                    <Button
                                        onClick={() => goToStep(2)}
                                        disabled={!termsAccepted}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        Next <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Rules (Do's and Don'ts) */}
                        {step === 2 && (
                            <div className="h-full flex flex-col animate-in slide-in-from-right-8 duration-500">
                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-foreground mb-2">Exam Environment</h2>
                                    <p className="text-muted-foreground">Please review these critical guidelines before beginning.</p>
                                </div>

                                <ScrollArea className="flex-1 border border-border bg-muted/10 rounded-xl p-4 mb-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Do's Column */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-green-500 font-semibold border-b border-green-500/20 pb-2">
                                                <CheckCircle size={20} />
                                                <h3>Do's</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                <li className="flex gap-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                                    <Sun className="text-green-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">Sit in a well-lit room</span>
                                                        <span className="text-muted-foreground">Ensure your face is clearly visible to the camera.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                                    <Laptop className="text-green-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">Keep your device stable</span>
                                                        <span className="text-muted-foreground">Place your laptop on a flat surface.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 bg-green-500/5 p-3 rounded-lg border border-green-500/10">
                                                    <Focus className="text-green-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">Look directly at the screen</span>
                                                        <span className="text-muted-foreground">Gaze tracking is active; maintain eye contact.</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>

                                        {/* Don'ts Column */}
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-2 text-rose-500 font-semibold border-b border-rose-500/20 pb-2">
                                                <AlertCircle size={20} />
                                                <h3>Don'ts</h3>
                                            </div>
                                            <ul className="space-y-4">
                                                <li className="flex gap-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                                    <Smartphone className="text-rose-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">No secondary devices</span>
                                                        <span className="text-muted-foreground">Phones/tablets will trigger an illumination spike.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                                    <Users className="text-rose-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">No other people</span>
                                                        <span className="text-muted-foreground">Your microphone listens for whispering/voices.</span>
                                                    </div>
                                                </li>
                                                <li className="flex gap-3 bg-rose-500/5 p-3 rounded-lg border border-rose-500/10">
                                                    <Minimize className="text-rose-500 shrink-0" size={20} />
                                                    <div className="text-sm">
                                                        <span className="block font-medium text-foreground">Do not exit Fullscreen</span>
                                                        <span className="text-muted-foreground">Leaving the exam tab halts the assessment.</span>
                                                    </div>
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </ScrollArea>

                                <div className="flex items-center justify-between pt-2">
                                    <Button variant="ghost" onClick={() => goToStep(1)}>
                                        Back
                                    </Button>
                                    <Button
                                        onClick={() => goToStep(3)}
                                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                    >
                                        I Understand <ArrowRight className="ml-2 w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Camera */}
                        {step === 3 && (
                            <div className="h-full flex flex-col items-center">
                                <div className="relative w-full flex-1 bg-black rounded-2xl overflow-hidden border border-border shadow-2xl group mb-6">
                                    {/* Video / Image */}
                                    {capturedImage ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                                    ) : hasMediaAccess ? (
                                        <video
                                            ref={videoRefCallback}
                                            autoPlay
                                            muted
                                            playsInline
                                            className="w-full h-full object-cover transform scale-x-[-1] z-0 relative"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground gap-3">
                                            <PremiumLoader size="sm" text="Initializing Camera..." />
                                        </div>
                                    )}

                                    {/* Overlays */}
                                    <CameraOverlay status={scanStatus} message={scanMessage} />

                                    {error && (
                                        <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center z-20 backdrop-blur-sm">
                                            <div className="max-w-md space-y-4 bg-black/50 border border-destructive/50 p-6 rounded-2xl shadow-2xl shadow-destructive/20">
                                                <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                                                <p className="text-white text-lg font-medium leading-relaxed">{error}</p>
                                                <Button onClick={handleSmartRetry} className="bg-destructive hover:bg-destructive/90 text-white w-full">Retry Scanning</Button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Controls */}
                                <div className="w-full flex items-center justify-between pt-2">
                                    <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => goToStep(2)}>
                                        Back
                                    </Button>

                                    <div className="flex gap-2">
                                        {capturedImage ? (
                                            <>
                                                <Button variant="outline" onClick={handleRetake} disabled={isLoading} className="border-border hover:bg-secondary text-foreground">
                                                    <RefreshCw className="mr-2 w-4 h-4" /> Retake
                                                </Button>
                                                <Button
                                                    onClick={handleSubmit}
                                                    disabled={isLoading}
                                                    className="bg-primary hover:bg-primary/90 text-primary-foreground min-w-[140px]"
                                                >
                                                    {isLoading ? <PremiumLoader size="sm" text="" className="scale-75" /> : (
                                                        <>Start Session <ArrowRight className="ml-2 w-4 h-4" /></>
                                                    )}
                                                </Button>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={handleCapture}
                                                disabled={!hasMediaAccess}
                                                className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-lg shadow-blue-500/20"
                                            >
                                                <Aperture className="mr-2 w-4 h-4" /> Capture Photo
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
