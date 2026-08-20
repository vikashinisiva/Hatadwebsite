import type { Metadata } from 'next'
import Link from 'next/link'
import { SiteFooter } from '@/components/layout/PolicyPage'
import { NavCTA } from '@/components/layout/ClearanceCTA'
import { POSTS } from '@/lib/journal'

export const metadata: Metadata = {
  title: 'Journal',
  description:
    'Notes on Tamil Nadu land records from the people who read them: what the patta, the encumbrance certificate, the survey sketch and the courts each say, and what happens when they disagree.',
  alternates: { canonical: '/journal' },
  openGraph: {
    title: 'The HataD Journal',
    description:
      'Notes on Tamil Nadu land records from the people who read them, with the underlying records cited.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'HataD',
    url: 'https://www.hatad.in/journal',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'The HataD Journal' }],
  },
}

export default function JournalIndex() {
  /* Newest first. Sorted here rather than relied on in POSTS, so adding a post
     at the top or the bottom of the array makes no difference to the page. */
  const posts = [...POSTS].sort((a, b) => b.publishedISO.localeCompare(a.publishedISO))

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm tracking-[0.14em] text-text-primary">
            HATAD
          </Link>
          <NavCTA />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-14 pb-24">
        <h1 className="text-[2rem] md:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.1] text-text-primary">
          Journal
        </h1>
        <p className="mt-4 text-base md:text-lg leading-relaxed text-text-secondary max-w-[54ch]">
          Notes on Tamil Nadu land records from the people who read them. Every claim is written up
          with the record that establishes it, so it can be checked.
        </p>

        <div className="mt-12 divide-y divide-border border-t border-border">
          {posts.map((p) => (
            <article key={p.slug} className="py-7">
              <p className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-2">
                <time dateTime={p.publishedISO}>{p.published}</time>
                <span className="mx-2">·</span>
                {p.readingMinutes} min read
              </p>
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight text-text-primary">
                <Link href={`/journal/${p.slug}`} className="hover:text-accent-blue">
                  {p.title}
                </Link>
              </h2>
              <p className="mt-2 text-[15px] leading-relaxed text-text-secondary max-w-[58ch]">
                {p.description}
              </p>
              <Link
                href={`/journal/${p.slug}`}
                className="inline-block mt-3 text-sm font-medium text-accent-blue"
              >
                Read
              </Link>
            </article>
          ))}
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
