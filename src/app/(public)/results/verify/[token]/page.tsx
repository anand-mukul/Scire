import React from 'react';
import { Metadata } from 'next';
import { api } from '@/lib/network/api';
import { CheckCircle, XCircle, Linkedin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { Logo } from '@/components/ui/logo';
import { PrintButton } from '@/components/ui/print-button';

export const dynamic = 'force-dynamic';

type Props = {
    params: Promise<{ token: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { token } = await params;

    let title = 'Credential Verification | SCIRE';
    let description = 'Verify this credential issued by SCIRE.';

    try {
        const session = await api.sessions.verifyResult(token);
        if (session?.student) {
            title = `Credential Verified – ${session.student.full_name}`;
            description = `Officially verified credential issued by SCIRE. Assessment: ${session.exam?.title}.`;
        }
    } catch { }

    return {
        title,
        description,
        openGraph: { title, description, type: 'article' },
    };
}

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
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="text-center max-w-md">
                    <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
                        <XCircle className="text-red-500" size={32} />
                    </div>
                    <h1 className="text-2xl font-semibold text-gray-900 mb-2">Credential Not Found</h1>
                    <p className="text-gray-500 mb-8 leading-relaxed">
                        This verification link is invalid, expired, or has been revoked.
                    </p>
                    <Link
                        href="/results/verify"
                        className="inline-block bg-orange-500 text-white px-7 py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-600 transition-colors"
                    >
                        Try Another Credential
                    </Link>
                </div>
            </div>
        );
    }

    const passed = (session.final_score ?? 0) >= 50;
    const issueDate = session.end_time ? new Date(session.end_time) : new Date();
    const scorePercent = Math.round(session.final_score ?? 0);

    const linkedInUrl = new URL('https://www.linkedin.com/profile/add');
    linkedInUrl.searchParams.set('startTask', 'CERTIFICATION_NAME');
    linkedInUrl.searchParams.set('name', session.exam?.title || 'Exam Credential');
    linkedInUrl.searchParams.set('organizationName', 'SCIRE');
    linkedInUrl.searchParams.set('issueYear', issueDate.getFullYear().toString());
    linkedInUrl.searchParams.set('issueMonth', (issueDate.getMonth() + 1).toString());
    linkedInUrl.searchParams.set('certId', token);

    const formattedDate = issueDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    const sealDots = [0, 45, 90, 135, 180, 225, 270, 315];

    return (
        <div className="min-h-screen bg-[#f0f2f5] flex flex-col items-center justify-center py-10 px-4">

            {/* Toolbar */}
            <div id="certificate-toolbar" className="flex items-center gap-3 mb-7">
                <PrintButton />
                {passed && (
                    <a
                        href={linkedInUrl.toString()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 bg-[#0A66C2] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#004182] transition-colors shadow-sm cursor-pointer"
                    >
                        <Linkedin size={15} />
                        Add to LinkedIn
                    </a>
                )}
            </div>

            {/* Certificate */}
            <div
                id="certificate-printable"
                className="relative w-full bg-white overflow-hidden"
                style={{
                    maxWidth: '860px',
                    boxShadow: '0 4px 32px rgba(0,0,0,0.10)',
                    borderRadius: '4px',
                }}
            >
                {/* Left brand stripe */}
                <div
                    className="absolute left-0 top-0 bottom-0 w-[6px]"
                    style={{ background: 'linear-gradient(180deg, #fb923c 0%, #ea580c 100%)' }}
                />

                {/* Top accent line */}
                <div className="absolute top-0 left-[6px] right-0 h-[3px] bg-gradient-to-r from-orange-400 to-orange-100" />

                {/* Corner marks */}
                <div className="absolute top-4 left-5 w-5 h-5 border-t-2 border-l-2 border-orange-300 rounded-tl-sm" />
                <div className="absolute top-4 right-4 w-5 h-5 border-t-2 border-r-2 border-orange-300 rounded-tr-sm" />
                <div className="absolute bottom-4 left-5 w-5 h-5 border-b-2 border-l-2 border-orange-300 rounded-bl-sm" />
                <div className="absolute bottom-4 right-4 w-5 h-5 border-b-2 border-r-2 border-orange-300 rounded-br-sm" />

                <div className="pl-12 pr-10 pt-9 pb-10">

                    {/* Header */}
                    <div className="flex items-start justify-between mb-7">
                        <div className="flex items-center gap-3.5">
                            <Logo size="md" showText={false} href={undefined} />
                            <div>
                                <div className="text-[15px] font-black tracking-[0.2em] text-gray-900 uppercase leading-tight">
                                    SCIRE
                                </div>
                                <div className="text-[10px] text-gray-400 tracking-[0.18em] uppercase mt-0.5">
                                    Assessment Platform
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 pt-0.5">
                            <div
                                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${passed
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-red-50 text-red-600 border-red-200'
                                    }`}
                            >
                                {passed ? (
                                    <><CheckCircle size={11} strokeWidth={2.5} /> Verified &amp; Active</>
                                ) : (
                                    <><XCircle size={11} strokeWidth={2.5} /> Not Passed</>
                                )}
                            </div>
                            <div className="text-[10px] text-gray-400 tracking-[0.16em] uppercase">
                                Certificate of Completion
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gradient-to-r from-orange-200 via-orange-100 to-transparent mb-9" />

                    {/* Body */}
                    <div className="text-center px-4 mb-10">
                        <p className="text-sm italic text-gray-400 mb-4" style={{ fontFamily: 'Georgia, serif' }}>
                            This is to certify that
                        </p>

                        <h1
                            className="text-[42px] font-bold text-gray-900 leading-tight mb-5"
                            style={{ fontFamily: 'Georgia, "Times New Roman", serif', letterSpacing: '-0.01em' }}
                        >
                            {session.student?.full_name}
                        </h1>

                        <p className="text-[13.5px] text-gray-500 max-w-lg mx-auto mb-5 leading-relaxed">
                            has successfully demonstrated proficiency and passed the AI-powered oral assessment for
                        </p>

                        <div className="inline-block">
                            <h2
                                className="text-[22px] font-bold text-orange-500 tracking-wide"
                                style={{ fontFamily: 'Georgia, serif' }}
                            >
                                {session.exam?.title}
                            </h2>
                            <div className="mt-1.5 h-[2px] w-full bg-gradient-to-r from-orange-300 via-orange-400 to-orange-300 rounded-full" />
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-100 mb-8" />

                    {/* Footer */}
                    <div className="flex items-end justify-between gap-6">

                        {/* Metadata */}
                        <div className="flex gap-10">
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1.5">
                                    Date of Issue
                                </div>
                                <div className="text-[13px] text-gray-800 font-semibold whitespace-nowrap">
                                    {formattedDate}
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1.5">
                                    Assessment Score
                                </div>
                                <div className={`text-[13px] font-semibold ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {scorePercent}%
                                </div>
                            </div>
                            <div>
                                <div className="text-[9px] uppercase tracking-[0.15em] text-gray-400 mb-1.5">
                                    Credential ID
                                </div>
                                <div className="text-[11px] text-gray-600 font-mono tracking-tight">
                                    {token.slice(0, 26)}…
                                </div>
                            </div>
                        </div>

                        {/* Signature + Seal */}
                        <div className="flex items-end gap-7 flex-shrink-0">
                            <div className="text-center">
                                <Image
                                    src="/brand-sign.png"
                                    alt="Authorized signature"
                                    width={108}
                                    height={44}
                                    className="mb-2"
                                    unoptimized
                                />
                                <div className="border-t border-gray-300 pt-2">
                                    <div className="text-[11px] font-semibold text-gray-700">SCIRE Platform</div>
                                    <div className="text-[10px] text-gray-400 mt-0.5">Authorized Issuing Authority</div>
                                </div>
                            </div>

                            {/* Official seal */}
                            <div className="relative w-[88px] h-[88px] flex-shrink-0">
                                <svg viewBox="0 0 88 88" className="w-full h-full">
                                    <circle cx="44" cy="44" r="40" fill="none" stroke="#f97316" strokeWidth="1.5" opacity="0.9" />
                                    <circle cx="44" cy="44" r="33" fill="none" stroke="#f97316" strokeWidth="0.8" strokeDasharray="3 2.5" opacity="0.7" />

                                    <path id="sealTopArc" d="M 10,44 A 34,34 0 0,1 78,44" fill="none" />
                                    <text fontSize="6" fill="#f97316" fontWeight="700" letterSpacing="2">
                                        <textPath href="#sealTopArc" startOffset="50%" textAnchor="middle">
                                            SCIRE · VERIFIED · OFFICIAL
                                        </textPath>
                                    </text>

                                    <path id="sealBottomArc" d="M 13,50 A 34,34 0 0,0 75,50" fill="none" />
                                    <text fontSize="5.5" fill="#f97316" letterSpacing="2" opacity="0.85">
                                        <textPath href="#sealBottomArc" startOffset="50%" textAnchor="middle">
                                            ASSESSMENT · PLATFORM
                                        </textPath>
                                    </text>

                                    {sealDots.map((angle) => {
                                        const r = 38;
                                        const x = 44 + r * Math.cos((angle - 90) * Math.PI / 180);
                                        const y = 44 + r * Math.sin((angle - 90) * Math.PI / 180);
                                        return <circle key={angle} cx={x} cy={y} r="1.4" fill="#f97316" opacity="0.8" />;
                                    })}
                                </svg>

                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Logo size="sm" showText={false} href={undefined} />
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* Footer note */}
            <p className="mt-5 text-xs text-gray-400">
                Independently verify credentials at{' '}
                <Link href="/results/verify" className="text-orange-500 font-medium hover:underline">
                    scire.in/results/verify
                </Link>
            </p>

        </div>
    );
}