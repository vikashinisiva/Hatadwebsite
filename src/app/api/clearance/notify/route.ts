import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    },
  })
}

function formatDeadlineIST(deadline: string): string {
  return new Date(deadline).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }) + ' IST'
}

function senderAddress(): string {
  return process.env.SMTP_FROM || `"HataD" <${process.env.SMTP_USER || process.env.SMTP_EMAIL}>`
}

function submittedEmail(id: string, deadline: string, siteUrl: string): string {
  const trackUrl = `${siteUrl}/clearance/track/${id}`
  const shortId = id.slice(0, 8).toUpperCase()
  const deadlineFormatted = formatDeadlineIST(deadline)

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FC;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#0D1B2A;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">HataD</h1>
      <p style="margin:4px 0 0;color:#C9A84C;font-size:12px;letter-spacing:0.05em;">LAND CLEARANCE INTELLIGENCE</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#0D1B2A;font-size:18px;">Request Received</h2>
      <p style="color:#3D5278;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your land clearance report request has been logged and assigned to our analysis queue.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;color:#7A8FAD;font-size:13px;width:120px;">Request ID</td>
          <td style="padding:8px 0;color:#0D1B2A;font-size:13px;font-weight:600;font-family:monospace;">${shortId}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;color:#7A8FAD;font-size:13px;">Deadline</td>
          <td style="padding:8px 0;color:#0D1B2A;font-size:13px;font-weight:500;">${deadlineFormatted}</td>
        </tr>
      </table>
      <a href="${trackUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;border-radius:4px;">
        Track Your Report →
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;color:#7A8FAD;font-size:11px;">HataD by Hypse Aero · Coimbatore, Tamil Nadu</p>
    </div>
  </div>
</body>
</html>`
}

function readyEmail(id: string, reportSignedUrl: string): string {
  const shortId = id.slice(0, 8).toUpperCase()

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FC;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;">
    <div style="background:#0D1B2A;padding:24px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">HataD</h1>
      <p style="margin:4px 0 0;color:#C9A84C;font-size:12px;letter-spacing:0.05em;">LAND CLEARANCE INTELLIGENCE</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#0D1B2A;font-size:18px;">Your Report is Ready</h2>
      <p style="color:#3D5278;font-size:14px;line-height:1.6;margin:0 0 24px;">
        Your HataD land clearance report has been completed and is ready for download.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;color:#7A8FAD;font-size:13px;width:120px;">Request ID</td>
          <td style="padding:8px 0;color:#0D1B2A;font-size:13px;font-weight:600;font-family:monospace;">${shortId}</td>
        </tr>
      </table>
      <a href="${reportSignedUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;border-radius:4px;">
        Download Report
      </a>
      <p style="color:#7A8FAD;font-size:12px;margin:16px 0 0;">This download link expires in 7 days.</p>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;color:#7A8FAD;font-size:11px;">HataD by Hypse Aero · Coimbatore, Tamil Nadu</p>
    </div>
  </div>
</body>
</html>`
}

interface NotifyBody {
  type: 'submitted' | 'ready'
  id: string
  notifyEmail: string
  deadline?: string
  reportSignedUrl?: string
}

export async function POST(request: Request) {
  try {
    const body: NotifyBody = await request.json()

    if (!body.type || !body.id || !body.notifyEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transporter = createTransporter()
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hatad.in'

    if (body.type === 'submitted') {
      if (!body.deadline) {
        return NextResponse.json({ error: 'Deadline required for submitted notification' }, { status: 400 })
      }
      await transporter.sendMail({
        from: senderAddress(),
        to: body.notifyEmail,
        subject: 'Your HataD clearance report request has been received',
        html: submittedEmail(body.id, body.deadline, siteUrl),
      })
    } else if (body.type === 'ready') {
      if (!body.reportSignedUrl) {
        return NextResponse.json({ error: 'Report URL required for ready notification' }, { status: 400 })
      }
      await transporter.sendMail({
        from: senderAddress(),
        to: body.notifyEmail,
        subject: 'Your HataD clearance report is ready',
        html: readyEmail(body.id, body.reportSignedUrl),
      })
    } else {
      return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Notify route error:', error)
    return NextResponse.json({ error: 'Failed to send notification' }, { status: 500 })
  }
}
