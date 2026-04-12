import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: ['https://www.hatad.in/sitemap.xml', 'https://www.hypseaero.in/sitemap.xml'],
  }
}
