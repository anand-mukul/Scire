'use client';

import dynamic from 'next/dynamic';
import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { SmoothScroll } from '@/components/landing/SmoothScroll';

const DashboardPreview = dynamic(() => import('@/components/landing/DashboardPreview').then((mod) => mod.DashboardPreview), { ssr: true });
const FeaturesSection = dynamic(() => import('@/components/landing/FeaturesSection').then((mod) => mod.FeaturesSection), { ssr: true });
const CTASection = dynamic(() => import('@/components/landing/CTASection').then((mod) => mod.CTASection), { ssr: true });
const Footer = dynamic(() => import('@/components/landing/Footer').then((mod) => mod.Footer), { ssr: true });

// import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <SmoothScroll>
      <main className="relative bg-background min-h-screen text-foreground selection:bg-primary/30">
        <Navbar />
        <HeroSection />
        <DashboardPreview />
        {/* <HowItWorks /> */}
        <FeaturesSection />
        <CTASection />
        <Footer />
      </main>
    </SmoothScroll>
  );
}

