import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { mpServerTrack } from '@/lib/mixpanel-server'

export async function POST(request: Request) {
  try {
    // Verify the caller's auth token
    const authHeader = request.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAuth = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { requestId, analyticsConsent } = await request.json()
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
    }

    // Verify the request belongs to this user
    const { data: req, error: fetchError } = await supabaseAdmin
      .from('clearance_requests')
      .select('report_url, user_id, property_details, created_at')
      .eq('id', requestId)
      .single()

    if (fetchError || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    if (req.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!req.report_url) {
      return NextResponse.json({ error: 'Report not ready' }, { status: 404 })
    }

    // Generate signed URL using service role
    const { data: signedData } = await supabaseAdmin.storage
      .from('clearance-reports')
      .createSignedUrl(req.report_url, 604800)

    if (!signedData?.signedUrl) {
      return NextResponse.json({ error: 'Failed to generate download link' }, { status: 500 })
    }

    /*
     * ── The Value Moment ──
     *
     * Everything else on this site is a step toward this line: the buyer
     * opening the report and finding out what the records say about the land.
     * Emitted here, after the ownership check and the signed URL, so it counts
     * only downloads that actually succeeded.
     *
     * Server-side on purpose. This is the one event that must not be lost to
     * an ad blocker, because every funnel on top of it is measured against it.
     *
     * Not awaited — a slow Mixpanel must never delay handing over the report.
     */
    const district = typeof req.property_details?.district === 'string'
      ? req.property_details.district
      : undefined
    const createdMs = req.created_at ? new Date(req.created_at).getTime() : 0
    void mpServerTrack({
      event: 'clearance_report_downloaded',
      distinctId: user.id,
      consent: analyticsConsent === true,
      /* One Value Moment per report, however many times the link is re-minted. */
      insertId: `report_downloaded:${requestId}`,
      props: {
        district,
        hours_since_request: createdMs
          ? Math.round((Date.now() - createdMs) / 3_600_000)
          : undefined,
      },
    })

    return NextResponse.json({ url: signedData.signedUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
