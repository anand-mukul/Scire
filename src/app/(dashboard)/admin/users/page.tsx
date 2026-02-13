'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { UserRole } from '@/types/auth';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    Users,
    Plus,
    Search,
    MoreVertical,
    Shield,
    UserCheck,
    UserX,
    Mail,
    Calendar,
    Filter,
} from 'lucide-react';
import { toast } from 'sonner';
import { User } from '@/types/auth';
import { formatToLocalDateTime } from '@/lib/date-utils';

const ROLES = [UserRole.STUDENT, UserRole.INSTRUCTOR, UserRole.REVIEWER, UserRole.ADMIN] as const;
// Local UserRole type removed, imported from @/types/auth



interface UserWithMeta extends Omit<User, 'created_at'> {
    created_at?: string;
}

export default function AdminUsersPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string>('all');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    // Form state for creating users
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserFullName, setNewUserFullName] = useState('');
    const [newUserRole, setNewUserRole] = useState<UserRole>(UserRole.STUDENT);

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
        mutationFn: (data: { email: string; password: string; full_name: string; role: string }) =>
            api.tenant.createUser(data),
        onSuccess: () => {
            toast.success('User created successfully');
            queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
            setIsCreateDialogOpen(false);
            resetForm();
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

    const resetForm = () => {
        setNewUserEmail('');
        setNewUserPassword('');
        setNewUserFullName('');
        setNewUserRole(UserRole.STUDENT);
    };

    const handleCreateUser = () => {
        if (!newUserEmail || !newUserPassword || !newUserFullName) {
            toast.error('Please fill in all required fields');
            return;
        }
        createUserMutation.mutate({
            email: newUserEmail,
            password: newUserPassword,
            full_name: newUserFullName,
            role: newUserRole,
        });
    };

    const handleRoleChange = (userId: string, newRole: string) => {
        updateUserMutation.mutate({ userId, data: { role: newRole } });
    };

    const handleToggleStatus = (userId: string, currentStatus: boolean) => {
        updateUserMutation.mutate({ userId, data: { is_active: !currentStatus } });
    };

    const getRoleBadgeStyle = (role: string) => {
        // Use adaptive styling with different opacity levels for visual distinction
        switch (role.toUpperCase()) {
            case 'ADMIN':
                return 'bg-primary/20 text-primary border-primary/30';
            case 'INSTRUCTOR':
                return 'bg-purple-500/15 text-purple-400 border-purple-500/25';
            case 'REVIEWER':
                return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
            default:
                return 'bg-muted/50 text-muted-foreground border-border';
        }
    };

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
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <AmbientGlow /> */}

            <div className="container mx-auto p-6 space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <Users className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">User Management</h1>
                                <p className="text-sm text-muted-foreground">
                                    {users?.length || 0} users registered
                                </p>
                            </div>
                        </div>
                    </div>

                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]">
                                <Plus className="w-4 h-4 mr-2" />
                                Add User
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-card border-border text-foreground max-w-md backdrop-blur-xl">
                            <DialogHeader>
                                <DialogTitle>Create New User</DialogTitle>
                                <DialogDescription className="text-muted-foreground">
                                    Add a new user to the platform with specified role and credentials.
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Ashok Kumar"
                                        value={newUserFullName}
                                        onChange={(e) => setNewUserFullName(e.target.value)}
                                        className="bg-background/50 border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="bg-background/50 border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        className="bg-background/50 border-input"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Role</Label>
                                    <Select value={newUserRole} onValueChange={(v) => setNewUserRole(v as UserRole)}>
                                        <SelectTrigger className="bg-background/50 border-input">
                                            <SelectValue placeholder="Select role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {ROLES.map((role) => (
                                                <SelectItem key={role} value={role}>
                                                    {role}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateUser}
                                    disabled={createUserMutation.isPending}
                                    className="bg-foreground text-background hover:bg-foreground/90"
                                >
                                    {createUserMutation.isPending ? 'Creating...' : 'Create User'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name or email..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10 bg-card/40 border-border focus:border-primary/50 backdrop-blur-sm"
                        />
                    </div>
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                        <SelectTrigger className="w-[180px] bg-card/40 border-border backdrop-blur-sm">
                            <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                            <SelectValue placeholder="Filter by role" />
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

                {/* User List */}
                <div className="space-y-3">
                    {isLoading ? (
                        Array(5)
                            .fill(0)
                            .map((_, i) => (
                                <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
                            ))
                    ) : filteredUsers?.length === 0 ? (
                        <Card className="text-center py-16 text-muted-foreground border-dashed">
                            <Users className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No users found matching your criteria.</p>
                        </Card>
                    ) : (
                        filteredUsers?.map((user, index) => (
                            <div key={user.id}>
                                <Card className="hover:border-primary/30 transition-colors group">
                                    <div className="relative p-5 flex items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 min-w-0 flex-1">
                                            {/* Avatar */}
                                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold ${getRoleBadgeStyle(user.role)} border`}>
                                                {user.full_name.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-bold text-foreground truncate">{user.full_name}</h3>
                                                    <Badge variant="outline" className={`${getRoleBadgeStyle(user.role)} text-xs border-transparent`}>
                                                        {user.role}
                                                    </Badge>
                                                    {!user.is_active && (
                                                        <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                                            Inactive
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                    <span className="flex items-center gap-1.5 truncate">
                                                        <Mail className="w-3.5 h-3.5" />
                                                        {user.email}
                                                    </span>
                                                    {user.created_at && (
                                                        <span className="flex items-center gap-1.5 hidden md:flex">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {formatToLocalDateTime(user.created_at)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="text-muted-foreground hover:text-foreground hover:bg-white/5"
                                                >
                                                    <MoreVertical className="w-4 h-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <div className="px-2 py-1.5 text-xs text-muted-foreground font-medium">
                                                    Change Role
                                                </div>
                                                {ROLES.map((role) => (
                                                    <DropdownMenuItem
                                                        key={role}
                                                        onClick={() => handleRoleChange(user.id, role)}
                                                        className={`${user.role === role ? 'bg-primary/10 text-primary' : ''} cursor-pointer`}
                                                    >
                                                        <Shield className="w-4 h-4 mr-2" />
                                                        {role}
                                                        {user.role === role && <span className="ml-auto">✓</span>}
                                                    </DropdownMenuItem>
                                                ))}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                >
                                                    {user.is_active ? (
                                                        <>
                                                            <UserX className="w-4 h-4 mr-2" />
                                                            <span>Deactivate</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="w-4 h-4 mr-2 text-emerald-500" />
                                                            <span className="text-emerald-500">Activate</span>
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </Card>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
