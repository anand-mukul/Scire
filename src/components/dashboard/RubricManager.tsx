'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, Info } from 'lucide-react';
import { toast } from 'sonner';
import { PremiumCard } from '@/components/ui/premium-card';
import { CardHeader, CardTitle, CardContent } from '@/components/ui/card';
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
        <PremiumCard className="bg-card/40 border-border backdrop-blur-md">
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Grading Rubrics</CardTitle>
                {isEditable && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button size="sm" className="gap-2 bg-white/5 hover:bg-white/10 text-foreground border-white/10">
                                <Plus className="h-4 w-4" /> Add Rubric
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-neutral-900/80 backdrop-blur-2xl border-white/10 text-foreground shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="text-xl font-bold">Add New Rubric</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="criterion" className="text-slate-200">Criterion</Label>
                                    <Input
                                        id="criterion"
                                        placeholder="e.g., Technical Accuracy"
                                        value={newRubric.criterion}
                                        onChange={(e) => setNewRubric({ ...newRubric, criterion: e.target.value })}
                                        className="bg-white/5 border-white/10 text-foreground focus:border-primary/50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="weight" className="text-slate-200">Weight (0-10)</Label>
                                        <Input
                                            id="weight"
                                            type="number"
                                            step="0.1"
                                            value={newRubric.weight}
                                            onChange={(e) => setNewRubric({ ...newRubric, weight: e.target.value })}
                                            className="bg-white/5 border-white/10 text-foreground focus:border-primary/50"
                                        />
                                    </div>
                                    <div className="flex items-center gap-2 mt-8">
                                        <Checkbox
                                            id="mandatory"
                                            checked={newRubric.is_mandatory}
                                            onCheckedChange={(c) => setNewRubric({ ...newRubric, is_mandatory: c as boolean })}
                                            className="border-white/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                        />
                                        <Label htmlFor="mandatory" className="text-slate-200 cursor-pointer">Mandatory Pass?</Label>
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="constraints" className="text-slate-200">Constraints / Details (Optional)</Label>
                                    <textarea
                                        id="constraints"
                                        className="flex min-h-[80px] w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/50 focus-visible:border-primary/50 disabled:cursor-not-allowed disabled:opacity-50 text-foreground"
                                        placeholder="Specific requirements for AI evaluator"
                                        value={newRubric.constraints}
                                        onChange={(e) => setNewRubric({ ...newRubric, constraints: e.target.value })}
                                    />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="hover:bg-white/10">Cancel</Button>
                                <Button
                                    onClick={handleAdd}
                                    disabled={addMutation.isPending}
                                    className="bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white border-0"
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
                    <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg border-border bg-muted/10">
                        <Info className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No rubrics defined yet.</p>
                        {isEditable && <p className="text-xs">Add criteria for the AI to grade against.</p>}
                    </div>
                ) : (
                    <div className="space-y-4">
                        {rubrics.map((rubric: any) => (
                            <div key={rubric.id} className="flex items-center justify-between p-3 border rounded-lg bg-card/50 border-border hover:bg-card/80 transition-colors">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">{rubric.criterion}</span>
                                        {rubric.is_mandatory && (
                                            <span className="bg-destructive/10 text-destructive text-[10px] px-2 py-0.5 rounded-full uppercase font-bold tracking-wider border border-destructive/20">
                                                Mandatory
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-xs text-muted-foreground flex gap-4">
                                        <span>Weight: <span className="font-mono text-foreground">{parseFloat(rubric.weight).toFixed(1)}</span></span>
                                        {rubric?.constraints?.description && (
                                            <span className="italic truncate max-w-[300px]">Note: {rubric.constraints.description}</span>
                                        )}
                                    </div>
                                </div>
                                {isEditable && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="text-muted-foreground hover:text-destructive"
                                        onClick={() => deleteMutation.mutate(rubric.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </PremiumCard>
    );
}
