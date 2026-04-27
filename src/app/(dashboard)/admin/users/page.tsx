'use client';

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { UserRole } from '@/types/auth'; // Ensure this exists
import { User } from '@/types/auth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Shield,
    UserCheck,
    UserX,
    School,
    GraduationCap,
    CheckCircle2,
    Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { formatToLocalDateTime } from '@/lib/date-utils';
import { PageHeader } from '@/components/dashboard/page-header';
import { KPICard } from '@/components/dashboard/kpi-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { StatusBadge } from '@/components/ui/status-badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';

const ROLES = [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.REVIEWER, UserRole.ADMIN] as const;

interface UserWithMeta extends Omit<User, 'created_at'> {
    created_at?: string;
}

const createUserSchema = z.object({
    full_name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.nativeEnum(UserRole),
});

type CreateUserFormValues = z.infer<typeof createUserSchema>;

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Form definition
    const form = useForm<CreateUserFormValues>({
        resolver: zodResolver(createUserSchema),
        defaultValues: {
            full_name: '',
            email: '',
            password: '',
            role: UserRole.STUDENT,
        },
    });

    // Reset form when dialog opens/closes
    React.useEffect(() => {
        if (!isCreateDialogOpen) {
            form.reset();
        }
    }, [isCreateDialogOpen, form]);

    // Fetch users
    const { data: users, isLoading } = useQuery<UserWithMeta[]>({
        queryKey: ['tenant-users', roleFilter],
        queryFn: () => api.tenant.listUsers({
            role: roleFilter !== 'all' ? roleFilter : undefined,
            limit: 100
        }),
    });

    // Create user mutation
    const createUserMutation = useMutation({
        mutationFn: (data: CreateUserFormValues) =>
            api.tenant.createUser(data),
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
            setIsCreateDialogOpen(false);
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create user');
        },
    });

    // Update user mutation
    const updateUserMutation = useMutation({
        mutationFn: ({ userId, data }: { userId: string; data: { role?: string; is_active?: boolean } }) =>
            api.tenant.updateUser(userId, data),
        onSuccess: () => {
            toast.success('User updated successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update user');
        },
    });

    const handleCreateUser = (data: CreateUserFormValues) => {
        createUserMutation.mutate(data);
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        updateUserMutation.mutate({ userId, data: { role: newRole } });
    };

    const handleToggleStatus = (userId: string, currentStatus: boolean) => {
        updateUserMutation.mutate({ userId, data: { is_active: !currentStatus } });
    };

    // Derived stats
    const stats = useMemo(() => {
        if (!users) return { total: 0, students: 0, instructors: 0, active: 0 };
        return {
            total: users.length,
            students: users.filter(u => u.role === UserRole.STUDENT).length,
            instructors: users.filter(u => u.role === UserRole.INSTRUCTOR).length,
            active: users.filter(u => u.is_active).length,
        };
    }, [users]);

    // Filter users by search query
    const filteredUsers = users?.filter((user) => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            user.email.toLowerCase().includes(query) ||
            user.full_name.toLowerCase().includes(query)
        );
    });

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">

            {/* Header */}
            <PageHeader
                title="User Management"
                description="Manage access, roles, and user accounts for your organization."
                actions={
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-md">
                                <Plus className="w-4 h-4" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground max-w-md backdrop-blur-xl sm:rounded-2xl">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Add a new user to the platform with specified role and credentials.
                                </DialogDescription>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4 py-4">
                                    <FormField
                                        control={form.control}
                                        name="full_name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Full Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Ashok Kumar" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl>
                                                    <Input type="email" placeholder="akash@edu.in" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="password"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Password</FormLabel>
                                                <FormControl>
                                                    <Input type="password" placeholder="••••••••" className="bg-background/50" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <FormField
                                        control={form.control}
                                        name="role"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Role</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger className="bg-background/50">
                                                            <SelectValue placeholder="Select role" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        {ROLES.map((role) => (
                                                            <SelectItem key={role} value={role}>
                                                                {role}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsCreateDialogOpen(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={createUserMutation.isPending}
                                        >
                                            {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                }
            />

            {/* KPI Stats */}
            <div className="grid gap-6 md:grid-cols-4">
                <KPICard
                    title="Total Accounts"
                    value={stats.total}
                    icon={Users}
                    trend="neutral"
                    loading={isLoading}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Instructors"
                    value={stats.instructors}
                    icon={School}
                    change={`${Math.round((stats.instructors / (stats.total || 1)) * 100)}% of total`}
                    trend="neutral"
                    loading={isLoading}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Students"
                    value={stats.students}
                    icon={GraduationCap}
                    change={`${Math.round((stats.students / (stats.total || 1)) * 100)}% of total`}
                    trend="neutral"
                    loading={isLoading}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
                <KPICard
                    title="Active Users"
                    value={stats.active}
                    icon={CheckCircle2}
                    change="Accounts enabled"
                    trend="up"
                    loading={isLoading}
                    className="shadow-sm border-border/60 bg-gradient-to-br from-card to-card/50"
                />
            </div>

            {/* Content Area */}
            <div className="space-y-4">

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card/30 p-1 rounded-xl">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search users..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Select value={roleFilter} onValueChange={setRoleFilter}>
                            <SelectTrigger className="w-[160px] h-10 bg-background/50 border-transparent hover:border-border/50 focus:border-primary/50">
                                <Briefcase className="w-4 h-4 mr-2 text-muted-foreground" />
                                <SelectValue placeholder="All Roles" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Roles</SelectItem>
                                {ROLES.map((role) => (
                                    <SelectItem key={role} value={role}>
                                        {role}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Users Table */}
                <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm shadow-sm overflow-hidden">
                    <Table>
                        <TableHeader className="bg-muted/30">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="w-[300px] pl-6">User</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="hidden md:table-cell">Email</TableHead>
                                <TableHead className="hidden md:table-cell">Joined</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-border/50">
                                        <TableCell className="pl-6"><Skeleton className="h-10 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-32" /></TableCell>
                                        <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                        <TableCell className="pr-6"><Skeleton className="h-8 w-8 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                                        <div className="flex flex-col items-center gap-2">
                                            <Search className="w-8 h-8 opacity-20" />
                                            <p>No users found matching your criteria.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredUsers?.map((user) => (
                                    <TableRow key={user.id} className="hover:bg-muted/40 border-border/40 transition-colors">
                                        <TableCell className="pl-6 py-3">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-9 w-9 border border-border/50">
                                                    <AvatarFallback className={cn("text-xs font-semibold",
                                                        user.role === 'STUDENT' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                                                            user.role === 'INSTRUCTOR' ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                                                                "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                                                    )}>
                                                        {user.full_name?.charAt(0).toUpperCase()}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium text-sm text-foreground">
                                                    {user.full_name}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge role={user.role} />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span className={cn("w-2 h-2 rounded-full", user.is_active ? "bg-emerald-500" : "bg-red-500")} />
                                                <span className="text-xs text-muted-foreground">{user.is_active ? 'Active' : 'Inactive'}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            {user.email}
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                                            {user.created_at ? formatToLocalDateTime(user.created_at).split(',')[0] : 'N/A'}
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors">
                                                        <MoreVertical className="w-4 h-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48">
                                                    <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                                                        Manage User
                                                    </div>
                                                    <DropdownMenuSeparator />
                                                    {ROLES.map((role) => (
                                                        <DropdownMenuItem
                                                            key={role}
                                                            onClick={() => handleRoleChange(user.id, role)}
                                                            className="cursor-pointer text-xs"
                                                        >
                                                            <Shield className="w-3.5 h-3.5 opacity-70" />
                                                            Set as {role}
                                                            {user.role === role && <CheckCircle2 className="w-3.5 h-3.5 ml-auto text-primary" />}
                                                        </DropdownMenuItem>
                                                    ))}
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                        className={cn("cursor-pointer text-xs", user.is_active ? "text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20" : "text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 dark:focus:bg-emerald-950/20")}
                                                    >
                                                        {user.is_active ? (
                                                            <>
                                                                <UserX className="w-3.5 h-3.5" />
                                                                Deactivate Account
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-3.5 h-3.5" />
                                                                Activate Account
                                                            </>
                                                        )}
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

            </div>
        </div>
    );
}
