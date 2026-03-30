"use client";

import { Button } from "@/components/ui/button";
import { Mail, MessageSquare, MapPin, ArrowRight, HelpCircle, FileText } from "lucide-react";
import Link from 'next/link';
import { motion } from 'motion/react';
import { ProtectedMailLink } from "@/components/ui/protected-mail-link";

export default function ContactPage() {
    return (
        <div className="max-w-3xl mx-auto">
            <div className="text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70 mb-6 tracking-tight">
                    Contact Us
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto">
                    Have questions about enterprise deployment, API access, or just want to say hi? We'd love to hear from you.
                </p>
            </div>

            <div className="grid gap-6 mb-16">
                <div className="group relative overflow-hidden rounded-3xl border border-primary/10 bg-background/50 hover:bg-background/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 p-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-7 flex items-start gap-6">
                        <div className="p-4 rounded-2xl bg-primary/10 text-primary shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Email Us</h3>
                            <p className="text-muted-foreground text-sm mb-3">For general inquiries, partnerships, and support.</p>
                            <ProtectedMailLink email="contact@scire.in" className="inline-flex items-center text-primary font-medium hover:underline">
                                contact@scire.in <ArrowRight className="w-4 h-4 ml-1" />
                            </ProtectedMailLink>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-blue-500/10 bg-background/50 hover:bg-background/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/5 p-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-7 flex items-start gap-6">
                        <div className="p-4 rounded-2xl bg-blue-500/10 text-blue-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-blue-500 transition-colors">Live Chat</h3>
                            <p className="text-muted-foreground text-sm mb-2">Available Mon-Fri, 9am - 5pm EST for real-time assistance.</p>
                            <span className="text-xs font-mono py-1 px-2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                Widget in bottom right
                            </span>
                        </div>
                    </div>
                </div>

                <div className="group relative overflow-hidden rounded-3xl border border-orange-500/10 bg-background/50 hover:bg-background/80 backdrop-blur-xl transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/5 p-1">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="relative p-7 flex items-start gap-6">
                        <div className="p-4 rounded-2xl bg-orange-500/10 text-orange-500 shrink-0 group-hover:scale-110 transition-transform duration-300">
                            <MapPin className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1 group-hover:text-orange-500 transition-colors">Office</h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                                Remote, India
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative overflow-hidden rounded-3xl bg-muted/30 border border-border p-8 md:p-10 text-center">
                <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
                <div className="relative z-10">
                    <h3 className="font-bold text-2xl mb-4">Support for Students & Instructors</h3>
                    <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
                        Looking for technical help with an ongoing exam? Our help center has guides, tutorials, and FAQs to get you back on track.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Button variant="outline" className="h-11 px-6 rounded-xl border-primary/20 hover:border-primary/40 hover:bg-primary/5">
                            <HelpCircle className="w-4 h-4 mr-2" />
                            Visit Help Center
                        </Button>
                        <Button className="h-11 px-6 rounded-xl shadow-lg shadow-primary/20">
                            <FileText className="w-4 h-4 mr-2" />
                            Documentation
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
