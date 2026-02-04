'use client';

import { ShieldX } from 'lucide-react';
import Link from 'next/link';

// Metadata removed: Cannot be used in 'use client' components

export default function UnauthorizedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card/40 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10">
                    <ShieldX className="h-8 w-8 text-red-500" />
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                    Access Denied
                </h1>

                <p className="mt-4 text-muted-foreground">
                    You don&apos;t have permission to access this resource.
                    This area may require different privileges or roles.
                </p>

                <div className="mt-8 space-y-3">
                    <Link
                        href="/"
                        className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        Go to Home
                    </Link>

                    <button
                        onClick={() => window.history.back()}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5"
                    >
                        Go Back
                    </button>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                    If you believe you should have access, contact your administrator.
                </p>
            </div>
        </div>
    );
}
