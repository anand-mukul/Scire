import React from 'react';
import { Metadata } from 'next';
import { api } from '@/lib/network/api';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200 max-w-md w-full text-center space-y-4">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto" />
                    <h1 className="text-xl font-semibold text-gray-900">Credential Not Found</h1>
                    <p className="text-gray-500">
                        This verification link is invalid, expired, or has been revoked.
                    </p>
                </div>
            </div>
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
    // In production, use the actual public URL
    // linkedInUrl.searchParams.set('certUrl', `https://scira.com/results/verify/${token}`);
    linkedInUrl.searchParams.set('certId', token);

    return (
        <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-sans flex flex-col">

            {/* Minimal Header */}
            <header className="bg-white border-b border-gray-200 py-4 px-6 md:px-12 flex items-center justify-between">
                <div className="font-bold text-xl tracking-tight text-gray-800">SCIRE</div>
                <div className="text-xs text-gray-500 uppercase tracking-widest font-medium">Official Credential Verification</div>
            </header>

            <main className="flex-1 flex items-center justify-center p-4 md:p-8">
                <div className="bg-white w-full max-w-3xl rounded-xl shadow-sm border border-gray-200 overflow-hidden relative">
                    {/* Top Decorative Bar */}
                    <div className={`h-2 w-full ${passed ? 'bg-[#0077B5]' : 'bg-gray-300'}`} />

                    <div className="p-8 md:p-12 space-y-8">

                        {/* Trust & Status */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <ShieldCheck className="w-6 h-6 text-gray-600" />
                                </div>
                                <span className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Verified by SCIRE</span>
                            </div>

                            {passed ? (
                                <Badge variant="secondary" className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200 px-3 py-1 flex w-fit items-center gap-1.5">
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Active Credential</span>
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-gray-500 border-gray-300">
                                    Attempt Recorded
                                </Badge>
                            )}
                        </div>

                        {/* Credential Details */}
                        <div className="space-y-6">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-serif text-gray-900 mb-2">
                                    {session.exam?.title}
                                </h1>
                                <p className="text-lg text-gray-500">
                                    Issued to <span className="font-semibold text-gray-900">{session.student?.full_name}</span>
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Issue Date</p>
                                    <p className="text-base text-gray-900 font-medium">
                                        {issueDate.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-1">Final Result</p>
                                    <p className="text-base text-gray-900 font-medium">
                                        {Math.round(session.final_score ?? 0)}% Score
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Actions */}
                        <div className="pt-8 border-t border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                            <div className="space-y-1">
                                <p className="text-xs text-gray-400 font-mono">Credential ID</p>
                                <p className="text-xs text-gray-600 font-mono select-all font-medium">{token}</p>
                            </div>

                            {passed && (
                                <Link href={linkedInUrl.toString()} target="_blank" rel="noopener noreferrer">
                                    <Button className="bg-[#0077B5] hover:bg-[#006097] text-white font-medium h-10 px-6 rounded-md shadow-sm transition-all hover:shadow-md">
                                        <svg className="w-4 h-4 mr-2 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 21.227.792 22 1.771 22h20.451C23.2 22 24 21.227 24 20.271V1.729C24 .774 23.2 0 22.227 0z" />
                                        </svg>
                                        Add Credential to LinkedIn
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer Seal */}
                <div className="absolute bottom-6 text-center w-full">
                    <p className="text-xs text-gray-400">© {new Date().getFullYear()} SCIRE Assessment Platform. All rights reserved.</p>
                </div>
            </main>
        </div>
    );
}
