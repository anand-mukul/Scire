'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/dashboard/page-header';
import { Shield, HelpCircle, Mail, AlertTriangle } from 'lucide-react';
import { SUPPORT_MAIL } from '@/lib/constants';

export default function StudentHelpPage() {
    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Help & Exam Rules"
                description="Guidelines to ensure a smooth and fair examination experience."
            />

            <div className="grid gap-8 md:grid-cols-2">
                {/* Rules Section */}
                <Card className="p-8 space-y-6 bg-gradient-to-br from-orange-500/5 to-transparent border-orange-500/10">
                    <div className="flex items-center gap-4 pb-6 border-b border-border/50">
                        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-medium text-foreground">Exam Rules</h2>
                    </div>

                    <ul className="space-y-4 text-muted-foreground">
                        <li className="flex gap-3">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 border border-primary/20">1</span>
                            <div>
                                <strong className="text-foreground block mb-1">Environment Scan</strong>
                                Ensure your room is well-lit and quiet. No other people should be visible or audible.
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 border border-primary/20">2</span>
                            <div>
                                <strong className="text-foreground block mb-1">No External Resources</strong>
                                The use of phones, notes, or other devices is strictly prohibited and monitored.
                            </div>
                        </li>
                        <li className="flex gap-3">
                            <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono shrink-0 mt-0.5 border border-primary/20">3</span>
                            <div>
                                <strong className="text-foreground block mb-1">Stay in Frame</strong>
                                Keep your face visible in the camera frame at all times.
                            </div>
                        </li>
                    </ul>
                </Card>

                {/* Support Section */}
                <div className="space-y-8">
                    <Card className="p-6 group hover:border-primary/50 transition-colors card-hover">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-colors">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h3 className="font-medium text-foreground">Technical Verification</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-4">
                            Before joining, ensure your microphone and camera permissions are allowed. Run the system check on the dashboard if you are unsure.
                        </p>
                    </Card>

                    <Card className="p-6 group hover:border-primary/50 transition-colors card-hover">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary group-hover:bg-primary/20 transition-colors">
                                <HelpCircle className="w-5 h-5" />
                            </div>
                            <h3 className="font-medium text-foreground">Need Assistance?</h3>
                        </div>
                        <p className="text-muted-foreground text-sm mb-6">
                            If you experience technical issues during the exam, contact your proctor immediately or email support.
                        </p>
                        <a href={`mailto:${SUPPORT_MAIL}`} className="flex items-center gap-2 text-foreground bg-secondary/50 hover:bg-primary hover:text-primary-foreground p-3 rounded-lg transition-all border border-border hover:border-primary shadow-sm button-press">
                            <Mail className="w-4 h-4" />
                            <span>{SUPPORT_MAIL}</span>
                        </a>
                    </Card>
                </div>
            </div>
        </main>
    );
}
