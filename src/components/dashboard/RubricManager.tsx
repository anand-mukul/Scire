'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, ListChecks, Scale, AlertCircle, Sparkles, Loader2 } from 'lucide-react';
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
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Separator } from '@/components/ui/separator';

const rubricSchema = z.object({
    criterion: z.string().min(3, "Criterion must be at least 3 characters"),
    weight: z.number().min(0.1, "Weight must be at least 0.1").max(10, "Weight cannot exceed 10"),
    is_mandatory: z.boolean().default(false),
    constraints: z.string().optional(),
});

type RubricValues = z.infer<typeof rubricSchema>;

interface RubricManagerProps {
    examId: string;
    isEditable: boolean;
}

export default function RubricManager({ examId, isEditable }: RubricManagerProps) {
    const queryClient = useQueryClient();
    const [isAddOpen, setIsAddOpen] = useState(false);

    // Fetch Rubrics
    const { data: rubrics, isLoading } = useQuery({
        queryKey: ['rubrics', examId],
        queryFn: () => api.exams.getRubrics(examId),
    });

    const form = useForm({
        resolver: zodResolver(rubricSchema),
        defaultValues: {
            criterion: '',
            weight: 1.0,
            is_mandatory: false,
            constraints: '',
        },
        mode: "onChange",
    });

    const addMutation = useMutation({
        mutationFn: (values: RubricValues) =>
            api.exams.addRubric(examId, {
                criterion: values.criterion,
                weight: values.weight,
                is_mandatory: values.is_mandatory,
                constraints: values.constraints ? { description: values.constraints } : null,
                order_index: (rubrics?.length || 0) + 1,
            }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rubrics', examId] });
            setIsAddOpen(false);
            form.reset();
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

    const onSubmit = (values: RubricValues) => {
        addMutation.mutate(values);
    };

    if (isLoading) return (
        <div className="p-8 text-center text-muted-foreground bg-card/40 border border-border/60 rounded-xl backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
            Loading rubrics...
        </div>
    );

    return (
        <Card className="bg-card/40 border-border/60 backdrop-blur-sm shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-6">
                <div className="space-y-1">
                    <CardTitle className="text-xl tracking-tight">Grading Rubrics</CardTitle>
                    <CardDescription>Define the criteria AI will use to evaluate student answers.</CardDescription>
                </div>
                {isEditable && (
                    <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-primary dark:bg-primary/10 dark:hover:bg-primary/20 transition-all shadow-sm">
                                <Plus className="h-4 w-4" />
                                Add Grading Criteria
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[520px] border-border/40 bg-card/95 dark:bg-card/90 backdrop-blur-xl shadow-2xl">
                            <DialogHeader className="space-y-1.5">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20">
                                        <ListChecks className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <DialogTitle className="text-lg font-semibold tracking-tight">Add Grading Criteria</DialogTitle>
                                        <DialogDescription className="text-muted-foreground/80 text-sm">
                                            Define a new evaluation dimension for the AI grader.
                                        </DialogDescription>
                                    </div>
                                </div>
                            </DialogHeader>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
                                    <FormField
                                        control={form.control}
                                        name="criterion"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground/80 text-sm">Criterion Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="e.g., Technical Accuracy, Communication Style"
                                                        className="bg-muted/30 border-border/50 focus:bg-background dark:focus:bg-card focus:border-primary/50 transition-all shadow-sm"
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
                                            name="weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-foreground/80 text-sm">Weight (0–10)</FormLabel>
                                                    <FormControl>
                                                        <div className="relative group">
                                                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                                                            <Input
                                                                type="number"
                                                                step="0.1"
                                                                className="pl-9 bg-muted/30 border-border/50 focus:bg-background dark:focus:bg-card focus:border-primary/50 transition-all shadow-sm"
                                                                {...field}
                                                                onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                            />
                                                        </div>
                                                    </FormControl>
                                                    <FormDescription className="text-xs text-muted-foreground/60">Relative importance</FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="is_mandatory"
                                            render={({ field }) => (
                                                <FormItem
                                                    className="flex flex-row items-center gap-3 space-y-0 rounded-lg border border-border/40 p-3.5 bg-muted/20 hover:bg-muted/40 dark:bg-muted/10 dark:hover:bg-muted/20 transition-colors self-start mt-8"
                                                >
                                                    <FormControl>
                                                        <Checkbox
                                                            checked={field.value}
                                                            onCheckedChange={field.onChange}
                                                            className="data-[state=checked]:bg-destructive data-[state=checked]:border-destructive dark:data-[state=checked]:bg-destructive dark:data-[state=checked]:border-destructive"
                                                        />
                                                    </FormControl>
                                                    <div className="space-y-0.5 leading-none">
                                                        <FormLabel className="text-foreground/90 font-medium cursor-pointer text-sm">
                                                            Mandatory Pass
                                                        </FormLabel>
                                                        <FormDescription className="text-xs text-muted-foreground/60">
                                                            Fail exam if this fails
                                                        </FormDescription>
                                                    </div>
                                                </FormItem>

                                            )}
                                        />
                                    </div>

                                    <FormField
                                        control={form.control}
                                        name="constraints"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-foreground/80 text-sm">
                                                    Evaluation Instructions{' '}
                                                    <span className="text-muted-foreground/50 font-normal">(optional)</span>
                                                </FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Specific instructions for the AI evaluator. E.g., 'Must mention dependency injection and provide a code example.'"
                                                        className="min-h-[100px] resize-none bg-muted/30 border-border/50 focus:bg-background dark:focus:bg-card focus:border-primary/50 transition-all shadow-sm text-sm"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormDescription className="text-xs text-muted-foreground/60">
                                                    These instructions guide the LLM during grading.
                                                </FormDescription>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <DialogFooter className="gap-3 pt-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => setIsAddOpen(false)}
                                            className="border-border/50 hover:bg-muted/50 dark:hover:bg-muted/30"
                                        >
                                            Cancel
                                        </Button>
                                        <Button type="submit" disabled={addMutation.isPending} className="gap-2 shadow-sm hover:shadow-md transition-all">
                                            {addMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {addMutation.isPending ? 'Adding...' : 'Add Rubric'}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>

                )}
            </CardHeader>
            <Separator className="mb-6 opacity-50" />
            <CardContent>
                {(!rubrics || rubrics.length === 0) ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center border-2 border-dashed rounded-xl border-border/50 bg-muted/5 group hover:bg-muted/10 transition-colors">
                        <div className="p-4 rounded-full bg-primary/5 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <ListChecks className="h-8 w-8 text-primary/60" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">No Grading Rubrics Defined</h3>
                        <p className="text-muted-foreground max-w-sm mb-6">
                            Rubrics help the AI evaluator understand how to grade student responses accurately and consistently.
                        </p>
                        {isEditable && (
                            <Button onClick={() => setIsAddOpen(true)} variant="outline" className="gap-2 cursor-pointer border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 text-primary dark:bg-primary/10 dark:hover:bg-primary/20 transition-all shadow-sm">
                                <Plus className="h-4 w-4" /> create your first rubric
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {rubrics.map((rubric: any) => (
                            <div
                                key={rubric.id}
                                className="relative group flex flex-col md:flex-row gap-6 p-5 border border-border/60 rounded-xl bg-card/50 hover:bg-card hover:border-primary/20 transition-all shadow-sm"
                            >
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                            {parseFloat(rubric.weight).toFixed(1)}
                                        </div>
                                        <h4 className="font-semibold text-lg tracking-tight">{rubric.criterion}</h4>
                                        {rubric.is_mandatory && (
                                            <Badge variant="destructive" className="gap-1.5 px-2.5 py-0.5 shadow-sm">
                                                <AlertCircle className="h-3.5 w-3.5" /> Mandatory Pass
                                            </Badge>
                                        )}
                                    </div>

                                    {rubric?.constraints?.description && (
                                        <div className="flex gap-3 text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg border border-border/50">
                                            <Sparkles className="h-4 w-4 text-primary/60 shrink-0 mt-0.5" />
                                            <p className="leading-relaxed">
                                                <span className="font-medium text-foreground block mb-1 text-xs uppercase tracking-wider opacity-70">AI Instruction</span>
                                                {rubric.constraints.description}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {isEditable && (
                                    <div className="flex items-start justify-end">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => deleteMutation.mutate(rubric.id)}
                                            title="Delete Rubric"
                                        >
                                            <Trash2 className="h-4 w-4" />
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
