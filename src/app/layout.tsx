import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.scire.in"),
  title: "Scire | Autonomous AI Viva Assessments",
  description: "Conduct massive scale viva exams with autonomous AI examiners. Real-time anti-cheat, instant grading, and detailed analytics.",
  keywords: ["AI", "Viva", "Exam", "Education", "EdTech", "Assessment"],
  openGraph: {
    title: "Scire | Autonomous AI Viva Assessments",
    description: "Conduct massive scale viva exams with autonomous AI examiners. Real-time anti-cheat, instant grading, and detailed analytics.",
    url: "https://www.scire.in",
    siteName: "Scire",
    locale: "en_IN",
    type: "website",
    /* Uncomment below when static images are ready in public/images folder
    images: [
      {
        url: "https://www.scire.in/images/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scire OpenGraph Image",
        type: "image/png",
      }
    ],
    */
  },
  twitter: {
    card: "summary_large_image",
    title: "Scire | Autonomous AI Viva Assessments",
    description: "Conduct massive scale viva exams with autonomous AI examiners. Real-time anti-cheat, instant grading, and detailed analytics.",
    /* Uncomment below when static images are ready
    images: ["https://www.scire.in/images/twitter-image.png"],
    */
  },
  /* Uncomment to explicitly provide static icons instead of Next.js auto-magical detection
  icons: {
    icon: [
      { url: "/images/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/images/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      { url: "/images/icon.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/images/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  */
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
