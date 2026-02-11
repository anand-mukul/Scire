'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BackgroundBeams } from '@/components/visuals/BackgroundBeams';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { ChevronRight, PlayCircle } from 'lucide-react';

export const HeroSection = () => {
    return (
        <section className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center bg-background overflow-hidden">
            <AmbientGlow />
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 py-20 md:py-0">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Introducing Scire Platform
                    </div>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-5xl sm:text-6xl md:text-7xl font-bold text-center text-foreground pb-4 tracking-tight leading-[1.1]"
                >
                    <span className="bg-clip-text text-transparent bg-[image:var(--brand-gradient-text)]">
                        The Future of Oral
                    </span>
                    <br />
                    Assessments
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="mt-8 text-base md:text-lg text-muted-foreground max-w-2xl text-center mx-auto leading-relaxed"
                >
                    Conduct massive scale viva exams with autonomous AI examiners.
                    Real-time anti-cheat, instant grading, and detailed analytics.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12"
                >
                    <Link href="/auth/register">
                        <Button className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all font-semibold text-base">
                            Start Free Trial
                            <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                    </Link>
                    <Link href="#features">
                        <Button variant="outline" className="h-12 px-8 border-border text-foreground hover:bg-secondary font-semibold text-base">
                            <PlayCircle className="w-4 h-4 mr-2" />
                            See How It Works
                        </Button>
                    </Link>
                </motion.div>
            </div>
            <BackgroundBeams className="opacity-30 top-0" />
        </section>
    );
};
