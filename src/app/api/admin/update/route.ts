import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/sendNotification'
import { REPORT_TURNAROUND_HOURS } from '@/lib/constants'
import { mpServerTrack } from '@/lib/mixpanel-server'

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.slice(7) === process.env.ADMIN_PASSWORD
}

/**
 * Records that a report went out, and how long it actually took.
 *
 * Deliberately NOT attributed to the customer. This route is triggered by ops
 * in /hq-panel, not by the buyer's browser, so there is no Termly consent
 * state to honour — and inventing one would be the wrong answer. distinct_id
 * is therefore the request id: this measures our own turnaround against the
 * 48-hour floor, which is an operational fact about an order, rather than
 * behaviour attributed to a person.
 *
 * Worth a second opinion from counsel before launch; it is the one event here
 * that is emitted without a consent signal, and the reasoning above is an
 * engineer's, not a lawyer's.
 *
 * Fire-and-forget: a report delivery must never fail because Mixpanel is slow.
 */
function trackReportDelivered(
  requestId: string,
  req: { property_details?: Record<string, unknown> | null; created_at?: string | null } | null,
): void {
  const createdMs = req?.created_at ? new Date(req.created_at).getTime() : 0
  if (!createdMs) return

  const actualHours = Math.round((Date.now() - createdMs) / 3_600_000)
  const district = typeof req?.property_details?.district === 'string'
    ? req.property_details.district
    : undefined

  void mpServerTrack({
    event: 'clearance_report_delivered',
    distinctId: requestId,
    consent: true,
    /* One delivery per request, even if a report is re-uploaded. */
    insertId: `report_delivered:${requestId}`,
    props: {
      district,
      actual_turnaround_hours: actualHours,
      /* The constant is a minimum, so "late" means past it, not at it. */
      was_delayed: actualHours > REPORT_TURNAROUND_HOURS,
    },
  })
}

interface UpdateBody {
  id: string
  action: string
  reportUrl?: string
  hasFlags?: boolean | null
  value?: boolean | null
  paths?: string[]
  note?: string
  status?: string
}

export async function POST(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const contentType = request.headers.get('content-type') || ''

    // Handle file upload via FormData
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const id = formData.get('id') as string
      const file = formData.get('file') as File
      const hasFlags = formData.get('hasFlags')

      if (!id || !file) {
        return NextResponse.json({ error: 'Missing id or file' }, { status: 400 })
      }

      const path = `${id}/report.pdf`
      const buffer = Buffer.from(await file.arrayBuffer())

      const { error: uploadError } = await supabaseAdmin.storage
        .from('clearance-reports')
        .upload(path, buffer, { contentType: 'application/pdf', upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        return NextResponse.json({ error: 'Failed to upload report' }, { status: 500 })
      }

      const parsedFlags = hasFlags === 'true' ? true : hasFlags === 'false' ? false : null

      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .update({
          report_url: path,
          status: 'ready',
          has_flags: parsedFlags,
        })
        .eq('id', id)

      if (error) {
        console.error('Admin update error:', error)
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      // Send notification email
      const { data: req } = await supabaseAdmin
        .from('clearance_requests')
        .select('notify_email, property_details, created_at, document_urls')
        .eq('id', id)
        .single()

      trackReportDelivered(id, req)

      if (req?.notify_email) {
        const { data: signedData } = await supabaseAdmin.storage
          .from('clearance-reports')
          .createSignedUrl(path, 604800)

        if (signedData?.signedUrl) {
          try {
            await sendNotification({
              type: 'ready',
              id,
              notifyEmail: req.notify_email,
              reportSignedUrl: signedData.signedUrl,
              hasFlags: parsedFlags,
              propertyDetails: req.property_details,
              submittedAt: req.created_at,
              docCount: req.document_urls?.length || 0,
              isUploadRequest: (req.document_urls?.length || 0) > 0,
            })
          } catch {
            console.error('Notification email failed, but report was uploaded')
          }
        }
      }

      return NextResponse.json({ success: true })
    }

    // Handle JSON actions
    const body: UpdateBody = await request.json()

    if (!body.id && body.action !== 'export') {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
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
        return NextResponse.json({ error: 'Failed to update request' }, { status: 500 })
      }

      const { data: req } = await supabaseAdmin
        .from('clearance_requests')
        .select('notify_email, property_details, created_at, document_urls')
        .eq('id', body.id)
        .single()

      trackReportDelivered(body.id, req)

      if (req?.notify_email) {
        const { data: signedData } = await supabaseAdmin.storage
          .from('clearance-reports')
          .createSignedUrl(body.reportUrl, 604800)

        if (signedData?.signedUrl) {
          try {
            await sendNotification({
              type: 'ready',
              id: body.id,
              notifyEmail: req.notify_email,
              reportSignedUrl: signedData.signedUrl,
              hasFlags: body.hasFlags,
              propertyDetails: req.property_details,
              submittedAt: req.created_at,
              docCount: req.document_urls?.length || 0,
              isUploadRequest: (req.document_urls?.length || 0) > 0,
            })
          } catch {
            console.error('Notification email failed')
          }
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
        return NextResponse.json({ error: 'Failed to update flags' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === 'set_status') {
      if (!body.status) {
        return NextResponse.json({ error: 'status required' }, { status: 400 })
      }
      const allowed = ['pending', 'ready', 'cancelled', 'refunded']
      if (!allowed.includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }

      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .update({ status: body.status })
        .eq('id', body.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to update status' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === 'add_note') {
      if (!body.note?.trim()) {
        return NextResponse.json({ error: 'Note cannot be empty' }, { status: 400 })
      }

      const { data: existing } = await supabaseAdmin
        .from('clearance_requests')
        .select('admin_notes')
        .eq('id', body.id)
        .single()

      const notes = (existing?.admin_notes as string[] | null) || []
      const timestamp = new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      })
      notes.push(`[${timestamp}] ${body.note.trim()}`)

      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .update({ admin_notes: notes })
        .eq('id', body.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to add note' }, { status: 500 })
      }
      return NextResponse.json({ success: true, notes })
    }

    if (body.action === 'delete') {
      // Delete report from storage if exists
      const { data: req } = await supabaseAdmin
        .from('clearance_requests')
        .select('report_url, document_urls')
        .eq('id', body.id)
        .single()

      if (req?.report_url) {
        await supabaseAdmin.storage.from('clearance-reports').remove([req.report_url])
      }
      if (req?.document_urls?.length) {
        await supabaseAdmin.storage.from('clearance-documents').remove(req.document_urls)
      }

      const { error } = await supabaseAdmin
        .from('clearance_requests')
        .delete()
        .eq('id', body.id)

      if (error) {
        return NextResponse.json({ error: 'Failed to delete request' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === 'send_delay') {
      const { data: req } = await supabaseAdmin
        .from('clearance_requests')
        .select('notify_email')
        .eq('id', body.id)
        .single()

      if (!req?.notify_email) {
        return NextResponse.json({ error: 'Request not found' }, { status: 404 })
      }

      try {
        await sendNotification({
          type: 'delayed',
          id: body.id,
          notifyEmail: req.notify_email,
        })
      } catch {
        return NextResponse.json({ error: 'Failed to send delay notification' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (body.action === 'get_signed_urls') {
      if (!body.paths || body.paths.length === 0) {
        return NextResponse.json({ error: 'No paths provided' }, { status: 400 })
      }

      const urls: Record<string, string> = {}
      for (const path of body.paths) {
        const { data } = await supabaseAdmin.storage
          .from('clearance-documents')
          .createSignedUrl(path, 3600)
        if (data?.signedUrl) {
          urls[path] = data.signedUrl
        }
      }
      return NextResponse.json({ urls })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Admin update route error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('clearance_requests')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
