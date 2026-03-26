import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join Assessment | Scire',
  description: 'Join your Scire autonomous AI Viva assessment securely. Enter your code to begin.',
  openGraph: {
    title: 'Join Assessment | Scire',
    description: 'Join your Scire autonomous AI Viva assessment securely. Enter your code to begin.',
    url: 'https://www.scire.in/student/join',
    siteName: 'Scire',
    locale: 'en_IN',
    type: 'website',
    /* Uncomment below when setting a specific static image for this page
    images: [
      {
        url: 'https://www.scire.in/images/og-join-image.png',
        width: 1200,
        height: 630,
        alt: 'Join Scire Assessment',
        type: 'image/png',
      },
    ],
    */
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Join Assessment | Scire',
    description: 'Join your Scire autonomous AI Viva assessment securely.',
    /* Uncomment below when ready
    images: ['https://www.scire.in/images/og-join-image.png'],
    */
  },
};

export default function JoinLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
