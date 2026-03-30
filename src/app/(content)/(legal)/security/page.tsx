"use client";

import Link from "next/link";

const toc = [
    { id: "infrastructure", label: "Infrastructure Security" },
    { id: "encryption", label: "Data Encryption" },
    { id: "access-control", label: "Access Control" },
    { id: "application-security", label: "Application Security" },
    { id: "exam-security", label: "AI & Examination Security" },
    { id: "compliance", label: "Compliance" },
    { id: "responsible-disclosure", label: "Responsible Disclosure" },
    { id: "incident-response", label: "Incident Response" },
    { id: "personnel", label: "Personnel Security" },
    { id: "contact", label: "Contact Information" },
];

export default function SecurityPage() {
    return (
        <article>
            {/* Title */}
            <h1 className="text-[2.5rem] md:text-[3.25rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
                Security
            </h1>
            <p className="text-sm text-muted-foreground/70 mb-16">
                <span className="font-medium text-muted-foreground">Last updated:</span> March 31, 2026
            </p>

            {/* Intro */}
            <div className="space-y-5 text-[15px] leading-[1.75] text-muted-foreground mb-16">
                <p>
                    Security is the foundation of everything we build at Scire. We protect student data, examination integrity, and institutional trust with enterprise-grade defenses, continuous monitoring, and a security-first engineering culture.
                </p>
                <p>
                    We handle sensitive educational data including biometric recordings, exam transcripts, and student performance metrics. Our infrastructure and processes are designed to meet or exceed the requirements of <strong className="text-foreground">ISO 27001</strong>, <strong className="text-foreground">SOC 2 Type II</strong>, and the <strong className="text-foreground">Digital Personal Data Protection Act, 2023</strong>. For details on how we handle personal data, see our <Link href="/privacy" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Privacy Policy</Link>.
                </p>
            </div>

            {/* Table of Contents */}
            <div className="mb-20">
                <h2 className="text-xl font-semibold text-foreground mb-5 tracking-[-0.01em]">
                    Table of Contents
                </h2>
                <ul className="space-y-2">
                    {toc.map((item) => (
                        <li key={item.id}>
                            <a
                                href={`#${item.id}`}
                                className="text-sm text-muted-foreground/70 hover:text-foreground transition-colors"
                            >
                                {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Sections */}
            <div className="space-y-16 text-[15px] leading-[1.75] text-muted-foreground">

                <section id="infrastructure">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Infrastructure Security
                    </h2>
                    <p className="mb-6">
                        Scire is hosted on <strong className="text-foreground">Amazon Web Services (AWS)</strong> in the Mumbai region (ap-south-1), ensuring data sovereignty and low-latency access for Indian users.
                    </p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Network Isolation.</strong> All compute resources operate within a Virtual Private Cloud (VPC) with strict ingress/egress controls. Databases and application servers run in private subnets, never directly exposed to the internet.</li>
                        <li><strong className="text-foreground">DDoS Protection.</strong> AWS Shield Standard for automatic mitigation, CloudFront CDN with edge-level threat blocking, and WAF rules on all public endpoints.</li>
                        <li><strong className="text-foreground">High Availability.</strong> Multi-AZ deployment for automatic failover, auto-scaling groups for traffic spikes during exam windows, and daily encrypted database snapshots replicated across availability zones.</li>
                        <li><strong className="text-foreground">Monitoring.</strong> 24/7 real-time infrastructure monitoring via AWS CloudWatch, centralized log aggregation, and automated alerting for anomalous patterns.</li>
                    </ul>
                </section>

                <section id="encryption">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Data Encryption
                    </h2>
                    <p className="mb-6">We employ industry-leading encryption at every stage:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">In Transit.</strong> All data transmitted between clients and servers is encrypted using <strong className="text-foreground">TLS 1.3</strong>. We enforce HSTS headers and score an A+ on SSL Labs tests.</li>
                        <li><strong className="text-foreground">At Rest.</strong> All stored data — including exam recordings, transcripts, and PII — is encrypted using <strong className="text-foreground">AES-256</strong> with keys managed by AWS KMS, FIPS 140-2 compliant.</li>
                        <li><strong className="text-foreground">Database.</strong> MongoDB Atlas with encrypted storage engine and encrypted backups.</li>
                        <li><strong className="text-foreground">Media.</strong> Audio/video exam recordings encrypted in S3 with server-side encryption (SSE-KMS).</li>
                        <li><strong className="text-foreground">Secrets.</strong> Application secrets and API keys stored in AWS Secrets Manager, never committed to source code.</li>
                        <li><strong className="text-foreground">Passwords.</strong> Hashed using bcrypt with a cost factor of 12. Plaintext passwords are never stored.</li>
                    </ul>
                </section>

                <section id="access-control">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Access Control
                    </h2>
                    <p className="mb-6">We operate on the principle of Least Privilege — every user and system component is granted only the minimum access necessary.</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Employee Access.</strong> Only authorized engineering and support personnel access production environments, authenticated via SSO with mandatory MFA.</li>
                        <li><strong className="text-foreground">RBAC.</strong> Granular role-based access control across the platform — students, instructors, and admins have strictly scoped permissions.</li>
                        <li><strong className="text-foreground">VPN &amp; Bastion.</strong> Direct SSH to production is prohibited. Administrative access is routed through VPN and bastion hosts with session recording.</li>
                        <li><strong className="text-foreground">Audit Logging.</strong> All access to personal data and admin actions are logged with immutable audit trails, retained for a minimum of 12 months.</li>
                        <li><strong className="text-foreground">Quarterly Reviews.</strong> All production access privileges are reviewed quarterly, revoking unnecessary permissions.</li>
                    </ul>
                </section>

                <section id="application-security">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Application Security
                    </h2>
                    <p className="mb-6">Security is embedded into every stage of our Software Development Lifecycle:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Secure Coding.</strong> All engineers follow OWASP Top 10 guidelines and our internal secure coding standards.</li>
                        <li><strong className="text-foreground">Automated Scanning.</strong> SAST and DAST scans run in every CI/CD pipeline. Vulnerabilities block deployment.</li>
                        <li><strong className="text-foreground">Dependency Management.</strong> Automated scanning for known CVEs in third-party libraries via Dependabot and Snyk.</li>
                        <li><strong className="text-foreground">Code Review.</strong> Mandatory peer review for all changes. Security-sensitive changes require senior engineer approval.</li>
                        <li><strong className="text-foreground">Penetration Testing.</strong> Annual third-party penetration testing by independent security firms, with findings remediated within SLA timelines.</li>
                    </ul>
                </section>

                <section id="exam-security">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        AI &amp; Examination Security
                    </h2>
                    <p className="mb-6">Our examination system incorporates multiple layers of security to protect exam integrity:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Proctoring.</strong> Real-time computer vision detects gaze aversion, unauthorized persons, secondary devices, and environmental anomalies.</li>
                        <li><strong className="text-foreground">Anti-Tampering.</strong> Detection of virtual cameras, screen sharing tools, remote desktop software, and browser developer tools during active exams.</li>
                        <li><strong className="text-foreground">Question Isolation.</strong> Exam questions are generated dynamically and delivered in real-time, preventing pre-exam leaks.</li>
                        <li><strong className="text-foreground">Secure Transmission.</strong> Exam audio/video streamed over encrypted WebRTC connections.</li>
                        <li><strong className="text-foreground">AI Model Isolation.</strong> Models hosted on isolated infrastructure with minimized input/output logging to protect student privacy.</li>
                    </ul>
                </section>

                <section id="compliance">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Compliance
                    </h2>
                    <p className="mb-6">We are committed to meeting the highest standards of regulatory compliance:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li><strong className="text-foreground">GDPR &amp; DPDPA 2023</strong> — Compliant.</li>
                        <li><strong className="text-foreground">IT Act, 2000 &amp; SPDI Rules, 2011</strong> — Compliant.</li>
                        <li><strong className="text-foreground">ISO 27001</strong> — Certification in progress (target: Q4 2026).</li>
                        <li><strong className="text-foreground">SOC 2 Type II</strong> — Certification in progress (target: Q4 2026).</li>
                        <li><strong className="text-foreground">FERPA</strong> — Compatible for US-based institutions.</li>
                    </ul>
                    <p>Certificates will be made available to institutional customers upon request once obtained.</p>
                </section>

                <section id="responsible-disclosure">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Responsible Disclosure
                    </h2>
                    <p className="mb-5">We welcome responsible disclosure of security vulnerabilities from the security research community.</p>
                    <p className="mb-5"><strong className="text-foreground">Scope:</strong> All Scire-owned domains, APIs, and applications. Third-party services and social engineering are out of scope.</p>
                    <p className="mb-5"><strong className="text-foreground">Guidelines:</strong></p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li>Do not publicly disclose the vulnerability before it has been fixed.</li>
                        <li>Do not access, modify, or delete data that does not belong to you.</li>
                        <li>Provide sufficient detail for us to reproduce and validate the issue.</li>
                        <li>Allow 90 days for remediation before public disclosure.</li>
                    </ul>
                    <p className="mb-5">
                        We acknowledge valid reports within <strong className="text-foreground">48 hours</strong> and provide a remediation timeline within <strong className="text-foreground">5 business days</strong>. Valid reports are eligible for our Security Hall of Fame and monetary rewards based on severity.
                    </p>
                    <p>
                        Report vulnerabilities to: <a href="mailto:security@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">security@scire.in</a><br />
                        PGP key available at <code className="text-xs bg-muted/30 px-1.5 py-0.5 rounded">scire.in/.well-known/security.txt</code>
                    </p>
                </section>

                <section id="incident-response">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Incident Response
                    </h2>
                    <p className="mb-6">We maintain a comprehensive Incident Response Plan:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Detection.</strong> Automated monitoring detects anomalous activity in real-time.</li>
                        <li><strong className="text-foreground">Containment.</strong> Suspected incidents are contained within minutes through automated playbooks and manual escalation.</li>
                        <li><strong className="text-foreground">Notification.</strong> Affected individuals and regulatory authorities are notified within <strong className="text-foreground">72 hours</strong> of a confirmed breach, as required by the DPDPA and GDPR.</li>
                        <li><strong className="text-foreground">Post-Mortem.</strong> Blameless post-mortem analysis with documented findings used to improve defenses.</li>
                        <li><strong className="text-foreground">Communication.</strong> Status updates during active incidents published on our status page. Institutional customers receive direct communication.</li>
                    </ul>
                </section>

                <section id="personnel">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Personnel Security
                    </h2>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Background Checks.</strong> All employees with access to sensitive data undergo background verification prior to onboarding.</li>
                        <li><strong className="text-foreground">Training.</strong> Mandatory security awareness training during onboarding and quarterly refreshers.</li>
                        <li><strong className="text-foreground">NDAs.</strong> All employees sign confidentiality agreements extending beyond employment.</li>
                        <li><strong className="text-foreground">Offboarding.</strong> Access revoked within 4 hours of departure. Equipment securely wiped.</li>
                    </ul>
                </section>

                <section id="contact">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Contact Information
                    </h2>
                    <p className="mb-5">For security-related questions or to report a vulnerability:</p>
                    <p>
                        Email: <a href="mailto:security@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">security@scire.in</a> · <a href="mailto:ciso@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">ciso@scire.in</a><br />
                        Address: Remote, India
                    </p>
                </section>
            </div>
        </article>
    );
}
