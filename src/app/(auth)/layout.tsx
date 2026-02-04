import { ReactNode } from 'react';
import { GuestGuard } from '@/components/auth/AuthGuard';
import { AmbientGlow } from '@/components/ui/ambient-glow';
import { Logo } from '@/components/ui/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <GuestGuard>
            <div className="min-h-screen bg-background flex flex-col relative overflow-hidden transition-colors duration-300">
                {/* Background Effects */}
                <AmbientGlow />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,var(--primary)/0.05,transparent_60%)] pointer-events-none" />

                {/* Logo Header */}
                <header className="relative z-10 p-6 md:p-8">
                    <Logo />
                </header>

                {/* Main Content */}
                <main className="relative z-10 flex-1 flex items-center justify-center px-4 py-8">
                    {children}
                </main>

                {/* Footer */}
                <footer className="relative z-10 p-6 text-center text-sm text-muted-foreground flex flex-col md:flex-row justify-center items-center gap-4">
                    <span>© 2026 Scire Inc. All rights reserved.</span>
                    <span className="hidden md:inline text-border">|</span>
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span>Systems Operational</span>
                    </div>
                </footer>
            </div>
        </GuestGuard>
    );
}
