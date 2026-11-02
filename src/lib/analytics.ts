/**
 * The tracking plan, as types.
 *
 * Every event name and property shape in the signed-off plan lives here and
 * nowhere else. Mixpanel is case-sensitive and keeps the first type it sees
 * for a property forever, so `checkout_started` and `Checkout_Started` are two
 * events and one stray quoted number makes `amount_inr` a string that can
 * never be summed again. A typo here is a compile error instead.
 *
 * This is the same reason SOURCE_COUNT derives from SOURCE_CLUSTERS rather
 * than being typed as '30+': one definition, everything else reads from it.
 *
 * Client events dual-send — Supabase analytics_events (the system of record,
 * via the existing track()) and Mixpanel (for funnels and retention). Server
 * events go only to Mixpanel, via src/lib/mixpanel-server.ts; their system of
 * record is already the clearance_requests / verified_payments tables.
 */

import { track as trackSupabase } from './track'
import { mpTrack, mpIdentify, mpRegister, mpReset, type TrackProps } from './mixpanel'

/* ------------------------------------------------------------------ *
 * Client events
 * ------------------------------------------------------------------ */

export type ClientEvents = {
  /* --- Pre-launch. Reachable today; the only family the wall allows. --- */

  waitlist_joined: {
    /** 'email' | 'phone' — the kind only. Never the address or number. */
    contact_kind: 'email' | 'phone'
    /** The join form renders twice on the launch page. */
    slot: 'hero' | 'close'
    already_joined: boolean
    /** Omit when the API did not return one. Never send null. */
    queue_position?: number
    referral_source?: string
    /*
     * Also a super property (`locale`), and deliberately duplicated here. The
     * super property is current preference; this is the language they were
     * actually reading when they signed up, which is the question worth asking
     * later. It is also what the existing analytics_events rows carry.
     */
    lang: string
  }

  waitlist_signup_blocked: {
    slot: 'hero' | 'close'
    block_reason: 'honeypot'
    lang: string
  }

  /**
   * New in this plan. A rejected signup was previously invisible from both
   * sides: the person saw an error, and we recorded nothing at all.
   */
  waitlist_signup_failed: {
    slot: 'hero' | 'close'
    /** Mirrors ContactReject in waitlist-contact.ts, plus transport failures. */
    reject_reason:
      | 'empty'
      | 'unrecognised'
      | 'phone_prefix'
      | 'phone_fake'
      | 'email_shape'
      | 'email_disposable'
      | 'server_error'
      | 'network_error'
    lang: string
  }

  /**
   * `slot` is absent, not forgotten: the share handler sits outside the join
   * block that knows which of the two slots rendered it.
   */
  waitlist_referral_shared: {
    share_channel: 'clipboard'
    lang: string
  }

  /* --- Acquisition --- */

  /** Also registers entry_district, which is what makes district ROI answerable. */
  district_page_viewed: { district: string }

  /* --- Free risk preview --- */

  risk_check_started: {
    entry_method: 'geolocate' | 'manual_survey'
    district?: string
  }

  /* --- Account --- */

  sign_up_completed: { sign_up_method: 'google' | 'email_otp' }
  login_completed: { login_method: 'google' | 'email_otp' }

  /* --- Money path, browser side --- */

  clearance_property_submitted: {
    district: string
    taluk?: string
    document_count: number
  }

  checkout_started: { amount_inr: number; currency: 'INR' }
  checkout_abandoned: { amount_inr: number; seconds_on_step: number }

  /**
   * Kept from the existing instrumentation, but with a location property.
   * It fires from four places; without one, "which CTA works" is unanswerable.
   * Still one event rather than four, because it is one action — the plan's
   * "one event, one meaning" rule is about distinct actions, not placements.
   */
  cta_click: { cta_location: string; has_real_data?: boolean }
  sample_report_viewed: { source: string }
  sample_report_requested: { source: string }
  whatsapp_click: { source: string }
}

export type ClientEventName = keyof ClientEvents

/**
 * The one way client events are sent. Writes to Supabase and Mixpanel from a
 * single call so the two can never drift apart.
 *
 * `source` is kept for the Supabase row's existing shape — analytics_events
 * has carried it since the first landing page and queries depend on it.
 *
 * `supabaseOnly` is how the two destinations are allowed to differ, and the
 * only way they may. Supabase is ours and already holds the full property
 * record, so a survey number there is no new disclosure; sending the same
 * value to Mixpanel would put a specific plot of land — and with it, in
 * practice, a specific buyer — into a third party. Data minimisation is not
 * optional for the EU/California users this site has.
 */
export function trackEvent<K extends ClientEventName>(
  name: K,
  props: ClientEvents[K],
  source?: string,
  supabaseOnly?: Record<string, unknown>,
): void {
  const record = props as Record<string, unknown>
  trackSupabase(name, source, supabaseOnly ? { ...record, ...supabaseOnly } : record)
  mpTrack(name, record as TrackProps)
}

/* ------------------------------------------------------------------ *
 * Identity
 * ------------------------------------------------------------------ */

export type UserProfile = {
  $email?: string
  $name?: string
  sign_up_method?: 'google' | 'email_otp'
  /*
   * Never add the property form's applicantName, phone or surveyNo here. They
   * identify a person and a specific plot of land, and the plan is explicit
   * that they stay out of Mixpanel.
   */
}

/**
 * Bind this browser to a user. Must run on every login AND on every re-open
 * while already signed in — not just at signup — or the session silently
 * reverts to an anonymous id and the funnel breaks at the join.
 */
export function identifyUser(userId: string, profile?: UserProfile): void {
  mpIdentify(userId, profile as TrackProps | undefined)
}

/** Call on logout, always, or the next user of this browser inherits this one. */
export function resetUser(): void {
  mpReset()
}

/**
 * Sticky for the rest of the browser's history. Set when someone lands on a
 * district page so every later event — including a purchase weeks later —
 * still says which district page brought them in.
 */
export function registerEntryDistrict(district: string): void {
  if (!district) return
  mpRegister({ entry_district: district })
}

/* ------------------------------------------------------------------ *
 * Server events
 * ------------------------------------------------------------------ */

export type ServerEvents = {
  /**
   * The free preview's real outcome. Server-side because this is the hard part
   * of the product and the number that matters — how often TNGIS actually
   * returns something usable — must not be filtered by ad blockers.
   */
  risk_preview_returned: {
    outcome: 'complete' | 'partial' | 'empty' | 'error'
    has_patta: boolean
    has_fmb: boolean
    has_ulpin: boolean
    rural_urban?: 'rural' | 'urban'
    latency_ms: number
    district?: string
  }

  payment_completed: {
    /** Unquoted. From Razorpay's authoritative amount, never the client's. */
    amount_inr: number
    currency: 'INR'
    payment_method?: string
  }

  clearance_request_created: {
    district: string
    taluk?: string
    document_count: number
    /** Reads REPORT_TURNAROUND_HOURS. Never retype the number. */
    turnaround_hours: number
  }

  /** Operational — see the distinct_id note where this is emitted. */
  clearance_report_delivered: {
    district?: string
    actual_turnaround_hours: number
    was_delayed: boolean
  }

  /**
   * The Value Moment. The buyer finally reads what the records say.
   *
   * The plan asked for hours_since_delivery. clearance_requests has no
   * delivered-at column — the admin route sets status:'ready' and report_url
   * and nothing records when — so this measures from created_at instead:
   * payment to reading, which is the span the buyer actually experiences.
   * A true hours_since_delivery needs a `ready_at` column, which is a
   * Supabase dashboard change (there are no migrations in this repo).
   */
  clearance_report_downloaded: {
    district?: string
    hours_since_request?: number
  }
}

export type ServerEventName = keyof ServerEvents
