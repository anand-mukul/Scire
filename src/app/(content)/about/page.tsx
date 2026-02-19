"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Zap, BrainCircuit, Users } from "lucide-react";
import { motion } from "motion/react";

export default function AboutPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-20 md:space-y-32">
            {/* Hero Section */}
            <section className="text-center space-y-6">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-4xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/50 tracking-tight"
                >
                    About Scire
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
                >
                    We are building the future of oral assessments. A world where grading is instant, feedback is deep, and integrity is guaranteed by intelligence, not surveillance.
                </motion.p>
            </section>

            {/* Mission Section */}
            <section className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                    <div className="flex items-center gap-2 text-primary font-semibold tracking-wide uppercase text-sm">
                        <Zap className="w-4 h-4" />
                        <span>Our Mission</span>
                    </div>
                    <h2 className="text-3xl font-bold tracking-tight">Scalable Oral Exams</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                        Oral exams are the gold standard for assessing true understanding, but they have historically been too expensive and slow to administer at scale. Scire changes that by leveraging AI to conduct thousands of concurrent, high-quality interviews.
                    </p>
                    <ul className="space-y-3">
                        {['Eliminate grading backlog', 'Assess deep understanding', 'Reduce academic dishonesty'].map((item) => (
                            <li key={item} className="flex items-center gap-3 text-foreground/80">
                                <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="relative aspect-square md:aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900 border border-white/10 shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center space-y-2 opacity-50">
                            <div className="w-16 h-16 rounded-2xl bg-foreground/10 mx-auto flex items-center justify-center">
                                <Users className="w-8 h-8 text-foreground" />
                            </div>
                            <p className="text-sm font-mono">Mission Visual Placeholder</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Technology Section */}
            <section className="relative rounded-3xl overflow-hidden bg-neutral-950 text-white p-8 md:p-16 text-center border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-neutral-950/0 to-neutral-950/0 pointer-events-none" />
                <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                    <div className="w-16 h-16 rounded-2xl bg-white/10 mx-auto flex items-center justify-center border border-white/10 backdrop-blur-md">
                        <BrainCircuit className="w-8 h-8 text-indigo-400" />
                    </div>
                    <h2 className="text-3xl md:text-4xl font-bold">Powered by 'AI Examiner'</h2>
                    <p className="text-lg text-neutral-400 leading-relaxed">
                        Scire is powered by state-of-the-art Large Language Models (LLMs) fine-tuned for Socratic questioning. Our proprietary architecture mimics the flow of a real professor, probing for depth rather than just checking for keywords.
                    </p>
                </div>
            </section>

            {/* Team/Join Section */}
            <section className="text-center space-y-8 pb-20">
                <div className="aspect-video w-full rounded-3xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                    <span className="text-muted-foreground font-mono text-sm">(Team Photo Placeholder)</span>
                </div>

                <div className="max-w-2xl mx-auto space-y-6">
                    <h2 className="text-3xl font-bold">Join the Revolution</h2>
                    <p className="text-muted-foreground text-lg">
                        We are always looking for brilliant engineers and educators to join our team. Help us define the next era of education.
                    </p>
                    <Link href="/careers">
                        <Button size="lg" className="h-12 px-8 rounded-full text-base font-semibold shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
                            View Open Positions <ArrowRight className="w-5 h-5 ml-2" />
                        </Button>
                    </Link>
                </div>
            </section>
        </div>
    );
}
