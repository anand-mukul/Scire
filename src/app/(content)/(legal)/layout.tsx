'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const legalNav = [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Security', href: '/security' },
];

export default function LegalLayout({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    return (
        <div className="relative w-full">
            {/* Subtle top glow — Linear-inspired ambient light */}
            <div
                className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full opacity-[0.07]"
                style={{
                    background: 'radial-gradient(ellipse at center, hsl(var(--primary)), transparent 70%)',
                }}
            />

            {/* Minimal legal nav */}
            <nav className="relative z-10 flex items-center gap-6 mb-16 text-[13px]">
                {legalNav.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`transition-colors ${
                                isActive
                                    ? 'text-foreground font-medium'
                                    : 'text-muted-foreground/60 hover:text-muted-foreground'
                            }`}
                        >
                            {item.label}
                        </Link>
                    );
                })}
            </nav>

            {/* Content column */}
            <div className="relative z-10 max-w-[680px]">
                {children}
            </div>
        </div>
    );
}
