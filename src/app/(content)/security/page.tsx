"use client";

import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SecurityPage() {
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
                        Security Policy
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-white/5 pb-8">
                        <span>Last Updated: February 18, 2026</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>Enterprise Grade</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                    <p className="lead text-xl">
                        Security is not an afterthought at Scire. It is the foundation of our infrastructure. We protect student data, exam integrity, and institutional trust with enterprise-grade defenses.
                    </p>

                    <h2>1. Infrastructure Security</h2>
                    <p>
                        Scire is hosted on <strong>Amazon Web Services (AWS)</strong> in the Mumbai region (ap-south-1), ensuring data sovereignty for our Indian customers.
                    </p>
                    <ul>
                        <li><strong>Network Isolation:</strong> All compute resources run within a Virtual Private Cloud (VPC) with strict firewall rules.</li>
                        <li><strong>DDoS Protection:</strong> We use AWS Shield and CloudFront to mitigate Distributed Denial of Service attacks.</li>
                        <li><strong>Regular Backups:</strong> Database snapshots are taken daily and encrypted across multiple availability zones.</li>
                    </ul>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>2. Data Encryption</h2>
                    <p>We use industry-standard encryption protocols to protect your data:</p>
                    <ul>
                        <li><strong>In Transit:</strong> All data sent to or from our infrastructure is encrypted using <strong>TLS 1.3</strong> (Transport Layer Security). We score an "A+" on SSL Labs tests.</li>
                        <li><strong>At Rest:</strong> All user data, including exam recordings, transcripts, and PII, is encrypted at rest using <strong>AES-256</strong> encryption keys managed by AWS KMS.</li>
                    </ul>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>3. Access Control</h2>
                    <p>
                        We operate on a principle of "Least Privilege."
                    </p>
                    <ul>
                        <li><strong>Employee Access:</strong> Only authorized engineering support staff have access to production environments, protected by Multi-Factor Authentication (MFA) and VPN.</li>
                        <li><strong>Audit Logs:</strong> All access to sensitive data is logged and audited for suspicious activity.</li>
                    </ul>

                    <h2>4. Vulnerability Management</h2>
                    <p>
                        We perform automated code scanning (SAST/DAST) in our CI/CD pipelines to detect vulnerabilities before they reach production. We also engage third-party security firms for periodic penetration testing.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h2>5. Compliance</h2>
                    <div className="grid md:grid-cols-3 gap-4 not-prose">
                        <div className="p-4 border border-border rounded-xl text-center hover:bg-muted/20 transition-colors">
                            <div className="font-bold mb-1">ISO 27001</div>
                            <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="p-4 border border-border rounded-xl text-center hover:bg-muted/20 transition-colors">
                            <div className="font-bold mb-1">SOC 2 Type II</div>
                            <div className="text-xs text-muted-foreground">In Progress</div>
                        </div>
                        <div className="p-4 border border-border rounded-xl text-center hover:bg-muted/20 transition-colors">
                            <div className="font-bold mb-1">GDPR & DPDPA</div>
                            <div className="text-xs text-muted-foreground">Compliant</div>
                        </div>
                    </div>

                    <div className="mt-12 p-8 bg-green-500/5 rounded-2xl border border-green-500/20 not-prose">
                        <div className="flex items-center gap-3 mb-4">
                            <Lock className="w-5 h-5 text-green-500" />
                            <h4 className="text-lg font-bold text-green-700 dark:text-green-400 m-0">Responsible Disclosure</h4>
                        </div>
                        <p className="text-sm text-muted-foreground m-0 leading-relaxed">
                            Security is a community effort. If you discover a vulnerability, please do NOT publicly disclose it. Report it to our security team at <a href="mailto:security@scire.in" className="text-green-500 font-medium hover:underline">security@scire.in</a>. We acknowledge and reward valid reports.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
