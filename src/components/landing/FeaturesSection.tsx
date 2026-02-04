'use client';

import { BentoGrid, BentoGridItem } from '@/components/ui/bento-grid';
import {
    AiExaminerVisual,
    IntegrityVisual,
    GradingVisual,
    ScaleVisual,
    AnalyticsVisual
} from '@/components/visuals/feature-visuals';
import {
    ShieldCheck,
    BrainCircuit,
    Zap,
    BarChart3,
    Globe
} from 'lucide-react';

import { motion } from 'motion/react';

export const FeaturesSection = () => {

    const items = [
        {
            title: "Autonomous AI Examiner",
            description: "Advanced LLMs conduct natural, dynamic conversations that adapt to the student's responses.",
            header: <AiExaminerVisual />,
            icon: <BrainCircuit className="h-4 w-4 text-primary" />,
        },
        {
            title: "Real-time Integrity",
            description: "Multi-modal monitoring tracks tab switching, gaze direction, and multiple voices to ensure exam fairness.",
            header: <IntegrityVisual />,
            icon: <ShieldCheck className="h-4 w-4 text-primary" />,
        },
        {
            title: "Instant Grading",
            description: "Detailed rubrics and feedback are generated seconds after the exam. No more manual grading backlog.",
            header: <GradingVisual />,
            icon: <Zap className="h-4 w-4 text-primary" />,
        },
        {
            title: "Global Scale",
            description: "Run thousands of concurrent exams without logistical nightmares. Scire scales with your institution.",
            header: <ScaleVisual />,
            icon: <Globe className="h-4 w-4 text-primary" />,
        },
        {
            title: "Deep Analytics",
            description: "Get insights into class performance, gap analysis, and historical trends with our comprehensive dashboard.",
            header: <AnalyticsVisual />,
            icon: <BarChart3 className="h-4 w-4 text-primary" />,
        },
    ];

    return (
        <section id="features" className="py-20 bg-background relative z-20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5 }}
                        className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-muted-foreground pb-2"
                    >
                        Intelligence at Scale
                    </motion.h2>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="text-lg text-muted-foreground"
                    >
                        Everything you need to conduct world-class oral assessments.
                    </motion.p>
                </div>

                <BentoGrid className="max-w-4xl mx-auto">
                    {items.map((item, i) => (
                        <BentoGridItem
                            key={i}
                            title={item.title}
                            description={item.description}
                            header={item.header}
                            icon={item.icon}
                            className={i === 3 ? "md:col-span-2" : ""}
                        />
                    ))}
                </BentoGrid>
            </div>
        </section>
    );
};
