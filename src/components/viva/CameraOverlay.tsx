import React from 'react';
import { Scan } from 'lucide-react';

interface CameraOverlayProps {
    status: 'idle' | 'scanning' | 'success' | 'error';
    message?: string;
}

export const CameraOverlay: React.FC<CameraOverlayProps> = ({ status, message }) => {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Guide Frame */}
            <div className={`
                relative w-64 h-80 rounded-[4rem] border-2 transition-all duration-500
                ${status === 'success' ? 'border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]' :
                    status === 'error' ? 'border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]' :
                        'border-white/30'}
            `}>
                {/* Corner Markers */}
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white/60 rounded-tl-3xl -mt-1 -ml-1" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white/60 rounded-tr-3xl -mt-1 -mr-1" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white/60 rounded-bl-3xl -mb-1 -ml-1" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white/60 rounded-br-3xl -mb-1 -mr-1" />

                {/* Scanning Beam */}
                {status === 'scanning' && (
                    <div className="absolute left-0 right-0 h-0.5 bg-blue-500/80 shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan" />
                )}

                {/* Status Icon */}
                {status === 'scanning' && (
                    <div className="absolute -top-12 left-0 right-0 flex justify-center animate-pulse">
                        <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/50 text-blue-200 px-3 py-1 rounded-full text-xs font-mono flex items-center gap-2">
                            <Scan className="w-3 h-3" />
                            SCANNING FACE
                        </div>
                    </div>
                )}
            </div>

            {/* Backdrop Dimming (Outside the frame) */}
            <svg className="absolute inset-0 w-full h-full text-black/50" preserveAspectRatio="none">
                <defs>
                    <mask id="mask">
                        <rect width="100%" height="100%" fill="white" />
                        <rect x="50%" y="50%" width="256" height="320" rx="64" transform="translate(-128, -160)" fill="black" />
                    </mask>
                </defs>
                <rect width="100%" height="100%" mask="url(#mask)" fill="currentColor" />
            </svg>

            {/* Status Message */}
            {message && (
                <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className={`inline-block px-4 py-2 rounded-lg backdrop-blur-md border text-sm font-medium ${status === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-200' :
                            status === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200' :
                                'bg-black/40 border-white/10 text-white'
                        }`}>
                        {message}
                    </p>
                </div>
            )}
        </div>
    );
};
