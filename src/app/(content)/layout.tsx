'use client';

import { ReactNode } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
// import { AmbientGlow } from '@/components/ui/ambient-glow';

export default function ContentLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                {/* <AmbientGlow /> */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
            </div>

            <Navbar />

            <main className="flex-1 relative z-10 pt-32 pb-20 container mx-auto px-4 max-w-4xl">
                {children}
            </main>

            <Footer />
        </div>
    );
}
