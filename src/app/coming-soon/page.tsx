import type { Metadata } from 'next'
import { LaunchTease } from '@/components/sections/LaunchTease'
import { SOURCE_CLAIM } from '@/lib/departments'
import { COVERAGE } from '@/lib/coverage'

export const metadata: Metadata = {
  /*
   * Leads with the product, not the status.
   *
   * Two reasons. The layout applies `template: '%s | HataD'`, so the old value
   * rendered as "Launching soon — HataD | HataD" — the brand twice, and the
   * first thing anyone saw in a result was that we were not open yet.
   *
   * The launch is still stated, in the description below. A title is what
   * someone decides to click on; "Launching soon" is not a reason to click.
   */
  title: 'Land record verification for Tamil Nadu',
  // Mirrors the on-page claim, counted from the same source so the two cannot
  // drift apart.
  description: `Know what's wrong with the land before you pay for it. HataD reads ${SOURCE_CLAIM} Tamil Nadu government departments and courts and hands you one report. Launching soon — join the waitlist.`,
  /*
   * Canonical is correct now that this is the indexable page: with COMING_SOON=1
   * the proxy rewrites "/" here, so "/" genuinely is this document's address.
   *
   * `languages` is the other half of the hreflang pair with /ta. Google ignores
   * an annotation that is not returned by the page it points at, so these two
   * blocks have to stay mirror images of each other — change one, change both.
   */
  alternates: {
    canonical: '/',
    languages: {
      en: '/',
      ta: '/ta',
      'x-default': '/',
    },
  },
  /*
   * Indexable.
   *
   * This was noindex, to keep "Launching soon" out of the hatad.in snippet. The
   * side effect was larger than the problem: the proxy rewrites "/" to this
   * route, so noindex here meant the root domain served noindex for the whole
   * pre-launch window — while sitemap.ts still listed "/" at priority 1 and
   * robots.txt allowed everything. We were asking Google to crawl a page that
   * then refused to be indexed, and losing the domain's index entry to do it.
   *
   * The snippet worry is really a title problem, and the title above now solves
   * it. The page itself is not thin: it names every record source, the coverage
   * figures and a real FAQ.
   */
  robots: { index: true, follow: true },
  openGraph: {
    title: 'HataD — Launching soon',
    description: `Know what's wrong with the land before you pay for it. ${SOURCE_CLAIM} government departments and courts, one report. Join the waitlist for first-week access.`,
    type: 'website',
    locale: 'en_IN',
    siteName: 'HataD',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'HataD — Launching soon' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HataD — Launching soon',
    description: 'Land record verification for Tamil Nadu. Join the waitlist.',
    images: ['/og-image.png'],
  },
}

export default function ComingSoonPage() {
  /* Counted from sro_cache.json here, in a server component — the file is
     3.4 MB and must never reach the browser to display four numbers. */
  return <LaunchTease coverage={COVERAGE} />
}
