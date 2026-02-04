'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { useTenant } from '@/contexts/TenantContext';

interface AmbientGlowProps {
    className?: string;
    intensity?: 'subtle' | 'normal' | 'intense';
}

export function AmbientGlow({ className, intensity = 'normal' }: AmbientGlowProps) {
    const { tenantPrimaryColor } = useTenant();

    const opacity = {
        subtle: 0.3,
        normal: 0.5,
        intense: 0.8,
    }[intensity];

    return (
        <div className={cn("fixed inset-0 -z-50 overflow-hidden pointer-events-none", className)}>
            {/* Primary Orb - Follows tenant branding if available */}
            <motion.div
                animate={{
                    scale: [1, 1.2, 1],
                    opacity: [opacity * 0.5, opacity, opacity * 0.5],
                }}
                transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full blur-[100px]"
                style={{
                    background: tenantPrimaryColor
                        ? `radial-gradient(circle, ${tenantPrimaryColor}40 0%, transparent 70%)`
                        : 'radial-gradient(circle, var(--primary) 0%, transparent 70%)',
                    opacity: opacity
                }}
            />

            {/* Secondary Orb - Deep Blue/Purple */}
            <motion.div
                animate={{
                    scale: [1.2, 1, 1.2],
                    opacity: [opacity * 0.3, opacity * 0.6, opacity * 0.3],
                }}
                transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 1
                }}
                className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[120px]"
                style={{
                    background: 'radial-gradient(circle, oklch(0.35 0.15 270 / 0.3) 0%, transparent 70%)'
                }}
            />

            {/* Accent Orb - Floating */}
            <motion.div
                animate={{
                    x: ['-10%', '10%', '-10%'],
                    y: ['-10%', '10%', '-10%'],
                }}
                transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear"
                }}
                className="absolute top-[30%] left-[30%] w-[30vw] h-[30vw] rounded-full blur-[80px] opacity-20 bg-accent/20"
            />
        </div>
    );
}
