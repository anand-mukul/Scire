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
            <AlertDialogContent className="bg-card border-border text-card-foreground max-w-md">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-5 w-5 text-red-500" />
                        </div>
                        <AlertDialogTitle className="text-lg">Delete Exam</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="text-muted-foreground text-sm leading-relaxed">
                        This action is <span className="text-red-400 font-semibold">permanent and irreversible</span>.
                        All associated data including rubrics, sessions, and results will be deleted.
                    </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3 py-4 border-t border-b border-border">
                    <Label htmlFor="confirm-delete" className="text-sm text-muted-foreground">
                        Type <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded text-xs">{examTitle}</span> to confirm
                    </Label>
                    <Input
                        id="confirm-delete"
                        value={confirmText}
                        onChange={(e) => setConfirmText(e.target.value)}
                        placeholder="Type exam title..."
                        className="bg-background/50 border-border font-mono text-sm"
                        autoComplete="off"
                        disabled={deleteMutation.isPending}
                    />
                </div>

                <AlertDialogFooter>
                    <AlertDialogCancel
                        className="border-border hover:bg-muted"
                        disabled={deleteMutation.isPending}
                    >
                        Cancel
                    </AlertDialogCancel>
                    <Button
                        variant="destructive"
                        onClick={() => deleteMutation.mutate()}
                        disabled={!isConfirmed || deleteMutation.isPending}
                        className="bg-red-600 hover:bg-red-700 text-white gap-2"
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
