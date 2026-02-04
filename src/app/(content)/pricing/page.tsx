import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Check } from "lucide-react";

export default function PricingPage() {
    return (
        <div className="py-12">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-4">
                    Simple, Transparent Pricing
                </h1>
                <p className="text-xl text-muted-foreground">
                    Start for free, scale with your institution.
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {/* Starter */}
                <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
                    <h3 className="font-bold text-xl mb-2">Starter</h3>
                    <div className="mb-6"><span className="text-3xl font-bold">$0</span><span className="text-muted-foreground">/mo</span></div>
                    <p className="text-muted-foreground text-sm mb-6">Perfect for individual instructors or small pilots.</p>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> 50 Exams / month</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Basic Analytics</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Email Support</li>
                    </ul>
                    <Button variant="outline" className="w-full">Get Started</Button>
                </div>

                {/* Institution */}
                <div className="rounded-2xl border-2 border-primary bg-primary/5 p-8 flex flex-col relative">
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPULAR</div>
                    <h3 className="font-bold text-xl mb-2">Institution</h3>
                    <div className="mb-6"><span className="text-3xl font-bold">Custom</span></div>
                    <p className="text-muted-foreground text-sm mb-6">For universities and large organizations.</p>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Unlimited Exams</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> LMS Integration</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Advanced Proctoring</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> 24/7 Priority Support</li>
                    </ul>
                    <Link href="/contact" className="w-full">
                        <Button className="w-full">Contact Sales</Button>
                    </Link>
                </div>

                {/* Enterprise */}
                <div className="rounded-2xl border border-border bg-card p-8 flex flex-col">
                    <h3 className="font-bold text-xl mb-2">Enterprise</h3>
                    <div className="mb-6"><span className="text-3xl font-bold">Custom</span></div>
                    <p className="text-muted-foreground text-sm mb-6">Full control and on-premise deployment.</p>
                    <ul className="space-y-3 mb-8 flex-1">
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> On-premise / Private Cloud</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Custom LLM Training</li>
                        <li className="flex gap-2 text-sm"><Check className="w-4 h-4 text-primary" /> Dedicated Success Manager</li>
                    </ul>
                    <Link href="/contact" className="w-full">
                        <Button variant="outline" className="w-full">Contact Sales</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
