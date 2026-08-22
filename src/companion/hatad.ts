/**
 * The HataD companion — public API.
 *
 * This is the only file a product engineer needs. It hides the engine, applies
 * HataD's tokens by default, and exposes one verb: tell him what the ledger
 * says and he resolves the rest.
 *
 *   import { createCompanion } from '@hatad/companion'
 *
 *   const bot = createCompanion(el)
 *   bot.show('reading', { domain: 'paper', caption: 'Revenue Department' })
 *
 * Nothing here asks you to pick a state, a body or an expression. Those are
 * derived from the posture and the source, because a face that can be
 * hand-picked is a face that can disagree with the data (law: derived-not-authored).
 */
import { mountBot, type BotOptions } from './entry'
import { resolve, POSTURES, type Domain } from './hatad-grammar'
import { TOKENS, RULES, LAWS, validate, COUNTS } from './spec'
import { YAW_MAX, PITCH_MAX } from './gaze'

export type PostureId = (typeof POSTURES)[number]['id']

export interface ShowOptions {
  /** what kind of record the source is; the body is inherited from this */
  domain?: Domain
  /** client-facing caption. Fact, absence, route — never law. */
  caption?: string
}

export interface CompanionOptions extends Omit<BotOptions, 'ink' | 'paper'> {
  ink?: string
  paper?: string
  /** follow the pointer, break off after RULES.stareLimitMs. Default true. */
  gaze?: boolean
  /** called whenever the caption changes, for an aria-live region */
  onCaption?: (text: string) => void
  /*
   * Something for him to watch, in screen coordinates, instead of the pointer.
   *
   * Polled by the gaze clock rather than passed once, because the interesting
   * targets move: the thing this exists for is the parcel under the launch
   * page's map, which is reprojected on every frame of a flight. Return null
   * to hand him back to the pointer.
   *
   * A watched target is exempt from the stare limit. That rule is about not
   * holding eye contact with a PERSON for five seconds; land does not mind
   * being looked at, and an instrument that keeps glancing away from the thing
   * it is examining is telling the reader it is not really working.
   */
  target?: () => { x: number; y: number } | null
}

export function createCompanion(host: HTMLElement, opts: CompanionOptions = {}) {
  const reduced =
    typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

  const bot = mountBot(host, {
    size: opts.size ?? RULES.defaultSize,
    ink: opts.ink ?? TOKENS.ink,
    paper: opts.paper ?? TOKENS.paper,
    state: opts.state
  })

  let caption = ''
  let posture: PostureId | null = null

  /** Tell him what the ledger says. Everything else follows. */
  function show(id: PostureId, o: ShowOptions = {}) {
    const r = resolve(id, o.domain ?? 'neutral')
    if (!r) throw new Error(`unknown posture "${id}" — see POSTURES`)
    posture = id
    // setPosture applies state, body, expression AND carriage together
    bot.setPosture(r)
    if (o.caption !== undefined && o.caption !== caption) {
      caption = o.caption
      opts.onCaption?.(caption)
    }
  }

  /* ---- gaze: smooth tracking, and he stops staring ---- */
  let mx = 0
  let my = 0
  let seen = false
  let lastMove = 0
  let lockedSince = 0
  let awayUntil = 0
  let timer = 0
  let onMove: ((e: PointerEvent) => void) | null = null
  /** Restarts the gaze clock after `pause`. Null when gaze is off entirely. */
  let startGaze: (() => void) | null = null
  /*
   * Where he looks while nobody is moving the pointer, and until when.
   *
   * HELD, not re-rolled. This used to pick a fresh random point on every tick
   * — a new target every 70ms — while the engine takes LOOK_MORPH (240ms) to
   * travel to one. He therefore never completed a move: he got about a third
   * of the way, was sent somewhere else, and the result read as vibration
   * rather than as looking around. It never showed up in the prototype
   * because there you are moving the mouse, so `quiet` is false and he is
   * locked to the cursor; it is the reader who sits still that sees it.
   *
   * Holding each target for about a second lets the morph finish and settle
   * before the next one, which is what "breaks off and comes back" meant.
   */
  let wanderUntil = 0
  let wanderX = 0
  let wanderY = 0

  if (opts.gaze !== false && !reduced && typeof window !== 'undefined') {
    onMove = (e: PointerEvent) => {
      seen = true
      lastMove = performance.now()
      mx = e.clientX
      my = e.clientY
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    const step = () => {
      const now = performance.now()
      const r = bot.svg.getBoundingClientRect()
      if (!r.width) return

      /* A declared target outranks the pointer, and outranks the wander. */
      const watched = opts.target?.() ?? null

      // Too long and too short are both uneasy, so he breaks off and comes back
      let tx = mx
      let ty = my
      const quiet = !watched && (!seen || now - lastMove > 2600)
      if (watched) {
        lockedSince = 0
        wanderUntil = 0
        tx = watched.x
        ty = watched.y
      } else if (quiet || now < awayUntil) {
        lockedSince = 0
        if (now >= wanderUntil) {
          wanderUntil = now + 900 + Math.random() * 700
          wanderX = r.left + r.width / 2 + (Math.random() - 0.5) * 420
          wanderY = r.top + r.height / 2 + (Math.random() - 0.5) * 280
        }
        tx = wanderX
        ty = wanderY
      } else {
        /* Cleared so that the moment he is left alone again he chooses a new
           place to look, rather than resuming a stale one. */
        wanderUntil = 0
        if (!lockedSince) lockedSince = now
        if (now - lockedSince > RULES.stareLimitMs) {
          awayUntil = now + 900 + Math.random() * 800
          lockedSince = 0
          return
        }
      }
      const nx = Math.max(-1, Math.min(1, (tx - (r.left + r.width / 2)) / (window.innerWidth / 2)))
      const ny = Math.max(-1, Math.min(1, (ty - (r.top + r.height / 2)) / (window.innerHeight / 2)))
      bot.setLook({
        yaw: nx * YAW_MAX,
        pitch: -ny * PITCH_MAX,
        mix: 1,
        spin: 0,
        /* Watching something is the opposite of having nothing to look at, so
           the idle drift is off whenever a target is being tracked. */
        wander: watched || seen ? 0 : 1
      })
    }

    startGaze = () => {
      if (!timer) timer = window.setInterval(step, 70)
    }
    startGaze()
  }

  return {
    show,
    /** the raw adapter, for the rare thing `show` does not cover */
    bot,
    svg: bot.svg,
    get posture() {
      return posture
    },
    get caption() {
      return caption
    },
    /*
     * Suspends the gaze clock as well as the frame loop.
     *
     * `bot.pause` only leaves the shared ticker. The interval above was
     * cleared solely on destroy, so a paused companion went on calling
     * getBoundingClientRect fourteen times a second for the life of the page
     * — including the entire time he is off screen, which on the launch page
     * is everything above the fold. A forced layout read at 14Hz for a thing
     * nobody can see is not a cost worth carrying.
     */
    pause() {
      bot.pause()
      if (timer) {
        clearInterval(timer)
        timer = 0
      }
    },
    resume() {
      bot.resume()
      startGaze?.()
    },
    destroy() {
      if (timer) clearInterval(timer)
      if (onMove) window.removeEventListener('pointermove', onMove)
      bot.destroy()
    }
  }
}

export type Companion = ReturnType<typeof createCompanion>

/**
 * Map a ledger row to a posture. This is the seam between the data and the
 * face — the only place that decides, and the place to change when the ledger
 * schema does.
 */
export interface LedgerRow {
  /** has the source been opened yet */
  reached?: boolean
  /** did the retrieval succeed */
  retrieved?: boolean
  /** why it failed, if it did */
  failure?: 'no-response' | 'declined' | null
  /** EX_FindingStatus */
  status?: 'established' | 'notEstablishedByExamination' | 'notEstablishableFromRecords' | null
  /** severity from the taxonomy, never assigned per case (D-3) */
  severity?: 'MustClear' | 'ShouldKnow' | 'CheckedAndClear' | null
  /** case-level */
  reportReady?: boolean
  awaitingClient?: boolean
}

export function postureFor(row: LedgerRow): PostureId {
  if (row.reportReady) return 'ready'
  if (row.awaitingClient) return 'awaiting'
  if (row.reached === false) return 'queued'
  if (row.failure) return 'blocked'
  if (row.retrieved === false) return 'reading'

  switch (row.status) {
    case 'notEstablishableFromRecords':
      return 'notEstablishable'
    case 'notEstablishedByExamination':
      return 'notEstablished'
    case 'established':
      return row.severity === 'MustClear'
        ? 'mustClear'
        : row.severity === 'ShouldKnow'
          ? 'shouldKnow'
          : 'clear'
    default:
      return 'reading'
  }
}

/**
 * Lower-level surface. `createCompanion` is the API to build against; these are
 * re-exported because the prototype pages drive the engine directly, and
 * because occasionally you need a bot that is not posture-driven.
 */
export { mountBot } from './entry'
export { YAW_MAX, PITCH_MAX, lookTarget } from './gaze'
export { NEUTRAL } from './hatad-expressions'

export { TOKENS, TYPE, RULES, LAWS, validate, COUNTS } from './spec'
export { POSTURES, POSTURE_BY_ID, resolve as resolvePosture, FAMILY_DOMAIN } from './hatad-grammar'
export { HATAD_SHAPES } from './hatad-shapes'
export {
  HATAD_EXPRESSIONS, NEW_EXPRESSIONS, MORE_EXPRESSIONS, BLOUB_EXPRESSIONS,
  ALL_EXPRESSIONS, EXPRESSION_BY_KEY
} from './hatad-expressions'
export type { ExpressionUse, HataDExpression } from './hatad-expressions'
export type { Domain, Posture, Resolved } from './hatad-grammar'
