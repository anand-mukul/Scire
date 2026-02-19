import React from 'react';
import { Metadata } from 'next';
import { api } from '@/lib/network/api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { GrainyBackground } from '@/components/ui/grainy-background';
import { motion } from 'motion/react';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ token: string }>;
};

// 1. Dynamic Metadata for Social Sharing
export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;

    let title = 'Credential Verification | SCIRE';
    let description = 'Verify this credential issued by SCIRE.';

    try {
        const session = await api.sessions.verifyResult(token);
        if (session && session.student) {
            title = `Credential Verified – ${session.student.full_name}`;
            description = `Officially verified result issued by SCIRE. Exam: ${session.exam?.title}.`;
        }
    } catch {
        // Fallback if fetch fails (e.g. invalid token)
    }

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: 'article',
            // images: ['/images/credential-og.png'], 
        },
    };
}

// 2. Main Page Component
export default async function VerifyResultPage({ params }: Props) {
    const { token } = await params;
    let session;
    let error = false;

    try {
        session = await api.sessions.verifyResult(token);
    } catch {
        error = true;
    }

    if (error || !session) {
        return (
            <GrainyBackground className="relative flex flex-col min-h-screen items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-md relative z-10"
                >
                    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl p-8 text-center space-y-4">
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />
                        <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                        <h1 className="text-xl font-semibold text-foreground">Credential Not Found</h1>
                        <p className="text-muted-foreground">
                            This verification link is invalid, expired, or has been revoked.
                        </p>
                        <Link href="/">
                            <Button variant="outline" className="mt-4 border-white/10 hover:bg-white/5">
                                Return to Home
                            </Button>
                        </Link>
                    </div>
                </motion.div>
            </GrainyBackground>
        );
    }

    const passed = (session.final_score ?? 0) >= 50;
    const issueDate = session.end_time ? new Date(session.end_time) : new Date();

    // Construct LinkedIn Add-to-Profile URL
    const linkedInUrl = new URL('https://www.linkedin.com/profile/add');
    linkedInUrl.searchParams.set('startTask', 'CERTIFICATION_NAME');
    linkedInUrl.searchParams.set('name', session.exam?.title || 'Exam Credential');
    linkedInUrl.searchParams.set('organizationName', 'SCIRE');
    linkedInUrl.searchParams.set('issueYear', issueDate.getFullYear().toString());
    linkedInUrl.searchParams.set('issueMonth', (issueDate.getMonth() + 1).toString());
    linkedInUrl.searchParams.set('certId', token);

    return (
        <GrainyBackground className="relative flex flex-col min-h-screen font-sans text-foreground">

            {/* Minimal Header */}
            <header className="relative z-10 py-6 px-6 md:px-12 flex items-center justify-between border-b border-white/10 bg-black/5 backdrop-blur-sm">
                <Link href="/" className="font-bold text-xl tracking-tight">SCIRE</Link>
                <div className="text-xs text-muted-foreground uppercase tracking-widest font-medium">Official Credential Verification</div>
            </header>

            <main className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-3xl"
                >
                    <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl shadow-2xl transition-all duration-300">
                        {/* Glow Effect */}
                        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

                        {/* Top Decorative Bar */}
                        <div className={`h-1.5 w-full ${passed ? 'bg-[#0077B5]' : 'bg-muted'}`} />

                        <div className="p-8 md:p-12 space-y-10">

                            {/* Trust & Status */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="bg-white/5 border border-white/10 p-2.5 rounded-full">
                                        <ShieldCheck className="w-5 h-5 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Verified by SCIRE</span>
                                </div>

                                {passed ? (
                                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20 px-4 py-1.5 flex w-fit items-center gap-2 text-sm">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Active Credential</span>
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" className="text-muted-foreground border-white/10 px-4 py-1.5 text-sm">
                                        Attempt Recorded
                                    </Badge>
                                )}
                            </div>

                            {/* Credential Details */}
                            <div className="space-y-8">
                                <div>
                                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight mb-3 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">
                                        {session.exam?.title}
                                    </h1>
                                    <p className="text-xl text-muted-foreground">
                                        Issued to <span className="font-semibold text-foreground">{session.student?.full_name}</span>
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/10">
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Issue Date</p>
                                        <p className="text-lg font-medium">
                                            {issueDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mb-2">Final Result</p>
                                        <p className="text-lg font-medium">
                                            {Math.round(session.final_score ?? 0)}% Score
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / Actions */}
                            <div className="pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div className="space-y-1.5">
                                    <p className="text-xs text-muted-foreground font-mono uppercase">Credential ID</p>
                                    <p className="text-xs text-foreground/70 font-mono select-all font-medium bg-white/5 px-2 py-1 rounded border border-white/10 w-fit">{token}</p>
                                </div>

                                {passed && (
                                    <Link href={linkedInUrl.toString()} target="_blank" rel="noopener noreferrer">
                                        <Button className="bg-[#0077B5] hover:bg-[#006097] text-white font-medium h-11 px-6 rounded-xl shadow-lg shadow-blue-900/20 transition-all hover:scale-[1.02]">
                                            <svg className="w-5 h-5 mr-2 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 21.227.792 22 1.771 22h20.451C23.2 22 24 21.227 24 20.271V1.729C24 .774 23.2 0 22.227 0z" />
                                            </svg>
                                            Add to LinkedIn
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Footer Seal */}
                <div className="absolute bottom-6 text-center w-full z-0 pointer-events-none opacity-50">
                    <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SCIRE Assessment Platform. All rights reserved.</p>
                </div>
            </main>
        </GrainyBackground>
    );
}
