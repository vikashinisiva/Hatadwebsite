import { NextResponse } from 'next/server'
import { sendNotification } from '@/lib/sendNotification'
import type { NotificationPayload } from '@/lib/sendNotification'

export async function POST(request: Request) {
  // Only allow internal server-to-server calls
  const secret = request.headers.get('x-internal-secret')
  if (!secret || secret !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body: NotificationPayload = await request.json()

    if (!body.type || !body.id || !body.notifyEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    await sendNotification(body)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notify route error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
