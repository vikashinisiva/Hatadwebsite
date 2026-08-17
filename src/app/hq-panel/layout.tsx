import type { Metadata } from 'next'

/**
 * Keeps the ops console out of search results.
 *
 * `/hq-panel` is deliberately reachable through the pre-launch wall so ops can
 * keep working, and it is password-gated — but it was also returning
 * `index, follow` like every other page, so the admin sign-in was crawlable and
 * listable. That matters more now that the site is indexable again: an admin
 * login discoverable from a search result is an invitation to try passwords
 * against it.
 *
 * This lives in a layout because page.tsx is a client component, and a client
 * component cannot export `metadata`.
 *
 * robots.ts carries the matching Disallow. The two are belt and braces: this
 * tag governs crawlers that fetch the page, the Disallow stops well-behaved
 * ones fetching it at all.
 */
export const metadata: Metadata = {
  title: 'Ops',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
}

export default function HqPanelLayout({ children }: { children: React.ReactNode }) {
  return children
}
