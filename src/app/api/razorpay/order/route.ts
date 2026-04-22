import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { CLEARANCE_PRICE_PAISE } from '@/lib/constants'

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
    const { email, phone, name, amount } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (amount !== CLEARANCE_PRICE_PAISE) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
    }

    const order = await razorpay.orders.create({
      amount: CLEARANCE_PRICE_PAISE,
      currency: 'INR',
      receipt: `clearance_${Date.now()}`,
      notes: {
        email,
        phone: phone || '',
        name: name || '',
        product: 'Land Clearance Report',
      },
    })

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
    })
  } catch (error) {
    console.error('Razorpay order creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 },
    )
  }
}
