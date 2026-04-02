"use client";

import Link from "next/link";
import { ProtectedMailLink } from "@/components/ui/protected-mail-link";

const mailLinkClass = "text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors";

const toc = [
    { id: "what-are-cookies", label: "What Are Cookies" },
    { id: "cookies-we-use", label: "Cookies We Use" },
    { id: "managing-cookies", label: "How to Manage Cookies" },
    { id: "dnt", label: "Do Not Track Signals" },
    { id: "changes", label: "Changes to This Policy" },
    { id: "contact", label: "Contact Information" },
];

export default function CookiesPage() {
    return (
        <article>
            {/* Title */}
            <h1 className="text-[2.5rem] md:text-[3.25rem] font-bold tracking-[-0.03em] leading-[1.1] text-foreground mb-4">
                Cookie policy
            </h1>
            <p className="text-sm text-muted-foreground/70 mb-16">
                <span className="font-medium text-muted-foreground">Effective date:</span> March 31, 2026
            </p>

            {/* Intro */}
            <div className="space-y-5 text-[15px] leading-[1.75] text-muted-foreground mb-16">
                <p>
                    This Cookie Policy explains how Scire (&ldquo;Scire,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) uses cookies and similar tracking technologies when you visit <strong className="text-foreground">scire.in</strong> and use our platform. This policy should be read alongside our <Link href="/privacy" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Privacy Policy</Link>.
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

                <section id="what-are-cookies">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        What Are Cookies
                    </h2>
                    <p className="mb-5">
                        Cookies are small text files stored on your device when you visit a website. They allow the site to recognize your device and remember information about your session or preferences. We also use similar technologies including local storage, session storage, and pixel tags (web beacons). References to &ldquo;cookies&rdquo; in this policy include these similar technologies.
                    </p>
                    <ul className="list-disc pl-5 space-y-3">
                        <li><strong className="text-foreground">First-Party Cookies</strong> are set by Scire directly for authentication, security, and preferences.</li>
                        <li><strong className="text-foreground">Third-Party Cookies</strong> are set by external services we integrate (e.g., Google Analytics, PostHog), governed by their own privacy policies.</li>
                        <li><strong className="text-foreground">Session Cookies</strong> are temporary and deleted when you close your browser.</li>
                        <li><strong className="text-foreground">Persistent Cookies</strong> remain on your device for a set period until they expire or you delete them.</li>
                    </ul>
                </section>

                <section id="cookies-we-use">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Cookies We Use
                    </h2>

                    <h3 className="text-base font-semibold text-foreground mb-3">Strictly Necessary</h3>
                    <p className="mb-3">These cookies are essential for the platform to function and cannot be disabled.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-10">
                        <li><strong className="text-foreground">scire_session</strong> — Maintains your authenticated login session. <em className="text-muted-foreground/60">Session. First-party.</em></li>
                        <li><strong className="text-foreground">csrf_token</strong> — Prevents Cross-Site Request Forgery attacks. <em className="text-muted-foreground/60">Session. First-party.</em></li>
                        <li><strong className="text-foreground">scire_auth</strong> — Stores secure JWT authentication token. <em className="text-muted-foreground/60">7 days. First-party.</em></li>
                        <li><strong className="text-foreground">scire_refresh</strong> — Stores secure refresh token for session renewal. <em className="text-muted-foreground/60">30 days. First-party (HttpOnly).</em></li>
                        <li><strong className="text-foreground">__cf_bm</strong> — Cloudflare bot management and DDoS protection. <em className="text-muted-foreground/60">30 min. Third-party.</em></li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Analytics &amp; Performance</h3>
                    <p className="mb-3">These help us understand how visitors interact with our site. You can opt out of these.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-10">
                        <li><strong className="text-foreground">_ga / _ga_*</strong> — Google Analytics — tracks user behavior and traffic sources. <em className="text-muted-foreground/60">2 years. Third-party.</em></li>
                        <li><strong className="text-foreground">_gid</strong> — Google Analytics — identifies unique users for the current session. <em className="text-muted-foreground/60">24 hours. Third-party.</em></li>
                        <li><strong className="text-foreground">ph_*</strong> — PostHog — product analytics, session recordings, and feature flags. <em className="text-muted-foreground/60">1 year. Third-party.</em></li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Functionality</h3>
                    <p className="mb-3">These enable enhanced functionality and personalization.</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-10">
                        <li><strong className="text-foreground">scire_theme</strong> — Stores your Dark/Light mode preference. <em className="text-muted-foreground/60">1 year. First-party.</em></li>
                        <li><strong className="text-foreground">scire_locale</strong> — Remembers your preferred language/locale. <em className="text-muted-foreground/60">1 year. First-party.</em></li>
                        <li><strong className="text-foreground">scire_sidebar</strong> — Remembers dashboard sidebar state. <em className="text-muted-foreground/60">1 year. First-party.</em></li>
                    </ul>

                    <h3 className="text-base font-semibold text-foreground mb-3">Marketing &amp; Advertising</h3>
                    <p className="mb-3">These may be set by our advertising partners. You can opt out of these.</p>
                    <ul className="list-disc pl-5 space-y-1.5">
                        <li><strong className="text-foreground">_fbp</strong> — Facebook Pixel — measures advertising effectiveness. <em className="text-muted-foreground/60">3 months. Third-party.</em></li>
                        <li><strong className="text-foreground">_gcl_au</strong> — Google Ads — conversion linker for campaign tracking. <em className="text-muted-foreground/60">3 months. Third-party.</em></li>
                    </ul>
                </section>

                <section id="managing-cookies">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        How to Manage Cookies
                    </h2>
                    <p className="mb-5">
                        You have the right to accept or reject non-essential cookies. You can manage preferences through our cookie consent banner (displayed on first visit), by updating preferences via the &ldquo;Cookie Preferences&rdquo; link in our footer, or through your browser settings.
                    </p>
                    <p className="mb-5">Most browsers allow you to control cookies through their settings:</p>
                    <ul className="list-disc pl-5 space-y-1.5 mb-5">
                        <li><a href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Google Chrome</a></li>
                        <li><a href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Mozilla Firefox</a></li>
                        <li><a href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Apple Safari</a></li>
                        <li><a href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Microsoft Edge</a></li>
                    </ul>
                    <p>
                        You can also opt out of Google Analytics via the <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-foreground underline decoration-muted-foreground/30 underline-offset-4 hover:decoration-foreground transition-colors">Google Analytics Opt-out Add-on</a>. Note that rejecting cookies may restrict access to some functionality.
                    </p>
                </section>

                <section id="dnt">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Do Not Track Signals
                    </h2>
                    <p>
                        We honor DNT signals for our first-party analytics. However, since there is no industry-wide standard, we cannot guarantee that all third-party services will also honor DNT.
                    </p>
                </section>

                <section id="changes">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Changes to This Policy
                    </h2>
                    <p>
                        We may update this Cookie Policy to reflect changes in cookies used, our practices, or regulatory requirements. Material changes will be reflected in the effective date and communicated via the consent banner or email where appropriate.
                    </p>
                </section>

                <section id="contact">
                    <h2 className="text-2xl font-semibold text-foreground mb-6 tracking-[-0.01em]">
                        Contact Information
                    </h2>
                    <p className="mb-5">
                        If you have any questions about cookies or tracking technologies, please contact us at:
                    </p>
                    <p>
                        Email: <ProtectedMailLink email="privacy@mail.scire.in" className={mailLinkClass}>privacy@mail.scire.in</ProtectedMailLink><br />
                        Address: Remote, India
                    </p>
                </section>
            </div>
        </article>
    );
}
