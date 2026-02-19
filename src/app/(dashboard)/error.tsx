'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorReportDialog } from '@/components/dashboard/ErrorReportDialog';
import { Logger } from '@/lib/logger';

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        Logger.error('Dashboard error:', error);
    }, [error]);

    return (
        <div className="flex min-h-[60vh] items-center justify-center px-4">
            <div className="w-full max-w-md text-center space-y-6">
                {/* Icon */}
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 dark:bg-destructive/15 border border-destructive/20 shadow-sm">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>

                {/* Heading */}
                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Something went wrong
                    </h2>
                    <p className="text-sm text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
                        An unexpected error occurred. You can try again, go back to the dashboard,
                        or report this to our team.
                    </p>
                </div>

                {/* Error message (dev mode) */}
                {process.env.NODE_ENV === 'development' && (
                    <div className="p-3 rounded-lg bg-destructive/5 dark:bg-destructive/10 border border-destructive/15 dark:border-destructive/20 text-left">
                        <p className="text-xs font-mono text-destructive/90 break-all leading-relaxed">
                            {error.message}
                        </p>
                        {error.digest && (
                            <p className="text-xs font-mono text-muted-foreground/50 mt-1.5 pt-1.5 border-t border-destructive/10">
                                Digest: {error.digest}
                            </p>
                        )}
                    </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        onClick={reset}
                        variant="default"
                        size="sm"
                        className="gap-2 w-full sm:w-auto shadow-sm hover:shadow-md transition-all"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full sm:w-auto border-border/50 hover:bg-muted/50 dark:hover:bg-muted/30"
                        onClick={() => (window.location.href = '/dashboard')}
                    >
                        <Home className="h-4 w-4" />
                        Dashboard
                    </Button>
                    <ErrorReportDialog error={error} />
                </div>

                {/* Subtle reload link */}
                <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors cursor-pointer"
                >
                    <RefreshCcw className="h-3 w-3" />
                    Reload page
                </button>
            </div>
        </div>
    );
}
