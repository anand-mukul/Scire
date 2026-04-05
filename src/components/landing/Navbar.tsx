'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, PlayCircle, LogIn, UserPlus, LogOut, Menu } from "lucide-react";
import { useState, useEffect } from 'react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Logo } from '@/components/ui/logo';
import { useAuth, getLandingPageForRole } from '@/contexts/AuthContext';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";

export const Navbar = () => {
    const { user, isLoading, logout } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const navLinks = [
        { label: "Features", href: "/#features" },
        { label: "Pricing", href: "/pricing" },
    ];

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 py-4 md:px-12 border-b transition-all duration-300 ${scrolled
                ? "bg-white/70 dark:bg-neutral-950/70 backdrop-blur-xl border-neutral-200/50 dark:border-white/5 py-3 shadow-sm"
                : "bg-transparent border-transparent py-5"
                }`}
        >
            <div className="flex items-center gap-8">
                <Logo forceDefaultBranding size="sm" textClassName="text-neutral-900 dark:text-white" />
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-sm font-medium text-neutral-600 dark:text-neutral-300 hover:text-black dark:hover:text-white transition-colors relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black dark:bg-white transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                    <AnimatedThemeToggler />
                </div>

                {!isLoading && user ? (
                    <div className="hidden sm:flex items-center gap-3">
                        <Link href={user?.role ? getLandingPageForRole(user.role) : '/student'}>
                            <Button className="bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 shadow-md font-medium rounded-full px-5 py-2 h-9 transition-all hover:scale-105">
                                Dashboard
                                <ChevronRight className="w-4 h-4 ml-0.5" />
                            </Button>
                        </Link>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={logout}
                            className="text-neutral-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                        </Button>
                    </div>
                ) : (
                    <div className="hidden sm:flex items-center gap-4">

                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white rounded-full font-medium">
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/request-access">
                            <Button className="font-medium rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-md hover:shadow-lg hover:shadow-primary/20 transition-all">
                                Request Access
                                <ChevronRight className="w-4 h-4 ml-0.5" />
                            </Button>
                        </Link>

                    </div>
                )}

                {/* Mobile Menu */}
                <div className="sm:hidden flex items-center gap-2">
                    <AnimatedThemeToggler />
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full">
                                <Menu className="w-6 h-6 text-neutral-900 dark:text-white" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[300px] sm:w-[540px] border-l border-neutral-200 dark:border-white/10 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl">
                            <SheetHeader className="mb-8 text-left">
                                <SheetTitle>
                                    <Logo forceDefaultBranding textClassName="text-neutral-900 dark:text-white" />
                                </SheetTitle>
                            </SheetHeader>
                            <div className="flex flex-col gap-6">
                                <div className="flex flex-col gap-4">
                                    {navLinks.map((link) => (
                                        <Link
                                            key={link.href}
                                            href={link.href}
                                            className="text-lg font-medium text-neutral-600 hover:text-black dark:text-neutral-300 dark:hover:text-white transition-colors"
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                                <div className="h-px bg-neutral-200 dark:bg-white/10" />
                                <div className="flex flex-col gap-3">
                                    {!isLoading && user ? (
                                        <>
                                            <Link href={user?.role ? getLandingPageForRole(user.role) : '/student'} className="w-full">
                                                <Button className="w-full bg-neutral-900 dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200 rounded-full h-11">
                                                    Dashboard
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                            <Button
                                                variant="outline"
                                                onClick={logout}
                                                className="w-full border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400 dark:hover:bg-red-950/30 rounded-full h-11"
                                            >
                                                <LogOut className="w-4 h-4 mr-2" />
                                                Sign Out
                                            </Button>
                                        </>
                                    ) : (
                                        <>
                                            <Link href="/auth/login" className="w-full">
                                                <Button variant="outline" className="w-full rounded-full h-11 border-neutral-200 dark:border-white/10">
                                                    Sign In
                                                </Button>
                                            </Link>
                                            <Link href="/request-access" className="w-full">
                                                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full h-11">
                                                    Request Access
                                                    <ChevronRight className="w-4 h-4 ml-1" />
                                                </Button>
                                            </Link>
                                        </>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </motion.nav>
    );
};
