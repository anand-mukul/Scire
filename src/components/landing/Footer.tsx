'use client';

import React from 'react';
import Link from 'next/link';
import { motion, useScroll, useTransform } from 'motion/react';
import {
    Github,
    Twitter,
    Linkedin,
    Mail,
    ArrowUp
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';

export const Footer = () => {
    const currentYear = new Date().getFullYear();
    const { scrollYProgress } = useScroll();
    const opacity = useTransform(scrollYProgress, [0.9, 1], [0, 1]);

    const footerLinks = {
        product: [
            { label: 'Request Access', href: '/request-access' },
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

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <footer className="bg-neutral-50 dark:bg-neutral-950 border-t border-gray-200 dark:border-white/10 relative overflow-hidden transition-colors duration-300">
            {/* Animated watermark */}
            <motion.div
                style={{ opacity, x: useTransform(scrollYProgress, [0.9, 1], [0, -20]) }}
                className="absolute -bottom-20 left-1/2 -translate-x-1/2 text-[15rem] md:text-[20rem] font-bold text-black/[0.02] dark:text-white/[0.02] tracking-tighter select-none pointer-events-none whitespace-nowrap z-0"
            >
                SCIRE
            </motion.div>

            <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.02)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none opacity-20" />

            <div className="container mx-auto px-4 py-24 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 mb-24">
                    {/* Brand column */}
                    <div className="lg:col-span-4 space-y-6">
                        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                            <Logo textClassName="text-neutral-900 dark:text-white" />
                        </motion.div>
                        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-sm text-lg">
                            The autonomous AI oral examination platform. Redefining assessment with integrity, speed, and deep analytics.
                        </p>
                        <div className="flex items-center gap-4 pt-4">
                            {[
                                { icon: Twitter, href: '#' },
                                { icon: Github, href: '#' },
                                { icon: Linkedin, href: '#' },
                                { icon: Mail, href: 'mailto:contact@scire.in' }
                            ].map((social, i) => (
                                <motion.a
                                    key={i}
                                    href={social.href}
                                    whileHover={{ y: -3, scale: 1.1 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="p-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-neutral-600 dark:text-neutral-400 hover:text-black dark:hover:text-white hover:bg-black/10 dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300"
                                >
                                    <social.icon className="w-5 h-5" />
                                </motion.a>
                            ))}
                        </div>
                    </div>

                    {/* Link columns */}
                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-neutral-900 dark:text-white font-bold mb-8 text-lg">Product</h4>
                        <ul className="space-y-4">
                            {footerLinks.product.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors text-base group inline-flex items-center">
                                        <span className="relative">
                                            {link.label}
                                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-neutral-900 dark:text-white font-bold mb-8 text-lg">Company</h4>
                        <ul className="space-y-4">
                            {footerLinks.company.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors text-base group inline-flex items-center">
                                        <span className="relative">
                                            {link.label}
                                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="lg:col-span-2 md:col-span-4">
                        <h4 className="text-neutral-900 dark:text-white font-bold mb-8 text-lg">Legal</h4>
                        <ul className="space-y-4">
                            {footerLinks.legal.map((link) => (
                                <li key={link.label}>
                                    <Link href={link.href} className="text-neutral-600 dark:text-neutral-400 hover:text-primary dark:hover:text-primary transition-colors text-base group inline-flex items-center">
                                        <span className="relative">
                                            {link.label}
                                            <span className="absolute -bottom-0.5 left-0 w-0 h-px bg-primary transition-all duration-300 group-hover:w-full" />
                                        </span>
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom bar */}
                <div className="pt-8 mt-8 border-t border-gray-200 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-neutral-600 dark:text-neutral-400">
                    <p>© {currentYear} Scire Inc. All rights reserved.</p>
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            <span className="font-medium">Systems Operational</span>
                        </div>
                        <span className="hidden sm:inline">·</span>
                        <p className="font-medium">Designed for the future.</p>
                    </div>
                </div>
            </div>

            {/* Scroll to top */}
            <motion.button
                onClick={scrollToTop}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="fixed bottom-8 right-8 z-50 p-3 rounded-full bg-neutral-900 dark:bg-white text-white dark:text-black shadow-lg hover:shadow-xl transition-all"
            >
                <ArrowUp className="w-5 h-5" />
            </motion.button>
        </footer>
    );
};