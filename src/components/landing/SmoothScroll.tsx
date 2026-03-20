'use client';

import { useEffect, useRef } from 'react';
import Lenis from 'lenis';

interface SmoothScrollProps {
    children: React.ReactNode;
}

/**
 * Lenis smooth scroll wrapper for the landing page.
 *
 * - Normalizes scroll across trackpads, mice, and touch.
 * - Keeps native scrollbar and position: sticky support.
 * - Syncs with framer-motion's useScroll via the native scroll event.
 * - Handles anchor links (href="#section") with smooth scrollTo.
 */
export function SmoothScroll({ children }: SmoothScrollProps) {
    const lenisRef = useRef<Lenis | null>(null);

    useEffect(() => {
        const lenis = new Lenis({
            duration: 1.2,          // Scroll duration (seconds)
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential ease-out
            touchMultiplier: 2,     // Touch scroll sensitivity
            infinite: false,
        });

        lenisRef.current = lenis;

        // rAF loop — Lenis hooks into the native scroll position
        function raf(time: number) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Intercept anchor link clicks for smooth scrolling
        function handleAnchorClick(e: MouseEvent) {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a[href*="#"]') as HTMLAnchorElement | null;

            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href) return;

            // Only handle same-page anchors (/#section or #section)
            const hashIndex = href.indexOf('#');
            if (hashIndex === -1) return;

            const hash = href.substring(hashIndex);
            const pathname = href.substring(0, hashIndex);

            // If the link includes a pathname that isn't current page, let Next.js handle it
            if (pathname && pathname !== '/' && pathname !== window.location.pathname) return;

            const targetEl = document.querySelector(hash);
            if (!targetEl) return;

            e.preventDefault();
            lenis.scrollTo(targetEl as HTMLElement, {
                offset: -80, // Account for fixed navbar height
                duration: 1.5,
            });
        }

        document.addEventListener('click', handleAnchorClick);

        return () => {
            document.removeEventListener('click', handleAnchorClick);
            lenis.destroy();
            lenisRef.current = null;
        };
    }, []);

    return <>{children}</>;
}
