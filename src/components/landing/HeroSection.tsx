'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { ChevronRight, PlayCircle } from 'lucide-react';

export const HeroSection = () => {
    return (
        <section className="relative h-[40rem] md:h-screen w-full flex md:items-center md:justify-center bg-background/[0.96] antialiased dark:bg-grid-white/[0.02] bg-grid-black/[0.02] overflow-hidden">
            <AmbientGlow />
            <div className="p-4 max-w-7xl  mx-auto relative z-10  w-full pt-20 md:pt-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/10 dark:border-primary/20 text-xs font-semibold uppercase tracking-wider text-primary backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Introducing Scire v1.0
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-6xl md:text-8xl font-bold text-center bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)] pb-4 will-change-transform tracking-tighter md:leading-[0.9]"
                >
                    The Future of <br /> Oral Assessments
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-6 font-medium text-lg md:text-xl text-muted-foreground max-w-2xl text-center mx-auto leading-relaxed"
                >
                    Conduct massive scale viva exams with autonomous AI examiners.
                    Real-time anti-cheat, instant grading, and detailed analytics for modern education.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-6 mt-10"
                >
                    <Link href="/auth/register">
                        <Button className="h-14 px-8 rounded-full bg-foreground text-background hover:bg-foreground/90 shadow-2xl shadow-primary/20 hover:shadow-primary/40 transition-all hover:scale-105 font-bold text-lg min-w-[200px]">
                            Start Free Trial
                            <ChevronRight className="w-5 h-5 ml-1" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" className="h-12 px-8 rounded-full border-primary/20 text-foreground hover:bg-primary/10 hover:border-primary/40 transition-all font-medium text-lg">
                            <PlayCircle className="w-5 h-5 mr-2" />
                            See How It Works
                        </Button>
                    </Link>
                </motion.div>
            </div>
            <BackgroundBeams className="opacity-40 top-0" />
        </section>
    );
};
