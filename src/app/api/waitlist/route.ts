import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { classifyContact } from '@/lib/waitlist-contact'
import { clientKey, rateLimit } from '@/lib/rate-limit'

/**
 * Waitlist capture with a referral queue.
 *
 * Primary target is the `waitlist` table. If that table does not exist the
 * signup still lands — it falls back to `analytics_events` and the response
 * simply omits `code`/`position`, so the UI shows the plain confirmation
 * instead of the referral state. A lost lead is worse than a missing feature.
 *
 * Required schema (Supabase dashboard — this repo has no migrations):
 *
 *   create table public.waitlist (
 *     id            uuid primary key default gen_random_uuid(),
 *     contact       text not null unique,
 *     kind          text not null check (kind in ('phone','email')),
 *     source        text,
 *     referral_code text not null unique,
 *     referred_by   text references public.waitlist(referral_code),
 *     created_at    timestamptz not null default now()
 *   );
 *   create index on public.waitlist (referred_by);
 *   alter table public.waitlist enable row level security;
 *   -- no policies: the service role bypasses RLS, nothing else may read it
 */

/** Each confirmed referral moves you this many places up the queue. */
const REFERRAL_BOOST = 3

/** No I/L/O/0/1 — these codes get read aloud and typed by hand. */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

function makeCode(length = 6): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length))
  return Array.from(bytes, (b) => CODE_ALPHABET[b % CODE_ALPHABET.length]).join('')
}

type WaitlistRow = { referral_code: string; created_at: string }

/** Position = people ahead of you, less the credit for anyone you brought. */
async function queuePosition(row: WaitlistRow): Promise<number> {
  const [{ count: ahead }, { count: referred }] = await Promise.all([
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', row.created_at),
    supabaseAdmin
      .from('waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('referred_by', row.referral_code),
  ])
  return Math.max(1, (ahead ?? 0) + 1 - (referred ?? 0) * REFERRAL_BOOST)
}

/*
 * Per source IP, per hour.
 *
 * Was 6, on the reasoning that a person signs up once. That reasoning fails on
 * the network this page is actually served over: Indian mobile carriers run
 * heavy CGNAT, and offices, colleges and apartment blocks all leave through a
 * single address. Six meant the seventh genuine signup in an hour from an
 * entire building was told "Too many attempts" — a self-inflicted loss on the
 * one page whose only job is capture.
 *
 * The real spam gates are per-contact and unaffected by this number:
 * classifyContact rejects fake digit patterns, non-mobile prefixes and
 * disposable domains, the honeypot catches form-fillers, and the unique
 * constraint on `contact` makes a repeat signup idempotent rather than a new
 * row. This is left only to stop one script hammering the endpoint.
 */
const SIGNUPS_PER_HOUR = 50

export async function POST(request: Request) {
  const limited = rateLimit(`waitlist:${clientKey(request)}`, SIGNUPS_PER_HOUR, 60 * 60 * 1000)
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Too many attempts. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
    )
  }

  let body: { kind?: string; value?: string; source?: string; ref?: string; dial?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  /*
   * Re-run the same classifier the client used. Client-side validation exists
   * for feedback; anything can POST here directly, so this is the real gate —
   * it rejects fake number patterns, non-mobile prefixes and throwaway domains.
   */
  const dial = typeof body.dial === 'string' && /^\+\d{1,4}$/.test(body.dial) ? body.dial : '+91'
  const result = classifyContact(String(body.value ?? ''), dial)
  if (!result.ok) {
    return NextResponse.json(
      { error: 'Enter a mobile number or an email address we can reach you on.' },
      { status: 400 },
    )
  }

  const kind = result.kind
  const contact = result.value
  const source = typeof body.source === 'string' ? body.source.slice(0, 64) : null
  /*
   * Shape-checked only — this says the string looks like a code, not that any
   * such code exists. See the 23503 branch below.
   *
   * The pattern is deliberately looser than CODE_ALPHABET, which omits I, L, O,
   * 0 and 1: a code that arrives with one of those in it is a mistyped or
   * mangled link, and the database is the right place to find that out.
   */
  let referredBy =
    typeof body.ref === 'string' && /^[A-Z2-9]{4,12}$/.test(body.ref) ? body.ref : null

  /* Three, not two: one attempt can now be spent dropping a bad referral code,
     which would otherwise leave nothing in hand for a genuine code collision. */
  for (let attempt = 0; attempt < 3; attempt++) {
    const { data, error } = await supabaseAdmin
      .from('waitlist')
      .insert({ contact, kind, source, referral_code: makeCode(), referred_by: referredBy })
      .select('referral_code, created_at')
      .single()

    if (!error && data) {
      return NextResponse.json({
        ok: true,
        code: data.referral_code,
        position: await queuePosition(data as WaitlistRow),
      })
    }

    if (error?.code === '23505') {
      // Either the contact is already on the list, or the code collided.
      const { data: existing } = await supabaseAdmin
        .from('waitlist')
        .select('referral_code, created_at')
        .eq('contact', contact)
        .maybeSingle()

      // Already signed up — hand back the same link rather than a new one.
      if (existing) {
        return NextResponse.json({
          ok: true,
          alreadyJoined: true,
          code: existing.referral_code,
          position: await queuePosition(existing as WaitlistRow),
        })
      }
      continue // code collision: try once more
    }

    /*
     * 23503 — foreign key violation: `referred_by` names a code that is not in
     * the table. A shared link that was truncated, mistyped, or whose owner has
     * since been deleted will do it.
     *
     * Without this the insert fell through to the fallback, so a perfectly good
     * signup landed in analytics_events instead of the waitlist, and came back
     * without a code or a position — the referral UI silently disappeared for
     * someone who had done nothing wrong. Drop the credit nobody can be given
     * and put them on the list properly.
     */
    if (error?.code === '23503' && referredBy !== null) {
      console.warn('Waitlist: unknown referral code, joining without it:', referredBy)
      referredBy = null
      continue
    }

    // Table missing or some other failure — stop retrying and fall through.
    if (error) return fallback(contact, kind as string, source, referredBy, error.message)
  }

  return NextResponse.json({ ok: true })
}

/** Never drop a signup because the table isn't provisioned yet. */
async function fallback(
  contact: string,
  kind: string,
  source: string | null,
  referredBy: string | null,
  reason: string,
) {
  const { error } = await supabaseAdmin.from('analytics_events').insert({
    event: 'waitlist_signup',
    source,
    meta: { contact, kind, referred_by: referredBy, fallback_reason: reason },
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Waitlist insert failed on both tables:', reason, error)
    return NextResponse.json(
      { error: "We couldn't save that just now. Please try again in a moment." },
      { status: 500 },
    )
  }

  console.warn('Waitlist table unavailable, wrote to analytics_events:', reason)
  // No code/position — the UI falls back to the plain confirmation.
  return NextResponse.json({ ok: true })
}
