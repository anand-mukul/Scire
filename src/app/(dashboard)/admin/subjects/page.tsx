'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
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

// ─── Create Subject Dialog ──────────────────────────────────────────────────────

function CreateSubjectDialog({
    departments,
    onCreated,
}: {
    departments: Department[];
    onCreated: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');
    const [credits, setCredits] = useState<number | undefined>(undefined);
    const [departmentId, setDepartmentId] = useState('');

    const resetForm = () => {
        setName('');
        setCode('');
        setDescription('');
        setCredits(undefined);
        setDepartmentId('');
    };

    const createMutation = useMutation({
        mutationFn: () => {
            if (!name.trim()) throw new Error('Subject name is required');
            if (!code.trim()) throw new Error('Subject code is required');
            if (!departmentId) throw new Error('Please select a department');

            return api.tenant.createSubject({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim() || undefined,
                credits: credits ?? undefined,
                department_id: departmentId,
            });
        },
        onSuccess: () => {
            toast.success('Subject created successfully');
            onCreated();
            setOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create subject');
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-[0_0_15px_-3px_rgba(var(--primary),0.3)]">
                    <Plus className="w-4 h-4 mr-2" />
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
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="subjectName">Subject Name</Label>
                        <Input
                            id="subjectName"
                            placeholder="e.g. Data Structures & Algorithms"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background/50 border-input"
                            autoFocus
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="subjectCode">Code</Label>
                            <Input
                                id="subjectCode"
                                placeholder="e.g. CS201"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                className="bg-background/50 border-input uppercase"
                                maxLength={50}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subjectCredits">Credits</Label>
                            <Input
                                id="subjectCredits"
                                type="number"
                                placeholder="e.g. 4"
                                min={0}
                                max={20}
                                value={credits ?? ''}
                                onChange={(e) => setCredits(e.target.value ? parseInt(e.target.value) : undefined)}
                                className="bg-background/50 border-input"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Department</Label>
                        {departments.length === 0 ? (
                            <p className="text-sm text-destructive">
                                No departments exist. Create a department first.
                            </p>
                        ) : (
                            <Select value={departmentId} onValueChange={setDepartmentId}>
                                <SelectTrigger className="bg-background/50 border-input">
                                    <SelectValue placeholder="Select department" />
                                </SelectTrigger>
                                <SelectContent>
                                    {departments.map((dept) => (
                                        <SelectItem key={dept.id} value={dept.id}>
                                            {dept.code} — {dept.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="subjectDesc">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                            id="subjectDesc"
                            placeholder="Brief description of the subject"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-background/50 border-input"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending || departments.length === 0}
                        className="bg-foreground text-background hover:bg-foreground/90"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Subject'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Create Department Dialog ───────────────────────────────────────────────────

function CreateDepartmentDialog({ onCreated }: { onCreated: () => void }) {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState('');
    const [code, setCode] = useState('');
    const [description, setDescription] = useState('');

    const resetForm = () => {
        setName('');
        setCode('');
        setDescription('');
    };

    const createMutation = useMutation({
        mutationFn: () => {
            if (!name.trim()) throw new Error('Department name is required');
            if (!code.trim()) throw new Error('Department code is required');

            return api.tenant.createDepartment({
                name: name.trim(),
                code: code.trim().toUpperCase(),
                description: description.trim() || undefined,
            });
        },
        onSuccess: () => {
            toast.success('Department created successfully');
            onCreated();
            setOpen(false);
            resetForm();
        },
        onError: (error: Error) => {
            toast.error(error.message || 'Failed to create department');
        },
    });

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="border-border hover:border-primary/50">
                    <Building2 className="w-4 h-4 mr-2" />
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
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="deptName">Department Name</Label>
                        <Input
                            id="deptName"
                            placeholder="e.g. Computer Science"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-background/50 border-input"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deptCode">Code</Label>
                        <Input
                            id="deptCode"
                            placeholder="e.g. CSE"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="bg-background/50 border-input uppercase"
                            maxLength={50}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deptDesc">Description <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                        <Input
                            id="deptDesc"
                            placeholder="Brief description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="bg-background/50 border-input"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Cancel
                    </Button>
                    <Button
                        onClick={() => createMutation.mutate()}
                        disabled={createMutation.isPending}
                        className="bg-foreground text-background hover:bg-foreground/90"
                    >
                        {createMutation.isPending ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            'Create Department'
                        )}
                    </Button>
                </DialogFooter>
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
        <div className="relative min-h-screen w-full bg-background overflow-hidden text-foreground">
            {/* <AmbientGlow /> */}

            <div className="container mx-auto p-6 space-y-8 relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 animate-in fade-in duration-300">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                                <BookOpen className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground tracking-tight">
                                    Subjects & Departments
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {subjects.length} subject{subjects.length !== 1 ? 's' : ''} across{' '}
                                    {departments.length} department{departments.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <CreateDepartmentDialog onCreated={invalidateAll} />
                        <CreateSubjectDialog departments={departments} onCreated={invalidateAll} />
                    </div>
                </div>

                {/* Department Summary */}
                {departments.length > 0 && (
                    <div className="grid gap-3 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
                        {departments.map((dept) => {
                            const count = subjects.filter((s) => s.department_id === dept.id).length;
                            return (
                                <Card
                                    key={dept.id}
                                    className="p-4 hover:border-primary/30 transition-colors cursor-pointer group"
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
                                <Skeleton key={i} className="h-20 w-full rounded-xl bg-white/5" />
                            ))
                    ) : filteredSubjects.length === 0 ? (
                        <Card className="text-center py-16 text-muted-foreground border-dashed">
                            <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p className="font-medium">No subjects found</p>
                            <p className="text-sm mt-1">
                                {departments.length === 0
                                    ? 'Create a department first, then add subjects.'
                                    : 'Click "Add Subject" to create one.'}
                            </p>
                        </Card>
                    ) : (
                        filteredSubjects.map((subject, index) => {
                            const dept = deptMap.get(subject.department_id);
                            return (
                                <div key={subject.id}>
                                    <Card className="hover:border-primary/30 transition-colors group">
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
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
