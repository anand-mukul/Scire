import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function CaseStudiesPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-4">
                Case Studies
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-md">
                See how universities around the world are scaling their assessments with Scire.
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
