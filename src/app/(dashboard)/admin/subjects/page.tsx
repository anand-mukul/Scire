'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { Skeleton } from '@/components/ui/skeleton';
import {
    BookOpen,
    Plus,
    Search,
    Building2,
    GraduationCap,
    Hash,
    FileText,
    Loader2,
    ToggleLeft,
    ToggleRight,
} from 'lucide-react';
import { toast } from 'sonner';
import type { Department, Subject } from '@/types/backend';
import { PageHeader } from '@/components/dashboard/page-header';
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
import { EmptyState } from '@/components/ui/empty-state';

// ─── Schemas ────────────────────────────────────────────────────────────────────

const subjectSchema = z.object({
    name: z.string().min(2, 'Subject name must be at least 2 characters').max(255),
    code: z.string().min(1, 'Subject code is required').max(50),
    department_id: z.string().min(1, 'Please select a department'),
    credits: z.number().int().min(0).max(20).optional(),
    description: z.string().max(500).optional(),
});

type SubjectFormValues = z.infer<typeof subjectSchema>;

const departmentSchema = z.object({
    name: z.string().min(2, 'Department name must be at least 2 characters').max(255),
    code: z.string().min(1, 'Department code is required').max(50),
    description: z.string().max(500).optional(),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

// ─── Create Subject Dialog ──────────────────────────────────────────────────────

function CreateSubjectDialog({
    departments,
    onCreated,
}: {
    departments: Department[];
    onCreated: () => void;
}) {
    const [open, setOpen] = useState(false);

    const form = useForm<SubjectFormValues>({
        resolver: zodResolver(subjectSchema),
        defaultValues: {
            name: '',
            code: '',
            department_id: '',
            credits: undefined,
            description: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: SubjectFormValues) =>
            api.tenant.createSubject({
                name: values.name.trim(),
                code: values.code.trim().toUpperCase(),
                description: values.description?.trim() || undefined,
                credits: typeof values.credits === 'number' ? values.credits : undefined,
                department_id: values.department_id,
            }),
        onSuccess: () => {
            toast.success('Subject created successfully');
            onCreated();
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create subject');
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset(); }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="w-4 h-4" />
                    Add Subject
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-md backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Create New Subject</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Add a subject to a department. Instructors can link exams to subjects for organization.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Subject Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Data Structures & Algorithms"
                                            className="bg-background/50 border-input"
                                            autoFocus
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="code"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Code</FormLabel>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g. CS201"
                                                className="bg-background/50 border-input uppercase"
                                                maxLength={50}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="credits"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Credits</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                placeholder="e.g. 4"
                                                min={0}
                                                max={20}
                                                className="bg-background/50 border-input"
                                                value={field.value ?? ''}
                                                onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                                                onBlur={field.onBlur}
                                                ref={field.ref}
                                                name={field.name}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="department_id"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department</FormLabel>
                                    {departments.length === 0 ? (
                                        <p className="text-sm text-destructive">
                                            No departments exist. Create a department first.
                                        </p>
                                    ) : (
                                        <Select value={field.value} onValueChange={field.onChange}>
                                            <FormControl>
                                                <SelectTrigger className="bg-background/50 border-input">
                                                    <SelectValue placeholder="Select department" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {departments.map((dept) => (
                                                    <SelectItem key={dept.id} value={dept.id}>
                                                        {dept.code} — {dept.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Brief description of the subject"
                                            className="bg-background/50 border-input"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending || departments.length === 0}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Subject'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Create Department Dialog ───────────────────────────────────────────────────

function CreateDepartmentDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);

    const form = useForm<DepartmentFormValues>({
        resolver: zodResolver(departmentSchema),
        defaultValues: {
            name: '',
            code: '',
            description: '',
        },
    });

    const createMutation = useMutation({
        mutationFn: (values: DepartmentFormValues) =>
            api.tenant.createDepartment({
                name: values.name.trim(),
                code: values.code.trim().toUpperCase(),
                description: values.description?.trim() || undefined,
            }),
        onSuccess: () => {
            toast.success('Department created successfully');
            onCreated();
            setOpen(false);
            form.reset();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create department');
        },
    });

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) form.reset(); }}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-border hover:border-primary/50">
                    <Building2 className="w-4 h-4" />
                    Add Department
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border text-foreground max-w-md backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle>Create Department</DialogTitle>
                    <DialogDescription className="text-muted-foreground">
                        Departments group subjects. Create departments before adding subjects.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit((v) => createMutation.mutate(v))} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Department Name</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. Computer Science"
                                            className="bg-background/50 border-input"
                                            autoFocus
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="code"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Code</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="e.g. CSE"
                                            className="bg-background/50 border-input uppercase"
                                            maxLength={50}
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Brief description"
                                            className="bg-background/50 border-input"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createMutation.isPending}
                            >
                                {createMutation.isPending ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    'Create Department'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main Page ──────────────────────────────────────────────────────────────────

export default function AdminSubjectsPage() {
    const queryClient = useQueryClient();
    const [searchQuery, setSearchQuery] = useState('');
    const [deptFilter, setDeptFilter] = useState<string>('all');

    // Fetch departments
    const { data: departments = [] } = useQuery<Department[]>({
        queryKey: ['departments'],
        queryFn: () => api.tenant.listDepartments(),
    });

    // Fetch subjects
    const { data: subjects = [], isLoading } = useQuery<Subject[]>({
        queryKey: ['subjects', deptFilter],
        queryFn: () =>
            api.tenant.listSubjects(deptFilter !== 'all' ? deptFilter : undefined),
    });

    // Toggle subject active status
    const toggleMutation = useMutation({
        mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
            api.tenant.updateSubject(id, { is_active: !isActive }),
        onSuccess: () => {
            toast.success('Subject updated');
            queryClient.invalidateQueries({ queryKey: ['subjects'] });
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to update subject');
        },
    });

    const invalidateAll = () => {
        queryClient.invalidateQueries({ queryKey: ['subjects'] });
        queryClient.invalidateQueries({ queryKey: ['departments'] });
    };

    // Build a department lookup for display
    const deptMap = new Map(departments.map((d) => [d.id, d]));

    // Filter by search
    const filteredSubjects = subjects.filter((s) => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        return (
            s.name.toLowerCase().includes(q) ||
            s.code.toLowerCase().includes(q) ||
            deptMap.get(s.department_id)?.name.toLowerCase().includes(q)
        );
    });

    return (
        <div className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">

            {/* Header */}
            <PageHeader
                title="Subjects & Departments"
                description={`Manage ${subjects.length} subject${subjects.length !== 1 ? 's' : ''} across ${departments.length} department${departments.length !== 1 ? 's' : ''}.`}
                actions={
                    <div className="flex items-center gap-3">
                        <CreateDepartmentDialog onCreated={invalidateAll} />
                        <CreateSubjectDialog departments={departments} onCreated={invalidateAll} />
                    </div>
                }
            />

            {/* Department Summary */}
            {departments.length > 0 && (
                <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                    {departments.map((dept) => {
                        const count = subjects.filter((s) => s.department_id === dept.id).length;
                        return (
                            <Card
                                key={dept.id}
                                className={`p-4 hover:border-primary/30 transition-all cursor-pointer group border-border/60 bg-card/40 backdrop-blur-sm shadow-sm ${deptFilter === dept.id ? 'border-primary/50 bg-primary/5' : ''}`}
                                onClick={() => setDeptFilter(deptFilter === dept.id ? 'all' : dept.id)}
                            >
                                <div className={`flex items-center gap-3 ${deptFilter === dept.id ? 'text-primary' : ''}`}>
                                    <Building2 className={`w-4 h-4 ${deptFilter === dept.id ? 'text-primary' : 'text-muted-foreground'} group-hover:text-primary transition-colors`} />
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold uppercase tracking-wide truncate">
                                            {dept.code}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">{count} subject{count !== 1 ? 's' : ''}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, code, or department..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 bg-card/40 border-border focus:border-primary/50 backdrop-blur-sm"
                    />
                </div>
                {deptFilter !== 'all' && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeptFilter('all')}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        Clear filter
                    </Button>
                )}
            </div>

            {/* Subject List */}
            <div className="space-y-3">
                {isLoading ? (
                    Array(4)
                        .fill(0)
                        .map((_, i) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl bg-muted/20" />
                        ))
                ) : filteredSubjects.length === 0 ? (
                    <EmptyState
                        icon={GraduationCap}
                        title="No subjects found"
                        description={departments.length === 0
                            ? 'Get started by creating a department to organize your subjects.'
                            : 'Create your first subject to begin mapping out your curriculum.'}
                    />
                ) : (
                    filteredSubjects.map((subject) => {
                        const dept = deptMap.get(subject.department_id);
                        return (
                            <Card key={subject.id} className="card-hover hover:border-primary/30 transition-colors group border-border/60 bg-card/40 backdrop-blur-sm shadow-sm">
                                <div className="relative p-5 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-0 flex-1">
                                        {/* Icon */}
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold border ${subject.is_active ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                                            <Hash className="w-5 h-5" />
                                        </div>

                                        {/* Info */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-3 mb-1 flex-wrap">
                                                <h3 className="font-bold text-foreground">
                                                    {subject.name}
                                                </h3>
                                                <Badge
                                                    variant="outline"
                                                    className="bg-primary/10 text-primary border-primary/20 text-xs"
                                                >
                                                    {subject.code}
                                                </Badge>
                                                {subject.credits != null && (
                                                    <Badge
                                                        variant="outline"
                                                        className="text-xs border-border text-muted-foreground"
                                                    >
                                                        {subject.credits} cr
                                                    </Badge>
                                                )}
                                                {!subject.is_active && (
                                                    <Badge
                                                        variant="outline"
                                                        className="bg-destructive/10 text-destructive border-destructive/20 text-xs"
                                                    >
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                {dept && (
                                                    <span className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5" />
                                                        {dept.name}
                                                    </span>
                                                )}
                                                {subject.description && (
                                                    <span className="flex items-center gap-1.5 truncate hidden md:flex">
                                                        <FileText className="w-3.5 h-3.5" />
                                                        {subject.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Toggle Active */}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() =>
                                            toggleMutation.mutate({
                                                id: subject.id,
                                                isActive: subject.is_active,
                                            })
                                        }
                                        disabled={toggleMutation.isPending}
                                        className={`gap-2 text-xs ${subject.is_active ? 'text-muted-foreground hover:text-destructive' : 'text-emerald-500 hover:text-emerald-400'}`}
                                    >
                                        {subject.is_active ? (
                                            <>
                                                <ToggleRight className="w-4 h-4" />
                                                <span className="hidden sm:inline">Deactivate</span>
                                            </>
                                        ) : (
                                            <>
                                                <ToggleLeft className="w-4 h-4" />
                                                <span className="hidden sm:inline">Activate</span>
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </Card>
                        );
                    })
                )}
            </div>
        </div>
    );
}
