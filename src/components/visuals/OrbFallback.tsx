'use client';

import React from 'react';

interface OrbFallbackProps {
    audioLevel: number;
    isAgentSpeaking: boolean;
    fsmState?: string;
}

/**
 * CSS Fallback Orb for LOW tier devices (no WebGL).
 * Provides basic visual feedback with audio pulse and speaking indicator.
 */
export const OrbFallback: React.FC<OrbFallbackProps> = ({
    audioLevel,
    isAgentSpeaking,
    fsmState = 'IDLE',
}) => {
    // Determine color based on FSM state
    let colorClass = 'from-teal-500 to-cyan-400'; // Default teal
    if (fsmState === 'LISTENING') {
        colorClass = 'from-emerald-500 to-green-400';
    } else if (fsmState === 'QUESTION' || fsmState === 'THINKING') {
        colorClass = 'from-amber-500 to-yellow-400';
    } else if (fsmState === 'RESPONDING') {
        colorClass = 'from-cyan-500 to-sky-400';
    } else if (!fsmState || fsmState === 'IDLE') {
        colorClass = 'from-gray-400 to-gray-500';
    }

    // Audio-reactive scale (1.0 to 1.15)
    const scale = 1.0 + audioLevel * 0.15;

    // Glow intensity based on speaking state
    const glowOpacity = isAgentSpeaking ? 0.6 : 0.3;

    return (
        <div className="relative w-48 h-48 flex items-center justify-center mx-auto">
            {/* Outer Glow */}
            <div
                className={`absolute w-full h-full rounded-full bg-gradient-to-br ${colorClass} blur-3xl transition-opacity duration-300`}
                style={{ opacity: glowOpacity, transform: `scale(${scale * 1.2})` }}
            />

            {/* Middle Layer */}
            <div
                className={`absolute w-3/4 h-3/4 rounded-full bg-gradient-to-tr ${colorClass} blur-xl opacity-50 transition-transform duration-150`}
                style={{ transform: `scale(${scale})` }}
            />

            {/* Core */}
            <div
                className={`relative w-1/2 h-1/2 rounded-full bg-gradient-to-br ${colorClass} shadow-lg transition-transform duration-100`}
                style={{ transform: `scale(${scale})` }}
            />

            {/* Subtle Pulse Animation */}
            <div
                className={`absolute w-1/2 h-1/2 rounded-full bg-gradient-to-br ${colorClass} animate-ping opacity-20`}
            />
        </div>
    );
};
