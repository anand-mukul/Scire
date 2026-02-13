'use client';

import { useEffect, useState } from 'react';
import { Monitor, Smartphone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

/**
 * Detects if the user is on a mobile device using multiple heuristics.
 * Single signals can be spoofed, so we combine several checks.
 */
function detectMobile(): boolean {
    if (typeof window === 'undefined') return false;

    const checks = {
        // Touch-primary device (not just touch-capable)
        touchPrimary: window.matchMedia?.('(pointer: coarse)')?.matches,
        // Narrow viewport (typical phone width)
        narrowViewport: window.innerWidth < 768,
        // Mobile user agent patterns
        mobileUA: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
            navigator.userAgent
        ),
        // No hover capability (phones don't truly hover)
        noHover: window.matchMedia?.('(hover: none)')?.matches,
    };

    // Count how many signals suggest mobile — if 2+ match, it's likely mobile
    const mobileSignals = Object.values(checks).filter(Boolean).length;
    return mobileSignals >= 2;
}

interface MobileBlockScreenProps {
    examTitle?: string;
}

export default function MobileBlockScreen({ examTitle }: MobileBlockScreenProps) {
    const [isMobile, setIsMobile] = useState(false);
    const [currentUrl, setCurrentUrl] = useState('');

    useEffect(() => {
        setIsMobile(detectMobile());
        setCurrentUrl(window.location.href);

        // Re-check on resize (prevents switching to mobile emulation mid-flow)
        const handleResize = () => setIsMobile(detectMobile());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    if (!isMobile) return null;

    const emailSelfLink = `mailto:?subject=${encodeURIComponent(
        `Open this exam on your computer${examTitle ? `: ${examTitle}` : ''}`
    )}&body=${encodeURIComponent(
        `Open this link on your desktop/laptop to take the exam:\n\n${currentUrl}`
    )}`;

    return (
        <div className="fixed inset-0 z-[100] bg-background flex items-center justify-center p-6">
            <Card className="max-w-md w-full p-8 text-center space-y-6 border-border">
                {/* Icon */}
                <div className="flex justify-center gap-4 items-center">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20">
                        <Smartphone className="h-8 w-8 text-red-500" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <Monitor className="h-8 w-8 text-emerald-500" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h2 className="text-xl font-bold text-foreground">
                        Desktop Required
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        This exam requires a <strong className="text-foreground">desktop or laptop computer</strong> with
                        a working camera and microphone. Mobile devices are not supported.
                    </p>
                </div>

                {/* Requirements */}
                <div className="bg-muted/30 rounded-lg p-4 text-left space-y-2 border border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Requirements</p>
                    <div className="text-sm text-muted-foreground space-y-1.5">
                        <p className="flex items-center gap-2">✅ Desktop or laptop computer</p>
                        <p className="flex items-center gap-2">✅ Working webcam</p>
                        <p className="flex items-center gap-2">✅ Working microphone</p>
                        <p className="flex items-center gap-2">✅ Chrome, Firefox, or Edge browser</p>
                    </div>
                </div>

                {/* Email self */}
                <Button
                    variant="outline"
                    className="w-full gap-2"
                    onClick={() => window.open(emailSelfLink)}
                >
                    <Mail className="h-4 w-4" />
                    Email this link to yourself
                </Button>

                <p className="text-[11px] text-muted-foreground">
                    Open the emailed link on your computer to continue.
                </p>
            </Card>
        </div>
    );
}
