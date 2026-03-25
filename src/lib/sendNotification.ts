import nodemailer from 'nodemailer'

function esc(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

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

function senderAddress(): string {
  return process.env.SMTP_FROM || `"HataD" <${process.env.SMTP_USER || process.env.SMTP_EMAIL}>`
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

// ---------------------------------------------------------------------------
// Email templates
// ---------------------------------------------------------------------------

interface SubmittedEmailOptions {
  id: string
  deadline: string
  siteUrl: string
  propertyDetails?: Record<string, string> | null
  docCount?: number
}

function submittedEmail(opts: SubmittedEmailOptions): string {
  const trackUrl = `${opts.siteUrl}/clearance/track/${opts.id}`
  const shortId = opts.id.slice(0, 8).toUpperCase()
  const deadlineFormatted = formatDeadlineIST(opts.deadline)
  const district = opts.propertyDetails?.district || null
  const surveyNo = opts.propertyDetails?.surveyNo || opts.propertyDetails?.address || null
  const isUpload = (opts.docCount || 0) > 0

  let propertyRows = ''
  if (district || surveyNo) {
    if (district) {
      propertyRows += `<tr>
        <td style="padding:6px 0;color:#7A8FAD;font-size:13px;width:120px;">District</td>
        <td style="padding:6px 0;color:#0D1B2A;font-size:13px;font-weight:500;">${esc(district)}</td>
      </tr>`
    }
    if (surveyNo) {
      propertyRows += `<tr>
        <td style="padding:6px 0;color:#7A8FAD;font-size:13px;">Survey / Patta</td>
        <td style="padding:6px 0;color:#0D1B2A;font-size:13px;font-weight:500;">${esc(surveyNo)}</td>
      </tr>`
    }
  }

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
        ${isUpload
          ? "We've received your documents and started cross-referencing your property records."
          : "We've started retrieving your property records. Our team will pull the relevant documents and cross-reference every entry."}
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:6px 0;color:#7A8FAD;font-size:13px;width:120px;">Request ID</td>
          <td style="padding:6px 0;color:#0D1B2A;font-size:13px;font-weight:600;font-family:monospace;">${shortId}</td>
        </tr>
        ${propertyRows}
        <tr>
          <td style="padding:6px 0;color:#7A8FAD;font-size:13px;">Expected by</td>
          <td style="padding:6px 0;color:#0D1B2A;font-size:13px;font-weight:500;">${deadlineFormatted}</td>
        </tr>
      </table>
      <a href="${trackUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;border-radius:4px;">
        Track Your Report &rarr;
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;color:#7A8FAD;font-size:11px;">HataD by Hypse Aero &middot; Coimbatore, Tamil Nadu</p>
    </div>
  </div>
</body>
</html>`
}

interface ReadyEmailOptions {
  id: string
  reportSignedUrl: string
  hasFlags?: boolean | null
  propertyDetails?: Record<string, string> | null
  submittedAt?: string
  docCount?: number
  isUploadRequest?: boolean
  siteUrl: string
}

function readyEmail(opts: ReadyEmailOptions): string {
  const shortId = opts.id.slice(0, 8).toUpperCase()
  const trackUrl = `${opts.siteUrl}/clearance/track/${opts.id}`

  const submittedFormatted = opts.submittedAt
    ? new Date(opts.submittedAt).toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }) + ' IST'
    : null

  const district = opts.propertyDetails?.district || null
  const surveyNo = opts.propertyDetails?.surveyNo || opts.propertyDetails?.address || null

  const outcomeColor = opts.hasFlags === true ? '#D97706' : '#059669'
  const outcomeBg = opts.hasFlags === true ? '#FFFBEB' : '#ECFDF5'
  const outcomeBorder = opts.hasFlags === true ? '#FDE68A' : '#A7F3D0'
  const outcomeIcon = opts.hasFlags === true ? '&#9888;' : '&#10003;'
  const outcomeTitle = opts.hasFlags === true
    ? 'Items Flagged for Review'
    : 'No Issues Detected'
  const outcomeDesc = opts.hasFlags === true
    ? 'Our analysis identified items that need your attention. Each finding is documented with references in your report.'
    : 'Our analysis found no encumbrances, title conflicts, or litigation markers across all checked records.'

  let detailRows = ''
  if (district || surveyNo || opts.docCount) {
    detailRows = '<table style="width:100%;border-collapse:collapse;margin-bottom:20px;">'
    if (district) {
      detailRows += `<tr>
        <td style="padding:6px 0;color:#7A8FAD;font-size:12px;width:120px;">District</td>
        <td style="padding:6px 0;color:#0D1B2A;font-size:12px;font-weight:500;">${esc(district)}</td>
      </tr>`
    }
    if (surveyNo) {
      detailRows += `<tr>
        <td style="padding:6px 0;color:#7A8FAD;font-size:12px;">Survey / Patta</td>
        <td style="padding:6px 0;color:#0D1B2A;font-size:12px;font-weight:500;">${esc(surveyNo)}</td>
      </tr>`
    }
    if (opts.docCount) {
      const docLabel = opts.isUploadRequest ? 'analysed' : 'retrieved'
      detailRows += `<tr>
        <td style="padding:6px 0;color:#7A8FAD;font-size:12px;">Documents</td>
        <td style="padding:6px 0;color:#0D1B2A;font-size:12px;font-weight:500;">${opts.docCount} ${docLabel}</td>
      </tr>`
    }
    detailRows += '</table>'
  }

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#F4F7FC;font-family:'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #E5E7EB;">

    <div style="background:#0D1B2A;padding:28px 32px;">
      <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">HataD</h1>
      <p style="margin:4px 0 0;color:#C9A84C;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;">Land Clearance Intelligence</p>
    </div>

    <div style="background:#C9A84C;padding:14px 32px;text-align:center;">
      <p style="margin:0;color:#0D1B2A;font-size:14px;font-weight:700;letter-spacing:0.02em;">
        Your Clearance Report is Ready
      </p>
    </div>

    <div style="padding:32px;">

      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr>
          <td style="padding:6px 0;color:#7A8FAD;font-size:12px;width:120px;">Request ID</td>
          <td style="padding:6px 0;color:#0D1B2A;font-size:13px;font-weight:700;font-family:'Courier New',monospace;letter-spacing:0.05em;">${shortId}</td>
        </tr>
        ${submittedFormatted ? `<tr>
          <td style="padding:6px 0;color:#7A8FAD;font-size:12px;">Submitted</td>
          <td style="padding:6px 0;color:#0D1B2A;font-size:12px;font-weight:500;">${submittedFormatted}</td>
        </tr>` : ''}
      </table>

      ${detailRows}

      ${opts.hasFlags !== null && opts.hasFlags !== undefined ? `
      <div style="background:${outcomeBg};border:1px solid ${outcomeBorder};border-radius:6px;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;font-size:14px;font-weight:700;color:${outcomeColor};">
          <span style="margin-right:6px;">${outcomeIcon}</span>${outcomeTitle}
        </p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:${outcomeColor};">
          ${outcomeDesc}
        </p>
      </div>
      ` : ''}

      <div style="text-align:center;margin:28px 0;">
        <a href="${opts.reportSignedUrl}" style="display:inline-block;background:#0D1B2A;color:#C9A84C;font-size:15px;font-weight:700;padding:14px 36px;text-decoration:none;border-radius:6px;letter-spacing:0.02em;">
          Download Your Report
        </a>
        <p style="color:#7A8FAD;font-size:11px;margin:12px 0 0;">
          This link expires in 7 days. You can also download from your
          <a href="${trackUrl}" style="color:#1B4FD8;text-decoration:none;font-weight:600;">tracking page</a>.
        </p>
      </div>

      <div style="border-top:1px solid #E5E7EB;padding-top:20px;margin-top:8px;">
        <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:#0D1B2A;text-transform:uppercase;letter-spacing:0.08em;">
          What&rsquo;s in your report
        </p>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:4px 0;color:#3D5278;font-size:12px;">&#8226;&nbsp; Encumbrance Certificate (EC) analysis</td></tr>
          <tr><td style="padding:4px 0;color:#3D5278;font-size:12px;">&#8226;&nbsp; Title chain &amp; ownership verification</td></tr>
          <tr><td style="padding:4px 0;color:#3D5278;font-size:12px;">&#8226;&nbsp; Patta &amp; FMB cross-reference</td></tr>
          <tr><td style="padding:4px 0;color:#3D5278;font-size:12px;">&#8226;&nbsp; Mutation &amp; A-Register check</td></tr>
          <tr><td style="padding:4px 0;color:#3D5278;font-size:12px;">&#8226;&nbsp; Litigation &amp; dispute screening</td></tr>
        </table>
      </div>
    </div>

    <div style="background:#F8FAFC;padding:20px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0 0 4px;color:#7A8FAD;font-size:11px;">
        This report does not constitute legal advice. We recommend reviewing it with a qualified advocate for high-value transactions.
      </p>
      <p style="margin:0;color:#B8C5DA;font-size:10px;">
        HataD by Hypse Aero &middot; Coimbatore, Tamil Nadu &middot;
        <a href="${opts.siteUrl}" style="color:#B8C5DA;text-decoration:none;">hypseaero.in</a>
      </p>
    </div>

  </div>
</body>
</html>`
}

function delayedEmail(id: string, siteUrl: string): string {
  const trackUrl = `${siteUrl}/clearance/track/${id}`
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
      <h2 style="margin:0 0 8px;color:#0D1B2A;font-size:18px;">Quick Update on Your Report</h2>
      <p style="color:#3D5278;font-size:14px;line-height:1.6;margin:0 0 16px;">
        Your clearance report (${shortId}) is taking a bit longer than our usual turnaround.
        Our team is conducting additional cross-checks to ensure accuracy.
      </p>
      <p style="color:#3D5278;font-size:14px;line-height:1.6;margin:0 0 24px;">
        We expect to have it ready within the next 30&ndash;60 minutes.
        You'll receive an email the moment it's available for download.
      </p>
      <a href="${trackUrl}" style="display:inline-block;background:#C9A84C;color:#0D1B2A;font-size:14px;font-weight:600;padding:12px 28px;text-decoration:none;border-radius:4px;">
        Track Your Report &rarr;
      </a>
    </div>
    <div style="padding:20px 32px;border-top:1px solid #E5E7EB;">
      <p style="margin:0;color:#7A8FAD;font-size:11px;">HataD by Hypse Aero &middot; Coimbatore, Tamil Nadu</p>
    </div>
  </div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface NotificationPayload {
  type: 'submitted' | 'ready' | 'delayed'
  id: string
  notifyEmail: string
  deadline?: string
  reportSignedUrl?: string
  hasFlags?: boolean | null
  propertyDetails?: Record<string, string> | null
  submittedAt?: string
  docCount?: number
  isUploadRequest?: boolean
}

export async function sendNotification(payload: NotificationPayload): Promise<void> {
  const transporter = createTransporter()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://hypseaero.in'

  if (payload.type === 'submitted') {
    if (!payload.deadline) throw new Error('Deadline required for submitted notification')
    await transporter.sendMail({
      from: senderAddress(),
      to: payload.notifyEmail,
      subject: 'Your HataD clearance report request has been received',
      html: submittedEmail({
        id: payload.id,
        deadline: payload.deadline,
        siteUrl,
        propertyDetails: payload.propertyDetails,
        docCount: payload.docCount,
      }),
    })
  } else if (payload.type === 'ready') {
    if (!payload.reportSignedUrl) throw new Error('Report URL required for ready notification')
    const shortId = payload.id.slice(0, 8).toUpperCase()
    await transporter.sendMail({
      from: senderAddress(),
      to: payload.notifyEmail,
      subject: `Your HataD clearance report is ready (${shortId})`,
      html: readyEmail({
        id: payload.id,
        reportSignedUrl: payload.reportSignedUrl,
        hasFlags: payload.hasFlags,
        propertyDetails: payload.propertyDetails,
        submittedAt: payload.submittedAt,
        docCount: payload.docCount,
        isUploadRequest: payload.isUploadRequest,
        siteUrl,
      }),
    })
  } else if (payload.type === 'delayed') {
    await transporter.sendMail({
      from: senderAddress(),
      to: payload.notifyEmail,
      subject: `Update on your HataD clearance report (${payload.id.slice(0, 8).toUpperCase()})`,
      html: delayedEmail(payload.id, siteUrl),
    })
  } else {
    throw new Error('Invalid notification type')
  }
}
