import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'motion/react';

interface PremiumLoaderProps {
    className?: string;
    text?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const PremiumLoader = ({ className, text = "Loading...", size = "md" }: PremiumLoaderProps) => {
    const sizeClasses = {
        sm: "w-8 h-8",
        md: "w-12 h-12",
        lg: "w-16 h-16"
    };

    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className={cn("relative", sizeClasses[size])}>
                {/* Core Orb */}
                <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary to-purple-600 blur-sm"
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 0.8, 0.5],
                        rotate: [0, 180, 360]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />

                {/* Inner Ring */}
                <motion.div
                    className="absolute inset-1 rounded-full border-2 border-white/20 border-t-white/80"
                    animate={{ rotate: 360 }}
                    transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                />

                {/* Outer Glow */}
                <motion.div
                    className="absolute -inset-4 rounded-full bg-primary/20 blur-xl"
                    animate={{
                        opacity: [0.2, 0.5, 0.2],
                        scale: [0.9, 1.1, 0.9]
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {text && (
                <motion.p
                    className="text-sm font-medium text-muted-foreground tracking-widest uppercase"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                >
                    {text}
                </motion.p>
            )}
        </div>
    );
};
