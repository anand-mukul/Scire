"use client";
import React from "react";
import { cn } from "@/lib/utils";

export const BackgroundBeams = ({ className }: { className?: string }) => {
    return (
        <div
            className={cn(
                "absolute inset-0 w-full h-full bg-black dark:bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]",
                className
            )}
        >
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
            {/* Decorative gradients */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] opacity-30 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute top-1/4 left-1/4 w-[20rem] h-[20rem] opacity-20 bg-gradient-to-tr from-purple-500 to-indigo-500 rounded-full blur-[80px]"></div>
        </div>
    );
};
