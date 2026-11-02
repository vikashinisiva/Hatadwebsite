/**
 * Mixpanel — the server half of the analytics transport.
 *
 * Why the money path is tracked here and not in the browser: client-side
 * analytics loses 15-30% of events to ad blockers, and a dropped
 * payment_completed is a ₹3,599 order that silently never appears in the
 * funnel. Anything observable on the server is sent from the server.
 *
 * Uses the HTTP API over fetch rather than the `mixpanel` node package — one
 * fewer dependency, and it gives direct control over $insert_id, which is what
 * makes a retried webhook idempotent instead of a double-counted purchase.
 *
 * distinct_id is always the Supabase user id, exactly as src/lib/mixpanel.ts
 * uses it on the client, so an event pair that straddles the two halves still
 * resolves to one person.
 *
 * CONSENT: this module will not send a user-identified event unless the caller
 * passes consent: true. The server cannot see Termly's cookie, so it must be
 * told, and the default of "no" is the only safe default when the answer is
 * unknown. Callers that originate from a browser action pass the flag through
 * from the client. See the note on reportDelivered in src/lib/analytics.ts for
 * the one operational event that is not user-identified.
 */

import { randomUUID } from 'crypto'

const TRACK_ENDPOINT = 'https://api.mixpanel.com/track'
const ENGAGE_ENDPOINT = 'https://api.mixpanel.com/engage'

/*
 * VERCEL_ENV is production | preview | development. Previews and local dev both
 * resolve to the dev project; only a production deploy may reach production.
 */
const IS_PRODUCTION = process.env.VERCEL_ENV === 'production'

export const SERVER_APP_ENV = IS_PRODUCTION
  ? 'production'
  : (process.env.VERCEL_ENV ?? 'development')

/*
 * Server-only vars win, then the public ones. Same fallback shape as
 * createTransporter() in sendNotification.ts: explicit config if present,
 * otherwise the shared values, so a single token only has to be pasted once.
 */
const TOKEN = IS_PRODUCTION
  ? (process.env.MIXPANEL_TOKEN_PROD ?? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_PROD)
  : (process.env.MIXPANEL_TOKEN_DEV ?? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_DEV)

export const serverMixpanelConfigured = Boolean(TOKEN)

export type ServerProps = Record<string, string | number | boolean | string[] | undefined>

function stripUndefined(props: ServerProps): Record<string, string | number | boolean | string[]> {
  const out: Record<string, string | number | boolean | string[]> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }
  return out
}

type TrackArgs = {
  event: string
  /** Supabase user id for user events; a request id for operational ones. */
  distinctId: string
  props?: ServerProps
  /**
   * Must be explicitly true. Anything else and nothing is sent.
   * Pass the client's Termly analytics-consent state through for events that
   * begin as a browser action.
   */
  consent: boolean
  /**
   * Stable key for deduplication. Pass the payment id, request id or similar
   * so a retried handler cannot double-count. Defaults to a random uuid, which
   * dedupes nothing — always pass one for anything money-shaped.
   */
  insertId?: string
}

/**
 * Fire-and-forget by design: analytics must never fail a payment or a report
 * delivery. Every failure path here resolves quietly.
 */
export async function mpServerTrack({
  event,
  distinctId,
  props = {},
  consent,
  insertId,
}: TrackArgs): Promise<void> {
  if (!serverMixpanelConfigured || consent !== true || !distinctId) return

  const payload = [
    {
      event,
      properties: {
        ...stripUndefined(props),
        token: TOKEN as string,
        distinct_id: distinctId,
        time: Date.now(),
        $insert_id: insertId ?? randomUUID(),
        platform: 'web',
        app_env: SERVER_APP_ENV,
        /*
         * No `ip` key. Mixpanel geo-enriches from the IP it is given, and
         * forwarding it here would add location data nobody asked for to a
         * payment record. district already carries the geography we actually
         * want, from the form rather than from the network.
         */
      },
    },
  ]

  try {
    await fetch(TRACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
  } catch {
    /* Never let analytics break the caller. */
  }
}

/**
 * Set profile attributes on an identified user. Used for the waitlist bridge
 * (was_waitlisted / waitlist_joined_at), which is what lets waitlist -> paid
 * conversion be measured across devices instead of relying on one browser
 * keeping its cookie from now until launch.
 */
export async function mpServerSetProfile(
  distinctId: string,
  profile: ServerProps,
  consent: boolean,
): Promise<void> {
  if (!serverMixpanelConfigured || consent !== true || !distinctId) return

  const clean = stripUndefined(profile)
  if (!Object.keys(clean).length) return

  try {
    await fetch(ENGAGE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([
        { $token: TOKEN as string, $distinct_id: distinctId, $set: clean },
      ]),
    })
  } catch {
    /* Never let analytics break the caller. */
  }
}
