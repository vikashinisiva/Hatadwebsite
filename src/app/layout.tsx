import type { Metadata } from 'next'
import { DM_Sans, Playfair_Display, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import './globals.css'
import { I18nProvider } from '@/lib/i18n/context'
import TermlyCMP from '@/components/TermlyCMP'
import { AuthCallback } from '@/components/AuthCallback'

const TERMLY_WEBSITE_UUID = '1df20e0c-32e3-4b9c-9837-de16e39fec01'

const dmSans = DM_Sans({
  variable: '--font-dm',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
})

const playfair = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  weight: ['400', '700'],
})

const jetbrains = JetBrains_Mono({
  variable: '--font-jetbrains',
  subsets: ['latin'],
  weight: ['400', '500'],
})

export const metadata: Metadata = {
  title: {
    default: 'HataD — Land Clearance Intelligence for Tamil Nadu',
    template: '%s | HataD',
  },
  description:
    '1 in 3 land deals in Tamil Nadu has a legal defect. HataD cross-verifies 10+ government records and delivers a risk report in 3 hours. ₹3,599.',
  keywords: [
    'land clearance Tamil Nadu',
    'land verification India',
    'property due diligence',
    'land document verification',
    'encumbrance certificate check',
    'patta verification',
    'land fraud detection',
    'property risk report',
    'HataD',
    'Hypse Aero',
    'land records Tamil Nadu',
    'EC verification',
  ],
  metadataBase: new URL('https://www.hatad.in'),
  icons: {
    icon: '/icon.png',
    apple: '/apple-icon.png',
  },
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'HataD — Land Clearance Intelligence',
    description:
      '1 in 3 land deals in Tamil Nadu has a legal defect. Cross-verify 10+ government records before you pay. Report in 3 hours.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'HataD',
    url: 'https://www.hatad.in',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'HataD — Land Clearance Intelligence for Tamil Nadu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HataD — Land Clearance Intelligence',
    description: '1 in 3 land deals in Tamil Nadu has a legal defect. Verify before you buy.',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Pre-hydration OAuth overlay — hides page instantly when tokens are in the URL hash.
            Runs before React renders, so no flash of landing page during Google redirect flow. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                if (typeof window === 'undefined') return;
                var h = window.location.hash || '';
                if (h.indexOf('access_token=') === -1) return;
                var s = document.createElement('style');
                s.id = '__hatad_auth_overlay_style';
                s.textContent = 'html,body{background:#F4F7FC!important}body>*:not(#__hatad_auth_overlay){visibility:hidden!important}';
                document.head.appendChild(s);
                document.addEventListener('DOMContentLoaded', function(){
                  if (document.getElementById('__hatad_auth_overlay')) return;
                  var d = document.createElement('div');
                  d.id = '__hatad_auth_overlay';
                  d.style.cssText = 'position:fixed;inset:0;z-index:99999;background:#F4F7FC;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif';
                  d.innerHTML = '<div style="text-align:center"><div style="width:32px;height:32px;border:2px solid rgba(201,168,76,.25);border-top-color:#C9A84C;border-radius:50%;margin:0 auto;animation:__hs 0.8s linear infinite"></div><p style="font-size:13px;color:#7A8FAD;margin-top:16px">Signing you in...</p></div><style>@keyframes __hs{to{transform:rotate(360deg)}}</style>';
                  document.body.appendChild(d);
                });
              })();
            `,
          }}
        />
        {/* Preload Mapbox for hero — starts fetching before JS executes */}
        <link rel="preload" href="https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css" as="style" />
        <link rel="preconnect" href="https://api.mapbox.com" />
        <link rel="preconnect" href="https://events.mapbox.com" />
        <link rel="dns-prefetch" href="https://api.mapbox.com" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'HataD',
              legalName: 'Hypse Aero Private Limited',
              url: 'https://www.hatad.in',
              logo: 'https://www.hatad.in/icon.png',
              description: 'Land clearance intelligence platform for Tamil Nadu. Cross-verifies 10+ government land records and delivers risk reports in 3 hours.',
              telephone: '+918122642341',
              email: 'info@hypseaero.in',
              address: {
                '@type': 'PostalAddress',
                streetAddress: '77/C, Vittal Nagar, Ganeshapuram',
                addressLocality: 'Coimbatore',
                addressRegion: 'Tamil Nadu',
                postalCode: '641023',
                addressCountry: 'IN',
              },
              sameAs: ['https://www.hypseaero.in'],
              areaServed: {
                '@type': 'State',
                name: 'Tamil Nadu',
                containedInPlace: { '@type': 'Country', name: 'India' },
              },
              priceRange: '₹3,599',
            }),
          }}
        />
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
      <body className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable} antialiased`}>
        <TermlyCMP websiteUUID={TERMLY_WEBSITE_UUID} autoBlock />
        <AuthCallback />
        <I18nProvider>
          {children}
        </I18nProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
