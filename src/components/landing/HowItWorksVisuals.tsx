"use client";

import React from "react";
import { motion } from "motion/react";
import { FileText, Settings, Mic, CheckCircle2, User, Bot, BarChart3, UploadCloud } from "lucide-react";

export const UploadVisual = () => {
    return (
        <div className="w-full h-full flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 p-8">
            <div className="relative w-full max-w-xs aspect-[3/4] border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl flex flex-col items-center justify-center bg-white dark:bg-neutral-900 shadow-sm overflow-hidden">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="p-4 rounded-full bg-primary/10 mb-4"
                >
                    <UploadCloud className="w-8 h-8 text-primary" />
                </motion.div>
                <p className="text-sm font-medium text-neutral-500">Drop syllabus here</p>

                {/* Simulated File Dropping */}
                <motion.div
                    initial={{ scale: 0.8, opacity: 0, y: 50 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.5,
                        delay: 1.0,
                        type: "spring",
                        stiffness: 200
                    }}
                    className="absolute bottom-8 w-48 p-3 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center gap-3 shadow-md border border-neutral-200 dark:border-neutral-700"
                >
                    <FileText className="w-8 h-8 text-blue-500" />
                    <div className="flex-1 min-w-0">
                        <div className="h-2 w-24 bg-neutral-300 dark:bg-neutral-600 rounded mb-1.5" />
                        <div className="h-1.5 w-16 bg-neutral-200 dark:bg-neutral-700 rounded" />
                    </div>
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                </motion.div>
            </div>
        </div>
    );
};

export const ConfigVisual = () => {
    return (
        <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col gap-4 font-sans justify-center">
            {/* Setting Item 1 */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Difficulty</span>
                    <span className="text-xs text-primary font-bold">Hard</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "30%" }}
                        animate={{ width: "85%" }}
                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        className="h-full bg-primary rounded-full"
                    />
                </div>
            </div>

            {/* Setting Item 2 */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Strictness</span>
                    <span className="text-xs text-primary font-bold">High</span>
                </div>
                <div className="h-2 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "40%" }}
                        animate={{ width: "70%" }}
                        transition={{ duration: 2, delay: 0.2, repeat: Infinity, repeatType: "reverse", ease: "easeInOut" }}
                        className="h-full bg-primary rounded-full"
                    />
                </div>
            </div>

            {/* Toggle Item */}
            <div className="bg-white dark:bg-neutral-900 p-4 rounded-lg border border-neutral-200 dark:border-neutral-800 shadow-sm flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Proctoring Mode</span>
                <motion.div
                    initial={{ backgroundColor: "#e5e5e5" }}
                    animate={{ backgroundColor: "#ea580c" }} // Primary Orange
                    transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                    className="w-10 h-6 rounded-full flex items-center px-1"
                >
                    <motion.div
                        initial={{ x: 0 }}
                        animate={{ x: 16 }}
                        transition={{ duration: 1, repeat: Infinity, repeatType: "reverse" }}
                        className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                </motion.div>
            </div>
        </div>
    )
}

export const InterviewVisual = () => {
    return (
        <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 p-6 flex flex-col justify-end gap-3 pb-8">
            {/* AI Message */}
            <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
                className="self-start max-w-[85%] flex gap-3"
            >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Bot className="w-5 h-5 text-primary" />
                </div>
                <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 p-3 rounded-2xl rounded-tl-none shadow-sm">
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Explain the concept of closure in JavaScript.</p>
                </div>
            </motion.div>

            {/* Audio Waveform Simulation */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="self-center my-2 flex gap-1 h-8 items-center"
            >
                {[...Array(5)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: [8, 24, 8] }}
                        transition={{
                            duration: 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                        }}
                        className="w-1 bg-primary rounded-full"
                    />
                ))}
            </motion.div>

            {/* User Message */}
            <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 1.5 }}
                className="self-end max-w-[85%] flex gap-3 flex-row-reverse"
            >
                <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5 text-neutral-600 dark:text-neutral-400" />
                </div>
                <div className="bg-primary text-white p-3 rounded-2xl rounded-tr-none shadow-sm">
                    <p className="text-xs">A closure is the combination of a function bundled together with references to its surrounding state.</p>
                </div>
            </motion.div>
        </div>
    )
}

export const GradingVisual = () => {
    return (
        <div className="w-full h-full bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-6">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-lg overflow-hidden">
                <div className="p-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                    <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100">Exam Report</span>
                    <span className="text-xs text-neutral-500">Just now</span>
                </div>
                <div className="p-6 flex flex-col items-center">
                    <div className="relative w-24 h-24 mb-4 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-neutral-100 dark:text-neutral-800" strokeWidth="8" />
                            <motion.circle
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 0.92 }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                cx="50" cy="50" r="45" fill="none" stroke="currentColor" className="text-green-500" strokeWidth="8" strokeDasharray="283"
                            />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                                initial={{ opacity: 0, scale: 0.5 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-3xl font-bold text-neutral-900 dark:text-white"
                            >
                                A
                            </motion.span>
                        </div>
                    </div>
                    <div className="w-full space-y-3">
                        <div className="flex justify-between text-xs">
                            <span className="text-neutral-500">Technical Accuracy</span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">95%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} transition={{ delay: 0.8, duration: 1 }} className="h-full bg-green-500 rounded-full" />
                        </div>
                        <div className="flex justify-between text-xs mt-2">
                            <span className="text-neutral-500">Communication</span>
                            <span className="font-bold text-neutral-900 dark:text-neutral-100">88%</span>
                        </div>
                        <div className="w-full h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: "88%" }} transition={{ delay: 1.0, duration: 1 }} className="h-full bg-blue-500 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
