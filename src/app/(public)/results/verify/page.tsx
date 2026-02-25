'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Logo } from '@/components/ui/logo';
import { Search, ShieldCheck, ArrowRight, Fingerprint } from 'lucide-react';
import Link from 'next/link';

export default function VerifyLandingPage() {
    const router = useRouter();
    const [token, setToken] = useState('');
    const [loading, setLoading] = useState(false);

    function handleSubmit(e: FormEvent) {
        e.preventDefault();
        const trimmed = token.trim();
        if (!trimmed) return;
        setLoading(true);
        router.push(`/results/verify/${encodeURIComponent(trimmed)}`);
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col">

            {/* Minimal Header */}
            <header className="border-b border-gray-100 bg-white/80 backdrop-blur-sm">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Logo size="sm" />
                    <Link
                        href="/"
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ← Back to Home
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-6 py-16">
                <div className="w-full max-w-lg">

                    {/* Icon */}
                    <div className="flex justify-center mb-8">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100 flex items-center justify-center border border-orange-200/50">
                                <ShieldCheck className="text-orange-500" size={28} strokeWidth={1.8} />
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-orange-500 flex items-center justify-center shadow-sm">
                                <Fingerprint className="text-white" size={13} />
                            </div>
                        </div>
                    </div>

                    {/* Heading */}
                    <div className="text-center mb-10">
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-3">
                            Verify a Credential
                        </h1>
                        <p className="text-gray-500 text-[15px] leading-relaxed max-w-sm mx-auto">
                            Enter the credential ID from any SCIRE-issued certificate to verify its authenticity.
                        </p>
                    </div>

                    {/* Form Card */}
                    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label
                                    htmlFor="credential-id"
                                    className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2.5"
                                >
                                    Credential ID
                                </label>
                                <div className="relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        id="credential-id"
                                        type="text"
                                        value={token}
                                        onChange={(e) => setToken(e.target.value)}
                                        placeholder="Paste credential ID or verification token…"
                                        className="w-full pl-11 pr-4 py-3.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-400 transition-all placeholder:text-gray-400"
                                        autoFocus
                                        autoComplete="off"
                                        spellCheck={false}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={!token.trim() || loading}
                                className="w-full inline-flex items-center justify-center gap-2 bg-orange-500 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-orange-600 focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        Verifying…
                                    </>
                                ) : (
                                    <>
                                        Verify Credential
                                        <ArrowRight size={15} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-6 pt-5 border-t border-gray-100">
                            <p className="text-xs text-gray-400 text-center leading-relaxed">
                                The credential ID can be found on the bottom of any certificate issued by SCIRE. It typically looks like a long alphanumeric string.
                            </p>
                        </div>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-8 flex justify-center gap-8">
                        {[
                            { label: 'Cryptographically Signed', icon: '🔐' },
                            { label: 'Tamper-Proof', icon: '🛡️' },
                            { label: 'Instant Verification', icon: '⚡' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium">
                                <span>{item.icon}</span>
                                {item.label}
                            </div>
                        ))}
                    </div>

                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-gray-100 bg-white">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between text-xs text-gray-400">
                    <span>© {new Date().getFullYear()} SCIRE. All rights reserved.</span>
                    <span>AI-Powered Assessment Platform</span>
                </div>
            </footer>
        </div>
    );
}
