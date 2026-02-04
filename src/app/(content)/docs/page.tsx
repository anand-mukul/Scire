import { Button } from "@/components/ui/button";
import { ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="p-4 bg-primary/5 rounded-full mb-6">
                <BookOpen className="w-12 h-12 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-4">
                Documentation
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
                Comprehensive guides and API references are being generated. Check back shortly.
            </p>
            <Link href="/">
                <Button variant="outline">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Home
                </Button>
            </Link>
        </div>
    );
}
