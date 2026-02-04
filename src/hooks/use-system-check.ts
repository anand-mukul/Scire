import { useState, useEffect } from 'react';

export type SystemStatus = 'idle' | 'checking' | 'ready' | 'error' | 'denied';

export interface SystemCheckState {
    microphone: SystemStatus;
    camera: SystemStatus;
    network: SystemStatus;
    message?: string;
}

export function useSystemCheck() {
    const [status, setStatus] = useState<SystemCheckState>({
        microphone: 'idle',
        camera: 'idle',
        network: 'idle',
    });

    const checkSystem = async () => {
        setStatus(prev => ({ ...prev, microphone: 'checking', camera: 'checking', network: 'checking' }));

        // 1. Check Network
        let netStatus: SystemStatus = 'ready';
        try {
            if (!navigator.onLine) {
                netStatus = 'error';
            } else {
                // Simple fetch to verify connectivity (lightweight)
                const start = performance.now();
                await fetch('/api/health', { method: 'HEAD', cache: 'no-store' });
                // const duration = performance.now() - start;
                // Could use duration for "Slow" warning if needed
            }
        } catch (e) {
            // Fallback for network error (cors or offline)
            netStatus = navigator.onLine ? 'ready' : 'error';
        }

        // 2. Check Media (Microphone & Camera)
        let micStatus: SystemStatus = 'error';
        let camStatus: SystemStatus = 'error';

        try {
            // We request both first
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

            // If we get here, we have access
            if (stream.getAudioTracks().length > 0) micStatus = 'ready';
            if (stream.getVideoTracks().length > 0) camStatus = 'ready';

            // Clean up immediately
            stream.getTracks().forEach(t => t.stop());

        } catch (err) {
            const error = err as DOMException;
            if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
                micStatus = 'denied';
                camStatus = 'denied';
            } else if (error.name === 'NotFoundError') {
                micStatus = 'error';
                camStatus = 'error';
            } else {
                // If checking both fails, let's try individually to be more specific?
                // For now, assume if batch request fails, both are susceptible. 
                // But typically users want to know WHICH one failed.

                // Retry Audio Only
                try {
                    const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    micStatus = 'ready';
                    audioStream.getTracks().forEach(t => t.stop());
                } catch (e) {
                    const e2 = e as DOMException;
                    if (e2.name === 'NotAllowedError') micStatus = 'denied';
                }

                // Retry Video Only
                try {
                    const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
                    camStatus = 'ready';
                    videoStream.getTracks().forEach(t => t.stop());
                } catch (e) {
                    const e2 = e as DOMException;
                    if (e2.name === 'NotAllowedError') camStatus = 'denied';
                }
            }
        }

        setStatus({
            network: netStatus,
            microphone: micStatus,
            camera: camStatus
        });
    };

    // Run on mount
    useEffect(() => {
        checkSystem();

        const handleOnline = () => setStatus(s => ({ ...s, network: 'ready' }));
        const handleOffline = () => setStatus(s => ({ ...s, network: 'error' }));

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    return { status, checkSystem };
}
