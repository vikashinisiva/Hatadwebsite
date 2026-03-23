import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

interface ClearanceRequestBody {
  id: string
  userId: string
  notifyEmail: string
  propertyDetails: Record<string, string>
  documentUrls: string[]
  deadline: string
}

export async function POST(request: Request) {
  try {
    const body: ClearanceRequestBody = await request.json()

    if (!body.id || !body.userId || !body.notifyEmail || !body.deadline) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 },
      )
    }

    const { error } = await supabaseAdmin.from('clearance_requests').insert({
      id: body.id,
      user_id: body.userId,
      status: 'pending',
      property_details: body.propertyDetails,
      document_urls: body.documentUrls,
      notify_email: body.notifyEmail,
      deadline: body.deadline,
    })

    if (error) {
      console.error('Clearance insert error:', error)
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 },
      )
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
