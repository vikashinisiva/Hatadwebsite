import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { event, source, meta } = body

    if (!event) {
      return NextResponse.json({ error: 'Missing event' }, { status: 400 })
    }

    await supabaseAdmin.from('analytics_events').insert({
      event,
      source: source || null,
      meta: meta || null,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({ ok: true })
  } catch {
    // Never fail the user's flow for tracking
    return NextResponse.json({ ok: true })
  }
}
