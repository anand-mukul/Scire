'use client';

import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three';
import { OrbParticles } from './OrbParticles';
import { DeviceTier } from '@/lib/visuals/capability';
import { Logger } from '@/lib/logger';

interface OrbCanvasProps {
    tier: DeviceTier;
    audioLevel: number;
    isAgentSpeaking: boolean;
    fsmState: string;
    variant?: 'normal' | 'aggressive';
}

// State-based color mapping
const getTargetColor = (fsmState: string, isAgentSpeaking: boolean, variant?: 'normal' | 'aggressive'): THREE.Color => {
    // Priority 1: Aggressive Mode (Integrity Violation)
    if (variant === 'aggressive') {
        return new THREE.Color(0xdc2626); // Red-600
    }

    const colors: Record<string, THREE.Color> = {
        auth: new THREE.Color(0x64748b),           // Slate
        calibration: new THREE.Color(0xfbbf24),    // Amber
        greeting: new THREE.Color(0x0ea5e9),       // Sky blue (Legacy support or mapped)
        question: new THREE.Color(0x0f766e),       // Teal (primary)
        listening: new THREE.Color(0x22c55e),      // Green
        evaluation: new THREE.Color(0x8b5cf6),     // Violet
        scaffold: new THREE.Color(0x06b6d4),       // Cyan
        transfer: new THREE.Color(0x0f766e),       // Teal
        end: new THREE.Color(0x10b981),            // Emerald
        terminated: new THREE.Color(0xef4444),     // Red
        IDLE: new THREE.Color(0x64748b),           // Fallback
    };

    // Priority 2: Agent Speaking
    if (isAgentSpeaking) {
        return new THREE.Color(0x06b6d4);
    }

    return colors[fsmState] || colors.IDLE;
};

export const OrbCanvas: React.FC<OrbCanvasProps> = ({
    tier,
    audioLevel,
    isAgentSpeaking,
    fsmState,
    variant = 'normal',
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isVisible, setIsVisible] = useState(true);

    // Pause rendering when tab is hidden
    useEffect(() => {
        const handleVisibility = () => {
            setIsVisible(document.visibilityState === 'visible');
        };
        document.addEventListener('visibilitychange', handleVisibility);
        return () => document.removeEventListener('visibilitychange', handleVisibility);
    }, []);

    // Handle Context Lost gracefully
    useEffect(() => {
        const handleContextLost = (event: Event) => {
            event.preventDefault();
            Logger.warn("OrbCanvas: WebGL Context Lost");
            // React Three Fiber usually handles restore, but we log and prevent default to allow restore
        };

        const handleContextRestored = () => {
            Logger.log("OrbCanvas: WebGL Context Restored");
        };

        const canvas = containerRef.current?.querySelector('canvas');
        if (canvas) {
            canvas.addEventListener('webglcontextlost', handleContextLost, false);
            canvas.addEventListener('webglcontextrestored', handleContextRestored, false);
        }

        return () => {
            if (canvas) {
                canvas.removeEventListener('webglcontextlost', handleContextLost);
                canvas.removeEventListener('webglcontextrestored', handleContextRestored);
            }
        };
    }, []);

    const targetColor = getTargetColor(fsmState, isAgentSpeaking, variant);

    return (
        <div ref={containerRef} className="w-full h-full">
            <Canvas
                dpr={tier === 'HIGH' ? [1, 2] : [1, 1]}
                camera={{ position: [0, 0, 6], fov: 50 }}
                gl={{
                    antialias: tier === 'HIGH',
                    alpha: true,
                    powerPreference: tier === 'HIGH' ? 'high-performance' : 'low-power',
                }}
                frameloop={isVisible ? 'always' : 'never'}
                onCreated={({ gl, scene, camera }) => {
                    // Cleanup on unmount
                    // R3F handles automatic disposal of objects attached to the scene,
                    // but manual disposal of global resources or non-scene items is good practice.
                    gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
                }}
            >
                <Suspense fallback={null}>
                    <OrbParticles
                        tier={tier}
                        audioLevel={audioLevel}
                        targetColor={targetColor}
                    />
                </Suspense>
            </Canvas>
        </div>
    );
};
