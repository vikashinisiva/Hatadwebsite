import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { LaunchTease } from '@/components/sections/LaunchTease'
import { SOURCE_CLAIM } from '@/lib/departments'
import { COVERAGE } from '@/lib/coverage'
import { COMING_SOON } from '@/lib/constants'

/**
 * The Tamil launch page.
 *
 * Exists because the Tamil copy was only reachable through a client-side
 * toggle: the served HTML contained five Tamil characters, so a page selling
 * Tamil Nadu land verification could not rank for a single Tamil-language
 * query. Same component, same data, rendered in Tamil on its own URL.
 *
 * Paired with `/` through `alternates.languages` in both directions. Google
 * needs the annotation to be reciprocal — an hreflang that is not returned is
 * ignored — so if the tags here change, change the ones in
 * `coming-soon/page.tsx` too.
 */

const TITLE = 'தமிழ்நாடு நில ஆவணச் சரிபார்ப்பு'
const DESCRIPTION = `பணம் கொடுப்பதற்கு முன், நிலத்தில் என்ன குறை உள்ளது என்று அறியுங்கள். ${SOURCE_CLAIM} அரசுத் துறைகள் மற்றும் நீதிமன்றங்களின் ஆவணங்களைப் படித்து ஒரே அறிக்கையாகத் தருகிறோம். விரைவில் வெளியாகிறது — காத்திருப்புப் பட்டியலில் இணையுங்கள்.`

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: {
    canonical: '/ta',
    languages: {
      en: '/',
      ta: '/ta',
      /* The language an unmatched reader gets. English, because it is the
         wider net — not because it is the more important of the two. */
      'x-default': '/',
    },
  },
  robots: { index: true, follow: true },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    locale: 'ta_IN',
    alternateLocale: 'en_IN',
    siteName: 'HataD',
    url: 'https://www.hatad.in/ta',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: TITLE }],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: 'தமிழ்நாட்டு நில ஆவணச் சரிபார்ப்பு. காத்திருப்புப் பட்டியலில் இணையுங்கள்.',
    images: ['/og-image.png'],
  },
}

export default function TamilLaunchPage() {
  /*
   * This URL only means anything while the wall is up.
   *
   * After launch `/` becomes the real product landing page and this route would
   * otherwise keep serving a "launching soon" page in Tamil to anyone who had
   * bookmarked or indexed it. Redirect rather than 404: the URL will have been
   * crawled by then, and sending it home passes the signal on instead of
   * throwing it away.
   */
  if (!COMING_SOON) redirect('/')

  return <LaunchTease coverage={COVERAGE} initialLang="ta" />
}
