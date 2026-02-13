'use client';

import React from 'react';
// import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface PremiumCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    interactive?: boolean; // Enable scale animations only when true
}

export const PremiumCard = ({ children, className, onClick, interactive = false }: PremiumCardProps) => {
    return (
        <div
            className={cn(
                "rounded-xl border bg-card text-card-foreground shadow-sm transition-all duration-200",
                interactive && "cursor-pointer hover:bg-muted/50 hover:shadow-md",
                !interactive && "cursor-default",
                className
            )}
            onClick={onClick}
        >
            <div className="relative z-10">
                {children}
            </div>
        </div>
    );
};
