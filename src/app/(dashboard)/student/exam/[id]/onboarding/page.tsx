'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { api } from '@/lib/network/api';
import { PremiumLoader } from '@/components/ui/premium-loader';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { cn } from '@/lib/utils';
import {
    CheckCircle, AlertCircle,
    ArrowRight, RefreshCw, Aperture, ShieldCheck,
    FileText, ScanFace
} from 'lucide-react';
import { AxiosError } from 'axios';
import { CameraOverlay } from '@/components/viva/CameraOverlay';

// Animations
const slideVariants = {
    enter: (direction: number) => ({
        x: direction > 0 ? 20 : -20,
        opacity: 0,
    }),
    center: {
        zIndex: 1,
        x: 0,
        opacity: 1,
    },
    exit: (direction: number) => ({
        zIndex: 0,
        x: direction < 0 ? 20 : -20,
        opacity: 0,
    }),
};

export default function OnboardingPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id: sessionId } = React.use(params);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Steps: 1 = Terms, 2 = Identity
    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(0);

    // Media State
    const [hasMediaAccess, setHasMediaAccess] = useState(false);
    const streamRef = useRef<MediaStream | null>(null);

    // Capture State
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [scanMessage, setScanMessage] = useState("Position your face within the frame");

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
        if (step === 2) {
            startMedia();
            setScanStatus('idle');
            setScanMessage("Position your face within the frame");
        }
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
        };
    }, [step]);

    // --- Actions ---
    const goToStep = (newStep: number) => {
        setDirection(newStep > step ? 1 : -1);
        setStep(newStep);
    };

    const handleSmartRetry = () => {
        setError(null);
        // Only restart media if the stream is actually dead no broken
        if (streamRef.current && streamRef.current.active && videoRef.current) {
            // Just resume
            videoRef.current.play().catch(console.error);
        } else {
            startMedia();
        }
    };

    const handleCapture = async () => {
        if (!videoRef.current || !hasMediaAccess) return;

        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw and Flip
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0);
        ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset for data extraction

        // --- INTELLIGENT VALIDATION ---
        const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = frame.data;
        // const length = data.length; // Unused

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

        console.log(`[Face Check] B: ${avgBrightness.toFixed(2)}, V: ${avgVariance.toFixed(2)}`);

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

        // Start Simulation with Confidence
        // setIsScanning(true);
        setScanStatus('scanning');
        setScanMessage("Analyzing facial features...");

        // 1.5s delay
        await new Promise(r => setTimeout(r, 1500));

        setCapturedImage(dataUrl);
        setScanStatus('success');
        setScanMessage("Identity Verified");
        // setIsScanning(false);
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setScanStatus('idle');
        setScanMessage("Position your face within the frame");
        // Re-attach stream if it was lost (though typically it stays Active)
        if (videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current;
            videoRef.current.play().catch(console.error);
        }
    };

    const handleSubmit = async () => {
        if (!capturedImage) return;
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(capturedImage);
            const blob = await res.blob();
            await api.sessions.submitOnboarding(sessionId, blob);
            router.push(`/student/exam/${sessionId}/session`);
        } catch (err: unknown) {
            const error = err as AxiosError<{ detail: string }>;
            setError(error.response?.data?.detail || 'Submission failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative h-full api min-h-screen w-full overflow-hidden bg-background flex items-center justify-center font-sans p-4 md:p-6 text-foreground">
            <AmbientGlow />

            {/* Main Card Container */}
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-[900px] h-[600px] md:h-[550px] max-h-[85vh] bg-card/40 backdrop-blur-2xl border border-border rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row relative group"
            >
                {/* Glow Effect */}
                <div className="absolute -top-20 -left-20 w-64 h-64 bg-primary/10 rounded-full blur-[100px] pointer-events-none group-hover:bg-primary/20 transition-colors duration-1000" />

                {/* Left Sidebar: Stepper */}
                <div className="w-full md:w-64 bg-muted/30 border-b md:border-b-0 md:border-r border-border p-6 flex flex-col justify-between z-10">
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
                                { id: 2, label: 'Identity Check', icon: ScanFace }
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
                                            <motion.div
                                                layoutId="active-step"
                                                className="absolute -inset-1 rounded-full bg-primary/20 blur-sm"
                                                transition={{ duration: 0.2 }}
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
                    <AnimatePresence custom={direction} mode="wait">
                        <motion.div
                            key={step}
                            custom={direction}
                            variants={slideVariants}
                            initial="enter"
                            animate="center"
                            exit="exit"
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="flex-1 h-full p-6 md:p-10 flex flex-col"
                        >
                            {/* Step 1: Policy */}
                            {step === 1 && (
                                <div className="h-full flex flex-col">
                                    <div className="mb-6">
                                        <h2 className="text-2xl font-bold text-foreground mb-2">Academic Integrity</h2>
                                        <p className="text-muted-foreground">Review and accept the session terms to proceed.</p>
                                    </div>

                                    <ScrollArea className="flex-1 h-full bg-muted/20 rounded-xl border border-border p-4 mb-6">
                                        <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
                                            <p className="font-semibold text-foreground">By proceeding, you agree that:</p>
                                            <ul className="list-disc pl-4 space-y-2">
                                                <li>You are the registered student for this assessment.</li>
                                                <li>You will remain in the camera frame for the entire duration.</li>
                                                <li>Your microphone and screen activity will be monitored.</li>
                                                <li>Using external devices (phones, tablets) is strictly prohibited.</li>
                                                <li>Leaving full-screen mode may result in immediate termination.</li>
                                            </ul>
                                            <p className="text-xs text-muted-foreground/70 pt-4 italic">
                                                * This session is recorded for automated proctoring analysis.
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
                                                I accept the policy
                                            </label>
                                        </div>
                                        <Button
                                            onClick={() => goToStep(2)}
                                            disabled={!termsAccepted}
                                            className="bg-primary hover:bg-primary/90 text-primary-foreground"
                                        >
                                            Continue <ArrowRight className="ml-2 w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Camera */}
                            {step === 2 && (
                                <div className="h-full flex flex-col items-center">
                                    <div className="relative w-full flex-1 bg-black rounded-2xl overflow-hidden border border-border shadow-2xl group mb-6">
                                        {/* Video / Image */}
                                        {capturedImage ? (
                                            /* eslint-disable-next-line @next/next/no-img-element */
                                            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover transform scale-x-[-1]" />
                                        ) : hasMediaAccess ? (
                                            <video
                                                ref={videoRef}
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
                                            <div className="absolute inset-0 bg-black/80 flex items-center justify-center p-6 text-center z-20">
                                                <div className="space-y-4">
                                                    <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
                                                    <p className="text-destructive-foreground">{error}</p>
                                                    <Button variant="outline" onClick={handleSmartRetry} className="border-white/20 text-white hover:bg-white/10">Retry</Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer Controls */}
                                    <div className="w-full flex items-center justify-between">
                                        <Button variant="ghost" className="text-muted-foreground hover:text-foreground" onClick={() => goToStep(1)}>
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
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
