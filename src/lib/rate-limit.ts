/**
 * In-process sliding-window rate limiter.
 *
 * Deliberately dependency-free. The obvious alternative is Upstash Redis, which
 * means another account, another set of env vars and a network hop on a path
 * that must stay fast — too much for a waitlist.
 *
 * KNOWN LIMIT: the window lives in one instance's memory. Vercel's Fluid Compute
 * reuses instances across requests so this catches the ordinary case (one script
 * hammering one endpoint), but a request routed to a cold instance starts with a
 * clean slate. It is a speed bump, not a wall.
 *
 * For a real ceiling, add a rate-limit rule in the Vercel Firewall — that runs
 * at the edge, before any of this code, and is not fooled by scale-out.
 */

type Hit = { count: number; resetAt: number }

const buckets = new Map<string, Hit>()

/* Bounded so a flood of unique keys can't grow the map without limit. */
const MAX_KEYS = 10_000

function sweep(now: number) {
  if (buckets.size < MAX_KEYS) return
  for (const [key, hit] of buckets) {
    if (hit.resetAt <= now) buckets.delete(key)
  }
  // Still full of live entries — drop the oldest rather than grow forever.
  if (buckets.size >= MAX_KEYS) {
    const oldest = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)
    for (let i = 0; i < Math.floor(MAX_KEYS / 4); i++) buckets.delete(oldest[i][0])
  }
}

export type RateLimitResult = { allowed: boolean; retryAfterSec: number }

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  sweep(now)

  const hit = buckets.get(key)
  if (!hit || hit.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSec: 0 }
  }

  hit.count += 1
  if (hit.count > limit) {
    return { allowed: false, retryAfterSec: Math.ceil((hit.resetAt - now) / 1000) }
  }
  return { allowed: true, retryAfterSec: 0 }
}

/**
 * Best-effort client address. `x-forwarded-for` is set by Vercel's proxy and is
 * trustworthy there; it is spoofable if this ever runs behind something that
 * does not rewrite it, which is another reason this is not the only defence.
 */
export function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return request.headers.get('x-real-ip') ?? 'unknown'
}
