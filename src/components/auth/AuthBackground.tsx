'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

const AUTH_BACKGROUNDS = ['/auth-bg-1.webp', '/auth-bg-2.webp'] as const;

interface AuthBackgroundProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * Premium auth background with random image selection.
 * 
 * Design decisions:
 * - `useMemo` ensures the image is selected once per mount (no flicker on re-renders).
 * - Image is picked randomly — different on each full page load / navigation.
 * - Dark overlay ensures text readability regardless of which background is drawn.
 * - Layout is locked to 100dvh (dynamic viewport height for mobile address bar).
 * - Inner scroll container allows tall pages (register) to scroll within the viewport.
 */
export function AuthBackground({ children, className }: AuthBackgroundProps) {
    // Pick a random background image once per mount — stable across re-renders
    const bgImage = useMemo(
        () => AUTH_BACKGROUNDS[Math.floor(Math.random() * AUTH_BACKGROUNDS.length)],
        []
    );

    return (
        <div className={cn('relative h-dvh w-full overflow-hidden', className)}>
            {/* Background Image — fills viewport, cropped via object-cover */}
            <Image
                src={bgImage}
                alt=""
                fill
                priority
                quality={85}
                className="object-cover select-none pointer-events-none"
                sizes="100vw"
                aria-hidden="true"
            />

            {/* Dark Overlay — ensures text readability on all backgrounds */}
            <div
                className="absolute inset-0 z-[1] bg-black/60 backdrop-blur-[2px]"
                aria-hidden="true"
            />

            {/* Subtle noise texture for premium feel */}
            <div className="absolute inset-0 z-[2] opacity-[0.03] pointer-events-none mix-blend-overlay" aria-hidden="true">
                <svg className="w-full h-full" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <filter id="authNoiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.65"
                            numOctaves="3"
                            stitchTiles="stitch"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#authNoiseFilter)" />
                </svg>
            </div>

            {/* Scrollable content layer */}
            <div className="relative z-[3] h-full overflow-y-auto scrollbar-thin">
                {children}
            </div>
        </div>
    );
}
