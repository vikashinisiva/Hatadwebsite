import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { sendNotification } from '@/lib/sendNotification'
import { CLEARANCE_PRICE_PAISE, REPORT_TURNAROUND_HOURS } from '@/lib/constants'
import { mpServerTrack } from '@/lib/mixpanel-server'

interface ClearanceRequestBody {
  id: string
  userId: string
  notifyEmail: string
  propertyDetails: Record<string, string>
  documentUrls: string[]
  deadline: string
  paymentId: string
  /** Termly's analytics consent, forwarded from the browser. */
  analyticsConsent?: boolean
}

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

    // Atomic: mark payment used + insert clearance row in one Postgres transaction.
    // If either step fails, both roll back — no orphaned "paid but no report" state.
    const { error: rpcError } = await supabaseAdmin.rpc('create_clearance_with_payment', {
      p_request_id: body.id,
      p_user_id: user.id,
      p_payment_id: body.paymentId,
      p_property: body.propertyDetails,
      p_doc_urls: body.documentUrls || [],
      p_notify_email: body.notifyEmail,
      p_deadline: body.deadline,
      p_expected_amount: CLEARANCE_PRICE_PAISE,
    })

    if (rpcError) {
      const msg = rpcError.message || ''
      if (msg.includes('payment_not_verified_or_used')) {
        return NextResponse.json(
          { error: 'Payment not verified or already used.' },
          { status: 402 },
        )
      }
      if (msg.includes('amount_mismatch')) {
        return NextResponse.json(
          { error: 'Payment amount does not match the amount on record for this order.' },
          { status: 402 },
        )
      }
      console.error('Clearance RPC error:', rpcError)
      return NextResponse.json(
        { error: 'Failed to create request. Please try again.' },
        { status: 500 },
      )
    }

    /*
     * ── The money path, measured ──
     *
     * Both events fire here rather than in /api/razorpay/verify, because that
     * route authenticates nothing by design — it verifies an HMAC and refuses
     * to trust the client — so it has no user id to attribute a purchase to,
     * and handing it one from the browser would undo the thing that makes it
     * safe. Here the bearer token has already been checked and body.userId
     * confirmed against it.
     *
     * Known gap, accepted: a payment that is verified but whose submit never
     * lands produces neither event. Those orphans are not invisible — the
     * /api/cron/cleanup job reconciles them and emails ops — they are just not
     * in Mixpanel. Closing it properly needs an authenticated verify route.
     *
     * $insert_id is keyed on the payment id, so the sessionStorage replay that
     * re-fires a submit after a crash cannot double-count a purchase.
     *
     * Not awaited: a slow Mixpanel must not delay the confirmation, and the
     * row is already committed by this point.
     */
    const consent = body.analyticsConsent === true
    const district = body.propertyDetails?.district
    const taluk = body.propertyDetails?.taluk
    const documentCount = body.documentUrls?.length || 0

    void mpServerTrack({
      event: 'payment_completed',
      distinctId: user.id,
      consent,
      insertId: `payment_completed:${body.paymentId}`,
      props: {
        /* Rupees, unquoted, read from the single price source — never retyped. */
        amount_inr: CLEARANCE_PRICE_PAISE / 100,
        currency: 'INR',
      },
    })

    void mpServerTrack({
      event: 'clearance_request_created',
      distinctId: user.id,
      consent,
      insertId: `clearance_created:${body.id}`,
      props: {
        district,
        taluk,
        document_count: documentCount,
        /* Reads the constant; the 48 is a floor, not a ceiling. */
        turnaround_hours: REPORT_TURNAROUND_HOURS,
      },
    })

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
