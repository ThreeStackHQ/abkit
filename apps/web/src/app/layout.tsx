import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AbKit — A/B Testing for Indie Hackers',
  description:
    'Test headlines, CTAs, and pricing pages in 5 minutes. Google Optimize at 1/30th the price.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'https://abkit.threestack.io'),
  openGraph: {
    title: 'AbKit — A/B Testing for Indie Hackers',
    description: 'Test anything on your website in 5 minutes. From $9/mo.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AbKit — A/B Testing for Indie Hackers',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
