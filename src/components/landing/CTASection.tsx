'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

import { SparklesCore } from "@/components/ui/sparkles";

import { Orb } from '@/components/visuals/Orb';

export const CTASection = () => (
    <div className="w-full py-20 bg-background flex items-center justify-center relative overflow-hidden">
        <div className="w-[95%] max-w-6xl mx-auto bg-primary/5 dark:bg-card/30 backdrop-blur-3xl border border-primary/10 dark:border-white/10 rounded-[2.5rem] relative overflow-hidden group h-[50rem] md:h-[40rem] flex flex-col items-center justify-center">

            <div className="absolute inset-0 h-full opacity-60">
                <div className="absolute inset-0 scale-[1.2] translate-y-10 opacity-50 group-hover:opacity-70 transition-opacity duration-1000 grayscale-[0.2]">
                    <Orb color="#8B5CF6" hoverIntensity={0.8} followCursor={true} />
                </div>
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/0.15,transparent_60%)]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />
            </div>

            <h1 className="md:text-8xl text-4xl lg:text-7xl font-bold text-center text-foreground relative z-20 tracking-tighter">
                Ready to transform?
            </h1>
            <div className="w-[40rem] h-20 relative flex items-center justify-center">
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-primary/50 to-transparent h-[2px] w-3/4 blur-sm" />
                <div className="absolute inset-x-20 top-0 bg-gradient-to-r from-transparent via-primary to-transparent h-px w-3/4" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-[5px] w-1/4 blur-sm" />
                <div className="absolute inset-x-60 top-0 bg-gradient-to-r from-transparent via-primary/30 to-transparent h-px w-1/4" />
            </div>

            <p className="text-muted-foreground text-center relative z-20 mb-10 max-w-xl mx-auto px-4 text-xl font-medium leading-relaxed">
                Join forward-thinking institutions that are redefining assessment with Scire's autonomous AI platform.
            </p>

            <div className="relative z-20 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/auth/register">
                    <Button className="h-14 px-10 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-[0_0_40px_-10px_var(--primary)/0.5] hover:shadow-primary/60 transition-all hover:scale-105 font-bold text-lg">
                        Get Started Now
                    </Button>
                </Link>
            </div>
        </div>
    </div>
);
