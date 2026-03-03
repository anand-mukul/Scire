import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Scire | Autonomous AI Viva Assessments",
  description: "Conduct massive scale viva exams with autonomous AI examiners. Real-time anti-cheat, instant grading, and detailed analytics.",
  keywords: ["AI", "Viva", "Exam", "Education", "EdTech", "Assessment"],
};

import { Providers } from "@/components/providers/QueryProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { TenantProvider } from "@/contexts/TenantContext";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <body
        className="font-sans antialiased scrollbar-thin"
        suppressHydrationWarning
      >
        <a href="#main-content" className="skip-to-content">Skip to content</a>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <TenantProvider>
              <Providers>
                {children}
                <Toaster position="top-right" theme="dark" richColors closeButton expand />
              </Providers>
            </TenantProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
