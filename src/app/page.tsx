'use client';

import { Navbar } from '@/components/landing/Navbar';
import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { CTASection } from '@/components/landing/CTASection';
import { Footer } from "@/components/landing/Footer";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
// import { HowItWorks } from "@/components/landing/HowItWorks";

export default function Home() {
  return (
    <main className="bg-background min-h-screen text-foreground selection:bg-primary/30">
      <Navbar />
      <HeroSection />
      <DashboardPreview />
      {/* <HowItWorks /> */}
      <FeaturesSection />
      <CTASection />
      <Footer />
    </main>
  );
}
