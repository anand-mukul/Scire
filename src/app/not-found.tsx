'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="h-screen w-full rounded-md bg-black relative flex flex-col items-center justify-center antialiased">

            <div className="max-w-2xl mx-auto p-4 relative z-10 text-center space-y-8">
                <div className="relative inline-block">
                    <h1 className="text-9xl md:text-[12rem] font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 select-none">
                        404
                    </h1>
                    <div className="absolute inset-0 bg-gradient-to-b from-neutral-50 to-neutral-400 opacity-20 blur-2xl -z-10" />
                </div>

                <div className="space-y-4">
                    <h2 className="text-2xl md:text-4xl font-bold text-white">
                        Signal Lost
                    </h2>
                    <p className="text-neutral-400 text-lg max-w-lg mx-auto leading-relaxed">
                        The frequency you are trying to tune into does not exist.
                        It may have been moved to a new sector or dissolved into the void.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8">
                    <Link href="/">
                        <Button className="h-12 px-8 rounded-full bg-white text-black hover:bg-neutral-200 shadow-[0_0_20px_-5px_rgba(255,255,255,0.3)] transition-all hover:scale-105 font-medium text-lg group">
                            <Home className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                            Return Home
                        </Button>
                    </Link>
                    <Button onClick={() => window.history.back()} variant="outline" className="h-12 px-8 rounded-full border-white/10 text-white hover:bg-white/5 hover:border-white/20 transition-all font-medium text-lg">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Go Back
                    </Button>
                </div>
            </div>

            <div className="absolute inset-0 bg-grid-white/[0.02] pointer-events-none" />
        </div>
    );
}
