import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface ContactForm {
  name: string
  company: string
  phone: string
  email: string
  district: string
  village: string
  surveyNo: string
  documents: string
  urgency: string
}

const REQUIRED_FIELDS: (keyof ContactForm)[] = ['name', 'phone', 'district', 'village']

export async function POST(request: Request) {
  try {
    const body: ContactForm = await request.json()

    // Validate required fields
    for (const field of REQUIRED_FIELDS) {
      if (!body[field]?.trim()) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 },
        )
      }
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

        <hr style="margin-top: 32px; border: none; border-top: 1px solid #CBD5E8;" />
        <p style="color: #7A8FAD; font-size: 12px;">
          Submitted via hatad.in &middot; ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
        </p>
      </div>
    `

    await transporter.sendMail({
      from: `"HataD Website" <${process.env.SMTP_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL || process.env.SMTP_EMAIL,
      subject: `${urgencyLabel} Land Clearance Request — ${body.name} · ${body.district}`,
      html: htmlBody,
      replyTo: body.email || undefined,
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
