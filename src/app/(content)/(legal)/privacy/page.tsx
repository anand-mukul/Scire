"use client";

import Link from "next/link";

const toc = [
    { id: "information-we-collect", label: "Information We Collect" },
    { id: "purpose-and-legal-basis", label: "Purpose and Legal Basis" },
    { id: "consent-for-recording", label: "Consent for Recording" },
    { id: "disclosure-to-third-parties", label: "Disclosure to Third Parties" },
    { id: "data-retention", label: "Data Retention" },
    { id: "data-storage-and-transfers", label: "Data Storage and Transfers" },
    { id: "your-rights", label: "Your Rights" },
    { id: "security-measures", label: "Security Measures" },
    { id: "childrens-privacy", label: "Children's Privacy" },
    { id: "cookies", label: "Cookies & Tracking" },
    { id: "changes", label: "Changes to This Policy" },
    { id: "grievance-officer", label: "Grievance Officer & Contact" },
];

export default function PrivacyPage() {
    return (
        <article>
            {/* Title */}
            <h1 className="text-[2.5rem] md:text-[3.25rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
                Privacy policy
            </h1>
            <p className="text-sm text-muted-foreground/70 mb-16">
                <span className="font-medium text-muted-foreground">Effective date:</span> March 31, 2026
            </p>

            {/* Intro */}
            <div className="space-y-5 text-[15px] leading-[1.75] text-muted-foreground mb-16">
                <p>
                    At Scire (&ldquo;Scire,&rdquo; &ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), we take your privacy seriously. This Privacy Policy describes how we collect, use, store, share, and safeguard personal information when you access or use our AI-powered oral assessment platform, our website at <strong className="text-foreground">scire.in</strong>, or any related services (collectively, the &ldquo;Services&rdquo;).
                </p>
                <p>
                    This Policy is published in compliance with the <strong className="text-foreground">Information Technology Act, 2000</strong>, the <strong className="text-foreground">Information Technology (Reasonable Security Practices and Procedures and Sensitive Personal Data or Information) Rules, 2011</strong> (&ldquo;SPDI Rules&rdquo;), and the <strong className="text-foreground">Digital Personal Data Protection Act, 2023</strong> (&ldquo;DPDPA&rdquo;). Where our Services are used by individuals in the European Economic Area, we also comply with the <strong className="text-foreground">General Data Protection Regulation (EU) 2016/679</strong> (&ldquo;GDPR&rdquo;).
                </p>
                <p>
                    Remember that your use of Scire&apos;s Services is at all times subject to our <Link href="/terms" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Terms of Service</Link>. If you have a disability, you may access this Privacy Policy in an alternative format by contacting <a href="mailto:hello@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">hello@scire.in</a>.
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

                {/* 1. Information We Collect */}
                <section id="information-we-collect">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Information We Collect
                    </h2>
                    <p className="mb-6">We collect the following categories of information to provide, improve, and secure our Services:</p>

                    <h3 className="text-base font-semibold text-foreground mb-3">Profile or Contact Data</h3>
                    <ul className="list-disc pl-5 space-y-1.5 mb-8">
                        <li>Full name, email address, and profile photo.</li>
                        <li>Institutional affiliation, department, and role (student, instructor, or administrator).</li>
                        <li>Student ID or employee ID as provided by your institution.</li>
                        <li>Authentication credentials — hashed passwords or OAuth tokens from Google/Microsoft SSO.</li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Biometric &amp; Examination Data</h3>
                    <p className="mb-3 text-sm italic text-muted-foreground/60">Classified as Sensitive Personal Data under SPDI Rules</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-8">
                        <li>Voice recordings captured during AI oral examinations.</li>
                        <li>Facial video data for identity verification and proctoring.</li>
                        <li>Exam transcripts generated by our AI Examiner.</li>
                        <li>AI-generated scores, rubric evaluations, and performance analytics.</li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Device/IP Data</h3>
                    <ul className="list-disc pl-5 space-y-1.5 mb-8">
                        <li>IP address, browser type and version, operating system, and device identifiers.</li>
                        <li>Page views, click patterns, feature usage, session duration, and referral URLs.</li>
                        <li>Error logs and crash reports.</li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Communication Data</h3>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Emails, chat messages, or support tickets you send to us.</li>
                        <li>Survey responses, feedback submissions, and newsletter preferences.</li>
                    </ul>
                </section>

                {/* 2. Purpose and Legal Basis */}
                <section id="purpose-and-legal-basis">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Purpose and Legal Basis for Processing
                    </h2>
                    <p className="mb-6">We process your personal data only when we have a lawful basis to do so:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Performance of Contract.</strong> Conducting and grading AI oral examinations, generating performance analytics, and sending transactional emails.</li>
                        <li><strong className="text-foreground">Legitimate Interest.</strong> Identity verification and proctoring, fraud prevention, improving AI models with anonymized data, and enforcing academic integrity.</li>
                        <li><strong className="text-foreground">Legal Obligation.</strong> Complying with applicable laws, regulations, and court orders.</li>
                        <li><strong className="text-foreground">Consent.</strong> Recording audio/video during exams (explicit consent obtained at exam start) and marketing communications (opt-in only).</li>
                    </ul>
                </section>

                {/* 3. Consent for Recording */}
                <section id="consent-for-recording">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Consent for Audio &amp; Video Recording
                    </h2>
                    <p className="mb-5">
                        By initiating an assessment on Scire, you provide <strong className="text-foreground">explicit, informed, and freely given consent</strong> to the recording of your audio and video. This data is processed in real-time by our AI systems to analyze your oral responses, monitor for suspicious behavior (gaze aversion, unauthorized persons, secondary devices), and verify your identity against pre-registered biometric templates.
                    </p>
                    <p>
                        <strong className="text-foreground">Withdrawal of Consent:</strong> You may withdraw this consent at any time by terminating the exam session. Withdrawal will result in the immediate termination and invalidation of the assessment. Previously processed data may be retained for academic integrity records, subject to the retention periods below.
                    </p>
                </section>

                {/* 4. Disclosure */}
                <section id="disclosure-to-third-parties">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Disclosure to Third Parties
                    </h2>
                    <p className="mb-6">We do <strong className="text-foreground">not sell, rent, or trade</strong> your personal data to any third party for marketing or advertising purposes. We may share your information with:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Your Educational Institution.</strong> Examination results, AI-generated transcripts, performance analytics, and academic integrity reports. Your institution acts as the Data Fiduciary / Data Controller for this data.</li>
                        <li><strong className="text-foreground">Infrastructure &amp; Service Providers.</strong> Cloud hosting (AWS), database management (MongoDB Atlas), email delivery (AWS SES), error monitoring (Sentry), and analytics (PostHog). All sub-processors are bound by Data Processing Agreements.</li>
                        <li><strong className="text-foreground">AI Model Providers.</strong> Exam prompts and responses may be transmitted to third-party LLM APIs (e.g., Google Gemini) for real-time grading. We anonymize or pseudonymize data before transmission wherever feasible.</li>
                        <li><strong className="text-foreground">Legal &amp; Regulatory Authorities.</strong> When required by applicable law, regulation, court order, or governmental request.</li>
                        <li><strong className="text-foreground">Business Transfers.</strong> In a merger, acquisition, or sale of assets, your data may be transferred to the successor entity, provided they honor this Policy.</li>
                    </ul>
                </section>

                {/* 5. Data Retention */}
                <section id="data-retention">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Data Retention
                    </h2>
                    <p className="mb-6">We retain personal data only for as long as necessary to fulfil the purposes described in this Policy, unless a longer retention period is required by law:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Account Data</strong> — Duration of account plus 30 days after closure.</li>
                        <li><strong className="text-foreground">Exam Recordings</strong> — Up to 2 academic years, or as specified by your institution&apos;s retention policy, whichever is shorter.</li>
                        <li><strong className="text-foreground">Exam Transcripts &amp; Scores</strong> — Up to 5 academic years for audit trails and institutional compliance.</li>
                        <li><strong className="text-foreground">Usage &amp; Analytics Data</strong> — 24 months. Anonymized aggregate data may be retained indefinitely.</li>
                    </ul>
                </section>

                {/* 6. Data Storage */}
                <section id="data-storage-and-transfers">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Data Storage &amp; International Transfers
                    </h2>
                    <p className="mb-5">
                        Your personal data is primarily stored on secure servers in <strong className="text-foreground">India</strong> (AWS Mumbai Region, ap-south-1), ensuring data sovereignty and compliance with Indian data localization requirements.
                    </p>
                    <p className="mb-6">Where data must be transferred outside India, we ensure adequate safeguards including:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Standard Contractual Clauses (SCCs) approved by the European Commission for EEA data subjects.</li>
                        <li>Data Processing Agreements with all international sub-processors.</li>
                        <li>Transfer Impact Assessments for high-risk jurisdictions.</li>
                        <li>Data minimization and pseudonymization prior to cross-border transfers.</li>
                    </ul>
                </section>

                {/* 7. Your Rights */}
                <section id="your-rights">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Your Rights
                    </h2>
                    <p className="mb-6">Depending on your jurisdiction, you may exercise the following rights with respect to your Personal Data:</p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Access.</strong> Obtain confirmation and a copy of your personal data we process.</li>
                        <li><strong className="text-foreground">Correction.</strong> Request rectification of inaccurate or incomplete data.</li>
                        <li><strong className="text-foreground">Erasure.</strong> Request deletion of your personal data, subject to legal retention obligations.</li>
                        <li><strong className="text-foreground">Restrict Processing.</strong> Request limitation on how we process your data in certain circumstances.</li>
                        <li><strong className="text-foreground">Data Portability.</strong> Receive your data in a structured, machine-readable format (GDPR/DPDPA).</li>
                        <li><strong className="text-foreground">Withdraw Consent.</strong> Revoke previously granted consent at any time, without affecting prior processing.</li>
                        <li><strong className="text-foreground">Object.</strong> Object to processing based on legitimate interests or direct marketing.</li>
                        <li><strong className="text-foreground">Lodge Complaint.</strong> File a complaint with the Data Protection Board of India or your local supervisory authority.</li>
                    </ul>
                    <p className="mt-6">
                        To exercise any of these rights, submit a written request to <a href="mailto:dpo@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">dpo@scire.in</a>. We will respond within <strong className="text-foreground">30 days</strong>. Identity verification may be required.
                    </p>
                </section>

                {/* 8. Security */}
                <section id="security-measures">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Security Measures
                    </h2>
                    <p className="mb-5">
                        We implement comprehensive technical and organizational security measures in accordance with the SPDI Rules and industry best practices, including AES-256 encryption at rest, TLS 1.3 in transit, role-based access controls with mandatory MFA, comprehensive audit logging, and automated vulnerability scanning in CI/CD pipelines.
                    </p>
                    <p>
                        Despite our best efforts, no method of electronic storage or transmission is entirely secure. We commit to promptly notifying affected individuals and regulatory authorities in the event of a data breach, as required by applicable law. For full details, see our <Link href="/security" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Security page</Link>.
                    </p>
                </section>

                {/* 9. Children */}
                <section id="childrens-privacy">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Children&apos;s Privacy
                    </h2>
                    <p>
                        As noted in the <Link href="/terms" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Terms of Service</Link>, we do not knowingly collect or solicit Personal Data from anyone under the age of <strong className="text-foreground">13</strong>. If you are under 13, please do not attempt to register for the Services or send any Personal Data to us. If we learn that we have collected Personal Data from a child under age 13, we will delete that information as quickly as possible. If you believe that a child under 13 may have provided us Personal Data, please contact us at <a href="mailto:hello@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">hello@scire.in</a>.
                    </p>
                </section>

                {/* 10. Cookies */}
                <section id="cookies">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Cookies &amp; Tracking
                    </h2>
                    <p>
                        We use cookies and similar technologies to enhance your experience, analyze usage, and maintain session security. For details on what cookies we set, their purpose, and how to manage them, see our <Link href="/cookies" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Cookie Policy</Link>.
                    </p>
                </section>

                {/* 11. Changes */}
                <section id="changes">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Changes to This Policy
                    </h2>
                    <p>
                        We&apos;re constantly trying to improve our Services, so we may need to change this Privacy Policy from time to time, but we will alert you to any such changes by placing a notice on the Scire website, by sending you an email, and/or by some other means. Please note that if you&apos;ve opted not to receive legal notice emails from us, those legal notices will still govern your use of the Services. If you use the Services after any changes to the Privacy Policy have been posted, that means you agree to all of the changes.
                    </p>
                </section>

                {/* 12. Contact */}
                <section id="grievance-officer">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Grievance Officer &amp; Contact
                    </h2>
                    <p className="mb-5">
                        In accordance with the IT Act, 2000, SPDI Rules, 2011, and DPDPA, 2023, the details of the Grievance Officer are as follows. For GDPR-related inquiries, this individual also serves as our Data Protection Officer.
                    </p>
                    <p className="mb-5">
                        If you have any questions or comments about this Privacy Policy, the ways in which we collect and use your Personal Data, or your choices and rights regarding such collection and use, please do not hesitate to contact us at:
                    </p>
                    <p>
                        Email: <a href="mailto:grievance@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">grievance@scire.in</a> · <a href="mailto:dpo@scire.in" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">dpo@scire.in</a><br />
                        Address: Remote, India
                    </p>
                </section>
            </div>
        </article>
    );
}
