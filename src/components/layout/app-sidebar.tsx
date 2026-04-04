'use client';

import * as React from 'react';
import {
    BookOpen,
    LayoutDashboard,
    Settings,
    User as UserIcon,
    Users,
    Video,
    FileText,
    LogOut,
    GraduationCap,
    Activity,
    Plus,
    Command,
    ChevronsUpDown,
    Building2,
    Bug,
    ScrollText,
    ChevronRight,
    Search,
    type LucideIcon,
    ClipboardCheck,
    Eye,
    MonitorPlay,
    HelpCircle,
    Blocks,
    Lock,
    ChartBar,
    Target,
    AlertTriangle,
} from 'lucide-react';
import { Palette } from 'lucide-react';

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import { useSidebar } from '@/components/ui/sidebar';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    CommandDialog,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
} from '@/components/ui/command';
import { useAuth } from '@/contexts/AuthContext';
import { useTenant } from '@/contexts/TenantContext';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';
import { UpgradeModal } from '@/components/dashboard/upgrade-modal';
import { cn } from '@/lib/utils';

// ─── Types ───────────────────────────────────────────────────────

interface NavItem {
    label: string;
    href: string;
    icon: LucideIcon;
    minTier?: 'PRO' | 'ENTERPRISE';
    comingSoon?: boolean;
}

interface NavSection {
    label: string;
    icon: LucideIcon;
    items: NavItem[];
}

// ─── Navigation Config ──────────────────────────────────────────

const ROLE_NAV: Record<string, NavSection> = {
    PLATFORM_ADMIN: {
        label: 'Platform',
        icon: Blocks,
        items: [
            { label: 'Overview', href: '/platform', icon: LayoutDashboard },
            { label: 'Tenants', href: '/platform/tenants', icon: Building2 },
            { label: 'Error Reports', href: '/platform/reported-errors', icon: Bug },
            { label: 'Audit Logs', href: '/platform/audit-logs', icon: ScrollText },
            { label: 'Requests', href: '/platform/requests', icon: Users },
        ],
    },
    ADMIN: {
        label: 'Admin',
        icon: Settings,
        items: [
            { label: 'Overview', href: '/admin', icon: LayoutDashboard },
            { label: 'Analytics', href: '/admin/analytics', icon: ChartBar, minTier: 'PRO' },
            { label: 'Users', href: '/admin/users', icon: Users },
            { label: 'Subjects', href: '/admin/subjects', icon: GraduationCap },
            { label: 'System', href: '/admin/system', icon: Activity },
            { label: 'Extensions', href: '/admin/extensions', icon: AlertTriangle },
            { label: 'Settings', href: '/admin/settings', icon: Settings },
        ],
    },
    INSTRUCTOR: {
        label: 'Instructor',
        icon: BookOpen,
        items: [
            { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard },
            { label: 'Exams', href: '/instructor/exams', icon: BookOpen },
            { label: 'Create Exam', href: '/instructor/exam/create', icon: Plus },
            { label: 'Monitor', href: '/instructor/monitor', icon: MonitorPlay },
            { label: 'Rubrics', href: '/instructor/rubrics', icon: ClipboardCheck },
            { label: 'Extensions', href: '/instructor/extensions', icon: AlertTriangle },
        ],
    },
    REVIEWER: {
        label: 'Reviewer',
        icon: Eye,
        items: [
            { label: 'Queue', href: '/reviewer', icon: LayoutDashboard },
            { label: 'History', href: '/reviewer/history', icon: FileText },
        ],
    },
    STUDENT: {
        label: 'Student',
        icon: GraduationCap,
        items: [
            { label: 'Home', href: '/student', icon: LayoutDashboard },
            { label: 'Join Exam', href: '/student/join', icon: Video },
            { label: 'Practice', href: '/student/practice', icon: Target },
            { label: 'History', href: '/student/history', icon: FileText },
            { label: 'Help & Rules', href: '/student/help', icon: HelpCircle },
        ],
    },
};

const CROSS_ROLE_ACCESS: Record<string, string[]> = {
    PLATFORM_ADMIN: [],
    ADMIN: ['INSTRUCTOR', 'REVIEWER'],
    INSTRUCTOR: ['REVIEWER'],
    REVIEWER: [],
    STUDENT: [],
};

// ─── Component ──────────────────────────────────────────────────

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, logout } = useAuth();
    const { tenantName, subscriptionTier } = useTenant();
    const { state: sidebarState } = useSidebar();

    // Search state
    const [searchOpen, setSearchOpen] = React.useState(false);
    const [upgradeModalOpen, setUpgradeModalOpen] = React.useState(false);
    const [isMac, setIsMac] = React.useState(false);

    React.useEffect(() => {
        setIsMac(/(Mac|iPhone|iPod|iPad)/i.test(navigator.platform));
    }, []);

    const role = (user?.role || 'STUDENT').toUpperCase();
    const primarySection = ROLE_NAV[role] || ROLE_NAV.STUDENT;
    const crossRoles = CROSS_ROLE_ACCESS[role] || [];

    // Helper to check access
    const hasAccess = (minTier?: string) => {
        if (!minTier) return true;
        const tiers = { STARTER: 1, PRO: 2, ENTERPRISE: 3 };
        const current = tiers[(subscriptionTier || 'STARTER') as keyof typeof tiers] || 1;
        const required = tiers[minTier as keyof typeof tiers] || 100;
        return current >= required;
    };

    // ⌘K shortcut
    React.useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setSearchOpen((open) => !open);
            }
        };
        document.addEventListener('keydown', down);
        return () => document.removeEventListener('keydown', down);
    }, []);

    const getInitials = (name: string) =>
        name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);

    const isActive = (href: string) => {
        if (href === '/student' || href === '/instructor' || href === '/admin' || href === '/platform' || href === '/reviewer') {
            return pathname === href;
        }
        return pathname.startsWith(href);
    };

    // Build all searchable items
    const allSections: NavSection[] = [primarySection, ...crossRoles.map((r) => ROLE_NAV[r]).filter(Boolean)];

    return (
        <>
            <UpgradeModal
                open={upgradeModalOpen}
                onOpenChange={setUpgradeModalOpen}
                featureName="Advanced Analytics"
            />
            <Sidebar collapsible="icon" {...props}>
                <SidebarHeader>
                    <div className="flex items-center gap-2 py-3">
                        <img
                            src="/brand-logo.svg"
                            alt="Scire"
                            className={cn(
                                'flex-shrink-1 transition-all duration-200',
                                sidebarState === 'collapsed' ? 'w-6 h-6' : 'w-6 h-6'
                            )}
                        />
                        {sidebarState !== 'collapsed' && (
                            <div className="grid flex-1 text-left leading-tight min-w-0">
                                <span className="truncate font-bold text-base tracking-tight text-foreground">Scire</span>
                                <span className="truncate text-xs text-muted-foreground">{tenantName || 'Education Platform'}</span>
                            </div>
                        )}
                    </div>
                </SidebarHeader>

                <SidebarContent>
                    {/* Search Trigger */}
                    <SidebarGroup className="py-0">
                        <SidebarGroupContent>
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        onClick={() => setSearchOpen(true)}
                                        tooltip="Search"
                                        className="h-9 bg-sidebar-accent/30 border border-sidebar-border hover:bg-sidebar-accent/50 transition-colors cursor-pointer"
                                        aria-keyshortcuts={isMac ? 'Meta+K' : 'Control+K'}
                                    >
                                        <Search className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm text-muted-foreground">Search...</span>
                                        <span className="pointer-events-none ml-auto inline-flex h-5 select-none items-center rounded-md bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground/70 group-data-[collapsible=icon]:hidden">
                                            {isMac ? '⌘' : 'Ctrl+'}K
                                        </span>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Primary Navigation */}
                    <SidebarGroup>
                        <SidebarGroupLabel>{primarySection.label}</SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenu>
                                {primarySection.items.map((item) => {
                                    const active = isActive(item.href);
                                    const locked = item.minTier && !hasAccess(item.minTier);
                                    const disabled = locked || item.comingSoon;

                                    return (
                                        <SidebarMenuItem key={item.href}>
                                            <SidebarMenuButton
                                                asChild={!disabled}
                                                isActive={active}
                                                tooltip={item.comingSoon ? `${item.label} (Coming Soon)` : item.label}
                                                onClick={(e) => {
                                                    if (item.comingSoon) {
                                                        e.preventDefault();
                                                    } else if (locked) {
                                                        e.preventDefault();
                                                        setUpgradeModalOpen(true);
                                                    }
                                                }}
                                                className={`transition-all duration-150 ${disabled ? 'opacity-60 hover:bg-transparent hover:text-muted-foreground cursor-not-allowed' : ''}`}
                                            >
                                                {disabled ? (
                                                    <>
                                                        <item.icon className="h-4 w-4 shrink-0" />
                                                        <span className="flex-1 truncate">{item.label}</span>
                                                        {item.comingSoon ? (
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-orange-500/80 bg-orange-500/10 px-1.5 py-0.5 rounded ml-auto group-data-[collapsible=icon]:hidden">Soon</span>
                                                        ) : (
                                                            <Lock className="h-3 w-3 text-muted-foreground ml-auto" />
                                                        )}
                                                    </>
                                                ) : (
                                                    <Link href={item.href}>
                                                        <item.icon className="h-4 w-4" />
                                                        <span>{item.label}</span>
                                                    </Link>
                                                )}
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    );
                                })}
                            </SidebarMenu>
                        </SidebarGroupContent>
                    </SidebarGroup>

                    {/* Cross-Role Navigation */}
                    {crossRoles.length > 0 && (
                        <SidebarGroup>
                            <SidebarGroupLabel>Switch Role</SidebarGroupLabel>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {crossRoles.map((crossRole) => {
                                        const section = ROLE_NAV[crossRole];
                                        if (!section) return null;
                                        // Check if any sub-item is active
                                        const hasActiveChild = section.items.some((item) => isActive(item.href));
                                        return (
                                            <Collapsible
                                                key={crossRole}
                                                asChild
                                                defaultOpen={hasActiveChild}
                                                className="group/collapsible"
                                            >
                                                <SidebarMenuItem>
                                                    <CollapsibleTrigger asChild>
                                                        <SidebarMenuButton
                                                            tooltip={section.label}
                                                            className="transition-all duration-150"
                                                        >
                                                            <section.icon className="h-4 w-4" />
                                                            <span>{section.label}</span>
                                                            <ChevronRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                                                        </SidebarMenuButton>
                                                    </CollapsibleTrigger>
                                                    <CollapsibleContent>
                                                        <SidebarMenuSub>
                                                            {section.items.map((item) => (
                                                                <SidebarMenuSubItem key={item.href}>
                                                                    <SidebarMenuSubButton
                                                                        asChild
                                                                        isActive={isActive(item.href)}
                                                                    >
                                                                        <Link href={item.href}>
                                                                            <item.icon className="h-3.5 w-3.5" />
                                                                            <span>{item.label}</span>
                                                                        </Link>
                                                                    </SidebarMenuSubButton>
                                                                </SidebarMenuSubItem>
                                                            ))}
                                                        </SidebarMenuSub>
                                                    </CollapsibleContent>
                                                </SidebarMenuItem>
                                            </Collapsible>
                                        );
                                    })}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    )}
                </SidebarContent>

                <SidebarFooter>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <SidebarMenuButton
                                        size="lg"
                                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground transition-all hover:bg-sidebar-accent/50"
                                    >
                                        <Avatar className="h-8 w-8 rounded-lg border">
                                            <AvatarFallback className="rounded-lg bg-primary/10 text-primary font-medium text-xs">
                                                {getInitials(user?.full_name || 'User')}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                                            <span className="truncate font-semibold">{user?.full_name}</span>
                                            <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                        </div>
                                        <ChevronsUpDown className="ml-auto size-4" />
                                    </SidebarMenuButton>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                                    side="bottom"
                                    align="end"
                                    sideOffset={4}
                                >
                                    <DropdownMenuLabel className="p-0 font-normal">
                                        <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                            <Avatar className="h-8 w-8 rounded-lg">
                                                <AvatarFallback className="rounded-lg">
                                                    {getInitials(user?.full_name || 'User')}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="grid flex-1 text-left text-sm leading-tight">
                                                <span className="truncate font-semibold">{user?.full_name}</span>
                                                <span className="truncate text-xs text-muted-foreground">{user?.email}</span>
                                            </div>
                                        </div>
                                    </DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                        <Link href="/profile" className="cursor-pointer flex items-center">
                                            <UserIcon className="mr-2 h-4 w-4" />
                                            Profile
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" className="cursor-pointer flex items-center">
                                            <Settings className="mr-2 h-4 w-4" />
                                            Settings
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-muted-foreground" />
                                            <span>Theme</span>
                                        </div>
                                        <AnimatedThemeToggler />
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarFooter>
                <SidebarRail />
            </Sidebar>

            {/* Command Palette */}
            <CommandDialog
                open={searchOpen}
                onOpenChange={setSearchOpen}
                title="Navigation"
                description="Search for a page to navigate to..."
            >
                <CommandInput placeholder="Search pages..." />
                <CommandList>
                    <CommandEmpty>No pages found.</CommandEmpty>
                    {allSections.map((section) => (
                        <CommandGroup key={section.label} heading={section.label}>
                            {section.items.map((item) => (
                                <CommandItem
                                    key={item.href}
                                    value={`${section.label} ${item.label}`}
                                    onSelect={() => {
                                        router.push(item.href);
                                        setSearchOpen(false);
                                    }}
                                    className="cursor-pointer"
                                >
                                    <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                                    <span>{item.label}</span>
                                    <span className="ml-auto text-xs text-muted-foreground/50 group-data-[selected=true]:text-muted-foreground">
                                        {item.href}
                                    </span>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    ))}
                </CommandList>
            </CommandDialog>
        </>
    );
}
