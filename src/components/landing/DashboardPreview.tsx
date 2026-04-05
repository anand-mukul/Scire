'use client';

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { ContainerScroll } from "../visuals/container-scroll-animation";

export const DashboardPreview = () => {
    const [activeTab, setActiveTab] = useState<"dashboard" | "analytics">("dashboard");

    const tabs = [
        { id: "dashboard", label: "Dashboard" },
        { id: "analytics", label: "Analytics" },
    ] as const;

    return (
        <section className="relative py-20 bg-white dark:bg-neutral-950 overflow-hidden">
            <div className="relative container mx-auto px-4">
                <div className="flex flex-col items-center justify-center">
                    <ContainerScroll
                        titleComponent={
                            <>
                                <h1 className="text-4xl font-semibold text-black dark:text-white mb-8">
                                    Manage Assessments with <br />
                                    <span className="text-4xl md:text-[6rem] font-bold mt-1 leading-none">
                                        Unmatched Precision
                                    </span>
                                </h1>
                                <div className="flex items-center justify-center mb-8">
                                    <div className="flex space-x-1 p-1 bg-neutral-100 dark:bg-neutral-900 rounded-full border border-neutral-200 dark:border-neutral-800">
                                        {tabs.map((tab) => (
                                            <button
                                                key={tab.id}
                                                onClick={() => setActiveTab(tab.id)}
                                                className="relative px-6 py-2 text-sm font-medium rounded-full transition-colors focus:outline-none"
                                            >
                                                {activeTab === tab.id && (
                                                    <motion.div
                                                        layoutId="active-tab"
                                                        className="absolute inset-0 bg-white dark:bg-neutral-800 rounded-full shadow-sm"
                                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                                    />
                                                )}
                                                <span className={`relative z-10 ${activeTab === tab.id ? "text-black dark:text-white" : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"}`}>
                                                    {tab.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </>
                        }
                    >
                        <div className="relative h-full w-full">
                            <AnimatePresence mode="wait">
                                {activeTab === "dashboard" ? (
                                    <motion.div
                                        key="dashboard"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.4 }}
                                        className="h-full w-full"
                                    >
                                        <Image
                                            src="/dashboard-preview-light.png"
                                            alt="Dashboard Preview Light"
                                            height={720}
                                            width={1400}
                                            className="mx-auto rounded-xl object-cover h-full object-left-top draggable-false dark:hidden block"
                                            draggable={false}
                                        />
                                        <Image
                                            src="/dashboard-preview-dark.png"
                                            alt="Dashboard Preview Dark"
                                            height={720}
                                            width={1400}
                                            className="mx-auto rounded-xl object-cover h-full object-left-top draggable-false hidden dark:block"
                                            draggable={false}
                                        />
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="analytics"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.4 }}
                                        className="h-full w-full"
                                    >
                                        <Image
                                            src="/analytics-preview-light.png"
                                            alt="Analytics Preview Light"
                                            height={720}
                                            width={1400}
                                            className="mx-auto rounded-xl object-cover h-full object-left-top draggable-false dark:hidden block"
                                            draggable={false}
                                        />
                                        <Image
                                            src="/analytics-preview-dark.png"
                                            alt="Analytics Preview Dark"
                                            height={720}
                                            width={1400}
                                            className="mx-auto rounded-xl object-cover h-full object-left-top draggable-false hidden dark:block"
                                            draggable={false}
                                        />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </ContainerScroll>
                </div>
            </div>
        </section>
    );
};
