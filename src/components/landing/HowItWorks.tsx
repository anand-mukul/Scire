'use client';

import { StickyScroll } from "@/components/ui/sticky-scroll-reveal";
import { UploadVisual, ConfigVisual, InterviewVisual, GradingVisual } from "./HowItWorksVisuals";

const content = [
    {
        title: "1. Upload Materials",
        description:
            "Simply drag and drop your course syllabus, lecture notes, and reference materials. Scire's engine instantly analyzes your content to build a comprehensive knowledge graph of your subject matter.",
        videoSrc: "/videos/upload-flow.mp4",
        content: <UploadVisual />, // Fallback/Alternative
    },
    {
        title: "2. Configure the AI",
        description:
            "Define the examiner's persona. Set the difficulty level, strictness, and specific focus areas. Toggle anti-cheat parameters to ensure exam integrity matches your institutional standards.",
        videoSrc: "/videos/configure-flow.mp4",
        content: <ConfigVisual />,
    },
    {
        title: "3. Autonomous Interviews",
        description:
            "Students engage in natural, voice-based conversations. The AI asks adaptive questions, probes for deeper understanding, and handles follow-up queries just like a human professor, scaling to thousands of concurrent exams.",
        videoSrc: "/videos/interview-flow.mp4",
        content: <InterviewVisual />,
    },
    {
        title: "4. Instant Grading & Insights",
        description:
            "Receive detailed transcripts, audio recordings, and granular grading reports seconds after the exam concludes. Visual analytics highlight class performance gaps and individual student strengths.",
        videoSrc: "/videos/grading-flow.mp4",
        content: <GradingVisual />,
    },
];

export const HowItWorks = () => {
    return (
        <section id="how-it-works" className="py-24 bg-neutral-50 dark:bg-neutral-950 relative overflow-hidden">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400 mb-4">
                        How Scire Works
                    </h2>
                    <p className="text-lg text-neutral-600 dark:text-neutral-400">
                        Transform your assessment process in four simple steps.
                    </p>
                </div>
                <StickyScroll content={content} />
            </div>
        </section>
    );
};
