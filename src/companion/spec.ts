/**
 * The HataD companion specification.
 *
 * These are OUR rules, deliberately narrower than what the engine allows. They
 * are written as data and checked by `validate()` so they are enforced rather
 * than remembered — the build fails if a new body or expression leaves the
 * envelope, which is the only way a house style survives contact with a
 * deadline.
 *
 * Run `npm run build` to check them.
 */
import { EYE_H, EYE_W } from './bot/face'
import { HATAD_SHAPES } from './hatad-shapes'
import { HATAD_EXPRESSIONS, NEW_EXPRESSIONS, MORE_EXPRESSIONS, ALL_EXPRESSIONS, EXPRESSION_BY_KEY } from './hatad-expressions'
import { POSTURES } from './hatad-grammar'
import { STATE_BY_ID } from './bot/states'

/* ------------------------------------------------------------------ tokens */

/** Straight from hatad.in's stylesheet — not eyeballed. */
export const TOKENS = {
  ink: '#0c1525',        // --color-text-primary
  paper: '#f4f7fc',      // --color-background
  surface: '#ffffff',
  raised: '#ebf0f8',
  border: '#cbd5e8',
  muted: '#7a8fad',
  blue: '#155dfc',       // --color-blue-600, and the notification dot
  warn: '#b75000',
  good: '#00976a'
} as const

export const TYPE = {
  sans: '"DM Sans", system-ui, sans-serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, monospace',
  serif: '"Playfair Display", Georgia, serif'
} as const

/* ------------------------------------------------------------------- rules */

export const RULES = {
  /** Smallest size he stays legible at. Below this, use a static mark. */
  minSize: 16,
  /** Corner placement footprint on a page. */
  defaultSize: 84,

  /**
   * Our eye envelope, as multiples of neutral.
   *
   * Widened from [0.95–1.25] x [0.45–1.40] x 24 deg: the first pass was so
   * conservative that six expressions all read as the same face with jitter.
   * Still narrower than the engine (0.8–2.7 / 0.3–1.5 / 80 deg), because the
   * extremes there are cartoon faces and we are not making one — but wide
   * enough that the postures are actually distinguishable at a glance.
   */
  eye: {
    width: [0.85, 1.55] as [number, number],   // engine: 0.8 – 2.7
    height: [0.30, 1.50] as [number, number],  // engine: 0.3 – 1.5
    tiltDeg: 45                                 // engine: 80
  },

  /** Head angle must stay inside what the runtime gaze controller produces. */
  gaze: { yawDeg: 16, pitchDeg: 13 },

  /** Bodies are stability shapes only. See `noTriangles` below. */
  body: { maxRadius: 1.05, minRadius: 0.55 },

  /** How long he may hold your gaze before looking away. */
  stareLimitMs: 5000
} as const

/**
 * Laws. Not preferences — each one traces to something.
 */
export const LAWS = [
  {
    id: 'no-mouth',
    rule: 'He has no mouth, and never gets one.',
    because:
      'A mouth asserts a feeling about a finding. O-18 forbids client-facing output from stating legal effect and O-21 says severity is risk grading, not opinion. Sanrio reached the same design from the other direction: Hello Kitty is mouthless so she reflects the viewer rather than telling them how to feel.'
  },
  {
    id: 'no-triangles',
    rule: 'No body is a triangle or a spike. Alarm is only ever a state.',
    because:
      'Shape language reads triangles as danger, pre-consciously and across cultures. A body is a permanent claim; we never make a permanent claim about someone’s land. Alarm must be transient, so it lives in `alert`, never in a silhouette.'
  },
  {
    id: 'no-all-clear',
    rule: 'There is no single "all clear" face.',
    because:
      'N-3 makes rendering a blank search result as a clean one a prohibited failure, and C-4 requires searched-and-nothing-found, not-covered and search-failed to render differently from each other.'
  },
  {
    id: 'epistemic-not-emotional',
    rule: 'Expressions describe how sure he is, never how he feels.',
    because:
      'An emoting face editorialises about a finding, quietly, in the one place nobody reviews. Ours are postures: reading, cross-checking, unsettled, abstaining, settled, attending.'
  },
  {
    id: 'derived-not-authored',
    rule: 'His face is resolved from a ledger condition. Nobody hand-picks one.',
    because:
      'D-7 separates observations, assertions and narrative so assertions can be re-derived. A face computed from the data cannot disagree with it.'
  },
  {
    id: 'earn-the-appearance',
    rule: 'He appears only where something is happening that the visitor would otherwise take on faith.',
    because:
      'In trust-heavy categories, friendliness and credibility pull against each other past a point. He is an instrument, and an instrument that is always on is wallpaper.'
  },
  {
    id: 'dismissible',
    rule: 'He can always be dismissed.',
    because: 'A character you cannot get rid of is a nag, and this is a page about losing your savings.'
  },
  {
    id: 'colour-is-never-alone',
    rule: 'No status is distinguished by colour alone.',
    because:
      'Shape reads the same across cultures; colour does not, and colour fails outright for colour-blind readers. Every status differs in form as well as hue.'
  }
] as const

/* --------------------------------------------------------------- validation */

export interface Violation {
  where: string
  problem: string
}

/** Check every authored asset against RULES. Returns [] when the system is clean. */
export function validate(): Violation[] {
  const out: Violation[] = []

  for (const s of HATAD_SHAPES) {
    const min = Math.min(...s.radii)
    const max = Math.max(...s.radii)
    if (max > RULES.body.maxRadius) {
      out.push({ where: `shape/${s.id}`, problem: `max radius ${max.toFixed(3)} > ${RULES.body.maxRadius}` })
    }
    if (min < RULES.body.minRadius) {
      out.push({ where: `shape/${s.id}`, problem: `min radius ${min.toFixed(3)} < ${RULES.body.minRadius}` })
    }
    // a spike is a large step between adjacent samples — the geometric form of
    // a triangle corner, and what `no-triangles` is really guarding against
    const step = Math.max(
      ...s.radii.map((r, i) => Math.abs(r - s.radii[(i + 1) % s.radii.length]!))
    )
    if (step > 0.08) {
      out.push({ where: `shape/${s.id}`, problem: `spike: adjacent step ${step.toFixed(3)} > 0.08 (see law no-triangles)` })
    }
  }

  // Envelope applies to what WE authored. Borrowed faces were measured off
  // bloub's reference and are not ours to re-proportion; they are governed
  // instead by the client-safety rule below.
  for (const e of [...HATAD_EXPRESSIONS, ...NEW_EXPRESSIONS, ...MORE_EXPRESSIONS]) {
    const g = e.expr.gaze
    if (Math.abs(g.yaw) > RULES.gaze.yawDeg) {
      out.push({ where: `expr/${e.id}`, problem: `yaw ${g.yaw} outside ±${RULES.gaze.yawDeg}` })
    }
    if (Math.abs(g.pitch) > RULES.gaze.pitchDeg) {
      out.push({ where: `expr/${e.id}`, problem: `pitch ${g.pitch} outside ±${RULES.gaze.pitchDeg}` })
    }
    e.expr.eyes.forEach((eye, i) => {
      const rw = eye.w / EYE_W
      const rh = eye.h / EYE_H
      if (rw < RULES.eye.width[0] || rw > RULES.eye.width[1]) {
        out.push({ where: `expr/${e.id}#${i}`, problem: `width ${rw.toFixed(2)}x outside ${RULES.eye.width.join('–')}` })
      }
      if (rh < RULES.eye.height[0] || rh > RULES.eye.height[1]) {
        out.push({ where: `expr/${e.id}#${i}`, problem: `height ${rh.toFixed(2)}x outside ${RULES.eye.height.join('–')}` })
      }
      if (Math.abs(eye.tilt ?? 0) > RULES.eye.tiltDeg) {
        out.push({ where: `expr/${e.id}#${i}`, problem: `tilt ${eye.tilt}° outside ±${RULES.eye.tiltDeg}` })
      }
    })
  }

  for (const p of POSTURES) {
    /**
     * A posture that inherits its body must use a state that can SHOW one.
     * States with `baseBody: false` are ones whose silhouette is the animation
     * (thinking's dots, alert's exclamation) — they discard the shape entirely.
     * Binding one to an inheriting posture silently deletes the shape axis, and
     * `reading` a deed then looks identical to `reading` the ground.
     */
    const st = STATE_BY_ID.get(p.state as never) as { baseBody?: boolean } | undefined
    if (p.shape === null && st && st.baseBody === false) {
      out.push({
        where: `posture/${p.id}`,
        problem: `inherits its body but state "${p.state}" has baseBody:false — the shape would be discarded. Use a resting state, or declare an explicit shape.`
      })
    }

    const expr = EXPRESSION_BY_KEY.get(p.expression)
    if (!expr) {
      out.push({ where: `posture/${p.id}`, problem: `unknown expression "${p.expression}"` })
    } else if (expr.use !== 'client') {
      // THE rule. Every posture is client-facing, so binding a brand or
      // internal face to one would put a feeling next to a finding.
      out.push({
        where: `posture/${p.id}`,
        problem: `binds "${p.expression}" which is tagged ${expr.use} — client-facing postures may only use client expressions (law: epistemic-not-emotional)`
      })
    }
    if (!p.reqs.length) {
      out.push({ where: `posture/${p.id}`, problem: 'no requirement cited — every posture must trace to one' })
    }
  }

  return out
}

export const COUNTS = {
  bodies: HATAD_SHAPES.length,
  expressions: ALL_EXPRESSIONS.length,
  client: ALL_EXPRESSIONS.filter((e) => e.use === 'client').length,
  brand: ALL_EXPRESSIONS.filter((e) => e.use === 'brand').length,
  internal: ALL_EXPRESSIONS.filter((e) => e.use === 'internal').length,
  ours: HATAD_EXPRESSIONS.length + NEW_EXPRESSIONS.length + MORE_EXPRESSIONS.length,
  postures: POSTURES.length,
  laws: LAWS.length
}
