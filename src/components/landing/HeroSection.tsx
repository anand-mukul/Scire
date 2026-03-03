'use client';

import dynamic from 'next/dynamic';

import { motion } from "motion/react";
const BackgroundBeams = dynamic(() => import("@/components/visuals/BackgroundBeams").then(mod => mod.BackgroundBeams), { ssr: false });
import { Button } from "@/components/ui/button";
import { ChevronRight, PlayCircle } from "lucide-react";
import Link from 'next/link';


const HeroOrb = dynamic(() => import("@/components/visuals/HeroOrb").then(mod => mod.HeroOrb), { ssr: false });

export const HeroSection = () => {
    return (
        <section className="relative h-[45rem] md:h-screen w-full flex flex-col items-center justify-start pt-32 md:pt-48 bg-white dark:bg-neutral-950 antialiased bg-grid-black/[0.05] dark:bg-grid-white/[0.05] overflow-hidden">


            <div className="p-4 max-w-7xl mx-auto relative z-10 w-full flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="flex justify-center mb-8"
                >
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-white/10 border border-neutral-200 dark:border-white/10 text-neutral-800 dark:text-white text-xs font-semibold uppercase tracking-wider backdrop-blur-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                        Introducing Scire v1.0
                    </span>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
                    className="text-5xl md:text-8xl font-bold text-center text-neutral-900 dark:text-white pb-4 tracking-tighter md:leading-[0.9] max-w-4xl"
                >
                    The Future of <br />
                    <span className="relative inline-block mt-2">
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-orange-600 dark:from-orange-400 dark:to-orange-500">Oral Assessments</span>
                        <svg
                            className="absolute -bottom-2 w-full left-0 text-orange-500/30 dark:text-orange-500/40 h-3"
                            viewBox="0 0 200 9"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M2.00025 6.99997C25.7925 3.3986 63.3087 -1.60334 105.7 6.99997C118.04 8.76106 142.332 9.20456 166.388 6.99997C177.306 5.867 190.58 3.53509 198.001 2.00002"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
                    className="mt-6 text-lg md:text-xl text-neutral-600 dark:text-neutral-400 max-w-xl text-center leading-relaxed"
                >
                    Conduct massive scale viva exams with autonomous AI examiners. Real-time anti-cheat, instant grading, and detailed analytics for modern education.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center gap-4 pt-4"
                >
                    <Link href="/request-access">
                        <Button size="lg" className="rounded-full h-12 px-8 text-base bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 font-medium group">
                            Start Free Trial
                            <ChevronRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </Link>
                    <Link href="/#features">
                        <Button size="lg" variant="outline" className="rounded-full h-12 px-8 text-base border-neutral-200 dark:border-white/10 hover:bg-neutral-100 dark:hover:bg-white/10 backdrop-blur-sm font-medium">
                            <PlayCircle className="mr-2 w-4 h-4" />
                            Explore Features
                        </Button>
                    </Link>
                </motion.div>
            </div>

            {/* Wide Flat Horizon */}
            <div className="absolute inset-x-0 bottom-[-50%] h-[150%] w-full pointer-events-none z-0 overflow-hidden flex items-center justify-center">
                <div className="w-[300%] h-[300%] md:w-[300vw] md:h-[300vw] opacity-100 mix-blend-screen translate-y-[30%]">
                    <HeroOrb color="#f97316" className="w-full h-full" rotationSpeed={0.08} />
                </div>
            </div>

            <BackgroundBeams className="opacity-20 top-0" />

            {/* Fade out mask to blend into the next section smoothly */}
            <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-white dark:from-neutral-950 to-transparent pointer-events-none z-20" />
        </section>
    );
};
