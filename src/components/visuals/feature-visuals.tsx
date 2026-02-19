'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
    Mic,
    Shield,
    Check,
    Fingerprint
} from 'lucide-react';
import { Orb } from './Orb';
import { cn } from '@/lib/utils';

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
    const events = [
        { time: '10:42:15', event: 'Tab Switch', status: 'Flagged', color: 'text-red-500 bg-red-500/10 border-red-500/20' },
        { time: '10:45:30', event: 'Multiple Voices', status: 'Warning', color: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    ];

    return (
        <div className="relative flex flex-col w-full h-full p-6 pt-8 pb-32 bg-cyan-50/50 dark:bg-card/50 rounded-xl border border-cyan-500/20 overflow-hidden font-sans text-left">
            <GridPattern />

            {/* Header */}
            <div className="flex items-center gap-2 mb-3 relative z-10 opacity-80">
                <Shield className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
                <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-900 dark:text-cyan-100">Live Monitor</span>
                <div className="ml-auto flex gap-1 items-center">
                    <span className="w-1 h-1 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-[9px] font-medium text-red-500">REC</span>
                </div>
            </div>

            {/* Log Table Mockup */}
            <div className="w-full space-y-2 relative z-10">
                {events.map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.5 }}
                        className="flex items-center justify-between p-1.5 rounded-md bg-white/60 dark:bg-black/40 border border-cyan-500/10 backdrop-blur-sm"
                    >
                        <span className="text-[9px] font-mono text-muted-foreground">{item.time}</span>
                        <span className="text-[10px] font-medium text-foreground">{item.event}</span>
                        <span className={`text-[8px] px-1 py-0.5 rounded border font-semibold ${item.color}`}>
                            {item.status}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const GradingVisual = () => {
    return (
        <div className="flex flex-col w-full h-full p-6 pt-8 pb-32 bg-amber-50/50 dark:bg-card/50 rounded-xl border border-amber-500/20 overflow-hidden font-mono text-[10px] text-muted-foreground relative text-left">
            <GridPattern />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10 w-full border-b border-amber-500/20 pb-2">
                <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center border border-amber-500/30">
                        <span className="font-sans font-bold text-amber-700 dark:text-amber-400 text-[10px]">A+</span>
                    </div>
                    <div>
                        <div className="text-[10px] font-bold text-foreground">Result</div>
                    </div>
                </div>
                <div className="text-[10px] font-bold text-amber-600 dark:text-amber-500">98%</div>
            </div>

            <div className="space-y-2 w-full relative z-10">
                {[
                    { label: 'Knowledge', score: '10/10', bar: 100 },
                    { label: 'Clarity', score: '9/10', bar: 90 },
                ].map((item, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.3 }}
                        className="space-y-0.5"
                    >
                        <div className="flex justify-between text-[9px]">
                            <span className="font-medium text-foreground">{item.label}</span>
                            <span className="font-mono text-amber-700 dark:text-amber-400">{item.score}</span>
                        </div>
                        <div className="h-1 w-full bg-amber-200/30 dark:bg-amber-900/20 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${item.bar}%` }}
                                transition={{ delay: 0.5 + (i * 0.2), duration: 1 }}
                                className="h-full bg-amber-500 rounded-full"
                            />
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export const ScaleVisual = () => {
    return (
        <div className="relative w-full h-full bg-blue-50/50 dark:bg-card/50 rounded-xl border border-blue-500/20 overflow-hidden flex items-start p-6 pb-20 pt-10">
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
    const [range, setRange] = useState<'7d' | '30d'>('7d');

    const data = {
        '7d': [20, 45, 35, 60, 50, 75, 55, 85, 80, 95],
        '30d': [50, 30, 45, 35, 60, 40, 70, 55, 90, 65]
    };

    return (
        <div className="flex flex-col w-full h-full p-6 pt-10 pb-34 bg-fuchsia-50/50 dark:bg-card/50 rounded-xl border border-fuchsia-500/20 overflow-hidden relative font-sans text-left group/chart">
            <GridPattern />

            {/* Chart Header */}
            <div className="flex items-center justify-between mb-6 relative z-10 w-full">
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-foreground flex items-center gap-1">
                        {range === '7d' ? '+24%' : '+12%'} <span className="text-emerald-500 text-xs bg-emerald-500/10 px-1 rounded">▲</span>
                    </span>
                </div>
                {/* Mock Tabs */}
                <div className="flex bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-md p-0.5 border border-fuchsia-500/10">
                    {(['7d', '30d'] as const).map((r) => (
                        <button
                            key={r}
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setRange(r);
                            }}
                            className={cn(
                                "px-2 py-0.5 rounded text-[9px] font-medium transition-all cursor-pointer relative z-20",
                                range === r
                                    ? "bg-background shadow-sm text-foreground"
                                    : "text-muted-foreground hover:text-foreground hover:bg-fuchsia-500/5"
                            )}
                        >
                            {r}
                        </button>
                    ))}
                </div>
            </div>

            {/* Mock Area Chart */}
            <div className="flex items-end justify-between w-full h-full gap-1.5 relative z-10">
                {data[range].map((height, i) => (
                    <motion.div
                        key={`${range}-${i}`}
                        initial={{ height: 0 }}
                        animate={{ height: `${height}%` }}
                        transition={{ duration: 0.4, delay: i * 0.03, ease: "easeOut" }}
                        className="w-full bg-gradient-to-t from-fuchsia-500/80 to-fuchsia-400/80 dark:from-fuchsia-600 dark:to-fuchsia-500 rounded-t-sm relative group cursor-pointer hover:opacity-100 opacity-90 transition-opacity"
                    >
                        {/* Tooltip Overlay */}
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-[9px] px-1.5 py-0.5 rounded shadow-sm border border-border whitespace-nowrap transition-opacity pointer-events-none z-30">
                            {height * 10} users
                        </div>
                    </motion.div>
                ))}
            </div>
            {/* X-Axis Line */}
            <div className="absolute bottom-20 left-6 right-6 h-px bg-fuchsia-500/20 z-0" />
        </div>
    )
}
