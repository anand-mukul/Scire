'use client';

import React, { useEffect, useState } from 'react';
import { useSessionStore } from '@/lib/store/session-store';
import { detectDeviceTier, DeviceTier } from '@/lib/visuals/capability';
import { OrbCanvas } from './OrbCanvas';
import { OrbFallback } from './OrbFallback';

// Error boundary for WebGL failures
class OrbErrorBoundary extends React.Component<
    { children: React.ReactNode; onError: () => void },
    { hasError: boolean }
> {
    constructor(props: { children: React.ReactNode; onError: () => void }) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch() {
        this.props.onError();
    }

    render() {
        if (this.state.hasError) {
            return null; // Parent will render fallback
        }
        return this.props.children;
    }
}

export default function AIOrb() {
    const [tier, setTier] = useState<DeviceTier | null>(null);
    const [webglFailed, setWebglFailed] = useState(false);

    const fsmState = useSessionStore((state) => state.fsmState) || 'IDLE';
    const isAgentSpeaking = useSessionStore((state) => state.isAgentSpeaking);
    // Use agent volume if agent is speaking, otherwise user volume (mic input)
    const volumeLevel = useSessionStore((state) => isAgentSpeaking ? state.agentVolume : state.userVolume);
    const violation = useSessionStore((state) => state.violation);

    const variant = violation.isWarning ? 'aggressive' : 'normal';

    // Detect device tier on mount
    useEffect(() => {
        const detectedTier = detectDeviceTier();
        setTier(detectedTier);
    }, []);

    const handleWebGLError = () => {
        setWebglFailed(true);
    };

    // Loading state - tier detection not yet complete
    if (tier === null) {
        return (
            <div className="w-full h-full flex items-center justify-center">
                <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-teal-600/30 to-cyan-400/30 animate-pulse" />
            </div>
        );
    }

    // Determine effective tier (fallback on WebGL failure)
    const effectiveTier: DeviceTier = webglFailed ? 'LOW' : tier;

    return (
        <div className="w-full h-full flex items-center justify-center relative">
            <div className="w-full max-w-sm aspect-square relative selection:bg-none">
                {effectiveTier === 'LOW' ? (
                    <OrbFallback
                        audioLevel={volumeLevel}
                        isAgentSpeaking={isAgentSpeaking}
                        fsmState={fsmState}
                    />
                ) : (
                    <OrbErrorBoundary onError={handleWebGLError}>
                        <OrbCanvas
                            tier={effectiveTier}
                            audioLevel={volumeLevel}
                            isAgentSpeaking={isAgentSpeaking}
                            fsmState={fsmState}
                            variant={variant}
                        />
                    </OrbErrorBoundary>
                )}

                {/* State Indicator Overlay */}
                <div className="absolute bottom-0 left-0 right-0 text-center pb-4 pointer-events-none">
                    <span className="text-xs font-mono text-white/40 uppercase tracking-[0.2em] backdrop-blur-sm px-3 py-1 rounded-full bg-white/5 border border-white/5">
                        {fsmState}
                    </span>
                </div>
            </div>
        </div>
    );
}