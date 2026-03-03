'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCcw, Home, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Auth error:', error);
    }, [error]);

    return (
        <div className="flex min-h-dvh items-center justify-center px-4 bg-background">
            <div className="w-full max-w-md text-center space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 border border-destructive/20">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                        Authentication Error
                    </h2>
                    <p className="text-sm text-muted-foreground leading-relaxed max-w-sm mx-auto">
                        Something went wrong during authentication. Please try again or return to the home page.
                    </p>
                </div>

                {process.env.NODE_ENV === 'development' && (
                    <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/15 text-left">
                        <p className="text-xs font-mono text-destructive/90 break-all leading-relaxed">
                            {error.message}
                        </p>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                        onClick={reset}
                        variant="default"
                        size="sm"
                        className="gap-2 w-full sm:w-auto"
                    >
                        <RotateCcw className="h-4 w-4" />
                        Try Again
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 w-full sm:w-auto"
                        asChild
                    >
                        <Link href="/">
                            <Home className="h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>

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
