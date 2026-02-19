"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const GrainyBackground = ({
    className,
    children,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    return (
        <div
            className={cn(
                "relative w-full h-full min-h-screen bg-neutral-950 overflow-hidden font-sans",
                className
            )}
        >
            {/* Noise Overlay */}
            <div className="absolute inset-0 z-20 opacity-[0.05] pointer-events-none mix-blend-overlay">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <filter id="noiseFilter">
                        <feTurbulence
                            type="fractalNoise"
                            baseFrequency="0.65"
                            numOctaves="3"
                            stitchTiles="stitch"
                        />
                    </filter>
                    <rect width="100%" height="100%" filter="url(#noiseFilter)" />
                </svg>
            </div>

            {/* Gradients */}
            <div className="absolute top-0 left-0 w-full h-full z-0 overflow-hidden">
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, 0],
                    }}
                    transition={{
                        duration: 20,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] rounded-full bg-orange-500/20 blur-[100px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        rotate: [0, -10, 0],
                    }}
                    transition={{
                        duration: 15,
                        repeat: Infinity,
                        repeatType: "reverse",
                        delay: 2,
                    }}
                    className="absolute top-[20%] -right-[10%] w-[60vw] h-[60vw] rounded-full bg-indigo-500/10 blur-[120px] mix-blend-screen"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.3, 1],
                        x: [0, 100, 0],
                    }}
                    transition={{
                        duration: 25,
                        repeat: Infinity,
                        repeatType: "reverse",
                    }}
                    className="absolute -bottom-[20%] left-[20%] w-[80vw] h-[80vw] rounded-full bg-blue-600/10 blur-[140px] mix-blend-screen"
                />
            </div>

            {/* Content */}
            <div className="relative z-30">{children}</div>
        </div>
    );
};
