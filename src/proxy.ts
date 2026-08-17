import { NextResponse, type NextRequest } from 'next/server'
import { COMING_SOON, PRELAUNCH_PUBLIC_PATHS } from '@/lib/constants'

/**
 * Pre-launch wall. (Next 16 renamed the `middleware` convention to `proxy`.)
 *
 * With COMING_SOON=1 the marketing site and the whole clearance flow are replaced
 * by the waitlist page, while the Razorpay-required policy pages and the ops
 * console stay reachable.
 *
 * `/` is *rewritten* to `/coming-soon` rather than the landing page being edited,
 * so the rebuild of `src/app/page.tsx` continues untouched and stays previewable
 * on any deployment where the flag is off.
 *
 * Launching is one env var: set COMING_SOON=0 (or remove it) and redeploy.
 */
export function proxy(request: NextRequest) {
  if (!COMING_SOON) return NextResponse.next()

  const { pathname } = request.nextUrl

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/coming-soon'
    return NextResponse.rewrite(url)
  }

  const isPublic = PRELAUNCH_PUBLIC_PATHS.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  )
  if (isPublic) return NextResponse.next()

  // Non-allowlisted APIs answer with a real status. Redirecting a POST would
  // silently downgrade it to a GET on `/`, which reads as success to a caller.
  if (pathname.startsWith('/api/')) {
    return NextResponse.json(
      { error: 'HataD is not accepting requests yet. Join the waitlist at https://www.hatad.in' },
      { status: 503 },
    )
  }

  // Everything else — /clearance, /clearance/onboarding, /profile — goes back
  // to the waitlist.
  const home = request.nextUrl.clone()
  home.pathname = '/'
  home.search = ''
  return NextResponse.redirect(home)
}

export const config = {
  matcher: [
    /*
     * Everything except Next internals and static assets. Metadata routes are
     * excluded by name so crawlers can still read them with the wall up.
     */
    '/((?!_next/static|_next/image|favicon\\.ico|icon\\.png|apple-icon\\.png|og-image\\.png|robots\\.txt|sitemap\\.xml|sample-report\\.pdf|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?)$).*)',
  ],
}
