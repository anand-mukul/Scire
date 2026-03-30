'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/dashboard/page-header';
import {
    Shield, HelpCircle, Mail, AlertTriangle, Search,
    Monitor, Mic, Camera, Clock, BookOpen, Target,
    Ban, Eye, Volume2, Wifi, CheckCircle, XCircle,
    Sparkles, FileText, GraduationCap, Scale
} from 'lucide-react';
import { SUPPORT_MAIL } from '@/lib/constants';
import { ProtectedMailLink } from '@/components/ui/protected-mail-link';

interface HelpItem {
    icon: React.ReactNode;
    title: string;
    description: string;
    category: string;
}

const HELP_ITEMS: HelpItem[] = [
    // Exam Rules
    {
        icon: <Camera className="w-4 h-4" />,
        title: 'Camera Must Stay On',
        description: 'Your webcam must remain active and your face clearly visible throughout the exam. Covering or turning off the camera may result in session termination.',
        category: 'Exam Rules',
    },
    {
        icon: <Mic className="w-4 h-4" />,
        title: 'Microphone Required',
        description: 'A working microphone is mandatory. All your verbal answers are recorded and evaluated by the AI examiner in real time.',
        category: 'Exam Rules',
    },
    {
        icon: <Eye className="w-4 h-4" />,
        title: 'Stay in Frame',
        description: 'Keep your face centered in the camera frame at all times. Looking away for extended periods may be flagged by the system.',
        category: 'Exam Rules',
    },
    {
        icon: <Ban className="w-4 h-4" />,
        title: 'No External Resources',
        description: 'Use of phones, notes, textbooks, secondary monitors, or any external devices is strictly prohibited. The system monitors for violations.',
        category: 'Exam Rules',
    },
    {
        icon: <Volume2 className="w-4 h-4" />,
        title: 'Quiet Environment',
        description: 'Take the exam in a quiet, well-lit room. No other people should be visible or audible. Background noise may interfere with AI evaluation.',
        category: 'Exam Rules',
    },
    {
        icon: <Clock className="w-4 h-4" />,
        title: 'Time Limits',
        description: 'Each exam has a set duration configured by your instructor. The session will auto-submit when time expires. A timer is always visible on-screen.',
        category: 'Exam Rules',
    },
    {
        icon: <Scale className="w-4 h-4" />,
        title: 'Academic Integrity',
        description: 'By joining an exam, you agree to the academic integrity policy. Any form of cheating, impersonation, or misconduct will be reported to your institution.',
        category: 'Exam Rules',
    },

    // Before the Exam
    {
        icon: <Monitor className="w-4 h-4" />,
        title: 'System Check',
        description: 'Run the system check on your Student Portal before joining. It verifies your microphone, camera, and network connectivity. Fix any issues beforehand.',
        category: 'Before the Exam',
    },
    {
        icon: <Wifi className="w-4 h-4" />,
        title: 'Stable Internet',
        description: 'A stable internet connection (minimum 2 Mbps) is required. Use a wired connection if possible. Intermittent connectivity may disrupt your session.',
        category: 'Before the Exam',
    },
    {
        icon: <Shield className="w-4 h-4" />,
        title: 'Browser Permissions',
        description: 'Allow camera and microphone permissions when prompted. Use Chrome or Edge for the best experience. Disable browser extensions that may interfere.',
        category: 'Before the Exam',
    },
    {
        icon: <BookOpen className="w-4 h-4" />,
        title: 'Exam Code',
        description: 'Your instructor will provide an 8-character exam code. Enter it on the Student Portal to join. Codes are case-insensitive.',
        category: 'Before the Exam',
    },

    // During the Exam
    {
        icon: <GraduationCap className="w-4 h-4" />,
        title: 'How Viva Works',
        description: 'The AI examiner asks questions one at a time. Listen carefully, then respond verbally. The AI evaluates your answer in real time and follows up as needed.',
        category: 'During the Exam',
    },
    {
        icon: <Target className="w-4 h-4" />,
        title: 'Answering Questions',
        description: 'Speak clearly and directly into your microphone. Pause briefly between points. If you don\'t know an answer, say so honestly rather than guessing.',
        category: 'During the Exam',
    },
    {
        icon: <XCircle className="w-4 h-4" />,
        title: 'Disconnection',
        description: 'If you lose connection mid-exam, rejoin using the same exam code as quickly as possible. Your session will remain active for a short grace period.',
        category: 'During the Exam',
    },
    {
        icon: <AlertTriangle className="w-4 h-4" />,
        title: 'Do Not Close the Tab',
        description: 'Navigating away from the exam tab, opening new tabs, or closing the browser will be flagged. Stay on the exam page until you submit.',
        category: 'During the Exam',
    },

    // After the Exam
    {
        icon: <FileText className="w-4 h-4" />,
        title: 'Results & Scoring',
        description: 'After submission, the AI generates a detailed evaluation. Scores are based on accuracy, depth, clarity, and relevance. Results appear in your History tab.',
        category: 'After the Exam',
    },
    {
        icon: <CheckCircle className="w-4 h-4" />,
        title: 'Reviewing Performance',
        description: 'Visit History to view past exam results, scores, and AI feedback. Use this to identify weak areas and improve for future assessments.',
        category: 'After the Exam',
    },

    // Practice Mode
    {
        icon: <Sparkles className="w-4 h-4" />,
        title: 'Practice Sessions',
        description: 'Practice mode lets you rehearse viva-style exams with an AI. Create a session by writing topic instructions or uploading a syllabus PDF.',
        category: 'Practice Mode',
    },
    {
        icon: <Target className="w-4 h-4" />,
        title: 'Practice vs Real Exams',
        description: 'Practice sessions are unmonitored and do not count toward your academic record. Use them freely to build confidence before real assessments.',
        category: 'Practice Mode',
    },
];

const CATEGORIES = ['All', ...Array.from(new Set(HELP_ITEMS.map(item => item.category)))];

const CATEGORY_STYLES: Record<string, { gradient: string; borderColor: string; iconColor: string }> = {
    'Exam Rules': { gradient: 'from-orange-500/5 to-transparent', borderColor: 'border-orange-500/10', iconColor: 'text-orange-500 bg-orange-500/10 border-orange-500/20' },
    'Before the Exam': { gradient: 'from-blue-500/5 to-transparent', borderColor: 'border-blue-500/10', iconColor: 'text-blue-500 bg-blue-500/10 border-blue-500/20' },
    'During the Exam': { gradient: 'from-purple-500/5 to-transparent', borderColor: 'border-purple-500/10', iconColor: 'text-purple-500 bg-purple-500/10 border-purple-500/20' },
    'After the Exam': { gradient: 'from-emerald-500/5 to-transparent', borderColor: 'border-emerald-500/10', iconColor: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
    'Practice Mode': { gradient: 'from-primary/5 to-transparent', borderColor: 'border-primary/10', iconColor: 'text-primary bg-primary/10 border-primary/20' },
};

export default function StudentHelpPage() {
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredItems = useMemo(() => {
        return HELP_ITEMS.filter(item => {
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            const matchesSearch = !search ||
                item.title.toLowerCase().includes(search.toLowerCase()) ||
                item.description.toLowerCase().includes(search.toLowerCase()) ||
                item.category.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [search, activeCategory]);

    const groupedItems = useMemo(() => {
        const groups: Record<string, HelpItem[]> = {};
        filteredItems.forEach(item => {
            if (!groups[item.category]) groups[item.category] = [];
            groups[item.category].push(item);
        });
        return groups;
    }, [filteredItems]);

    return (
        <main className="flex flex-col gap-8 p-6 md:p-8 animate-fade-in pb-24">
            <PageHeader
                title="Help & Exam Rules"
                description="Everything you need to know for a smooth examination experience."
            />

            {/* Search & Filters */}
            <div className="space-y-4">
                <div className="relative max-w-lg">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search rules, tips, or topics..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10 h-11"
                    />
                </div>
                <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${activeCategory === cat
                                ? 'bg-primary text-primary-foreground border-primary'
                                : 'bg-secondary/50 text-muted-foreground border-border hover:border-primary/30 hover:text-foreground'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {filteredItems.length === 0 ? (
                <Card className="p-12 text-center">
                    <HelpCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No results found for &ldquo;{search}&rdquo;</p>
                </Card>
            ) : (
                <div className="space-y-8">
                    {Object.entries(groupedItems).map(([category, items]) => {
                        const style = CATEGORY_STYLES[category] || CATEGORY_STYLES['Practice Mode'];
                        return (
                            <div key={category}>
                                <h2 className="text-lg font-semibold text-foreground mb-4">{category}</h2>
                                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                                    {items.map((item, idx) => (
                                        <Card
                                            key={idx}
                                            className={`p-5 bg-gradient-to-br ${style.gradient} ${style.borderColor} hover:border-primary/30 transition-all`}
                                        >
                                            <div className="flex items-start gap-3">
                                                <div className={`p-2 rounded-lg border shrink-0 ${style.iconColor}`}>
                                                    {item.icon}
                                                </div>
                                                <div className="min-w-0">
                                                    <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                                                    <p className="text-xs text-muted-foreground leading-relaxed">{item.description}</p>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Support Section */}
            <Card className="p-6 mt-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                            <HelpCircle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Still need help?</h3>
                            <p className="text-sm text-muted-foreground">Contact your instructor or reach out to support.</p>
                        </div>
                    </div>
                    <ProtectedMailLink
                        email={SUPPORT_MAIL}
                        className="flex items-center gap-2 text-foreground bg-secondary/50 hover:bg-primary hover:text-primary-foreground px-4 py-2.5 rounded-lg transition-all border border-border hover:border-primary shadow-sm button-press text-sm font-semibold w-fit"
                    >
                        <Mail className="w-4 h-4" />
                        {SUPPORT_MAIL}
                    </ProtectedMailLink>
                </div>
            </Card>
        </main>
    );
}
