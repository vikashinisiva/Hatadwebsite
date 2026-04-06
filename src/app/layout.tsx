import type { Metadata } from 'next'
import { DM_Sans } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import TermlyCMP from '@/components/TermlyCMP'

const TERMLY_WEBSITE_UUID = '1df20e0c-32e3-4b9c-9837-de16e39fec01'

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
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4N3VPT49KZ" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4N3VPT49KZ');
            `,
          }}
        />
      </head>
      <body className={`${dmSans.variable} antialiased`}>
        <TermlyCMP websiteUUID={TERMLY_WEBSITE_UUID} autoBlock />
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
