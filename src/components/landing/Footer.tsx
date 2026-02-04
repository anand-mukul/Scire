'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
    Github,
    Twitter,
    Linkedin,
    Mail,
    ArrowRight
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export const Footer = () => {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
        product: [
            { label: 'Features', href: '/#features' },
            { label: 'Pricing', href: '/pricing' },
            { label: 'Case Studies', href: '/case-studies' },
            { label: 'Documentation', href: '/docs' },
        ],
        company: [
            { label: 'About Us', href: '/about' },
            { label: 'Careers', href: '/careers' },
            { label: 'Blog', href: '/blog' },
            { label: 'Contact', href: '/contact' },
        ],
        legal: [
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Cookie Policy', href: '/cookies' },
            { label: 'Security', href: '/security' },
        ]
    };

    return (
        <footer className="bg-background border-t border-border relative overflow-hidden transition-colors duration-300">
            {/* Watermark */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-[15rem] md:text-[20rem] font-bold text-foreground/[0.03] tracking-tighter select-none pointer-events-none whitespace-nowrap z-0">
                SCIRE
            </div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />

            <div className="container mx-auto px-4 py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-24">

                    <div className="lg:col-span-4 space-y-6">
                        <Logo />
                        <p className="text-muted-foreground leading-relaxed max-w-sm text-lg">
                            The autonomous AI oral examination platform. Redefining assessment with integrity, speed, and deep analytics.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            {[
                                { icon: Twitter, href: '#' },
                                { icon: Github, href: '#' },
                                { icon: Linkedin, href: '#' },
                                { icon: Mail, href: 'mailto:contact@scira.com' }
                            ].map((social, i) => (
                                <a
                                    key={i}
                                    href={social.href}
                                    className="p-3 rounded-full bg-primary/5 dark:bg-white/5 border border-primary/10 dark:border-white/5 text-muted-foreground hover:text-foreground hover:bg-primary/10 dark:hover:bg-white/10 hover:border-primary/20 dark:hover:border-white/20 transition-all duration-300"
                                >
                                    <social.icon className="w-5 h-5" />
                                </a>
                            ))}
                        </div>
                    </div>


                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-foreground font-bold mb-8 text-lg">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-base">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-foreground font-bold mb-8 text-lg">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-base">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-foreground font-bold mb-8 text-lg">Legal</h4>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-muted-foreground hover:text-foreground transition-colors text-base">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>


                <div className="pt-8 mt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© {currentYear} Scire Inc. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                            <span className="font-medium text-muted-foreground">Systems Operational</span>
                        </div>
                        <p className="font-medium text-muted-foreground">Designed for the future.</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};
