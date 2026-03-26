import React, { ReactNode } from 'react';
import { GuestGuard } from '@/components/auth/AuthGuard';
import { AuthBackground } from '@/components/auth/AuthBackground';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <React.Suspense fallback={
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            </div>
        }>
            <GuestGuard>
                <AuthBackground>
                    {/* Full-height flex column: logo at top, form centered, footer at bottom */}
                    <div className="flex flex-col min-h-dvh">
                        {/* Logo Header — fixed at top */}
                        <header className="shrink-0 p-4 md:p-5">
                            <Logo textClassName="!bg-none !text-white/90" />
                        </header>

                        {/* Main Content — takes remaining space, centers the form card */}
                        <main className="flex-1 flex items-center justify-center px-4 py-2">
                            {children}
                        </main>

                        {/* Footer — fixed at bottom */}
                        <footer className="shrink-0 px-6 py-4 text-center text-sm text-white/70 flex flex-col md:flex-row justify-center items-center gap-3">
                            <span>© 2026 Scire Inc. All rights reserved.</span>
                            <span className="hidden md:inline text-white/30">|</span>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                <span>Systems Operational</span>
                            </div>
                        </footer>
                    </div>
                </AuthBackground>
            </GuestGuard>
        </React.Suspense>
    );
}
