"use client";

import { PricingCards, PlanData } from "@/components/content/pricing/pricing-cards";
import { showMailRedirectAlert } from "@/components/ui/protected-mail-link";

const PUBLIC_PLANS: PlanData[] = [
    {
        id: "starter",
        name: "Starter",
        description: "Essential tools for individual educators.",
        price: "₹999",
        features: [
            { label: "50 Students", included: true },
            { label: "5 Exams per month", included: true },
            { label: "50 AI Sessions/mo", included: true },
            { label: "Basic Proctoring", included: true },
            { label: "Standard Support", included: true },
            { label: "Advanced Analytics", included: false },
        ],
        ctaText: "Get Started",
        ctaLink: "/request-access"
    },
    {
        id: "pro",
        name: "Pro",
        description: "Perfect for growing departments.",
        price: "₹4,999",
        features: [
            { label: "1,000 Students", included: true },
            { label: "100 Exams per month", included: true },
            { label: "2,500 AI Sessions/mo", included: true },
            { label: "Advanced Proctoring", included: true },
            { label: "Priority Support", included: true },
            { label: "Advanced Analytics", included: true },
        ],
        isPopular: true,
        ctaText: "Start Free Trial",
        ctaLink: "/request-access?plan=pro"
    },
    {
        id: "enterprise",
        name: "Enterprise",
        description: "Custom solutions for institutions.",
        price: "Contact Sales",
        features: [
            { label: "Unlimited Students", included: true },
            { label: "Unlimited Exams", included: true },
            { label: "Custom AI Models", included: true },
            { label: "Dedicated Success Manager", included: true },
            { label: "SLA & Priority Support", included: true },
            { label: "SSO Integration", included: true },
        ],
        ctaText: "Contact Sales",
        ctaAction: () => {
            if (!showMailRedirectAlert()) {
                window.open('mailto:sales@scire.in', '_blank');
            }
        }
    }
];

export default function PricingPage() {
    return (
        <div className="relative min-h-screen w-full bg-black overflow-hidden flex flex-col items-center justify-center">
            {/* Grid Background */}
            <div className="absolute inset-0 w-full h-full bg-black bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
                <div className="absolute inset-0 bg-black [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,transparent_70%,black)]" />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full py-24 px-4 md:px-8">
                <div className="w-full mx-auto">
                    {/* Header Section */}
                    <div className="text-center mb-20 space-y-6">
                        <div className="inline-flex items-center justify-center px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-xl mb-4">
                            <span className="flex h-2 w-2 relative mr-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                            </span>
                            <span className="text-xs font-medium text-white/80 tracking-wide uppercase">New Pricing Plans</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6">
                            Simple pricing for <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-primary animate-gradient-x">
                                advanced assessment.
                            </span>
                        </h1>

                        <p className="text-lg text-neutral-400 max-w-2xl mx-auto leading-relaxed">
                            Choose the perfect plan for your institution. No hidden fees, no credit card required to start.
                            Upgrade anytime as you scale.
                        </p>
                    </div>

                    {/* Pricing Component */}
                    <PricingCards plans={PUBLIC_PLANS} variant="public" />

                    {/* Trust Section */}
                    {/* <div className="mt-24 pt-12 border-t border-white/5 text-center"> */}
                    {/* <p className="text-sm text-neutral-500 mb-8">Trusted by innovatice educators at</p> */}
                    {/* <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40 grayscale hover:grayscale-0 transition-all duration-500"> */}
                    {/* Placeholder Logos - In a real app these would be SVGs */}

                    {/* </div> */}
                    {/* </div> */}
                </div>
            </div>
        </div>
    );
}
