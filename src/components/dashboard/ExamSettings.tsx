'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/network/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { AlertCircle, Save, Check, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getTimezoneAbbreviation } from '@/lib/date-utils';
import { ExamStatus } from '@/types/backend';

interface ExamSettingsProps {
    exam: any;
}

export default function ExamSettings({ exam }: ExamSettingsProps) {
    const queryClient = useQueryClient();
    const [formData, setFormData] = useState({
        title: exam.title,
        max_attempts: exam.max_attempts,
        status: exam.status,
        duration_minutes: exam.settings?.duration_minutes || 30,
        number_of_questions: exam.settings?.number_of_questions || 5,
        strict_mode: exam.settings?.strict_mode || false,
        is_public: exam.is_public || false,
        difficulty: exam.settings?.difficulty || 'medium',
    });

    // Reset form when prop changes
    useEffect(() => {
        if (!exam) return;
        setFormData(prev => ({
            ...prev,
            title: exam.title,
            max_attempts: exam.max_attempts,
            status: exam.status,
            duration_minutes: exam.settings?.duration_minutes || 30,
            number_of_questions: exam.settings?.number_of_questions || 5,
            strict_mode: exam.settings?.strict_mode || false,
            is_public: exam.is_public || false,
            difficulty: exam.settings?.difficulty || 'medium',
        }));
    }, [exam]);

    const isPublished = exam.status === ExamStatus.PUBLISHED || exam.status === ExamStatus.ACTIVE;

    const updateMutation = useMutation({
        mutationFn: (data: any) => api.exams.update(exam.id, data),
        onSuccess: (updatedExam) => {
            queryClient.invalidateQueries({ queryKey: ['exam', exam.id] });
            queryClient.setQueryData(['exam', exam.id], updatedExam);
            toast.success('Exam settings updated');
        },
        onError: (error: any) => {
            toast.error(error.message || 'Failed to update exam');
        },
    });

    const handleSave = () => {
        updateMutation.mutate({
            title: formData.title,
            max_attempts: Number(formData.max_attempts),
            is_public: formData.is_public,
            settings: {
                duration_minutes: parseInt(String(formData.duration_minutes)),
                number_of_questions: parseInt(String(formData.number_of_questions)),
                strict_mode: formData.strict_mode,
                difficulty: formData.difficulty,
            }
        });
    };

    const handlePublish = () => {
        // Confirmation could be added here
        updateMutation.mutate({
            status: ExamStatus.PUBLISHED,
        });
    };

    const handleArchive = () => {
        updateMutation.mutate({
            status: ExamStatus.ARCHIVED,
        });
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card/40 border-border backdrop-blur-md">
                <CardHeader>
                    <CardTitle>Exam Configuration</CardTitle>
                    <CardDescription>
                        Manage the core settings for this exam.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label htmlFor="title">Exam Title</Label>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            disabled={isPublished} // Lock title if published
                        />
                        {isPublished && <p className="text-xs text-muted-foreground">Title cannot be changed after publishing.</p>}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="max_attempts">Max Attempts</Label>
                            <Input
                                id="max_attempts"
                                type="number"
                                min="1"
                                max="10"
                                value={formData.max_attempts}
                                onChange={(e) => setFormData({ ...formData, max_attempts: parseInt(e.target.value) || 1 })}
                                disabled={isPublished}
                            />
                            <p className="text-xs text-muted-foreground">Limit attempts per student.</p>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="duration">Duration (minutes)</Label>
                            <Input
                                id="duration"
                                type="number"
                                min="10"
                                max="180"
                                value={formData.duration_minutes}
                                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 30 })}
                                disabled={isPublished}
                            />
                            <p className="text-xs text-muted-foreground flex items-center gap-1">Time limit for the exam. <Globe className="inline h-3 w-3" /><span className="font-mono">{getTimezoneAbbreviation()}</span></p>
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="num_questions">Number of Questions</Label>
                        <Input
                            id="num_questions"
                            type="number"
                            min="3"
                            max="15"
                            className="max-w-[120px]"
                            value={formData.number_of_questions}
                            onChange={(e) => setFormData({ ...formData, number_of_questions: parseInt(e.target.value) || 5 })}
                            disabled={isPublished}
                        />
                        <p className="text-xs text-muted-foreground">The AI examiner will ask exactly this many questions.</p>
                    </div>

                    <div className="grid gap-2">
                        <Label>Difficulty Level</Label>
                        <Select
                            value={formData.difficulty}
                            onValueChange={(v) => setFormData({ ...formData, difficulty: v })}
                            disabled={isPublished}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Influences the complexity of AI follow-up questions.</p>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 p-3 border border-border rounded-lg bg-accent/5">
                        <Switch
                            id="public-access"
                            checked={formData.is_public}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                            disabled={isPublished}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="public-access" className="cursor-pointer font-medium">
                                Public Guest Access
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Allow users from outside your organization to take this exam via Exam Code (Guest Mode).
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2 pt-2 p-3 border border-border rounded-lg bg-accent/5">
                        <Switch
                            id="strict-mode"
                            checked={formData.strict_mode}
                            onCheckedChange={(checked) => setFormData({ ...formData, strict_mode: checked })}
                            disabled={isPublished}
                        />
                        <div className="grid gap-1.5 leading-none">
                            <Label htmlFor="strict-mode" className="cursor-pointer font-medium">
                                Strict Mode
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Enforce full-screen validation and anti-cheat measures.
                            </p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-end">
                    {!isPublished && (
                        <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-primary hover:bg-primary/90">
                            <Save className="h-4 w-4 mr-2" />
                            Save Changes
                        </Button>
                    )}
                </CardFooter>
            </Card>

            <Card className={isPublished ? "border-emerald-500/20 bg-emerald-500/5 backdrop-blur-sm" : "border-amber-500/20 bg-amber-500/5 backdrop-blur-sm"}>
                <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">Exam Status: <span className={`uppercase font-mono px-2 py-0.5 rounded text-xs ${isPublished ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>{formData.status}</span></CardTitle>
                </CardHeader>
                <CardContent>
                    {!isPublished ? (
                        <div className="space-y-4">
                            <Alert variant="default" className="bg-amber-500/10 border-amber-500/20">
                                <AlertCircle className="h-4 w-4 text-amber-500" />
                                <AlertTitle className="text-amber-500">Draft Mode</AlertTitle>
                                <AlertDescription className="text-amber-500/80">
                                    Students cannot see or join this exam yet. Once published, you cannot edit the syllabus or rubrics.
                                </AlertDescription>
                            </Alert>
                            <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white" onClick={handlePublish} disabled={updateMutation.isPending}>
                                Publish Exam
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert variant="default" className="bg-emerald-500/10 border-emerald-500/20">
                                <Check className="h-4 w-4 text-emerald-500" />
                                <AlertTitle className="text-emerald-500">Live</AlertTitle>
                                <AlertDescription className="text-emerald-500/80">
                                    Exam is live and accessible to students. Most settings are locked to ensure integrity.
                                </AlertDescription>
                            </Alert>
                            {/* <Button variant="destructive" className="w-full" onClick={handleArchive}>Archive Exam</Button> */}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
