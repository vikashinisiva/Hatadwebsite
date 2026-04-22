import { NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Vercel Cron: runs daily at 3 AM IST (9:30 PM UTC) per vercel.json
// 1. Cleans unused verified payments > 24h
// 2. Cleans analytics events > 90 days
// 3. Reconciles paid-but-no-clearance-request orphans and alerts ops

const ORPHAN_GRACE_MS = 10 * 60 * 1000 // 10 min: gives in-flight submits time to land
const STUCK_UNUSED_MS = 2 * 60 * 60 * 1000 // 2h: paid but never completed submission

function createTransporter() {
  if (process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (Number(process.env.SMTP_PORT) || 465) === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
  })
}

interface PaymentRow {
  payment_id: string
  order_id: string | null
  amount: number
  verified_at: string
  used: boolean
}

async function sendOpsAlert(subject: string, html: string) {
  const target = process.env.NOTIFY_EMAIL || process.env.SMTP_FROM || process.env.SMTP_USER
  if (!target) { console.error('No NOTIFY_EMAIL configured — cannot alert on orphans'); return }
  const transporter = createTransporter()
  await transporter.sendMail({
    from: process.env.SMTP_FROM || `"HataD Ops" <${process.env.SMTP_USER || process.env.SMTP_EMAIL}>`,
    to: target,
    subject,
    html,
  })
}

function rupees(paise: number) { return `₹${(paise / 100).toLocaleString('en-IN')}` }

function formatRows(rows: PaymentRow[]) {
  return rows.map(r => `
    <tr>
      <td style="padding:6px 8px;font-family:monospace;font-size:12px;">${r.payment_id}</td>
      <td style="padding:6px 8px;font-family:monospace;font-size:12px;">${r.order_id ?? '—'}</td>
      <td style="padding:6px 8px;font-size:12px;">${rupees(r.amount)}</td>
      <td style="padding:6px 8px;font-size:11px;color:#7A8FAD;">${new Date(r.verified_at).toISOString()}</td>
    </tr>
  `).join('')
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results: Record<string, unknown> = {}
  const now = Date.now()

  try {
    // 3a. ORPHAN: used=true but no matching clearance_requests row
    // These are the critical "paid but no report" cases.
    const orphanCutoff = new Date(now - ORPHAN_GRACE_MS).toISOString()
    const { data: usedPayments, error: usedErr } = await supabaseAdmin
      .from('verified_payments')
      .select('payment_id, order_id, amount, verified_at, used')
      .eq('used', true)
      .lt('verified_at', orphanCutoff)

    const orphans: PaymentRow[] = []
    if (!usedErr && usedPayments) {
      for (const p of usedPayments as PaymentRow[]) {
        const { count } = await supabaseAdmin
          .from('clearance_requests')
          .select('id', { count: 'exact', head: true })
          .eq('payment_id', p.payment_id)
        if (!count) orphans.push(p)
      }
    }
    results.orphanCount = orphans.length

    // 3b. STUCK UNUSED: verified payment that was never consumed — user paid, never finished submit
    const stuckCutoff = new Date(now - STUCK_UNUSED_MS).toISOString()
    const { data: stuckUnused } = await supabaseAdmin
      .from('verified_payments')
      .select('payment_id, order_id, amount, verified_at, used')
      .eq('used', false)
      .lt('verified_at', stuckCutoff)
    const stuck = (stuckUnused || []) as PaymentRow[]
    results.stuckUnusedCount = stuck.length

    if (orphans.length > 0 || stuck.length > 0) {
      const html = `
        <h2>HataD payment reconciliation alert</h2>
        ${orphans.length > 0 ? `
          <h3 style="color:#B91C1C">CRITICAL · ${orphans.length} paid-but-no-report orphan(s)</h3>
          <p>These payments were marked <code>used=true</code> but no <code>clearance_requests</code> row exists. Customer paid, got nothing.</p>
          <table style="border-collapse:collapse;border:1px solid #CBD5E8;">
            <thead><tr style="background:#F4F7FC"><th style="padding:6px 8px;text-align:left">Payment ID</th><th style="padding:6px 8px;text-align:left">Order ID</th><th style="padding:6px 8px;text-align:left">Amount</th><th style="padding:6px 8px;text-align:left">Verified at</th></tr></thead>
            <tbody>${formatRows(orphans)}</tbody>
          </table>
          <p><b>Action:</b> look up each payment in Razorpay, contact the customer, and either manually create a <code>clearance_requests</code> row or issue a refund.</p>
        ` : ''}
        ${stuck.length > 0 ? `
          <h3 style="color:#D97706">${stuck.length} paid-but-never-submitted payment(s) &gt; 2h</h3>
          <p>Customer completed Razorpay payment but never triggered request creation. Likely closed the tab or lost connection.</p>
          <table style="border-collapse:collapse;border:1px solid #CBD5E8;">
            <thead><tr style="background:#F4F7FC"><th style="padding:6px 8px;text-align:left">Payment ID</th><th style="padding:6px 8px;text-align:left">Order ID</th><th style="padding:6px 8px;text-align:left">Amount</th><th style="padding:6px 8px;text-align:left">Verified at</th></tr></thead>
            <tbody>${formatRows(stuck)}</tbody>
          </table>
          <p><b>Action:</b> reach out to the customer with a recovery link or refund.</p>
        ` : ''}
      `
      try {
        await sendOpsAlert(
          `HataD reconciliation: ${orphans.length} orphan(s), ${stuck.length} stuck unused`,
          html,
        )
        results.alertSent = true
      } catch (e) {
        results.alertSent = false
        results.alertError = (e as Error).message
      }
    } else {
      results.alertSent = false
    }

    // 1. Delete truly stale unused verified payments (> 24h)
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
    const { error: payErr } = await supabaseAdmin
      .from('verified_payments')
      .delete()
      .eq('used', false)
      .lt('verified_at', oneDayAgo)
    results.stalePaymentsCleanup = payErr ? 'error' : 'done'

    // 2. Delete analytics events older than 90 days
    const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString()
    const { error: evtErr } = await supabaseAdmin
      .from('analytics_events')
      .delete()
      .lt('created_at', ninetyDaysAgo)
    results.oldEventsCleanup = evtErr ? 'error' : 'done'

    results.status = 'ok'
    results.timestamp = new Date().toISOString()
    return NextResponse.json(results)
  } catch (error) {
    console.error('Cron cleanup error:', error)
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 })
  }
}
