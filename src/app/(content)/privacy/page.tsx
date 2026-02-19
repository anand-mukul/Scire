"use client";

import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PrivacyPage() {
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
                        Privacy Policy
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-white/5 pb-8">
                        <span>Last Updated: February 18, 2026</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>10 min read</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
                    <p className="lead text-xl">
                        Scire EdTech Pvt. Ltd. ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our AI-powered oral assessment platform.
                    </p>

                    <div className="p-6 my-8 bg-muted/30 rounded-2xl border border-border/50 text-base">
                        <p className="m-0">
                            This Policy is published in compliance with the <strong>Information Technology Act, 2000</strong>, the <strong>SPDI Rules 2011</strong>, and the <strong>Digital Personal Data Protection Act, 2023</strong> (DPDPA).
                        </p>
                    </div>

                    <h2>1. Information We Collect</h2>
                    <p>We collect the following types of information to provide our services:</p>
                    <ul>
                        <li><strong>Personal Information:</strong> Name, email address, institutional affiliation, and student ID.</li>
                        <li><strong>Sensitive Personal Data (SPDI):</strong>
                            <ul className="list-[circle] marker:text-primary">
                                <li><strong>Biometric Data:</strong> Voice recordings and facial video data captured during AI oral exams for proctoring and identity verification.</li>
                                <li><strong>Authentication Data:</strong> Passwords (hashed) or SSO tokens.</li>
                            </ul>
                        </li>
                        <li><strong>Usage Data:</strong> IP address, browser type, device information, and interaction logs.</li>
                    </ul>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>2. Purpose of Collection</h2>
                    <p>We use your data for the following specific purposes:</p>
                    <ul>
                        <li>To conduct and grade AI-driven oral examinations.</li>
                        <li>To verify candidate identity and prevent academic dishonesty (proctoring).</li>
                        <li>To generate performance analytics for students and instructors.</li>
                        <li>To improve our AI models (only with anonymized data).</li>
                        <li>To comply with legal obligations and enforce our Terms of Service.</li>
                    </ul>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>3. Consent for Audio & Video Recording</h2>
                    <p>
                        By attempting an assessment on Scire, you explicitly consent to the recording of your audio and video. This data is processed in real-time to analyze your responses and monitor for suspicious behavior (e.g., looking away, multiple voices). You may withdraw this consent at any time by stopping the exam, but this will result in the immediate termination of the assessment.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>4. Data Storage & Retention</h2>
                    <p>
                        Your personal data is stored on secure servers located in <strong>India</strong> (AWS Mumbai Region). We retain exam data (recordings and transcripts) only for the duration required by your educational institution or for a maximum of <strong>two (2) academic years</strong>, after which it is securely deleted or anonymized, unless a longer retention period is required by law.
                    </p>

                    <h2>5. Disclosure to Third Parties</h2>
                    <p>We do not sell your data. We may share information with:</p>
                    <ul>
                        <li><strong>Your Institution:</strong> Results, transcripts, and integrity reports are shared with the educational institution administering the exam.</li>
                        <li><strong>Service Providers:</strong> Cloud hosting (AWS), database providers, and email services (bound by strict data processing agreements).</li>
                        <li><strong>Legal Authorities:</strong> If required by Indian law or correct court order.</li>
                    </ul>

                    <h2>6. Your Rights</h2>
                    <p>Under Indian law, you have the right to:</p>
                    <ul>
                        <li>Request confirmation of processing and access to your personal data.</li>
                        <li>Request correction of inaccurate or incomplete data.</li>
                        <li>Withdraw consent for future processing (subject to service termination).</li>
                        <li>Register a grievance with our Data Protection Officer.</li>
                    </ul>

                    <h2>7. Security Practices</h2>
                    <p>
                        We implement reasonable security practices and procedures as mandated by the SPDI Rules, including AES-256 encryption at rest, TLS 1.3 in transit, and strict role-based access controls (RBAC). However, no method of transmission over the internet is 100% secure.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>8. Grievance Officer</h2>
                    <p>
                        In accordance with the Information Technology Act, 2000 and the SPDI Rules, the contact details of the Grievance Officer are provided below:
                    </p>

                    <div className="not-prose mt-6 p-8 bg-card rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-8 items-start">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-lg font-bold text-foreground">Mr. Rahul Verma</h3>
                            <p className="text-sm font-medium text-primary">Grievance Officer, Scire EdTech Pvt. Ltd.</p>
                            <p className="text-muted-foreground text-sm pt-2">
                                Block B, Tech Village, Outer Ring Road<br />
                                Bengaluru, Karnataka, 560103, India
                            </p>
                            <div className="pt-4">
                                <a href="mailto:grievance@scire.in" className="text-sm font-medium text-foreground underline underline-offset-4 hover:text-primary transition-colors">
                                    grievance@scire.in
                                </a>
                            </div>
                        </div>
                    </div>

                    <p className="text-sm text-muted-foreground mt-12 italic">
                        We reserve the right to update this policy at any time. Significant changes will be notified via email/dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
}
