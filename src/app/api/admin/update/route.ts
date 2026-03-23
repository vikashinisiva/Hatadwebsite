import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface UpdateBody {
  id: string
  action: 'set_report' | 'set_flags'
  reportUrl?: string
  hasFlags?: boolean | null
  value?: boolean | null
}

export async function POST(request: Request) {
  try {
    const body: UpdateBody = await request.json()

    if (!body.id || !body.action) {
      return NextResponse.json({ error: 'Missing id or action' }, { status: 400 })
    }

    if (body.action === 'set_report') {
      if (!body.reportUrl) {
        return NextResponse.json({ error: 'reportUrl required' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .update({
          report_url: body.reportUrl,
          status: 'ready',
          has_flags: body.hasFlags ?? null,
        })
        .eq('id', body.id)

      if (error) {
        console.error('Admin update error:', error)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      // Fetch the request to get notify_email
      const { data: req } = await supabaseAdmin
        .from('clearance_requests')
        .select('notify_email')
        .eq('id', body.id)
        .single()

      if (req?.notify_email) {
        // Generate signed URL for the report (7 days)
        const { data: signedData } = await supabaseAdmin.storage
          .from('clearance-reports')
          .createSignedUrl(body.reportUrl, 604800)

        if (signedData?.signedUrl) {
          const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hatad.in'
          await fetch(`${siteUrl}/api/clearance/notify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'ready',
              id: body.id,
              notifyEmail: req.notify_email,
              reportSignedUrl: signedData.signedUrl,
            }),
          })
        }
      }

      return NextResponse.json({ success: true })
    }

    if (body.action === 'set_flags') {
      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .update({ has_flags: body.value ?? null })
        .eq('id', body.id)

      if (error) {
        console.error('Admin set_flags error:', error)
        return NextResponse.json({ error: 'Failed to update flags' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin update route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('clearance_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Admin fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
