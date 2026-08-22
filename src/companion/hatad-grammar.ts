/**
 * The grammar.
 *
 * We ended up with three independent axes — state (10), body (4), expression
 * (6) — which is 240 combinations and no rules. This file is the rules.
 *
 * The composition is deliberately not a 240-row lookup. It is two functions of
 * different things:
 *
 *   POSTURE  = what the ledger says about this source  -> state + expression
 *   BODY     = what kind of record this source is      -> shape
 *
 * A posture fixes state and expression, and normally *inherits* the body from
 * the source's own domain. Only where the body itself carries the meaning does
 * a posture override it — `notEstablishable` is always the stone, because "no
 * register records this at all" is a fact about land rather than about paper,
 * and `ready` is always the seal.
 *
 * That separation is the point. It means the face is derived from the ledger
 * rather than authored beside it, so it cannot drift from the data (D-7).
 */
import { HATAD_EXPRESSIONS } from './hatad-expressions'
import type { BotExpression } from './bot/expressions'

export type Domain = 'neutral' | 'paper' | 'land' | 'issued'

const EX: Record<string, BotExpression> = {}
HATAD_EXPRESSIONS.forEach((e) => { EX[e.id] = e.expr })

export interface Posture {
  id: string
  label: string
  /** the ledger condition this posture renders */
  when: string
  group: 'process' | 'outcome'
  state: string
  expression: string
  /** null = inherit the source's domain; a value = the body carries meaning */
  shape: Domain | null
  /** what a client-facing caption may say. Fact, absence, route — never law. */
  caption: string
  reqs: string[]
  /** 0-1, drawn dimmer when the source has not been reached */
  dim?: boolean
  /**
   * Carriage — how he holds himself, independent of his face. Luxo Jr. has no
   * face at all and reads perfectly, because a sunk posture is chastened and a
   * drawn-up one is alert. [drop, tilt]: drop -1 tall .. +1 sunk.
   */
  carry?: [number, number]
}

export const POSTURES: Posture[] = [
  // ---- process: what is happening right now -----------------------------
  {
    id: 'queued', label: 'Queued', group: 'process',
    carry: [0.25, 0] as [number, number],
    when: 'Not reached yet.',
    state: 'idle', expression: 'attending', shape: null,
    caption: 'Not opened yet',
    reqs: ['C-5'], dim: true
  },
  {
    id: 'reading', label: 'Reading', group: 'process',
    carry: [0.1, -0.22] as [number, number],
    when: 'Open on the desk right now.',
    // NOT 'thinking': that state has baseBody:false, so its three dots replace
    // the silhouette and the whole shape axis is discarded. Reading a deed and
    // reading the ground then look identical. A resting state keeps the body,
    // and the narrowed-slit `reading` eyes carry the activity instead.
    state: 'idle', expression: 'reading', shape: null,
    caption: 'Reading · {source}',
    reqs: ['C-5']
  },
  {
    id: 'blocked', label: 'Blocked', group: 'process',
    carry: [0.4, 0.3] as [number, number],
    when: 'We asked and the source did not answer.',
    state: 'exclaim', expression: 'unsettled', shape: 'neutral',
    caption: '{source} not responding · retry {time}',
    reqs: ['C-4', 'C-6', 'N-3']
  },
  {
    id: 'awaiting', label: 'Awaiting', group: 'process',
    carry: [0.7, 0] as [number, number],
    when: 'The case is stalled on the client, not on us.',
    state: 'sleep', expression: 'attending', shape: 'neutral',
    caption: 'Awaiting {thing}',
    reqs: ['C-6']
  },

  // ---- outcome: what the ledger says -------------------------------------
  {
    id: 'clear', label: 'Checked and Clear', group: 'outcome',
    carry: [0, 0] as [number, number],
    when: 'The search ran over a stated period and returned a real negative.',
    state: 'idle', expression: 'settled', shape: null,
    caption: '{source} · {period} · nil',
    reqs: ['Checked and Clear']
  },
  {
    id: 'shouldKnow', label: 'Should Know', group: 'outcome',
    carry: [-0.25, 0.3] as [number, number],
    when: 'Established. Changes what is being acquired, without threatening title.',
    state: 'wide', expression: 'crosschecking', shape: null,
    caption: '{fact}',
    reqs: ['O-21', 'O-18']
  },
  {
    id: 'mustClear', label: 'Must Clear', group: 'outcome',
    carry: [-0.6, 0] as [number, number],
    when: 'Established. To be resolved before proceeding.',
    // `alert` has baseBody:false — its leaning exclamation IS the silhouette, so
    // it cannot carry a body. Declared 'neutral' rather than 'inherit', because
    // claiming to inherit a shape the state discards is a lie the resolver would
    // repeat. A finding is about the record, not about what kind of record.
    state: 'alert', expression: 'unsettled', shape: 'neutral',
    caption: '{fact}. No {instrument} was found on record.',
    reqs: ['O-18', 'O-20', 'O-21']
  },
  {
    id: 'notEstablished', label: 'Not established', group: 'outcome',
    carry: [0.2, 0.28] as [number, number],
    when: 'The record exists, or may exist, and we did not obtain it.',
    // `scanning` (both eyes tilted the same way) reads as still looking, which
    // is what "the record exists and we did not obtain it" means. It also keeps
    // this distinct from notEstablishable, which C-4 requires.
    state: 'idle', expression: 'scanning', shape: null,
    caption: '{gap} · {office}, in person, {days} days',
    reqs: ['O-6', 'O-10', 'O-11']
  },
  {
    id: 'notEstablishable', label: 'Not establishable', group: 'outcome',
    carry: [0.35, 0] as [number, number],
    when: 'No register records this fact at all.',
    // the body carries this one: it is a fact about land, not about paper
    state: 'idle', expression: 'abstaining', shape: 'land',
    caption: '{fact} is not recorded by any register · requires {route}',
    reqs: ['O-10', 'C-4']
  },
  {
    id: 'ready', label: 'Report ready', group: 'outcome',
    carry: [-0.4, 0] as [number, number],
    when: 'The examination is complete and the report exists.',
    state: 'notify', expression: 'settled', shape: 'issued',
    caption: 'Examination report · records to {date}',
    reqs: ['O-3', 'O-4']
  }
]

export const POSTURE_BY_ID = new Map(POSTURES.map((p) => [p.id, p]))

export interface Resolved {
  state: string
  shape: Domain
  expression: BotExpression | null
  dim: boolean
  posture: Posture
}

/**
 * Resolve a posture against the domain of the source it is describing.
 * `domain` is a property of the SOURCE (a deed is paper, an FMB sketch is
 * land); the posture only overrides it when the body is the message.
 */
export function resolve(postureId: string, domain: Domain = 'neutral'): Resolved | null {
  const p = POSTURE_BY_ID.get(postureId)
  if (!p) return null
  return {
    state: p.state,
    shape: p.shape ?? domain,
    expression: EX[p.expression] ?? null,
    dim: !!p.dim,
    posture: p
  }
}

/** Which of the six families read as paper and which as land. */
export const FAMILY_DOMAIN: Domain[] = ['paper', 'land', 'land', 'paper', 'land', 'paper']
