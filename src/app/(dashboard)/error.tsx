'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Logger } from '@/lib/logger';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Logger.error('Dashboard Error:', error);
    }, [error]);

    return (
        <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="bg-red-500/10 p-4 rounded-full border border-red-500/20">
                <AlertCircle className="w-12 h-12 text-red-500" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-bold text-white">Something went wrong</h2>
                <p className="text-neutral-400">
                    We encountered an unexpected error while loading your dashboard.
                    Please try again or contact support if the issue persists.
                </p>
                {process.env.NODE_ENV === 'development' && (
                    <div className="p-4 bg-black/40 rounded-lg text-left overflow-auto max-h-40 border border-white/10 mt-4">
                        <p className="font-mono text-xs text-red-400 break-all">{error.message}</p>
                    </div>
                )}
            </div>

            <div className="flex gap-4">
                <Button
                    variant="outline"
                    onClick={() => window.location.href = '/'}
                    className="border-white/10 text-neutral-400 hover:text-white hover:bg-white/5"
                >
                    Go Details
                </Button>
                <Button
                    onClick={() => reset()}
                    className="bg-white text-black hover:bg-neutral-200"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again
                </Button>
            </div>
        </div>
    );
}
