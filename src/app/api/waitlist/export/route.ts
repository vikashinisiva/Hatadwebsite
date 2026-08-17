import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

/**
 * Waitlist export, admin-only.
 *
 * Exists because the whole promise on the launch page is "one message the day we
 * open" — and nothing in this app can send a bulk mail. Rather than commit you
 * to a provider (Resend, SES, Mailchimp), this hands you the list as CSV so the
 * send can happen wherever you choose.
 *
 *   curl -H "Authorization: Bearer $ADMIN_PASSWORD" \
 *        https://www.hatad.in/api/waitlist/export -o waitlist.csv
 *
 * Reads BOTH sources: the `waitlist` table and the `analytics_events` rows the
 * API falls back to while that table does not exist. Exporting only the former
 * would silently drop every signup collected before the schema was created.
 */

function authorised(request: Request): boolean {
  const header = request.headers.get('authorization')
  if (!header?.startsWith('Bearer ')) return false
  const secret = process.env.ADMIN_PASSWORD
  return !!secret && header.slice(7) === secret
}

type Row = {
  contact: string
  kind: string
  source: string | null
  referral_code: string
  referred_by: string | null
  created_at: string
}

/** RFC 4180: quote everything, double any embedded quote. */
function csvCell(value: unknown): string {
  return `"${String(value ?? '').replace(/"/g, '""')}"`
}

export async function GET(request: Request) {
  if (!authorised(request)) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const rows: Row[] = []

  const { data: table } = await supabaseAdmin
    .from('waitlist')
    .select('contact, kind, source, referral_code, referred_by, created_at')
    .order('created_at', { ascending: true })

  if (table) rows.push(...(table as Row[]))

  // Fallback rows, written while `waitlist` was unavailable.
  const { data: events } = await supabaseAdmin
    .from('analytics_events')
    .select('meta, source, created_at')
    .eq('event', 'waitlist_signup')
    .order('created_at', { ascending: true })

  for (const e of events ?? []) {
    const meta = (e.meta ?? {}) as { contact?: string; kind?: string; referred_by?: string }
    if (!meta.contact) continue
    rows.push({
      contact: meta.contact,
      kind: meta.kind ?? '',
      source: e.source ?? null,
      referral_code: '',
      referred_by: meta.referred_by ?? null,
      created_at: e.created_at,
    })
  }

  // One person may appear in both sources; earliest signup wins.
  const seen = new Set<string>()
  const unique = rows
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .filter((r) => {
      const key = r.contact.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

  // `?format=json` feeds the ops screen; the default stays CSV so the plain
  // curl-to-a-file case keeps working unchanged.
  if (new URL(request.url).searchParams.get('format') === 'json') {
    const referralCounts = new Map<string, number>()
    for (const r of unique) {
      if (r.referred_by) {
        referralCounts.set(r.referred_by, (referralCounts.get(r.referred_by) ?? 0) + 1)
      }
    }
    return NextResponse.json(
      {
        total: unique.length,
        phones: unique.filter((r) => r.kind === 'phone').length,
        emails: unique.filter((r) => r.kind === 'email').length,
        rows: unique.map((r) => ({ ...r, referrals: referralCounts.get(r.referral_code) ?? 0 })),
      },
      { headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const header = ['contact', 'kind', 'source', 'referral_code', 'referred_by', 'created_at']
  const csv = [
    header.join(','),
    ...unique.map((r) => header.map((h) => csvCell(r[h as keyof Row])).join(',')),
  ].join('\r\n')

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="waitlist.csv"',
      'Cache-Control': 'no-store',
    },
  })
}
