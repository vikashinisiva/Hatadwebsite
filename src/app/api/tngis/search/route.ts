import { NextResponse } from 'next/server'
import { searchPlace } from '@/lib/tngis'

export const preferredRegion = 'bom1' // Mumbai

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { query } = body

    if (!query || typeof query !== 'string' || query.trim().length < 2) {
      return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
    }

    const results = await searchPlace(query.trim())
    return NextResponse.json({ results })
  } catch (error) {
    console.error('TNGIS search error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
