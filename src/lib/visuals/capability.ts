/**
 * Device Capability Detection for Visuals
 * Determines the rendering tier based on hardware capabilities.
 */

export type DeviceTier = 'HIGH' | 'MEDIUM' | 'LOW';

export const detectDeviceTier = (): DeviceTier => {
    if (typeof window === 'undefined') return 'LOW';

    // 1. Check for Reduced Motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
        return 'LOW'; // CSS Fallback is best for reduced motion
    }

    // 2. Hardware Concurrency (CPU cores)
    // Low core count usually implies older mobile device
    const cores = navigator.hardwareConcurrency || 4;
    if (cores < 4) return 'LOW';

    // 3. WebGL Capabilities via Canvas
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) return 'LOW';

        // Check debug info if available (unmasked renderer)
        const debugInfo = (gl as WebGLRenderingContext).getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            const renderer = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
            const vendor = (gl as WebGLRenderingContext).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';

            const lowerRenderer = renderer.toLowerCase();

            // Detect Low-Power GPUs (Intel Integrated, older Adreno/Mali)
            if (
                lowerRenderer.includes('intel') ||
                lowerRenderer.includes('uhd graphics') ||
                lowerRenderer.includes('iris')
            ) {
                return 'MEDIUM';
            }

            // Detect Mobile GPUs
            if (
                lowerRenderer.includes('mali') ||
                lowerRenderer.includes('adreno') ||
                lowerRenderer.includes('powervr')
            ) {
                return 'MEDIUM';
            }

            // Swiftshader / Software Renders
            if (lowerRenderer.includes('swiftshader') || lowerRenderer.includes('mesa')) {
                return 'LOW';
            }
        }

        // If we got here, it's likely a discrete GPU or high-end integrated (Apple Silicon)
        return 'HIGH';

    } catch (e) {
        console.warn('WebGL capability check failed:', e);
        return 'LOW';
    }
};
