'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { SparklesCore } from "@/components/ui/sparkles";

import { Orb } from '@/components/visuals/Orb';

export const CTASection = () => (
    <div className="w-full py-20 bg-white dark:bg-neutral-950 flex items-center justify-center relative overflow-hidden">
        <div className="w-[95%] max-w-6xl mx-auto bg-neutral-900/50 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] relative overflow-hidden group h-[50rem] md:h-[40rem] flex flex-col items-center justify-center">

            <div className="absolute inset-0 h-full opacity-60">
                <div className="absolute inset-0 scale-[1.2] translate-y-10 opacity-50 group-hover:opacity-70 transition-opacity duration-1000">
                    <Orb
                        color="#f97316"
                        hoverIntensity={0.8}
                        followCursor={true}
                        p1={{ count: 400, radius: 1.0, size: 0.12, speed: 1.0 }}
                        p2={{ count: 600, radius: 2.0, size: 0.08, speed: 1.0 }}
                        p3={{ count: 800, radius: 3.0, size: 0.05, speed: 1.0 }}
                    />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/0.15,transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />
            </div>

            <h1 className="md:text-8xl text-4xl lg:text-7xl font-bold text-center text-white relative z-20 tracking-tighter">
                Ready to transform?
            </h1>
            <div className="w-[40rem] h-20 relative flex items-center justify-center">
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent h-[2px] w-3/4 blur-sm" />
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-indigo-500 to-transparent h-px w-3/4" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent h-[5px] w-1/4 blur-sm" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent h-px w-1/4" />
            </div>

            <p className="text-neutral-300 text-center relative z-20 mb-10 max-w-xl mx-auto px-4 text-xl font-medium leading-relaxed">
                Join forward-thinking institutions that are redefining assessment with Scire's autonomous AI platform.
            </p>

            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/request-access">
                    <Button className="h-14 px-10 rounded-full bg-white text-black hover:bg-neutral-200 shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-white/40 transition-all hover:scale-105 font-bold text-lg">
                        Get Started Now
                    </Button>
                </Link>
            </div>
        </div>
    </div>
);
