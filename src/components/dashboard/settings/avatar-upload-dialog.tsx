'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ShieldCheck, UserCircle, SunMedium, Focus, Fingerprint, CheckCircle2, UserCheck2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface AvatarUploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: File | null;
    onUpload: (blob: Blob) => Promise<void>;
}

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}

function ConstraintItem({
    icon: Icon,
    title,
    description,
    status
}: {
    icon: any;
    title: string;
    description: string;
    status: 'idle' | 'checking' | 'error' | 'success'
}) {
    return (
        <div className="flex items-start gap-3 p-3 rounded-xl border border-border/40 bg-muted/20 transition-colors">
            <div className={cn(
                "p-2 rounded-lg shrink-0 mt-0.5",
                status === 'checking' ? "bg-primary/20 text-primary animate-pulse" :
                    status === 'success' ? "bg-emerald-500/10 text-emerald-600" :
                        status === 'error' ? "bg-destructive/10 text-destructive" :
                            "bg-muted-foreground/10 text-muted-foreground"
            )}>
                {status === 'checking' ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    status === 'success' ? <CheckCircle2 className="h-4 w-4" /> :
                        status === 'error' ? <AlertCircle className="h-4 w-4" /> :
                            <Icon className="h-4 w-4" />}
            </div>
            <div className="space-y-0.5">
                <p className={cn(
                    "font-medium text-[13px] tracking-tight leading-tight",
                    status === 'error' ? "text-destructive" : "text-foreground"
                )}>{title}</p>
                <p className="text-[12px] text-muted-foreground leading-snug">{description}</p>
            </div>
        </div>
    );
}

export function AvatarUploadDialog({ open, onOpenChange, file, onUpload }: AvatarUploadDialogProps) {
    const [imgSrc, setImgSrc] = useState<string>('');
    const imgRef = useRef<HTMLImageElement>(null);
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const [isUploading, setIsUploading] = useState(false);
    const [backendErrors, setBackendErrors] = useState<string[]>([]);
    const [verificationState, setVerificationState] = useState<'idle' | 'checking' | 'error'>('idle');
    const [localFile, setLocalFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (file) {
            setLocalFile(file);
        }
    }, [file]);

    useEffect(() => {
        if (localFile) {
            setCrop(undefined);
            setBackendErrors([]);
            setVerificationState('idle');
            const reader = new FileReader();
            reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
            reader.readAsDataURL(localFile);
        } else {
            setImgSrc('');
        }
    }, [localFile]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setLocalFile(e.target.files[0]);
            e.target.value = '';
        }
    };

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 35 / 45));
    }

    const generateCroppedImage = async (): Promise<Blob | null> => {
        if (!completedCrop || !imgRef.current) return null;

        const canvas = document.createElement('canvas');
        const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
        const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

        canvas.width = completedCrop.width * scaleX;
        canvas.height = completedCrop.height * scaleY;

        const ctx = canvas.getContext('2d');
        if (!ctx) return null;

        ctx.drawImage(
            imgRef.current,
            completedCrop.x * scaleX,
            completedCrop.y * scaleY,
            completedCrop.width * scaleX,
            completedCrop.height * scaleY,
            0,
            0,
            canvas.width,
            canvas.height,
        );

        return new Promise((resolve) => {
            canvas.toBlob((blob) => {
                resolve(blob);
            }, localFile?.type || 'image/jpeg', 0.95);
        });
    };

    const handleUploadClick = async () => {
        if (!completedCrop) return;

        setBackendErrors([]);
        setIsUploading(true);
        setVerificationState('checking');
        try {
            const croppedBlob = await generateCroppedImage();
            if (!croppedBlob) throw new Error('Could not crop image');

            await onUpload(croppedBlob);
            setVerificationState('idle');
            onOpenChange(false);
        } catch (error: any) {
            setVerificationState('error');
            const detail = error.response?.data?.detail;
            if (detail) {
                if (Array.isArray(detail)) {
                    setBackendErrors(detail);
                } else if (typeof detail === 'string') {
                    setBackendErrors([detail]);
                } else {
                    setBackendErrors([JSON.stringify(detail)]);
                }
            } else if (error.message) {
                setBackendErrors([error.message]);
            } else {
                setBackendErrors(['Verification failed due to unknown constraints.']);
            }
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !isUploading && onOpenChange(val)}>
            <DialogContent className="sm:max-w-4xl w-[95vw] md:h-[600px] h-[85vh] p-0 overflow-hidden bg-card border-border/60 shadow-2xl rounded-2xl flex flex-col">
                <VisuallyHidden>
                    <DialogTitle>Strict Identity Verification</DialogTitle>
                    <DialogDescription>Upload and crop your avatar</DialogDescription>
                </VisuallyHidden>
                <div className="flex flex-col md:flex-row flex-1 overflow-hidden min-h-0 w-full">

                    {/* Left Side: Interactive Canvas Area */}
                    <div className="flex-1 relative flex flex-col bg-muted/10 border-b md:border-b-0 md:border-r border-border/50 min-w-0">
                        {/* Decorative Grid */}
                        <div className="absolute inset-0 pattern-dots pattern-muted-foreground pattern-bg-transparent pattern-size-4 pattern-opacity-5 mix-blend-overlay"></div>

                        <div className="relative z-10 flex-1 flex flex-col p-4 md:p-8 items-center justify-center w-full h-full min-h-0">
                            <div className="w-full flex justify-between items-center mb-6 shrink-0 gap-4">
                                <span className="px-4 py-1.5 bg-background/80 backdrop-blur border border-border/50 rounded-full text-[13px] font-medium text-foreground shadow-sm flex items-center gap-2">
                                    <Focus className="w-4 h-4 text-primary" />
                                    Use handles to adjust crop
                                </span>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="bg-background/80 backdrop-blur text-[13px] font-medium shadow-sm hover:bg-muted"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                >
                                    Change Photo
                                </Button>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                            </div>

                            <div className="flex-1 w-full flex items-center justify-center min-h-0">
                                {imgSrc && (
                                    <div className="relative rounded-xl overflow-hidden shadow-2xl ring-1 ring-border/50 bg-black/40 flex flex-col items-center justify-center p-4 backdrop-blur-sm max-w-full max-h-full">

                                        {/* Biometric Scanning Overlay */}
                                        {isUploading && (
                                            <div className="absolute inset-0 z-50 pointer-events-none rounded-xl overflow-hidden ring-1 ring-primary/50">
                                                {/* Dark overlay */}
                                                <div className="absolute inset-0 bg-background/50 backdrop-blur-[2px]" />

                                                {/* Scanning horizontal line */}
                                                <div className="absolute left-0 right-0 h-[2px] bg-primary animate-scanner shadow-[0_0_15px_3px_var(--color-primary)]" />

                                                {/* Center icon */}
                                                <div className="absolute inset-0 flex items-center justify-center text-primary/80">
                                                    <UserCheck2 className="w-16 h-16 animate-pulse" strokeWidth={1} />
                                                </div>
                                            </div>
                                        )}

                                        <ReactCrop
                                            crop={crop}
                                            onChange={(_, percentCrop) => setCrop(percentCrop)}
                                            onComplete={(c) => setCompletedCrop(c)}
                                            aspect={35 / 45}
                                            className="max-h-full max-w-full rounded-md shadow-inner bg-black/50 overflow-hidden"
                                        >
                                            <img
                                                ref={imgRef}
                                                alt="Upload preview"
                                                src={imgSrc}
                                                onLoad={onImageLoad}
                                                className="max-h-[60vh] md:max-h-[400px] w-auto object-contain block"
                                            />
                                        </ReactCrop>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Side: Constraints & Information */}
                    <div className="w-full md:w-[400px] shrink-0 bg-background flex flex-col">
                        <div className="p-5 md:p-6 flex-1 flex flex-col overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-start gap-3 mb-5 shrink-0">
                                <div className="p-2.5 bg-gradient-to-br from-primary/20 to-primary/5 text-primary rounded-xl shadow-inner border border-primary/20 shrink-0">
                                    <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                                </div>
                                <div className="space-y-0.5 mt-0.5">
                                    <h3 className="font-semibold text-base tracking-tight text-foreground">Identity Scan</h3>
                                    <p className="text-[12px] text-muted-foreground leading-snug">
                                        Upload your passport size photo.
                                    </p>
                                </div>
                            </div>

                            {/* Real-time Checklist */}
                            <div className="space-y-3 mb-4 shrink-0">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Verification Criteria</h4>
                                    {(verificationState === 'checking' || verificationState === 'error') && (
                                        <span className={cn(
                                            "text-[10px] font-semibold px-2 py-0.5 rounded-full",
                                            verificationState === 'checking' ? "bg-primary/10 text-primary animate-pulse" : "bg-destructive/10 text-destructive"
                                        )}>
                                            {verificationState === 'checking' ? 'Processing...' : 'Scan Failed'}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-2.5">
                                    <ConstraintItem
                                        status={
                                            verificationState === 'checking' ? 'checking' :
                                                verificationState === 'error' ?
                                                    (backendErrors.some(e => e.toLowerCase().includes('face') || e.toLowerCase().includes('visib')) ? 'error' : 'idle')
                                                    : 'idle'
                                        }
                                        icon={UserCircle}
                                        title="Facial Visibility"
                                        description="Directly facing camera, no obstructions."
                                    />
                                    <ConstraintItem
                                        status={
                                            verificationState === 'checking' ? 'checking' :
                                                verificationState === 'error' ?
                                                    (backendErrors.some(e => e.toLowerCase().includes('light') || e.toLowerCase().includes('dark') || e.toLowerCase().includes('shadow')) ? 'error' : 'idle')
                                                    : 'idle'
                                        }
                                        icon={SunMedium}
                                        title="Proper Lighting"
                                        description="Even lighting across face, no harsh shadows."
                                    />
                                    <ConstraintItem
                                        status={
                                            verificationState === 'checking' ? 'checking' :
                                                verificationState === 'error' ?
                                                    (backendErrors.some(e => e.toLowerCase().includes('center') || e.toLowerCase().includes('scale') || e.toLowerCase().includes('size')) ? 'error' : 'idle')
                                                    : 'idle'
                                        }
                                        icon={Focus}
                                        title="Centering & Scale"
                                        description="Head takes up 60-80% of the crop circle."
                                    />
                                    <ConstraintItem
                                        status={
                                            verificationState === 'checking' ? 'checking' :
                                                verificationState === 'error' ?
                                                    (backendErrors.some(e => e.toLowerCase().includes('auth') || e.toLowerCase().includes('spoof') || e.toLowerCase().includes('internal') || e.toLowerCase().includes('system') || e.toLowerCase().includes('fail')) ? 'error' : 'idle')
                                                    : 'idle'
                                        }
                                        icon={Fingerprint}
                                        title="Authenticity Check"
                                        description="AI deepfake and image spoofing detection."
                                    />
                                </div>
                            </div>

                            {/* Footer Actions */}
                            <div className="mt-auto flex flex-col gap-2.5 shrink-0 pt-2">
                                {backendErrors.length > 0 && (
                                    <div className="p-3 rounded-lg border border-destructive/20 bg-destructive/10 text-destructive animate-in fade-in zoom-in-95 shadow-sm">
                                        <div className="flex items-center gap-1.5 font-medium mb-1.5 text-[12px]">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            Verification Unsuccessful
                                        </div>
                                        <ul className="list-disc pl-4 space-y-0.5 text-[11px] opacity-90 overflow-hidden text-ellipsis">
                                            {backendErrors.map((err, i) => (
                                                <li key={i}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <Button
                                    size="default"
                                    className="w-full font-medium h-10 rounded-xl shadow-md transition-all shrink-0"
                                    onClick={handleUploadClick}
                                    disabled={isUploading || !completedCrop}
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Analyzing Biometrics...
                                        </>
                                    ) : (
                                        'Verify & Upload'
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
