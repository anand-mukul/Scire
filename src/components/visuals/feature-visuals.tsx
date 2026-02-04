'use client';

import { motion } from 'motion/react';
import {
    Mic,
    Shield,
    Check,
    Fingerprint
} from 'lucide-react';
import { Orb } from './Orb';

const GridPattern = () => (
    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50" />
);

export const AiExaminerVisual = () => {
    return (
        <div className="flex flex-col items-center justify-center w-full h-full bg-primary/5 dark:bg-card/50 rounded-xl border border-primary/20 overflow-hidden font-sans relative">
            <GridPattern />
            <div className="absolute inset-[-5] opacity-80 dark:opacity-100">
                <Orb color="#8B5CF6" hoverIntensity={0.2} />
            </div>
            <div className="relative z-10 mt-32 pointer-events-none">

            </div>
        </div>
    );
};

export const IntegrityVisual = () => {
    return (
        <div className="relative flex w-full h-full justify-center items-center bg-cyan-50/50 dark:bg-card/50 rounded-xl border border-cyan-500/20 overflow-hidden">
            <GridPattern />

            {/* Central Icon */}
            <div className="relative z-10 p-4 rounded-full bg-cyan-100/80 dark:bg-cyan-950/30 border border-cyan-500/20 backdrop-blur-sm">
                <Fingerprint className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
            </div>

            {/* Rotating Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute w-40 h-40 rounded-full border border-cyan-500/30 dark:border-cyan-500/10 border-t-cyan-500/80 dark:border-t-cyan-400/50 shadow-[0_0_20px_rgba(6,182,212,0.1)]"
            />
            {/* Pulsing Ring */}
            <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0, 0.1] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute w-32 h-32 rounded-full border border-cyan-500/40 dark:border-cyan-500/20"
            />
        </div>
    );
};

export const GradingVisual = () => {
    return (
        <div className="flex flex-col w-full h-full justify-center px-8 bg-amber-50/50 dark:bg-card/50 rounded-xl border border-amber-500/20 overflow-hidden font-mono text-[10px] text-muted-foreground relative">
            <GridPattern />
            <div className="space-y-3 w-full relative z-10">
                {['Technical Knowledge', 'Communication', 'Critical Thinking'].map((criterion, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.8 }}
                        className="flex items-center justify-between"
                    >
                        <span className="tracking-tight font-medium text-amber-900/70 dark:text-muted-foreground">{criterion}</span>
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: i * 0.8 + 0.4, type: "spring" }}
                            className="flex items-center gap-1.5"
                        >
                            <div className="bg-amber-100 dark:bg-amber-500/20 rounded-full p-0.5">
                                <Check className="w-2 h-2 text-amber-600 dark:text-amber-500" />
                            </div>
                            <span className="text-amber-950 dark:text-foreground font-semibold">10/10</span>
                        </motion.div>
                    </motion.div>
                ))}
                <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 2.5, duration: 0.5 }}
                    className="h-px bg-amber-500/20 w-full my-2"
                />
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 3 }}
                    className="flex justify-between items-center text-xs"
                >
                    <span className="text-amber-900/70 dark:text-muted-foreground font-semibold tracking-wide">FINAL SCORE</span>
                    <span className="bg-amber-500 text-white dark:text-black px-2 py-0.5 rounded text-[10px] font-bold shadow-[0_0_10px_rgba(245,158,11,0.3)]">A+</span>
                </motion.div>
            </div>
        </div>
    );
};

export const ScaleVisual = () => {
    return (
        <div className="relative w-full h-full bg-blue-50/50 dark:bg-card/50 rounded-xl border border-blue-500/20 overflow-hidden flex items-center p-6">
            <GridPattern />
            <div className="flex-1 space-y-6 relative z-10">

                <div className="space-y-2 opacity-70 dark:opacity-50">
                    <div className="flex justify-between text-xs text-muted-foreground font-medium">
                        <span>Manual (1000 Exams)</span>
                        <span>~500h</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-200/30 dark:bg-secondary/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '15%' }}
                            transition={{ duration: 2, ease: "linear" }}
                            className="h-full bg-slate-400 dark:bg-muted-foreground rounded-full"
                        />
                    </div>
                </div>


                <div className="space-y-2">
                    <div className="flex justify-between text-xs text-foreground font-medium">
                        <div className="flex items-center gap-2">
                            <span className="text-blue-600 dark:text-blue-400 font-bold">Scire AI</span>
                            <span className="px-1.5 py-0 rounded-full bg-blue-100 dark:bg-blue-500/20 text-[9px] text-blue-600 dark:text-blue-400 border border-blue-500/20 tracking-wider">TURBO</span>
                        </div>
                        <span className="text-blue-950 dark:text-foreground font-bold">5m</span>
                    </div>
                    <div className="h-1.5 w-full bg-blue-200/30 dark:bg-secondary/30 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: '100%' }}
                            transition={{ duration: 1.5, ease: "circOut", delay: 0.5 }}
                            className="h-full bg-blue-600 dark:bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                        />
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end justify-center pl-6 border-l border-blue-500/20 ml-6 relative z-10">
                <div className="text-3xl font-bold text-blue-950 dark:text-foreground tracking-tighter">
                    100x
                </div>
                <div className="text-[9px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-widest mt-0.5">Faster</div>
            </div>
        </div>
    )
}

export const AnalyticsVisual = () => {
    return (
        <div className="flex items-end justify-center w-full h-full gap-2 p-6 bg-fuchsia-50/50 dark:bg-card/50 rounded-xl border border-fuchsia-500/20 overflow-hidden relative">
            <GridPattern />
            {[40, 70, 50, 90, 65].map((height, i) => (
                <motion.div
                    key={i}
                    initial={{ height: 0 }}
                    animate={{ height: `${height}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: "backOut" }}
                    className="w-full bg-fuchsia-500/20 dark:bg-fuchsia-900/40 rounded-t-sm relative group hover:bg-fuchsia-500/40 dark:hover:bg-fuchsia-800/60 transition-colors z-10 overflow-hidden"
                >
                    <div className="absolute inset-x-0 bottom-0 h-full bg-gradient-to-t from-fuchsia-500/30 dark:from-fuchsia-500/50 to-transparent opacity-80" />
                    <div className="absolute inset-x-0 top-0 h-[1px] bg-fuchsia-500/50 dark:bg-fuchsia-400/50" />
                </motion.div>
            ))}
        </div>
    )
}
