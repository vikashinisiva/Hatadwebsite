import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/sendNotification'

function verifyAdmin(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.slice(7) === process.env.ADMIN_PASSWORD
}

interface UpdateBody {
  id: string
  action: 'set_report' | 'set_flags' | 'upload_report' | 'send_delay' | 'get_signed_urls'
  reportUrl?: string
  hasFlags?: boolean | null
  value?: boolean | null
  paths?: string[]
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

      // Update DB record
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
        .select('notify_email, property_details, created_at, document_urls')
        .eq('id', body.id)
        .single()

      if (req?.notify_email) {
        // Generate signed URL for the report (7 days)
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
            console.error('Notification email failed, but report was set')
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
        console.error('Admin set_flags error:', error)
        return NextResponse.json({ error: 'Failed to update flags' }, { status: 500 })
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
      console.error('Admin fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Admin GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
