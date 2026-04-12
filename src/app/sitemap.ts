import type { MetadataRoute } from 'next'

const DOMAINS = ['https://www.hatad.in', 'https://www.hypseaero.in']

const routes = [
  { path: '/', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/clearance', changeFrequency: 'monthly' as const, priority: 0.9 },
  { path: '/terms', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/privacy', changeFrequency: 'monthly' as const, priority: 0.3 },
  { path: '/cookies', changeFrequency: 'monthly' as const, priority: 0.2 },
]

export default function sitemap(): MetadataRoute.Sitemap {
  return DOMAINS.flatMap(domain =>
    routes.map(route => ({
      url: `${domain}${route.path}`,
      lastModified: new Date(),
      changeFrequency: route.changeFrequency,
      priority: route.priority,
    }))
  )
}
