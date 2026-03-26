import { NextResponse } from 'next/server'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import { supabaseAdmin } from '@/lib/supabase-admin'

function getRazorpay() {
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  })
}

export async function POST(request: Request) {
  try {
    const razorpay = getRazorpay()
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    // Use timing-safe comparison
    const sigBuffer = Buffer.from(razorpay_signature, 'utf8')
    const expectedBuffer = Buffer.from(expectedSignature, 'utf8')

    if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // Fetch order from Razorpay to get the verified amount (don't trust client)
    let orderAmount: number
    try {
      const order = await razorpay.orders.fetch(razorpay_order_id)
      orderAmount = order.amount as number
    } catch {
      console.error('Failed to fetch Razorpay order')
      return NextResponse.json({ error: 'Could not verify order amount' }, { status: 500 })
    }

    // Store verified payment with amount
    const { error: insertError } = await supabaseAdmin
      .from('verified_payments')
      .insert({
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
        amount: orderAmount,
        verified_at: new Date().toISOString(),
        used: false,
      })

    if (insertError) {
      if (!insertError.message.includes('duplicate')) {
        console.error('Failed to store verified payment:', insertError)
        return NextResponse.json({ error: 'Verification storage failed' }, { status: 500 })
      }
    }

    return NextResponse.json({
      verified: true,
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    })
  } catch (error) {
    console.error('Razorpay verify error:', error)
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 },
    )
  }
}
