'use client';

import { useState, useEffect } from 'react';

export type PerformanceTier = 'high' | 'low';

export const usePerformance = () => {
    const [tier, setTier] = useState<PerformanceTier>('high');
    const [isMobile, setIsMobile] = useState<boolean>(false);

    useEffect(() => {
        let isLowEnd = false;
        let mobile = false;

        // Check logical cores (less than or equal to 4 is often a low-end or older device/mobile)
        if (typeof navigator !== 'undefined') {
            const cores = navigator.hardwareConcurrency || 4;
            if (cores <= 4) {
                isLowEnd = true;
            }

            // Check device memory if available (less than or equal to 4GB is considered low-end for WebGL)
            const memory = (navigator as any).deviceMemory;
            if (memory && memory <= 4) {
                isLowEnd = true;
            }

            // Basic mobile detection
            if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                mobile = true;
                // Treat most mobile devices as low performance for heavy 3D
                isLowEnd = true;
            }
        }

        // Check screen width
        if (typeof window !== 'undefined') {
            if (window.innerWidth < 768) {
                mobile = true;
                // Small screen generally means mobile, which means less powerful GPU usually
                isLowEnd = true;
            }
        }

        setIsMobile(mobile);
        setTier(isLowEnd ? 'low' : 'high');
    }, []);

    return {
        tier,
        isLowPerformance: tier === 'low',
        isMobile
    };
};
