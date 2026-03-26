import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Vercel Cron: runs daily at 3 AM IST (9:30 PM UTC)
// Cleans up: unused verified payments older than 24h, old analytics events

export async function GET(request: Request) {
  // Verify this is called by Vercel Cron (not a random visitor)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}

  try {
    // 1. Delete unused verified payments older than 24 hours
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { error: payErr } = await supabaseAdmin
      .from('verified_payments')
      .delete()
      .eq('used', false)
      .lt('verified_at', oneDayAgo)

    results.stalePaymentsCleanup = payErr ? 'error' : 'done'

    // 2. Delete analytics events older than 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { error: evtErr } = await supabaseAdmin
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo)

    results.oldEventsCleanup = evtErr ? 'error' : 'done'

    results.status = 'ok'
    results.timestamp = new Date().toISOString()

    return NextResponse.json(results)
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
