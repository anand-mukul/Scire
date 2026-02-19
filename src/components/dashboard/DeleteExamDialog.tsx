'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { toast } from 'sonner';
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';

interface DeleteExamDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    examId: string;
    examTitle: string;
    /** Called after successful deletion — use to navigate away */
    onDeleted?: () => void;
}

export default function DeleteExamDialog({
    open,
    onOpenChange,
    examId,
    examTitle,
    onDeleted,
}: DeleteExamDialogProps) {
    const queryClient = useQueryClient();
    const [confirmText, setConfirmText] = useState('');
    const isConfirmed = confirmText === examTitle;

    const deleteMutation = useMutation({
        mutationFn: () => api.exams.delete(examId),
        onSuccess: () => {
            toast.success('Exam permanently deleted');
            queryClient.invalidateQueries({ queryKey: ['exams'] });
            queryClient.removeQueries({ queryKey: ['exam', examId] });
            onOpenChange(false);
            setConfirmText('');
            onDeleted?.();
        },
        onError: (error: any) => {
            toast.error(error?.message || 'Failed to delete exam');
        },
    });

    const handleClose = (nextOpen: boolean) => {
        if (!nextOpen) {
            setConfirmText('');
        }
        onOpenChange(nextOpen);
    };

    return (
        <AlertDialog open={open} onOpenChange={handleClose}>
            <AlertDialogContent className="sm:max-w-md bg-card/95 dark:bg-card/90 border-destructive/20 shadow-2xl backdrop-blur-xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-full bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                        </div>
                        <div className="space-y-0.5">
                            <AlertDialogTitle className="text-lg font-semibold tracking-tight">Delete Exam</AlertDialogTitle>
                            <AlertDialogDescription className="text-sm text-muted-foreground/90 leading-relaxed">
                                This action is <span className="font-semibold text-destructive">permanent and irreversible</span>.
                            </AlertDialogDescription>
                        </div>
                    </div>
                </AlertDialogHeader>

                <div className="py-2 space-y-4">
                    <p className="text-sm text-muted-foreground/80">
                        All associated data including rubrics, sessions, and results will be deleted.
                    </p>
                    <div className="space-y-2.5 p-4 rounded-lg bg-muted/20 dark:bg-muted/10 border border-border/40">
                        <Label htmlFor="confirm-delete" className="text-sm text-foreground/80">
                            Type <span className="font-mono font-bold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded text-xs select-all">{examTitle}</span> to confirm
                        </Label>
                        <Input
                            id="confirm-delete"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Type exam title..."
                            className="bg-background dark:bg-card border-destructive/30 focus:border-destructive focus-visible:ring-destructive/20 font-medium shadow-sm placeholder:text-muted-foreground/50"
                            autoComplete="off"
                            disabled={deleteMutation.isPending}
                        />
                    </div>
                </div>

                <AlertDialogFooter className="gap-3">
                    <AlertDialogCancel
                        className="border-border/50 hover:bg-muted/50 dark:hover:bg-muted/30 cursor-pointer"
                        disabled={deleteMutation.isPending}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={!isConfirmed || deleteMutation.isPending}
                        className="gap-2 shadow-sm hover:shadow-md transition-all"
                    >
                        {deleteMutation.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                        Delete Permanently
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
