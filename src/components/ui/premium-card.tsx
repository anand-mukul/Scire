'use client';

import React from 'react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean; // Enable scale animations only when true
}

export const PremiumCard = ({ children, className, onClick, interactive = false }: PremiumCardProps) => {
    return (
        <motion.div
            whileHover={interactive ? { scale: 1.02 } : undefined}
            whileTap={interactive && onClick ? { scale: 0.98 } : undefined}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-6 shadow-xl transition-all duration-300",
                interactive && "cursor-pointer hover:bg-blue-500/5 hover:border-blue-500/30",
                !interactive && "cursor-default",
                className
            )}
            onClick={onClick}
        >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
