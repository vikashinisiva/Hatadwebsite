import type { Metadata } from 'next'
import Link from 'next/link'
import { BUYER_FACTS } from '@/lib/departments'
import { SiteFooter } from '@/components/layout/PolicyPage'
import { ClearanceCTA, NavCTA } from '@/components/layout/ClearanceCTA'

export const metadata: Metadata = {
  title: 'Stamp Duty, Registration and Patta Transfer in Tamil Nadu',
  description:
    'What registering a sale deed in Tamil Nadu actually costs, whether duty is charged on your price or the guideline value, and why registering the deed does not transfer the patta.',
  alternates: { canonical: '/guides/buying-land-in-tamil-nadu' },
  openGraph: {
    title: 'Buying land in Tamil Nadu: cost, documents, and what registration does not settle',
    description:
      'Stamp duty, registration fees, the documents the Sub-Registrar Office expects, and the separate patta transfer people miss.',
    type: 'article',
    locale: 'en_IN',
    siteName: 'HataD',
    url: 'https://www.hatad.in/guides/buying-land-in-tamil-nadu',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Buying land in Tamil Nadu' }],
  },
}

/**
 * The buyer facts, on one page instead of thirty-eight.
 *
 * This block was rendered verbatim on every district page. That is roughly 350
 * words repeated 38 times, and it took the district-specific share of a page
 * from about three quarters down to 58 per cent — just under the threshold at
 * which a generated cluster reads as templated. Search Console was already
 * refusing five of twelve pages with "Crawled, currently not indexed", which is
 * a quality judgment rather than a crawl-budget one, so manufacturing 13,300
 * words of duplication across a new cluster was the wrong direction.
 *
 * One page carries it. The districts link here.
 */
export default function BuyingLandGuide() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm tracking-[0.14em] text-text-primary">
            HATAD
          </Link>
          <NavCTA />
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 pt-12 pb-16">
        <nav className="font-mono text-[11px] tracking-[0.09em] uppercase text-text-muted mb-5">
          <Link href="/tamil-nadu" className="hover:text-accent-blue">
            Tamil Nadu
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-text-secondary">Buying land</span>
        </nav>

        <h1 className="font-serif text-[2.2rem] md:text-[3rem] font-semibold tracking-[-0.02em] leading-[1.06] text-text-primary text-balance">
          What it costs, and what registration does not settle
        </h1>
        <p className="mt-5 text-[17px] leading-relaxed text-text-secondary max-w-[54ch]">
          The statutory cost of buying land in Tamil Nadu is high and easy to underestimate, and the
          step most buyers miss happens after the money has changed hands.
        </p>

        <div className="mt-12 space-y-9">
          {BUYER_FACTS.items.map((f) => (
            <section key={f.q}>
              <h2 className="text-[1.15rem] font-semibold text-text-primary mb-2">{f.q}</h2>
              <p className="text-[15.5px] leading-[1.75] text-text-secondary max-w-[62ch]">{f.a}</p>
            </section>
          ))}
        </div>

        <p className="mt-10 text-[13px] leading-relaxed text-text-muted max-w-[58ch]">
          Rates verified {BUYER_FACTS.verified}. Stamp duty and registration fees are set by the
          state and change with budgets; check against the Registration Department before a
          transaction.
        </p>

        <div className="mt-12 border-t border-border pt-8">
          <h2 className="text-[1.15rem] font-semibold text-text-primary mb-2">
            The checks that apply where you are buying
          </h2>
          <p className="text-[15.5px] leading-relaxed text-text-secondary max-w-[62ch]">
            Everything above is the same in every district. What differs is which departments hold a
            claim over the specific parcel: a coastal plot answers to the Coastal Zone Management
            Authority, land inside the Chennai Metropolitan Area to CMDA rather than DTCP, a hill
            slope to a forest notification that can prevent a patta being granted at all.{' '}
            <Link href="/tamil-nadu" className="text-accent-blue underline underline-offset-2">
              Browse by district
            </Link>{' '}
            to see which apply where you are looking.
          </p>
        </div>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              inLanguage: 'en-IN',
              mainEntity: BUYER_FACTS.items.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />

        <ClearanceCTA />
        <SiteFooter />
      </div>
    </div>
  )
}
