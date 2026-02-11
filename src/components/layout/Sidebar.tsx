'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
    BookOpen,
    LayoutDashboard,
    Settings,
    User as UserIcon,
    Users,
    Video,
    FileText,
    LogOut,
    ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion } from 'motion/react';
import { Logo } from '@/components/ui/logo';

const NAV_ITEMS = {
    STUDENT: [
        { label: 'Home', href: '/student', icon: LayoutDashboard },
        { label: 'Join Exam', href: '/student/join', icon: Video },
        { label: 'History', href: '/student/history', icon: FileText },
        { label: 'Help & Rules', href: '/student/help', icon: BookOpen },
    ],
    INSTRUCTOR: [
        { label: 'Exams', href: '/instructor', icon: BookOpen },
        { label: 'Monitor', href: '/instructor/monitor', icon: Video },
        { label: 'Rubrics', href: '/instructor/rubrics', icon: FileText },
    ],
    ADMIN: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
    PLATFORM_ADMIN: [
        { label: 'Overview', href: '/platform', icon: LayoutDashboard },
        { label: 'Requests', href: '/platform/requests', icon: Users },
    ],
    REVIEWER: [
        { label: 'Queue', href: '/reviewer', icon: LayoutDashboard },
        { label: 'History', href: '/reviewer/history', icon: FileText },
    ],
};

interface SidebarProps {
    className?: string;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export const Sidebar = ({ className, isMobile, onNavigate }: SidebarProps) => {
    const pathname = usePathname();
    const { user, logout, isLoading } = useAuth();

    // Ensure role is uppercase to match NAV_ITEMS keys
    const role = (user?.role || 'STUDENT').toUpperCase();
    const items = NAV_ITEMS[role as keyof typeof NAV_ITEMS] || NAV_ITEMS.STUDENT;

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const logoText = role === 'STUDENT' ? 'Student Portal' : 'Admin Console';

    const Content = (
        <div className={cn("flex flex-col h-full bg-sidebar border-r border-border transition-colors duration-300", className)}>
            {/* Logo */}
            <div className="px-6 py-5 border-b border-border">
                <Link href="/" className="flex items-center gap-3 group" onClick={onNavigate}>
                    <Logo showText={false} size="md" href="" />
                    <div className="flex flex-col">
                        <Logo showIcon={false} size="md" className="gap-0" href="" />
                        <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase group-hover:text-foreground transition-colors">
                            {logoText}
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto scroll-hidden">
                {items.map((item, index) => {
                    const Icon = item.icon;
                    // Exact match for root active state or specific sub-paths
                    const isActive = item.href === '/student' || item.href === '/instructor' || item.href === '/admin' || item.href === '/reviewer' || item.href === '/platform'
                        ? pathname === item.href
                        : pathname.startsWith(item.href);

                    return (
                        <div key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    'group flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 relative overflow-hidden font-medium text-sm',
                                    isActive
                                        ? 'text-sidebar-primary-foreground bg-sidebar-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-sidebar-primary rounded-lg"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className={cn("relative z-10 transition-colors")}>
                                    <Icon size={18} />
                                </div>
                                <span className="relative z-10">{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-border mt-auto">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto p-2.5 hover:bg-sidebar-accent group border border-transparent hover:border-border rounded-lg transition-all"
                        >
                            <Avatar className="h-9 w-9 border border-border group-hover:border-sidebar-primary transition-colors">
                                <AvatarFallback className="bg-sidebar-accent text-sidebar-foreground text-xs font-semibold">
                                    {isLoading ? '...' : user?.full_name ? getInitials(user.full_name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left overflow-hidden min-w-0">
                                <p className="text-xs font-semibold text-foreground truncate">
                                    {isLoading ? 'Loading...' : user?.full_name || 'User'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                    <p className="text-[10px] text-muted-foreground capitalize truncate">
                                        {role.toLowerCase()}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-popover border-border text-popover-foreground p-1 shadow-lg" side="top">
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm hover:bg-secondary transition-colors" onClick={onNavigate}>
                                <UserIcon className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-2 text-sm hover:bg-secondary transition-colors" onClick={onNavigate}>
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border my-1" />
                        <DropdownMenuItem
                            onClick={() => {
                                logout();
                                onNavigate?.();
                            }}
                            className="text-destructive hover:bg-destructive/10 cursor-pointer rounded-lg px-2 py-2 text-sm transition-colors"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );

    if (isMobile) {
        return Content;
    }

    return (
        <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="h-screen w-72 shrink-0 hidden md:block"
        >
            {Content}
        </motion.div>
    );
};
