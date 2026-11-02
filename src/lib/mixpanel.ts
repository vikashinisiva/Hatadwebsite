/**
 * Mixpanel — the browser half of the analytics transport.
 *
 * Deliberately lazy. The SDK pulls in @mixpanel/rrweb and is well over 100 KB,
 * so it is dynamically imported on first use and stays out of the initial
 * bundle, the same way page.tsx keeps its below-fold sections out.
 *
 * Three config choices are load-bearing. Do not change them without reading
 * why they are here:
 *
 *   opt_out_tracking_by_default — HataD has EU/EEA and California users (NRI
 *     buyers of ancestral land). Nothing may be sent before Termly reports
 *     analytics consent, so the SDK starts opted out and grantConsent() flips
 *     it. Events fired before consent are DROPPED, not buffered. That is the
 *     point of the gate, not a bug in it.
 *
 *   record_sessions_percent: 0 — session replay records the DOM. On
 *     /clearance/onboarding that DOM holds the applicant's name, phone number
 *     and survey number. Never raise this without first masking that form.
 *
 *   autocapture: false — the tracking plan is 16 curated events. Autocapture
 *     would add untyped click and pageview events alongside them, and can pick
 *     up input values.
 *
 * Server-side events go through src/lib/mixpanel-server.ts instead. Both sides
 * key on the Supabase user id, so identity stays consistent across them.
 */

type Mixpanel = (typeof import('mixpanel-browser'))['default']

/** Mirrors Mixpanel's own property value union, minus the parts we never send. */
export type TrackProps = Record<string, string | number | boolean | string[] | undefined>

/*
 * Vercel sets NEXT_PUBLIC_VERCEL_ENV to production | preview | development.
 * Only a real production deploy may touch the production project; previews and
 * local dev both resolve to the dev project. NODE_ENV is no use here, because
 * Vercel builds previews with NODE_ENV=production.
 */
const VERCEL_ENV = process.env.NEXT_PUBLIC_VERCEL_ENV
const IS_PRODUCTION = VERCEL_ENV === 'production'

export const APP_ENV = IS_PRODUCTION ? 'production' : (VERCEL_ENV ?? 'development')

/*
 * Two tokens, never one. An unset token is not an error — it means "do not
 * send", which is the correct behaviour until a project has been identified as
 * dev or production. Every exported function below no-ops in that state.
 */
const TOKEN = IS_PRODUCTION
  ? process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_PROD
  : process.env.NEXT_PUBLIC_MIXPANEL_TOKEN_DEV

/** Whether Mixpanel is configured at all. False => every call here is a no-op. */
export const mixpanelConfigured = Boolean(TOKEN)

let sdk: Mixpanel | null = null
let loading: Promise<Mixpanel | null> | null = null
let consentGranted = false

/*
 * Events fired after consent but while the dynamic import is still in flight.
 * Bounded, because an unbounded queue on a page that never loads the SDK is a
 * slow memory leak rather than a feature.
 */
type Queued = { name: string; props: TrackProps }
const queue: Queued[] = []
const QUEUE_LIMIT = 50

function stripUndefined(props: TrackProps): Record<string, string | number | boolean | string[]> {
  /*
   * The tracking plan forbids sending null or "". Mixpanel keeps a property
   * once it has seen it, so a single null teaches the schema a bad type and
   * there is no way to un-teach it. Callers pass undefined to mean "omit".
   */
  const out: Record<string, string | number | boolean | string[]> = {}
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === '') continue
    out[key] = value
  }
  return out
}

function superProperties(): Record<string, string> {
  const props: Record<string, string> = { platform: 'web', app_env: APP_ENV }

  /*
   * Locale lives under 'hatad_lang' (see src/lib/i18n/context.tsx). Read
   * defensively: localStorage throws in a private window with site data
   * blocked, and an analytics helper must never be the reason a page dies.
   */
  try {
    const lang = window.localStorage.getItem('hatad_lang')
    if (lang === 'en' || lang === 'ta') props.locale = lang
  } catch {
    /* no locale property rather than no page */
  }

  return props
}

function load(): Promise<Mixpanel | null> {
  if (sdk) return Promise.resolve(sdk)
  if (loading) return loading

  loading = import('mixpanel-browser')
    .then((mod) => {
      const mp = mod.default
      mp.init(TOKEN as string, {
        /* See the header comment — all three are deliberate. */
        opt_out_tracking_by_default: true,
        record_sessions_percent: 0,
        autocapture: false,

        /* Needed for waitlist -> paid attribution to survive across visits. */
        persistence: 'localStorage',
        /* api_host left default; revisit only if a Mixpanel EU-residency
           project is created, which cannot be changed after the fact. */
        debug: !IS_PRODUCTION,
      })
      mp.register(superProperties())
      sdk = mp
      return mp
    })
    .catch(() => {
      /* Ad blockers routinely kill this import. Analytics degrade, app does not. */
      return null
    })

  return loading
}

/**
 * Called once Termly reports analytics consent. Until this runs, the SDK is
 * opted out and silently drops everything.
 */
export function grantConsent(): void {
  if (!mixpanelConfigured || consentGranted) return
  consentGranted = true

  void load().then((mp) => {
    if (!mp) return
    mp.opt_in_tracking()
    while (queue.length) {
      const next = queue.shift()
      if (next) mp.track(next.name, next.props)
    }
  })
}

/**
 * Called when Termly reports consent withdrawn, or reports no analytics
 * consent on a later visit.
 */
export function revokeConsent(): void {
  if (!mixpanelConfigured) return
  consentGranted = false
  queue.length = 0
  if (sdk) sdk.opt_out_tracking()
}

/**
 * Whether Termly has reported analytics consent in this browser.
 *
 * Exported so client code can pass it to the server routes that emit events
 * of their own. The server cannot read Termly's cookie, so it has to be told,
 * and src/lib/mixpanel-server.ts sends nothing unless it is told `true`.
 */
export function hasAnalyticsConsent(): boolean {
  return mixpanelConfigured && consentGranted
}

/**
 * This browser's Mixpanel id, for server routes that need to emit an event on
 * behalf of an anonymous visitor (the free risk preview) and must land it on
 * the same timeline as the client's own events rather than a second identity.
 *
 * Undefined until the SDK has loaded. Callers should omit the server event
 * rather than invent an id — a wrong distinct_id is worse than a missing event.
 */
export function getDistinctId(): string | undefined {
  if (!mixpanelConfigured || !consentGranted || !sdk) return undefined
  try {
    return sdk.get_distinct_id() as string | undefined
  } catch {
    return undefined
  }
}

/** Fire-and-forget. Drops everything until consent is granted. */
export function mpTrack(name: string, props: TrackProps = {}): void {
  if (!mixpanelConfigured || !consentGranted) return

  const clean = stripUndefined(props)
  if (sdk) {
    sdk.track(name, clean)
    return
  }
  if (queue.length < QUEUE_LIMIT) queue.push({ name, props: clean })
  void load()
}

/**
 * Bind events to a real user. Must run on every login AND on every re-open
 * while already signed in, or the session reverts to an anonymous id.
 *
 * Order matters and is enforced by the signature: identify first, then the
 * profile. A people.set() before identify can land on the anonymous profile.
 */
export function mpIdentify(userId: string, profile?: TrackProps): void {
  if (!mixpanelConfigured || !consentGranted || !userId) return

  void load().then((mp) => {
    if (!mp) return
    mp.identify(userId)
    if (profile) {
      const clean = stripUndefined(profile)
      if (Object.keys(clean).length) mp.people.set(clean)
    }
  })
}

/**
 * Call on logout, always. Without it the next person to use this browser
 * inherits the previous user's identity and their events merge together.
 */
export function mpReset(): void {
  if (!mixpanelConfigured) return
  queue.length = 0
  if (sdk) sdk.reset()
}

/**
 * Register a super property that should ride along on every later event in
 * this browser — used for entry_district, which is what makes "which districts
 * convert" answerable at all.
 */
export function mpRegister(props: TrackProps): void {
  if (!mixpanelConfigured || !consentGranted) return
  const clean = stripUndefined(props)
  if (!Object.keys(clean).length) return

  void load().then((mp) => {
    if (mp) mp.register(clean)
  })
}
