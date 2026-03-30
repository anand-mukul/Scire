"use client";

import Link from "next/link";
import { ProtectedMailLink } from "@/components/ui/protected-mail-link";

const mailLinkClass = "text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors";

const toc = [
    { id: "acceptance", label: "Acceptance of Terms" },
    { id: "the-service", label: "The Service" },
    { id: "accounts", label: "User Accounts & Registration" },
    { id: "academic-integrity", label: "Academic Integrity & Acceptable Use" },
    { id: "billing", label: "Subscriptions, Billing & Payments" },
    { id: "ai-disclaimer", label: "AI Disclaimer" },
    { id: "intellectual-property", label: "Intellectual Property" },
    { id: "confidentiality", label: "Confidentiality" },
    { id: "sla", label: "Service Level Agreement" },
    { id: "liability", label: "Limitation of Liability" },
    { id: "indemnification", label: "Indemnification" },
    { id: "termination", label: "Termination" },
    { id: "governing-law", label: "Governing Law & Dispute Resolution" },
    { id: "general", label: "General Provisions" },
    { id: "contact", label: "Contact Information" },
];

export default function TermsPage() {
    return (
        <article>
            {/* Title */}
            <h1 className="text-[2.5rem] md:text-[3.25rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
                Terms of service
            </h1>
            <p className="text-sm text-muted-foreground/70 mb-16">
                <span className="font-medium text-muted-foreground">Effective date:</span> March 31, 2026
            </p>

            {/* Intro */}
            <div className="space-y-5 text-[15px] leading-[1.75] text-muted-foreground mb-16">
                <p>
                    THESE TERMS OF SERVICE (the &ldquo;<strong className="text-foreground">Agreement</strong>&rdquo;) GOVERN CUSTOMER&apos;S RECEIPT, ACCESS, TO AND USE OF THE SERVICE PROVIDED BY SCIRE EDTECH PVT. LTD. (&ldquo;<strong className="text-foreground">Scire</strong>&rdquo;), A COMPANY INCORPORATED UNDER THE COMPANIES ACT, 2013, WITH ITS REGISTERED OFFICE IN INDIA.
                </p>
                <p>
                    By creating an account, accessing, or using any part of the Scire platform, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link href="/privacy" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Privacy Policy</Link>. If you do not agree, you must immediately discontinue use of our Services.
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

                <section id="acceptance">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        1. Acceptance of Terms
                    </h2>
                    <p className="mb-5">By accessing or using our Services, you represent and warrant that:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>You are at least 18 years of age, or the age of majority in your jurisdiction, or you are using the Services under the supervision of a parent, guardian, or educational institution.</li>
                        <li>You have the legal capacity to enter into a binding agreement.</li>
                        <li>You are not barred from using the Services under any applicable law.</li>
                        <li>If accepting on behalf of an organization, you have authority to bind that organization to these Terms.</li>
                    </ul>
                </section>

                <section id="the-service">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        2. The Service
                    </h2>
                    <p className="mb-5">
                        Scire provides an AI-powered oral examination and assessment platform (the &ldquo;<strong className="text-foreground">Service</strong>&rdquo;) that uses Large Language Models, speech recognition, natural language processing, and computer vision technologies. The Service enables automated oral examinations, real-time proctoring via video and audio analysis, AI-powered grading and performance analytics, and institutional dashboards for exam management.
                    </p>
                    <p>
                        We reserve the right to modify, suspend, or discontinue any part of the Services at any time, with reasonable efforts to notify active users of material changes.
                    </p>
                </section>

                <section id="accounts">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        3. User Accounts &amp; Registration
                    </h2>
                    <p className="mb-5">To access certain features, you must register for an account. You agree to:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li>Provide accurate, current, and complete registration information.</li>
                        <li>Maintain the security and confidentiality of your login credentials.</li>
                        <li>Immediately notify us of any unauthorized access to your account.</li>
                        <li>Accept full responsibility for all activities under your account.</li>
                    </ul>
                    <p>
                        We reserve the right to suspend or terminate any account that we reasonably believe has been compromised, is being used fraudulently, or violates these Terms.
                    </p>
                </section>

                <section id="academic-integrity">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        4. Academic Integrity &amp; Acceptable Use
                    </h2>
                    <p className="mb-5">
                        Scire is built on trust and academic honesty. You agree to interact with the AI Examiner and the Platform authentically. The following actions constitute <strong className="text-foreground">material violations</strong> of these Terms:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li>Using unauthorized materials, devices, notes, or aids during an examination.</li>
                        <li>Having another person present or impersonating another candidate.</li>
                        <li>Attempting to bypass, deceive, or tamper with proctoring measures (e.g., virtual cameras, screen sharing tools, deepfakes, AI-generated voice).</li>
                        <li>Recording, reproducing, distributing, or sharing exam content or AI Examiner prompts.</li>
                        <li>Reverse-engineering, decompiling, or attempting to extract the source code or AI models.</li>
                        <li>Using the Platform for any unlawful purpose or transmitting malicious code.</li>
                        <li>Engaging in any activity that interferes with or disrupts the Services.</li>
                    </ul>
                    <p>
                        <strong className="text-foreground">Consequences:</strong> Any violation detected by our AI proctoring or human reviewers may result in immediate exam invalidation, reporting to your institution, permanent account suspension, and referral for legal action where applicable.
                    </p>
                </section>

                <section id="billing">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        5. Subscriptions, Billing &amp; Payments
                    </h2>
                    <p className="mb-5">
                        <strong className="text-foreground">Plans &amp; Pricing.</strong> Scire offers free and paid subscription plans for institutions. Prices are in Indian Rupees (INR) unless specified, exclusive of applicable GST.
                    </p>
                    <p className="mb-5">
                        <strong className="text-foreground">Billing Cycle.</strong> Paid subscriptions are billed in advance on a monthly or annual basis. You authorize Scire to charge your designated payment method at the start of each cycle.
                    </p>
                    <p className="mb-5">
                        <strong className="text-foreground">Refunds.</strong> Subscription fees are generally non-refundable, except where required by applicable law or expressly provided in a separate written agreement. Contact <ProtectedMailLink email="billing@scire.in" className={mailLinkClass}>billing@scire.in</ProtectedMailLink> within 14 days for refund requests.
                    </p>
                    <p>
                        <strong className="text-foreground">Taxes.</strong> You are responsible for all applicable taxes, including GST. Scire will collect and remit taxes where required by law.
                    </p>
                </section>

                <section id="ai-disclaimer">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        6. AI Disclaimer
                    </h2>
                    <p className="mb-5">Our Services utilize artificial intelligence. You acknowledge and agree that:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>AI models can occasionally produce inaccurate, incomplete, or biased outputs.</li>
                        <li>AI-generated grades and evaluations are <strong className="text-foreground">recommendations only</strong> and should be reviewed by qualified human instructors before official use.</li>
                        <li>The final academic decision rests with the instructor or institution.</li>
                        <li>Scire is not liable for academic, professional, or other consequences arising from reliance on AI-generated outputs.</li>
                    </ul>
                </section>

                <section id="intellectual-property">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        7. Intellectual Property
                    </h2>
                    <p className="mb-5">
                        <strong className="text-foreground">Scire&apos;s IP.</strong> All content, features, functionality, software, algorithms (including the AI Examiner), trademarks, and the &ldquo;Scire&rdquo; brand are the exclusive property of Scire EdTech Pvt. Ltd. You are granted a limited, non-exclusive, non-transferable, revocable license to use the Platform for its intended purpose.
                    </p>
                    <p>
                        <strong className="text-foreground">User Content.</strong> You retain ownership of content you submit. By submitting content, you grant Scire a worldwide, royalty-free, non-exclusive license to use, process, store, and analyze it for providing and improving the Services. AI model improvement uses only anonymized, aggregated data.
                    </p>
                </section>

                <section id="confidentiality">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        8. Confidentiality
                    </h2>
                    <p>
                        Each party agrees to maintain confidentiality of non-public information received from the other, including technical data, business plans, exam content, and student performance data. This obligation does not apply to information that is publicly available, was known prior to disclosure, is independently developed, or must be disclosed by law or court order.
                    </p>
                </section>

                <section id="sla">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        9. Service Level Agreement
                    </h2>
                    <p className="mb-5">For institutional customers on paid plans, Scire commits to:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li><strong className="text-foreground">99.9% Uptime</strong> — measured monthly, excluding scheduled maintenance.</li>
                        <li><strong className="text-foreground">&lt; 200ms API Response Time</strong> — average for core endpoints (p95).</li>
                        <li><strong className="text-foreground">&lt; 4 hour Critical Issue Response</strong> — for Severity 1 issues during business hours.</li>
                    </ul>
                    <p>
                        Scheduled maintenance will be communicated at least 72 hours in advance. Service credits for prolonged downtime are available as outlined in institutional agreements.
                    </p>
                </section>

                <section id="liability">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        10. Limitation of Liability
                    </h2>
                    <p className="mb-5">To the maximum extent permitted by applicable Indian law:</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li>Scire shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, goodwill, or other intangible losses.</li>
                        <li>Total aggregate liability shall not exceed the greater of: (a) the amount paid by you in the 12 months preceding the claim; or (b) ₹10,000.</li>
                        <li>This limitation applies regardless of the theory of liability, even if Scire has been advised of the possibility of such damages.</li>
                    </ul>
                </section>

                <section id="indemnification">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        11. Indemnification
                    </h2>
                    <p>
                        You agree to indemnify, defend, and hold harmless Scire, its officers, directors, employees, and affiliates from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys&apos; fees) arising from your use or misuse of the Services, violation of these Terms, violation of third-party rights, or academic dishonesty committed using your account.
                    </p>
                </section>

                <section id="termination">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        12. Termination
                    </h2>
                    <p className="mb-5">
                        <strong className="text-foreground">By You.</strong> You may terminate your account at any time via account settings or by contacting <ProtectedMailLink email="support@scire.in" className={mailLinkClass}>support@scire.in</ProtectedMailLink>. Pre-paid fees are non-refundable.
                    </p>
                    <p className="mb-5">
                        <strong className="text-foreground">By Scire.</strong> We may suspend or terminate your access at any time, with or without cause, with reasonable notice where practicable. Grounds include violation of these Terms, non-payment, or actions harming the Platform.
                    </p>
                    <p>
                        <strong className="text-foreground">Survival.</strong> Sections 6 (AI Disclaimer), 7 (IP), 10 (Liability), 11 (Indemnification), and 13 (Governing Law) survive termination.
                    </p>
                </section>

                <section id="governing-law">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        13. Governing Law &amp; Dispute Resolution
                    </h2>
                    <p className="mb-5">
                        These Terms are governed by the laws of <strong className="text-foreground">India</strong>, without regard to conflict of law principles.
                    </p>
                    <p className="mb-5">
                        <strong className="text-foreground">Arbitration.</strong> Disputes shall be resolved by arbitration under the Arbitration and Conciliation Act, 1996, as amended, by a sole arbitrator appointed mutually, conducted in English. The seat of arbitration shall be Bengaluru, Karnataka. The arbitrator&apos;s decision is final and binding.
                    </p>
                    <p>
                        <strong className="text-foreground">Jurisdiction.</strong> Subject to arbitration, both parties submit to the exclusive jurisdiction of the courts in Bengaluru, Karnataka, India.
                    </p>
                </section>

                <section id="general">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        14. General Provisions
                    </h2>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">Entire Agreement.</strong> These Terms, together with our Privacy Policy and Cookie Policy, constitute the entire agreement regarding the Services.</li>
                        <li><strong className="text-foreground">Severability.</strong> If any provision is unenforceable, the remainder stays in effect.</li>
                        <li><strong className="text-foreground">Waiver.</strong> Failure to enforce any right does not constitute a waiver.</li>
                        <li><strong className="text-foreground">Assignment.</strong> You may not assign without our consent. Scire may assign without restriction.</li>
                        <li><strong className="text-foreground">Force Majeure.</strong> Scire is not liable for delays or failures caused by events beyond reasonable control, including natural disasters, pandemics, war, or third-party service failures.</li>
                        <li><strong className="text-foreground">Notices.</strong> Sent to your account email (for you) or <ProtectedMailLink email="legal@scire.in" className={mailLinkClass}>legal@scire.in</ProtectedMailLink> (for Scire).</li>
                    </ul>
                </section>

                <section id="contact">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        15. Contact Information
                    </h2>
                    <p className="mb-5">
                        If you have any questions or comments about these Terms, please do not hesitate to contact us at:
                    </p>
                    <p>
                        Email: <ProtectedMailLink email="legal@scire.in" className={mailLinkClass}>legal@scire.in</ProtectedMailLink><br />
                        Address: Remote, India
                    </p>
                </section>
            </div>
        </article>
    );
}
