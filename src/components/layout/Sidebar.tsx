'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
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
    GraduationCap,
    Activity,
    Plus,
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
        { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
        { label: 'Exams', href: '/instructor/exams', icon: BookOpen },
        { label: 'Create Exam', href: '/instructor/exam/create', icon: Plus },
        { label: 'Monitor', href: '/instructor/monitor', icon: Video },
        { label: 'Rubrics', href: '/instructor/rubrics', icon: FileText },
    ],
    ADMIN: [
        { label: 'Overview', href: '/admin', icon: LayoutDashboard },
        { label: 'Users', href: '/admin/users', icon: Users },
        { label: 'Subjects', href: '/admin/subjects', icon: GraduationCap },
        { label: 'System', href: '/admin/system', icon: Activity },
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

const ROLE_LABELS: Record<string, string> = {
    STUDENT: 'Student',
    INSTRUCTOR: 'Instructor',
    ADMIN: 'Admin',
    PLATFORM_ADMIN: 'Platform',
    REVIEWER: 'Reviewer',
};

interface SidebarProps {
    className?: string;
    isMobile?: boolean;
    onNavigate?: () => void;
}

export const Sidebar = ({ className, isMobile, onNavigate }: SidebarProps) => {
    const pathname = usePathname();
    const { user, logout, isLoading } = useAuth();
    const { tenantName } = useTenant();

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

    const orgName = tenantName || 'Scire';
    const roleLabel = ROLE_LABELS[role] || 'User';

    const Content = (
        <div className={cn("flex flex-col h-full bg-sidebar/80 backdrop-blur-xl border-r border-sidebar-border transition-colors duration-300", className)}>
            {/* Logo & Org Name */}
            <div className="p-6 border-b border-sidebar-border/50">
                <Link href="/" className="flex items-center gap-3 group" onClick={onNavigate}>
                    <Logo showText={false} size="md" href="" />
                    <div className="flex flex-col">
                        <span className="text-base font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">
                            {orgName}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase group-hover:text-foreground transition-colors">
                            {roleLabel} Console
                        </span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto scroll-hidden">
                {items.map((item) => {
                    const Icon = item.icon;
                    const isExactMatch = item.href === '/student' || item.href === '/instructor' || item.href === '/admin' || item.href === '/reviewer' || item.href === '/platform';
                    const isActive = isExactMatch ? pathname === item.href : pathname.startsWith(item.href);

                    return (
                        <div key={item.href}>
                            <Link
                                href={item.href}
                                onClick={onNavigate}
                                className={cn(
                                    'group flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden',
                                    isActive
                                        ? 'text-sidebar-primary-foreground font-medium'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50'
                                )}
                            >
                                {isActive && (
                                    <motion.div
                                        layoutId="sidebar-active"
                                        className="absolute inset-0 bg-sidebar-primary shadow-[0_0_20px_-5px_var(--brand-primary)] rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                    />
                                )}
                                <div className={cn("relative z-10 p-1 rounded-lg transition-colors", isActive ? "text-white" : "text-muted-foreground group-hover:text-foreground")}>
                                    <Icon size={18} />
                                </div>
                                <span className="relative z-10 text-sm tracking-wide">{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* User Profile Section */}
            <div className="p-4 border-t border-sidebar-border/50 mt-auto bg-sidebar-accent/20">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 h-auto p-3 hover:bg-sidebar-accent/50 group border border-transparent hover:border-sidebar-border/50 rounded-xl transition-all"
                        >
                            <Avatar className="h-10 w-10 border-2 border-sidebar-border group-hover:border-sidebar-primary/50 transition-colors">
                                <AvatarFallback className="bg-gradient-to-br from-sidebar-accent to-sidebar-secondary text-sidebar-foreground text-sm font-bold">
                                    {isLoading ? '...' : user?.full_name ? getInitials(user.full_name) : 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-left overflow-hidden">
                                <p className="text-sm font-bold text-foreground truncate transition-colors">
                                    {isLoading ? 'Loading...' : user?.full_name || 'User'}
                                </p>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <p className="text-[10px] text-muted-foreground capitalize truncate font-mono tracking-wider">
                                        {role.toLowerCase()}
                                    </p>
                                </div>
                            </div>
                            <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground shrink-0 transition-colors" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 bg-popover/80 backdrop-blur-xl border-border text-popover-foreground p-2 shadow-2xl" side="top">
                        <DropdownMenuItem asChild>
                            <Link href="/profile" className="flex items-center gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground rounded-lg py-2" onClick={onNavigate}>
                                <UserIcon className="h-4 w-4" />
                                <span>Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                            <Link href="/settings" className="flex items-center gap-2 cursor-pointer focus:bg-accent focus:text-accent-foreground rounded-lg py-2" onClick={onNavigate}>
                                <Settings className="h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-border my-2" />
                        <DropdownMenuItem
                            onClick={() => {
                                logout();
                                onNavigate?.();
                            }}
                            className="text-destructive focus:text-destructive-foreground focus:bg-destructive/10 cursor-pointer rounded-lg py-2"
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
