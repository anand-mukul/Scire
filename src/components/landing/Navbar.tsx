'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogIn, UserPlus, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { Logo } from '@/components/ui/logo';
import { useAuth } from '@/contexts/AuthContext';

export const Navbar = () => {
    const { user, isLoading } = useAuth();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <motion.nav
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.5 }}
            className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 sm:px-6 lg:px-8 py-4 border-b transition-all duration-300 ${scrolled
                ? "bg-background/80 backdrop-blur-sm border-border"
                : "bg-transparent border-transparent"
                }`}
        >
            <Logo size="sm" />

            <div className="flex items-center gap-3 sm:gap-4">
                <AnimatedThemeToggler />

                {!isLoading && user ? (
                    <Link href="/student">
                        <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-semibold">
                            Dashboard
                            <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                    </Link>
                ) : (
                    <>
                        <Link href="/auth/login">
                            <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-secondary">
                                <LogIn className="w-4 h-4 mr-1.5 hidden sm:block" />
                                Sign In
                            </Button>
                        </Link>
                        <Link href="/auth/register">
                            <Button className="h-10 px-6 bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-semibold">
                                <UserPlus className="w-4 h-4 mr-1.5 hidden sm:block" />
                                Get Started
                                <ChevronRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </>
                )}
            </div>
        </motion.nav>
    );
};
