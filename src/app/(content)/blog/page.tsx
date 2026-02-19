"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Rss } from "lucide-react";
import Link from "next/link";

export default function BlogPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-2xl mx-auto space-y-8">
            <div className="space-y-4">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center mb-6">
                    <Rss className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground tracking-tight">
                    Scire Blog
                </h1>
                <p className="text-xl text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Deep dives into AI assessment, pedagogical integrity, and the future of education.
                </p>
            </div>

            <div className="w-full max-w-md space-y-4 p-6 rounded-3xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="space-y-2 text-left">
                    <h3 className="font-semibold">Get notified when we launch</h3>
                    <p className="text-sm text-muted-foreground">No spam. Only high-signal updates.</p>
                </div>
                <div className="flex gap-2">
                    <Input placeholder="Enter your email" className="bg-background/50 border-input/50" />
                    <Button>Subscribe</Button>
                </div>
            </div>

            <Link href="/">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </Link>
        </div>
    );
}
