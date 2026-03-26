import { NextResponse } from 'next/server'

export const maxDuration = 60
export const preferredRegion = 'bom1'

const PROXY_URL = process.env.TNGIS_PROXY_URL || 'http://35.200.151.237:8080'

// Simple in-memory cache
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function POST(request: Request) {
  try {
    const body = await request.json()
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
    const resp = await fetch(`${PROXY_URL}/api/lookup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lat, lon }),
      signal: AbortSignal.timeout(55000),
    })

    if (!resp.ok) {
      return NextResponse.json({ error: 'Proxy lookup failed' }, { status: 502 })
    }

    const result = await resp.json()

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
    return NextResponse.json({ error: 'Lookup failed' }, { status: 500 })
  }
}
