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
            whileHover={interactive ? { y: -2 } : undefined}
            whileTap={interactive && onClick ? { y: 0 } : undefined}
            className={cn(
                "relative overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200",
                interactive && "cursor-pointer hover:shadow-md hover:border-primary/20",
                !interactive && "cursor-default",
                className
            )}
            onClick={onClick}
        >
            {/* Subtle gradient overlay on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            <div className="relative z-10">
                {children}
            </div>
        </motion.div>
    );
};
