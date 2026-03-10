import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'

const dmSans = DM_Sans({
  variable: '--font-dm',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'HataD — Land Clearance Intelligence for Tamil Nadu',
  description:
    'HataD verifies every critical land document against every other — cross-referenced, risk-flagged, and delivered in under 3 hours.',
  keywords: [
    'land clearance',
    'land verification',
    'property due diligence',
    'land document verification',
    'HataD',
    'Hypse Aero',
  ],
  openGraph: {
    title: 'HataD — Land Clearance Intelligence',
    description:
      'Cross-referenced land document verification. Delivered in under 3 hours. Before you sign.',
    type: 'website',
    locale: 'en_IN',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${dmSans.variable} antialiased`}>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
