"use client";

import Link from "next/link";
import { ArrowLeft, FileText, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background relative">
            <div className="max-w-3xl mx-auto px-6 py-24 md:py-32">
                {/* Header */}
                <div className="mb-16">
                    <Link href="/">
                        <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent text-muted-foreground hover:text-foreground mb-8 transition-colors">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Home
                        </Button>
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-6">
                        Terms of Service
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-white/5 pb-8">
                        <span>Last Updated: February 18, 2026</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>Binding Agreement</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                    <p className="lead text-xl">
                        These Terms of Service ("Terms") constitute a legally binding agreement between you ("User" or "you") and <strong>Scire EdTech Pvt. Ltd.</strong> ("Scire," "we," "us," or "our").
                    </p>

                    <div className="p-6 my-8 bg-muted/30 rounded-2xl border border-border/50 text-base">
                        <p className="m-0">
                            By accessing Scire, you agree to comply with these terms. If you do not agree, you must explicitly discontinue use of our services immediately.
                        </p>
                    </div>

                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing or using our website, mobile application, or AI assessment platform, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, you must not use our services.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>2. Services Description</h2>
                    <p>
                        Scire provides an AI-powered oral examination platform that conducts, proctors, and grades assessments using Large Language Models (LLMs) and computer vision technologies.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>3. Academic Integrity & Code of Conduct</h2>
                    <p>
                        Scire is built on trust. You agree to interact with the AI Examiner honestly. The following actions constitute a violation of these Terms:
                    </p>
                    <ul>
                        <li>Using unauthorized materials or devices during an exam.</li>
                        <li>Having another person present in the room or impersonating a candidate.</li>
                        <li>Attempting to bypass the proctoring measures (e.g., virtual cameras, screen sharing tools).</li>
                        <li>Tampering with the audio or video feed.</li>
                    </ul>
                    <div className="mt-6 p-4 border-l-4 border-red-500 bg-red-500/5 rounded-r-lg">
                        <p className="m-0 text-sm font-medium text-red-600 dark:text-red-400">
                            <strong>Consequences:</strong> Any violation detected by our AI or human reviewers will be reported to your educational institution and may result in the immediate suspension of your account.
                        </p>
                    </div>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>4. AI Disclaimer</h2>
                    <p>
                        Our services utilize artificial intelligence. While we strive for high accuracy, AI models can occasionally produce errors ("hallucinations") or bias. Scire provides grading <strong>recommendations</strong> only. The final academic decision rests with your grading instructor or institution. We are not liable for any academic consequences resulting from reliance on AI-generated grades.
                    </p>

                    <h2>5. Intellectual Property</h2>
                    <p>
                        All content, features, and functionality (including the "AI Examiner" algorithms, "Scire" trademark, and codebase) are the exclusive property of Scire EdTech Pvt. Ltd. You are granted a limited, non-exclusive, non-transferable license to use the platform for its intended purpose.
                    </p>

                    <h2>6. Limitation of Liability</h2>
                    <p>
                        To the fullest extent permitted by Indian law, Scire shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues. Our total liability for any claim arising out of these Terms shall not exceed the amount paid by you, if any, for using the service during the twelve (12) months prior to the claim.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>7. Dispute Resolution & Jurisdiction</h2>
                    <p>
                        These Terms shall be governed by and construed in accordance with the laws of <strong>India</strong>. Any dispute arising out of or in connection with these Terms, including any question regarding its existence, validity, or termination, shall be subject to the exclusive jurisdiction of the <strong>courts in Bengaluru, Karnataka</strong>.
                    </p>

                    <h2>8. Contact Us</h2>
                    <p>
                        For any questions regarding these Terms, please contact us at <a href="mailto:legal@scire.in" className="text-primary hover:underline">legal@scire.in</a>.
                    </p>
                </div>
            </div>
        </div>
    );
}
