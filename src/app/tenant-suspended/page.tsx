import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
    title: 'Organization Suspended | Scire',
    description: 'Your organization\'s access has been temporarily suspended.',
};

export default function TenantSuspendedPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <div className="mx-auto max-w-md rounded-2xl border border-white/10 bg-card/40 p-8 text-center shadow-2xl backdrop-blur-xl">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                    <AlertTriangle className="h-8 w-8 text-amber-500" />
                </div>

                <h1 className="mt-6 text-2xl font-bold tracking-tight text-foreground">
                    Organization Suspended
                </h1>

                <p className="mt-4 text-muted-foreground">
                    Your organization&apos;s access to Scire has been temporarily suspended.
                    This may be due to a billing issue or administrative action.
                </p>

                <div className="mt-8 space-y-3">
                    <Link
                        href="/admin/settings?tab=billing"
                        className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
                    >
                        Manage Billing
                    </Link>

                    <Link
                        href="mailto:support@scire.in"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5"
                    >
                        Contact Support
                    </Link>

                    <Link
                        href="/auth/login"
                        className="inline-flex w-full items-center justify-center rounded-lg border border-white/10 px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-white/5"
                    >
                        Try Different Account
                    </Link>
                </div>

                <p className="mt-6 text-xs text-muted-foreground">
                    If you believe this is an error, please contact your organization administrator
                    or reach out to Scire support.
                </p>
            </div>
        </div>
    );
}
