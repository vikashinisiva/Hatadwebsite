import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      /*
       * Nothing here is secret — a Disallow is a signpost, not a lock, and the
       * real protection is the password on /hq-panel and the auth on the API
       * routes. It stops the ops console and the endpoints turning up in search
       * results, and stops crawlers spending the site's budget on routes that
       * answer 401, 503 or a redirect.
       *
       * /hq-panel also carries its own noindex, for crawlers that fetch first
       * and read robots.txt loosely.
       */
      disallow: ['/hq-panel', '/api/'],
    },
    /* One sitemap, one domain. www.hypseaero.in is a different company's site —
       no hatad.in content is served there and it is being taken down, so
       pointing crawlers at its sitemap would be pointing them off-site. */
    sitemap: 'https://www.hatad.in/sitemap.xml',
  }
}
