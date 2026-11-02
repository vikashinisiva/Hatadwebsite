import { NextResponse } from 'next/server'
import { mpServerTrack } from '@/lib/mixpanel-server'

export const maxDuration = 60
export const preferredRegion = 'bom1'

const PROXY_URL = process.env.TNGIS_PROXY_URL || 'http://35.200.151.237:8080'

// Simple in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

/**
 * Records what the free preview actually came back with.
 *
 * This is the single most useful event in the plan, because this lookup is the
 * hard part of the product: TNGIS blocks cloud IPs, rejects browser calls, and
 * every field can come back undefined or partial. "How often does a buyer who
 * asks get something usable?" cannot be answered from the client, where ad
 * blockers would silently remove the failures and leave only the successes —
 * a sample biased toward exactly the wrong conclusion.
 *
 * The visitor is anonymous here, so the browser passes its own Mixpanel id;
 * without one the event is dropped rather than attributed to a stranger.
 *
 * outcome: null means "derive it from the result".
 */
function trackPreview({
  outcome,
  latencyMs,
  analyticsConsent,
  distinctId,
  result,
}: {
  outcome: 'error' | null
  latencyMs: number
  analyticsConsent?: unknown
  distinctId?: unknown
  result?: Record<string, unknown>
}): void {
  if (typeof distinctId !== 'string' || !distinctId) return

  const land = result?.land_details as Record<string, unknown> | undefined
  const hasPatta = land?.success === 1
  /* Guard everything: urban areas return revenue_town_name where rural returns
     village_name, and either can be absent. This has crashed the page before. */
  const hasFmb = result?.is_fmb === 1 || land?.is_fmb === 1
  const ulpin = (result?.ulpin ?? land?.ulpin) as string | undefined
  const hasUlpin = typeof ulpin === 'string' && ulpin.length > 0

  const rural = (result?.rural_urban ?? land?.rural_urban) as string | undefined
  const district = (land?.district_name ?? result?.district_name) as string | undefined

  const resolved: 'complete' | 'partial' | 'empty' | 'error' =
    outcome === 'error'
      ? 'error'
      : !hasPatta
        ? 'empty'
        : hasFmb && hasUlpin
          ? 'complete'
          : 'partial'

  void mpServerTrack({
    event: 'risk_preview_returned',
    distinctId,
    consent: analyticsConsent === true,
    props: {
      outcome: resolved,
      has_patta: hasPatta,
      has_fmb: Boolean(hasFmb),
      has_ulpin: hasUlpin,
      rural_urban: rural === 'urban' || rural === 'rural' ? rural : undefined,
      latency_ms: latencyMs,
      district: typeof district === 'string' ? district : undefined,
    },
  })
}

export async function POST(request: Request) {
  /*
   * Hoisted out of the try so the catch can still report the failure. The
   * proxy VM timing out is not an edge case — it is a cloud IP allowlist and a
   * single Mumbai box — and it is precisely the outcome worth counting. An
   * error path that cannot emit its own event would leave the success rate
   * looking perfect while buyers saw nothing.
   */
  let startedAt = Date.now()
  let analyticsConsent: unknown
  let distinctId: unknown

  try {
    const body = await request.json()
    ;({ analyticsConsent, distinctId } = body)
    const { lat, lon } = body

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'lat and lon must be numbers' }, { status: 400 })
    }

    if (lat < 6 || lat > 14 || lon < 76 || lon > 81) {
      return NextResponse.json({ error: 'Coordinates must be within Tamil Nadu' }, { status: 400 })
    }

    // Check cache
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Call GCP proxy instead of TNGIS directly
    startedAt = Date.now()
    const resp = await fetch(`${PROXY_URL}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
      signal: AbortSignal.timeout(55000),
    })

    if (!resp.ok) {
      trackPreview({ outcome: 'error', latencyMs: Date.now() - startedAt, analyticsConsent, distinctId })
      return NextResponse.json({ error: 'Proxy lookup failed' }, { status: 502 })
    }

    const result = await resp.json()
    trackPreview({ outcome: null, latencyMs: Date.now() - startedAt, analyticsConsent, distinctId, result })

    // Cache successful results
    if (result.land_details?.success === 1) {
      cache.set(cacheKey, { data: result, ts: Date.now() })
      if (cache.size > 200) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
        if (oldest) cache.delete(oldest[0])
      }
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('TNGIS lookup error:', error)
    /*
     * A thrown fetch — connect timeout, DNS, the VM being down — not just a
     * non-ok response. This is the common failure in practice, and it reaches
     * here rather than the !resp.ok branch above.
     */
    trackPreview({
      outcome: 'error',
      latencyMs: Date.now() - startedAt,
      analyticsConsent,
      distinctId,
    })
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
