/**
 * Contact parsing for the launch waitlist.
 *
 * Deliberately separate from EMAIL_REGEX / PHONE_REGEX in constants.ts: those
 * are shared with the clearance checkout, and tightening them there could start
 * rejecting people mid-payment. This is stricter and only the waitlist uses it.
 *
 * Shared by the client (for instant feedback) and the API route (which must
 * never trust the client and re-runs the same checks).
 */

export type ContactKind = 'phone' | 'email'

export type ContactReject =
  | 'empty'
  | 'unrecognised'
  | 'phone_prefix'
  | 'phone_fake'
  | 'email_shape'
  | 'email_disposable'

export type ContactResult =
  | { ok: true; kind: ContactKind; value: string }
  | { ok: false; reason: ContactReject }

/*
 * A short list of the throwaway providers that actually show up, not an
 * exhaustive one — that is an arms race and not worth fighting on a waitlist.
 * The aim is to stop casual junk, not to be airtight.
 */
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  'yopmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  '10minutemail.com',
  'tempmail.com',
  'temp-mail.org',
  'throwawaymail.com',
  'trashmail.com',
  'getnada.com',
  'dispostable.com',
  'maildrop.cc',
  'fakeinbox.com',
  'mailnesia.com',
])

/* Local part and domain, at least one dot, TLD of two or more letters. Rejects
   `a@b.c` and `foo@bar` which the shared EMAIL_REGEX lets through. */
const EMAIL_SHAPE = /^[^\s@]{1,64}@[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i

/** Indian mobile numbers begin 6, 7, 8 or 9. Landlines are not accepted here. */
const INDIAN_MOBILE = /^[6-9]\d{9}$/

/** 9999999999, 1234567890, 9876543210 — typed to get past a form, not to be called.
    Length-agnostic so it still catches short non-Indian numbers. */
function isFakePattern(digits: string): boolean {
  if (digits.length < 6) return false
  if (/^(\d)\1+$/.test(digits)) return true // all one digit

  let ascending = true
  let descending = true
  for (let i = 1; i < digits.length; i++) {
    const step = digits.charCodeAt(i) - digits.charCodeAt(i - 1)
    if (step !== 1) ascending = false
    if (step !== -1) descending = false
  }
  return ascending || descending
}

/**
 * Decides phone vs email on the presence of `@` — they share no characters
 * worth disambiguating, so one regex for both would only be worse.
 *
 * `dial` is the country code the user picked. Indian numbers get the strict
 * treatment (mobile series, fake-pattern rejection); other countries only get a
 * length sanity check, because per-country mobile rules are a rabbit hole and
 * the diaspora is a small slice of the list.
 *
 * Phone numbers come back in E.164 (`+919876543210`) so the unique constraint
 * cannot be fooled by the same person in two different formats.
 */
export function classifyContact(raw: string, dial = '+91'): ContactResult {
  const trimmed = raw.trim()
  if (!trimmed) return { ok: false, reason: 'empty' }

  if (trimmed.includes('@')) {
    const value = trimmed.toLowerCase()
    if (value.length > 254 || value.includes('..') || !EMAIL_SHAPE.test(value)) {
      return { ok: false, reason: 'email_shape' }
    }
    const domain = value.slice(value.lastIndexOf('@') + 1)
    if (DISPOSABLE_DOMAINS.has(domain)) {
      return { ok: false, reason: 'email_disposable' }
    }
    return { ok: true, kind: 'email', value }
  }

  const digits = trimmed.replace(/\D/g, '')

  if (dial === '+91') {
    // Accept what people actually type: +91 81226 42341, 081226-42341, 8122642341.
    const local =
      digits.length === 12 && digits.startsWith('91')
        ? digits.slice(2)
        : digits.length === 11 && digits.startsWith('0')
          ? digits.slice(1)
          : digits

    if (local.length !== 10) return { ok: false, reason: 'unrecognised' }
    if (!INDIAN_MOBILE.test(local)) return { ok: false, reason: 'phone_prefix' }
    if (isFakePattern(local)) return { ok: false, reason: 'phone_fake' }

    return { ok: true, kind: 'phone', value: `+91${local}` }
  }

  // Everything else: E.164 allows 4–15 digits total including the country code.
  const local = digits.replace(new RegExp(`^${dial.slice(1)}`), '')
  if (local.length < 6 || local.length > 13) return { ok: false, reason: 'unrecognised' }
  if (isFakePattern(local.slice(0, 10))) return { ok: false, reason: 'phone_fake' }

  return { ok: true, kind: 'phone', value: `${dial}${local}` }
}
