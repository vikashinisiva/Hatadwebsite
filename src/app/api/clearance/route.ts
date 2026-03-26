import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/sendNotification'

interface ClearanceRequestBody {
  id: string
  userId: string
  notifyEmail: string
  propertyDetails: Record<string, string>
  documentUrls: string[]
  deadline: string
  paymentId: string
}

// Expected prices in paise
const PRICE_UPLOAD = 159900   // ₹1,599
const PRICE_PROPERTY = 359900 // ₹3,599

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

    const body: ClearanceRequestBody = await request.json()

    if (!body.id || !body.userId || !body.notifyEmail || !body.deadline || !body.paymentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    // Ensure the userId matches the authenticated user
    if (body.userId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Determine request type and expected price
    const isUploadRequest = (body.documentUrls?.length || 0) > 0
    const expectedAmount = isUploadRequest ? PRICE_UPLOAD : PRICE_PROPERTY

    // Atomic: mark payment as used ONLY IF it exists and is currently unused
    // This prevents TOCTOU race conditions — only one concurrent request can succeed
    const { data: markedPayment, error: markError } = await supabaseAdmin
      .from('verified_payments')
      .update({ used: true })
      .eq('payment_id', body.paymentId)
      .eq('used', false)
      .select('payment_id, amount')
      .single()

    if (markError || !markedPayment) {
      return NextResponse.json(
        { error: 'Payment not verified or already used.' },
        { status: 402 },
      )
    }

    // Validate payment amount matches the request type
    if (markedPayment.amount !== expectedAmount) {
      // Rollback: unmark payment
      await supabaseAdmin
        .from('verified_payments')
        .update({ used: false })
        .eq('payment_id', body.paymentId)

      return NextResponse.json(
        { error: `Payment amount mismatch. Expected ₹${expectedAmount / 100} for this request type.` },
        { status: 402 },
      )
    }

    const { error } = await supabaseAdmin.from('clearance_requests').insert({
      id: body.id,
      user_id: user.id,
      status: 'pending',
      property_details: body.propertyDetails,
      document_urls: body.documentUrls,
      notify_email: body.notifyEmail,
      deadline: body.deadline,
      payment_id: body.paymentId,
    })

    if (error) {
      // Rollback: unmark payment so user can retry
      await supabaseAdmin
        .from('verified_payments')
        .update({ used: false })
        .eq('payment_id', body.paymentId)

      console.error('Clearance insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create request. Please try again.' },
        { status: 500 },
      )
    }

    // Send notification email server-side
    try {
      await sendNotification({
        type: 'submitted',
        id: body.id,
        notifyEmail: body.notifyEmail,
        deadline: body.deadline,
        propertyDetails: body.propertyDetails,
        docCount: body.documentUrls?.length || 0,
      })
    } catch {
      console.error('Notification email failed, but request was submitted')
    }

    return NextResponse.json({ success: true, id: body.id })
  } catch (error) {
    console.error('Clearance route error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    )
  }
}
