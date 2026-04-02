"use client";

import { useState, ReactNode, MouseEvent } from "react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Mail, ArrowRight } from "lucide-react";

const REDIRECT_ENABLED =
    process.env.NEXT_PUBLIC_REDIRECT_ALL_MAIL === "true";
const SUPPORT_EMAIL =
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@mail.scire.in";

interface ProtectedMailLinkProps {
    /** The @mail.scire.in email displayed in the UI */
    email: string;
    /** Optional className — preserves existing styling */
    className?: string;
    /** Link text — defaults to the email string */
    children?: ReactNode;
}

/**
 * Drop-in replacement for `<a href="mailto:...">`.
 *
 * When `NEXT_PUBLIC_REDIRECT_ALL_MAIL=true`, clicking the link
 * shows a witty dialog redirecting users to the real support email.
 * Otherwise it behaves like a normal mailto link — zero overhead.
 */
export function ProtectedMailLink({
    email,
    className,
    children,
}: ProtectedMailLinkProps) {
    const [open, setOpen] = useState(false);

    const handleClick = (e: MouseEvent) => {
        if (!REDIRECT_ENABLED) return; // let the native mailto through
        e.preventDefault();
        setOpen(true);
    };

    return (
        <>
            <a
                href={`mailto:${email}`}
                className={className}
                onClick={handleClick}
            >
                {children ?? email}
            </a>

            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent className="max-w-md bg-background/70 backdrop-blur-2xl border border-white/10 shadow-2xl sm:rounded-2xl p-6">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-lg font-semibold text-foreground tracking-tight">
                            Email Infrastructure Update
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed pt-2 space-y-3">
                            <span className="block">
                                We are currently finalizing the inbound routing for <strong className="text-foreground font-medium">{email}</strong>.
                            </span>
                            <span className="block">
                                To ensure your message reaches us immediately and securely, please use our priority support inbox in the interim:
                            </span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    <div className="mt-5 flex items-center gap-2 p-3.5 rounded-lg bg-black/40 border border-white/5 shadow-inner">
                        <code className="font-mono text-[13px] text-foreground/90 tracking-tight">
                            {SUPPORT_EMAIL}
                        </code>
                    </div>

                    <AlertDialogFooter className="mt-7 gap-3 sm:gap-2">
                        <AlertDialogCancel className="rounded-xl border border-white/10 bg-transparent hover:bg-white/5 hover:text-foreground hover:border-white/20 transition-all font-medium">
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() =>
                                window.open(`mailto:${SUPPORT_EMAIL}`, "_self")
                            }
                            className="rounded-xl shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98] group font-medium"
                        >
                            Continue
                            <ArrowRight className="w-4 h-4 ml-1.5 opacity-70 group-hover:translate-x-0.5 transition-all" />
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}

export function showMailRedirectAlert(): boolean {
    if (!REDIRECT_ENABLED) return false;

    const proceed = window.confirm(
        `Email Infrastructure Update\n\n` +
        `We are currently finalizing the inbound routing for this email address.\n` +
        `To ensure your message reaches us immediately, please use our priority inbox: ${SUPPORT_EMAIL}\n\n` +
        `Click OK to open your email client, or Cancel to dismiss.`
    );

    if (proceed) {
        window.open(`mailto:${SUPPORT_EMAIL}`, "_self");
    }

    return true;
}
