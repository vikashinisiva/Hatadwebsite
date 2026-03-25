import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

    const { requestId } = await request.json()
    if (!requestId) {
      return NextResponse.json({ error: 'Missing requestId' }, { status: 400 })
    }

    // Verify the request belongs to this user
    const { data: req, error: fetchError } = await supabaseAdmin
      .from('clearance_requests')
      .select('report_url, user_id')
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

    return NextResponse.json({ url: signedData.signedUrl })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
