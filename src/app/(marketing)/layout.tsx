'use client';

import { ReactNode } from 'react';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';

export default function MarketingLayout({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">


            <Navbar />

            <main className="flex-1 relative z-10 pt-20">
                {children}
            </main>

            <Footer />
        </div>
    );
}
