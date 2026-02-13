'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Info, ListChecks, Scale, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';

interface RubricManagerProps {
    examId: string;
    isEditable: boolean;
}

export default function RubricManager({ examId, isEditable }: RubricManagerProps) {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newRubric, setNewRubric] = useState({
        criterion: '',
        weight: '1.0',
        is_mandatory: false,
        constraints: '',
    });

    // Fetch Rubrics
    const { data: rubrics, isLoading } = useQuery({
        queryKey: ['rubrics', examId],
        queryFn: () => api.exams.getRubrics(examId),
    });

    const addMutation = useMutation({
        mutationFn: (data: any) =>
            api.exams.addRubric(examId, {
                ...data,
                order_index: (rubrics?.length || 0) + 1,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubrics', examId] });
            setIsAddOpen(false);
            setNewRubric({ criterion: '', weight: '1.0', is_mandatory: false, constraints: '' });
            toast.success('Rubric added successfully');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to add rubric');
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (rubricId: string) => api.exams.deleteRubric(examId, rubricId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubrics', examId] });
            toast.success('Rubric deleted');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to delete rubric');
        },
    });

    const handleAdd = () => {
        if (!newRubric.criterion) {
            toast.error('Criterion is required');
            return;
        }
        addMutation.mutate({
            criterion: newRubric.criterion,
            weight: parseFloat(newRubric.weight),
            is_mandatory: newRubric.is_mandatory,
            constraints: newRubric.constraints ? { description: newRubric.constraints } : null,
        });
    };

    if (isLoading) return <div className="p-4 text-center">Loading rubrics...</div>;

    return (
        <Card className="bg-card/40 border-border backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="space-y-1">
                    <CardTitle className="text-xl">Grading Rubrics</CardTitle>
                    <CardDescription>Define criteria for AI evaluation.</CardDescription>
                </div>
                {isEditable && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2 shadow-sm">
                                <Plus className="h-4 w-4" /> Add Rubric
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-background border-border sm:max-w-[500px]">
                            <DialogHeader>
                                <DialogTitle>Add New Rubric</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="criterion">Criterion</Label>
                                    <Input
                                        id="criterion"
                                        placeholder="e.g., Technical Accuracy"
                                        value={newRubric.criterion}
                                        onChange={(e) => setNewRubric({ ...newRubric, criterion: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="weight">Weight (0-10)</Label>
                                        <div className="relative">
                                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                id="weight"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                max="10"
                                                value={newRubric.weight}
                                                onChange={(e) => setNewRubric({ ...newRubric, weight: e.target.value })}
                                                className="pl-9"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-8 p-2 rounded-lg border bg-muted/50">
                                        <Checkbox
                                            id="mandatory"
                                            checked={newRubric.is_mandatory}
                                            onCheckedChange={(c) => setNewRubric({ ...newRubric, is_mandatory: c as boolean })}
                                            className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                                        />
                                        <Label htmlFor="mandatory" className="cursor-pointer font-medium text-destructive">Mandatory Pass?</Label>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="constraints">Constraints / Details (Optional)</Label>
                                    <textarea
                                        id="constraints"
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Specific requirements for AI evaluator. E.g., 'Must mention dependency injection'"
                                        value={newRubric.constraints}
                                        onChange={(e) => setNewRubric({ ...newRubric, constraints: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={addMutation.isPending}
                                >
                                    {addMutation.isPending ? 'Adding...' : 'Add Rubric'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </CardHeader>
            <CardContent>
                {(!rubrics || rubrics.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl border-muted bg-muted/5">
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                            <ListChecks className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Grading Rubrics Defined</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Rubrics help the AI evaluator understand how to grade student responses accurately and consistently.
                        </p>
                        {isEditable && (
                            <Button onClick={() => setIsAddOpen(true)} variant="outline">
                                <Plus className="h-4 w-4 mr-2" /> Add Your First Rubric
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rubrics.map((rubric: any) => (
                            <div key={rubric.id} className="relative group flex flex-col md:flex-row gap-4 p-4 border rounded-xl bg-card hover:border-primary/50 transition-all shadow-sm">
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-3">
                                        <h4 className="font-semibold text-lg">{rubric.criterion}</h4>
                                        {rubric.is_mandatory && (
                                            <Badge variant="destructive" className="gap-1 px-2">
                                                <AlertCircle className="h-3 w-3" /> Mandatory Pass
                                            </Badge>
                                        )}
                                        <Badge variant="secondary" className="font-mono">
                                            Weight: {parseFloat(rubric.weight).toFixed(1)}
                                        </Badge>
                                    </div>

                                    {rubric?.constraints?.description && (
                                        <div className="text-sm text-muted-foreground bg-muted/30 p-2.5 rounded-md border border-border/50">
                                            <span className="font-semibold text-xs text-primary/80 uppercase tracking-wider block mb-0.5">Evaluation Criteria</span>
                                            {rubric.constraints.description}
                                        </div>
                                    )}
                                </div>

                                {isEditable && (
                                    <div className="flex items-start justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => deleteMutation.mutate(rubric.id)}
                                            title="Delete Rubric"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
