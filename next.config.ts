import type { NextConfig } from "next";

/*
 * Response headers.
 *
 * There were none. The site has a password-gated ops console reachable on the
 * public internet and a payment flow behind the wall, and neither had so much
 * as clickjacking protection. Vercel adds HSTS for custom domains; it does not
 * add any of these.
 *
 * frame-ancestors is set through CSP rather than X-Frame-Options because the
 * latter is superseded and has no way to say "nobody" that every browser reads
 * the same. It is the only CSP directive here on purpose: a full policy on a
 * page running Mapbox, Termly, GA4 and Vercel Analytics needs to be built and
 * tested deliberately, not guessed at in a config file.
 */
const securityHeaders = [
  { key: 'Content-Security-Policy', value: "frame-ancestors 'none'" },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  /* Send the full URL same-origin, only the origin cross-origin: analytics and
     referral attribution keep working, but the ?r= referral code is not leaked
     to third parties. */
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  /* The launch page asks for geolocation on the landing hero; camera, mic and
     payment APIs are never used by the browser here. */
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), payment=()' },
];

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,

  /* Free fingerprinting for anyone scanning for framework-specific exploits. */
  poweredByHeader: false,

  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
