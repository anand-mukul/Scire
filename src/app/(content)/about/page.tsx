import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function AboutPage() {
    return (
        <div className="prose prose-lg dark:prose-invert max-w-none">
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground mb-8">
                About Scire
            </h1>
            <p className="lead text-xl text-muted-foreground mb-12">
                We are building the future of oral assessments. A world where grading is instant, feedback is deep, and integrity is guaranteed by intelligence, not surveillance.
            </p>

            <div className="aspect-video w-full rounded-2xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center mb-12 relative overflow-hidden group">
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(59,130,246,0.1)_0%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                <span className="text-muted-foreground font-mono text-sm">(Team Photo Placeholder)</span>
            </div>

            <h3>Our Mission</h3>
            <p>
                To make oral examinations scalable. Oral exams are the gold standard for assessing true understanding, but they have historically been too expensive and slow to administer at scale. Scire changes that.
            </p>

            <h3>The Technology</h3>
            <p>
                Scire is powered by state-of-the-art Large Language Models (LLMs) fine-tuned for Socratic questioning. Our properitary "AI Examiner" architecture mimics the flow of a real professor, probing for depth rather than just checking for keywords.
            </p>

            <div className="not-prose mt-16 p-8 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-center">
                <h3 className="text-2xl font-bold mb-4">Join the Revolution</h3>
                <p className="text-muted-foreground mb-6 max-w-lg mx-auto">
                    We are always looking for brilliant engineers and educators to join our team. Help us define the next era of education.
                </p>
                <Link href="/careers">
                    <Button>
                        View Open Positions <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}
