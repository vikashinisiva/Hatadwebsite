import type { MetadataRoute } from 'next'
import { COMING_SOON } from '@/lib/constants'
import { POSTS } from '@/lib/journal'
import { publishableDistricts, districtSlug } from '@/lib/districts'
import { LOCAL_SCAN_STEPS } from '@/lib/departments'

/*
 * One domain.
 *
 * www.hypseaero.in used to be listed alongside this one and every route was
 * emitted twice, once per host. Hypse Aero is a different company; hatad.in
 * content is not served there and that domain is being taken down. Advertising
 * its URLs would have pointed crawlers at another company's host and, with the
 * site indexable again, published a second copy of every page under it.
 */
const ORIGIN = 'https://www.hatad.in'

const routes = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  /* Same page in Tamil. Listed so it is discovered rather than left to be found
     through the hreflang tag alone; dropped after launch with the other walled
     paths, since /ta redirects home once the product site is live. */
  { path: '/ta', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/clearance', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/tamil-nadu', changeFrequency: 'monthly' as const, priority: 0.8 },
  /* Only districts with verified local checks. Listing the other 33 would be
     asking Google to index pages we already know are thin. */
  ...publishableDistricts(LOCAL_SCAN_STEPS).map(d => ({
    path: `/tamil-nadu/${districtSlug(d)}`, changeFrequency: 'monthly' as const, priority: 0.7,
  })),
  { path: '/guides/buying-land-in-tamil-nadu', changeFrequency: 'monthly' as const, priority: 0.8 },
  { path: '/journal', changeFrequency: 'weekly' as const, priority: 0.7 },
  /* Every post, derived. A hand-listed sitemap and a growing journal disagree
     the first time someone forgets to add a line here. */
  ...POSTS.map(p => ({ path: `/journal/${p.slug}`, changeFrequency: 'monthly' as const, priority: 0.6 })),
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.4 },
  { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/refunds', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/shipping', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/cookies', changeFrequency: 'monthly' as const, priority: 0.2 },
]

// While the wall is up, /clearance redirects — advertising it to crawlers would
// only earn soft-404s. The policy pages stay listed; Razorpay and Google both
// need to reach them.
const WALLED_PATHS = ['/clearance']
/* The mirror of the above: these only exist while the wall is up. */
const PRELAUNCH_ONLY_PATHS = ['/ta']

export default function sitemap(): MetadataRoute.Sitemap {
  const active = COMING_SOON
    ? routes.filter(r => !WALLED_PATHS.includes(r.path))
    : routes.filter(r => !PRELAUNCH_ONLY_PATHS.includes(r.path))

  return active.map(route => ({
    url: `${ORIGIN}${route.path}`,
    lastModified: new Date(),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }))
}
