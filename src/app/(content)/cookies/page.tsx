"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CookiesPage() {
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
                        Cookie Policy
                    </h1>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground border-b border-white/5 pb-8">
                        <span>Last Updated: February 18, 2026</span>
                        <span className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                        <span>Transparency</span>
                    </div>
                </div>

                {/* Content */}
                <div className="prose prose-lg dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
                    <p className="lead text-xl">
                        This Cookie Policy explains how Scire EdTech Pvt. Ltd. ("we" or "us") uses cookies and similar technologies to recognize you when you visit our website at scire.app.
                    </p>

                    <h3>1. What are cookies?</h3>
                    <p>
                        Cookies are small data files that are placed on your computer or mobile device when you visit a website. They are widely used by website owners to make their websites work, or to work more efficiently, as well as to provide reporting information.
                    </p>

                    <div className="h-px bg-border/40 my-12" />

                    <h3>2. Types of Cookies We Use</h3>

                    <div className="grid gap-6 not-prose mb-12">
                        <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
                            <h4 className="text-lg font-semibold mb-2">Essential Cookies (Strictly Necessary)</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                These cookies are strictly necessary to provide you with services available through our Website and to use some of its features, such as access to secure areas.
                            </p>
                            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                                <li><strong className="text-foreground">Auth Tokens:</strong> Used to maintain your login session.</li>
                                <li><strong className="text-foreground">CSRF Tokens:</strong> Used to prevent Cross-Site Request Forgery attacks.</li>
                                <li><strong className="text-foreground">Load Balancing:</strong> Used to distribute traffic across our servers.</li>
                            </ul>
                        </div>

                        <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
                            <h4 className="text-lg font-semibold mb-2">Analytics and Customization Cookies</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                These cookies collect information that is used either in aggregate form to help us understand how our Website is being used or how effective our marketing campaigns are.
                            </p>
                            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                                <li><strong className="text-foreground">Google Analytics:</strong> We use Google Analytics to understand user behavior and traffic sources.</li>
                                <li><strong className="text-foreground">PostHog:</strong> We use PostHog to analyze product usage patterns and improve user experience.</li>
                            </ul>
                        </div>

                        <div className="p-6 bg-muted/30 rounded-xl border border-border/50">
                            <h4 className="text-lg font-semibold mb-2">Functionality Cookies</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                These cookies are used to enhance the performance and functionality of our Website but are non-essential to their use. However, without these cookies, certain functionality (like videos) may become unavailable.
                            </p>
                            <ul className="text-sm space-y-2 text-muted-foreground list-disc pl-4">
                                <li><strong className="text-foreground">Theme Preference:</strong> Stores your preference for Dark Mode or Light Mode.</li>
                            </ul>
                        </div>
                    </div>

                    <div className="h-px bg-border/40 my-12" />

                    <h3>3. How can you control cookies?</h3>
                    <p>
                        You have the right to decide whether to accept or reject cookies. You can set or amend your web browser controls to accept or refuse cookies. If you choose to reject cookies, you may still use our website though your access to some functionality and areas of our website may be restricted.
                    </p>
                    <p>
                        As the means by which you can refuse cookies through your web browser controls vary from browser-to-browser, you should visit your browser's help menu for more information.
                    </p>

                    <div className="mt-12 p-6 bg-primary/5 rounded-xl border border-primary/10">
                        <p className="text-sm text-muted-foreground m-0">
                            If you have any questions about our use of cookies or other technologies, please email us at <a href="mailto:privacy@scire.in" className="text-primary hover:underline">privacy@scire.in</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
