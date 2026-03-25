import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabase-admin'

const REQUIRED_FIELDS = ['name', 'phone', 'district', 'village'] as const

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const body = {
      name: formData.get('name') as string || '',
      company: formData.get('company') as string || '',
      phone: `${formData.get('countryCode') || '+91'} ${formData.get('phone') || ''}`.trim(),
      email: formData.get('email') as string || '',
      district: formData.get('district') as string || '',
      village: formData.get('village') as string || '',
      surveyNo: formData.get('surveyNo') as string || '',
      documents: formData.get('documents') as string || '',
      urgency: formData.get('urgency') as string || 'standard',
    }

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field]?.trim()) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        )
      }
    }

    // Collect uploaded files
    const files = formData.getAll('files') as File[]

    // Upload files to Supabase Storage
    const fileUrls: string[] = []
    const attachments: { filename: string; content: Buffer; contentType: string }[] = []
    const leadId = crypto.randomUUID()

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer())
      const filePath = `${leadId}/${file.name}`

      const { error: uploadError } = await supabaseAdmin.storage
        .from('documents')
        .upload(filePath, buffer, { contentType: file.type, upsert: false })

      if (!uploadError) {
        fileUrls.push(filePath)
      }

      attachments.push({ filename: file.name, content: buffer, contentType: file.type })
    }

    // Save lead to Supabase
    const { error: dbError } = await supabaseAdmin.from('leads').insert({
      id: leadId,
      name: body.name,
      phone: body.phone,
      email: body.email || null,
      company: body.company || null,
      district: body.district,
      village: body.village,
      survey_no: body.surveyNo || null,
      documents_note: body.documents || null,
      urgency: body.urgency,
      status: 'new',
      file_urls: fileUrls.length > 0 ? fileUrls : null,
    })

    if (dbError) {
      console.error('Supabase insert error:', dbError)
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_EMAIL,
        pass: process.env.SMTP_PASSWORD,
      },
    })

    const urgencyLabel = body.urgency === 'urgent' ? '🔴 URGENT' : '🟢 Standard'

    const htmlBody = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #0C1525; border-bottom: 2px solid #1B4FD8; padding-bottom: 8px;">
          New Land Clearance Request
        </h2>
        <p style="background: ${body.urgency === 'urgent' ? '#FEE2E2' : '#ECFDF5'}; padding: 8px 12px; border-radius: 4px; display: inline-block; font-weight: 600;">
          ${urgencyLabel}
        </p>

        <h3 style="color: #3D5278; margin-top: 24px;">Contact Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #7A8FAD; width: 140px;">Name</td><td style="padding: 6px 0; color: #0C1525; font-weight: 500;">${body.name}</td></tr>
          <tr><td style="padding: 6px 0; color: #7A8FAD;">Phone</td><td style="padding: 6px 0; color: #0C1525; font-weight: 500;">${body.phone}</td></tr>
          ${body.email ? `<tr><td style="padding: 6px 0; color: #7A8FAD;">Email</td><td style="padding: 6px 0; color: #0C1525;">${body.email}</td></tr>` : ''}
          ${body.company ? `<tr><td style="padding: 6px 0; color: #7A8FAD;">Company</td><td style="padding: 6px 0; color: #0C1525;">${body.company}</td></tr>` : ''}
        </table>

        <h3 style="color: #3D5278; margin-top: 24px;">Property Details</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 6px 0; color: #7A8FAD; width: 140px;">District</td><td style="padding: 6px 0; color: #0C1525; font-weight: 500;">${body.district}</td></tr>
          <tr><td style="padding: 6px 0; color: #7A8FAD;">Village / Area</td><td style="padding: 6px 0; color: #0C1525; font-weight: 500;">${body.village}</td></tr>
          ${body.surveyNo ? `<tr><td style="padding: 6px 0; color: #7A8FAD;">Survey No.</td><td style="padding: 6px 0; color: #0C1525;">${body.surveyNo}</td></tr>` : ''}
        </table>

        ${body.documents ? `
        <h3 style="color: #3D5278; margin-top: 24px;">Documents Available</h3>
        <p style="color: #0C1525; background: #F4F7FC; padding: 12px; border-radius: 4px;">${body.documents}</p>
        ` : ''}

        ${attachments.length > 0 ? `
        <h3 style="color: #3D5278; margin-top: 24px;">Uploaded Files (${attachments.length})</h3>
        <ul style="color: #0C1525; background: #F4F7FC; padding: 12px 12px 12px 28px; border-radius: 4px; margin: 0;">
          ${attachments.map((a) => `<li style="padding: 2px 0;">${a.filename}</li>`).join('')}
        </ul>
        ` : ''}

        <hr style="margin-top: 32px; border: none; border-top: 1px solid #CBD5E8;" />
        <p style="color: #7A8FAD; font-size: 12px;">
          Submitted via hypseaero.in &middot; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `"HataD Website" <${process.env.SMTP_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_EMAIL,
      subject: `${urgencyLabel} Land Clearance Request — ${body.name} · ${body.district}`,
      html: htmlBody,
      replyTo: body.email || undefined,
      attachments,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Failed to send. Please try again.' },
      { status: 500 },
    )
  }
}
