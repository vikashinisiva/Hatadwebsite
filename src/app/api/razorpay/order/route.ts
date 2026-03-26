import { NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, phone, name, amount } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Validate amount — only allow known prices (in paise)
    const ALLOWED_AMOUNTS = [159900, 359900] // ₹1,599 and ₹3,599
    const orderAmount = ALLOWED_AMOUNTS.includes(amount) ? amount : 359900

    const order = await razorpay.orders.create({
      amount: orderAmount,
      currency: 'INR',
      receipt: `clearance_${Date.now()}`,
      notes: {
        email,
        phone: phone || '',
        name: name || '',
        product: orderAmount === 159900 ? 'Land Clearance Report — Document Upload' : 'Land Clearance Report',
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
