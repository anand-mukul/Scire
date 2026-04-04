'use client';

import React, { useState, useRef, useEffect } from 'react';
import ReactCrop, { type Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

export function AvatarUploadDialog({ open, onOpenChange, file, onUpload }: AvatarUploadDialogProps) {
  const [imgSrc, setImgSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isUploading, setIsUploading] = useState(false);
  const [backendErrors, setBackendErrors] = useState<string[]>([]);

  useEffect(() => {
    if (file) {
      setCrop(undefined); // Reset crop state on new image
      setBackendErrors([]);
      const reader = new FileReader();
      reader.addEventListener('load', () => setImgSrc(reader.result?.toString() || ''));
      reader.readAsDataURL(file);
    } else {
      setImgSrc('');
    }
  }, [file]);

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
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
      }, file?.type || 'image/jpeg', 0.95);
    });
  };

  const handleUploadClick = async () => {
    if (!completedCrop) return;
    
    setBackendErrors([]);
    setIsUploading(true);
    try {
        const croppedBlob = await generateCroppedImage();
        if (!croppedBlob) throw new Error('Could not crop image');
        
        await onUpload(croppedBlob);
        onOpenChange(false); // Close dialog on success
    } catch (error: any) {
        // Handle various error formats from the backend
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
            setBackendErrors(['An unknown error occurred during verification.']);
        }
    } finally {
        setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !isUploading && onOpenChange(val)}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Strict Identity Verification
          </DialogTitle>
          <DialogDescription>
            Our system strictly enforces passport-style photos for platform authenticity. 
            Ensure your face is clearly visible, directly facing the camera, and properly lit.
          </DialogDescription>
        </DialogHeader>

        {backendErrors.length > 0 && (
          <Alert variant="destructive" className="animate-in fade-in slide-in-from-top-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Verification Failed</AlertTitle>
            <AlertDescription>
                <ul className="list-disc pl-4 mt-2 space-y-1 text-sm">
                    {backendErrors.map((err, i) => (
                        <li key={i}>{err}</li>
                    ))}
                </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex flex-col items-center justify-center space-y-4">
          {imgSrc && (
            <div className="border border-border/50 rounded-lg overflow-hidden bg-black/5 flex items-center justify-center relative p-8 max-h-[50vh]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                circularCrop
                className="max-h-full max-w-full"
              >
                <img
                  ref={imgRef}
                  alt="Crop preview"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  className="max-h-[40vh] w-auto object-contain"
                />
              </ReactCrop>
            </div>
          )}

          <div className="flex gap-4 justify-end w-full mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isUploading}>
              Cancel
            </Button>
            <Button onClick={handleUploadClick} disabled={isUploading || !completedCrop}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying AI Constraints...
                </>
              ) : (
                'Verify & Upload'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
