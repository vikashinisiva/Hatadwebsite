import { NextResponse } from 'next/server'
import { previewLookup } from '@/lib/tngis'

export const maxDuration = 30
export const preferredRegion = 'bom1' // Mumbai — closest to TNGIS servers

// Simple in-memory cache (cleared on cold start — acceptable for demo)
const cache = new Map<string, { data: unknown; ts: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lat, lon } = body

    if (typeof lat !== 'number' || typeof lon !== 'number') {
      return NextResponse.json({ error: 'lat and lon must be numbers' }, { status: 400 })
    }

    // Validate coordinates are within Tamil Nadu
    if (lat < 6 || lat > 14 || lon < 76 || lon > 81) {
      return NextResponse.json({ error: 'Coordinates must be within Tamil Nadu' }, { status: 400 })
    }

    // Check cache (round to 4 decimal places ~11m accuracy)
    const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    const result = await previewLookup(lat, lon)

    // Cache successful results
    if (result.land_details.success === 1) {
      cache.set(cacheKey, { data: result, ts: Date.now() })
      // Evict old entries if cache grows too large
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
