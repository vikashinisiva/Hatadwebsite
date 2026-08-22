/**
 * HataD expressions.
 *
 * bloub ships sixteen: happy, hilarious, angry, sad, scared, proud, shy…
 * They are *emotions*, and almost none of them are usable here. A character
 * that looks sad or angry about a parcel is characterising the finding, and
 * O-18 forbids client-facing output from stating legal effect while O-21 says
 * severity is risk grading, not opinion. An emoting face editorialises.
 *
 * So ours are **epistemic postures**, not moods: how sure he is of what he is
 * reading, never how he feels about it. Every one below maps to a state the
 * standard already names.
 *
 * The face is two capsules, so there are only four levers (per the engine):
 * head orientation, the gap between the eyes, each eye's proportions, and each
 * eye's own tilt. Mirrored tilts are the expressive ones — tops converging or
 * diverging. Envelope: width 0.8–2.7x neutral, height 0.3–1.5x, tilt to ±80°.
 */
import { EYE_H, EYE_SPLIT, EYE_W, REST_GAZE } from './bot/face'
import { EXPRESSIONS as BLOUB } from './bot/expressions'
import type { BotExpression } from './bot/expressions'

type Eye = { w: number; h: number; tilt: number; open: number }

const eye = (w: number, h: number, tilt = 0, open = 1): Eye => ({ w, h, tilt, open })
/** Both eyes alike; `tilt` is mirrored, so the tops converge or diverge. */
const pair = (w: number, h: number, tilt = 0, open = 1): [Eye, Eye] => [
  eye(w, h, tilt, open),
  eye(w, h, -tilt, open)
]

/**
 * Where an expression may be used.
 *
 *   client   — may appear next to a finding. Epistemic only: it says how sure he
 *              is, never how he feels, because a feeling about a parcel is a
 *              characterisation of it (O-18, O-21).
 *   internal — the workbench and other analyst-facing surfaces. No client sees it.
 *   brand    — marketing, social, 404s, empty states. Nothing is asserted there,
 *              so he may be as expressive as he likes.
 *
 * The build enforces this: a client-facing posture cannot bind a non-client
 * expression. That is what lets us keep the whole emotional range without it
 * ever landing beside someone's land.
 */
export type ExpressionUse = 'client' | 'internal' | 'brand'

export interface HataDExpression {
  id: string
  label: string
  use: ExpressionUse
  /** the state in our own vocabulary this posture belongs to */
  when: string
  /** why it is drawn this way */
  why: string
  expr: BotExpression
}

export const HATAD_EXPRESSIONS: HataDExpression[] = [
  {
    id: 'reading',
    use: 'client',
    label: 'Reading',
    when: 'Working through a register, a deed, a court file.',
    why: 'Lowered and drawn inward, but still open — attention on a page, not strain. Reading is the top of a ramp that runs reading → narrowing → squinting; it was authored at 0.138 high, narrower than both of them, which left the ramp inverted and this face indistinguishable from a squint (check-faces measured them 0.141 apart).',
    expr: {
      id: 'reading' as BotExpression['id'],
      gaze: { yaw: 0, pitch: -11, roll: -5 },
      split: 12.4,
      eyes: pair(0.222, 0.344, 10)
    }
  },
  {
    id: 'crosschecking',
    use: 'client',
    label: 'Cross-checking',
    when: 'Two sources disagree, and he is holding both.',
    why: 'The only deliberately asymmetric one. One eye narrows while the other stays open — the closest a face without eyebrows gets to raising one. Doubt is the product, so this is the posture that should feel most like ours.',
    expr: {
      id: 'crosschecking' as BotExpression['id'],
      gaze: { yaw: 9, pitch: 2, roll: -14 },
      split: 18.6,
      eyes: [eye(0.246, 0.132, -38), eye(0.192, 0.598, 9)]
    }
  },
  {
    id: 'unsettled',
    use: 'client',
    label: 'Unsettled',
    when: 'Something on the record does not reconcile.',
    why: 'Narrowed with the tops tilted slightly apart. Diverging reads as concern; converging would read as anger, which is a judgement we are not entitled to make.',
    expr: {
      id: 'unsettled' as BotExpression['id'],
      gaze: { yaw: 0, pitch: -4, roll: 0 },
      split: 17.4,
      eyes: pair(0.252, 0.164, -27)
    }
  },
  {
    id: 'abstaining',
    use: 'client',
    label: 'Abstaining',
    when: 'Not established. He does not know, and says so.',
    why: 'Wide, level, untilted, head back a fraction. Frank rather than alarmed — V-4 asks us to abstain hard, and abstention should look like candour, not like worry.',
    expr: {
      id: 'abstaining' as BotExpression['id'],
      gaze: { yaw: 0, pitch: 9, roll: -10 },
      split: 21.4,
      eyes: pair(0.222, 0.604, 0)
    }
  },
  {
    id: 'settled',
    use: 'client',
    label: 'Settled',
    when: 'The check ran and closed. Checked and Clear.',
    why: 'Slightly shorter than neutral, level, no tilt: released tension. Deliberately not a happy face — a clean result is a fact, not good news to celebrate.',
    expr: {
      id: 'settled' as BotExpression['id'],
      gaze: { yaw: 0, pitch: 0, roll: -4 },
      split: 13.8,
      eyes: pair(0.192, 0.330, 0)
    }
  },
  {
    id: 'attending',
    use: 'client',
    label: 'Attending',
    when: 'Waiting on the client. The case is stalled on you.',
    why: 'Taller than neutral with the head lifted toward the viewer. Patient and available, without the pleading quality of wide eyes.',
    expr: {
      id: 'attending' as BotExpression['id'],
      gaze: { yaw: 0, pitch: 11, roll: -8 },
      split: 15.4,
      eyes: pair(0.206, 0.548, 0)
    }
  }
]

/**
 * bloub's neutral, kept as the control — but with the head brought to centre so
 * the comparison is purely about eye geometry. Their REST_GAZE points the head
 * at their own left-hand panel, which is a layout decision, not an expression.
 */
export const NEUTRAL: BotExpression = {
  id: 'neutre' as BotExpression['id'],
  gaze: { yaw: 0, pitch: 0, roll: REST_GAZE.roll },
  split: EYE_SPLIT,
  eyes: pair(EYE_W, EYE_H, 0)
}

/* ==========================================================================
 * NEW — ours, beyond the first six.
 *
 * Four levers only: head angle, the gap between the eyes, each eye's
 * proportions, each eye's own tilt. `open` below 1 gives a heavy lid, which is
 * the one thing the first six never used.
 * ========================================================================== */

export const NEW_EXPRESSIONS: HataDExpression[] = [
  {
    id: 'scanning',
    use: 'client',
    label: 'Scanning',
    when: 'Sweeping a page rather than reading a line.',
    why: 'Both eyes tilt the SAME way instead of mirroring. Mirrored tilts read as emotion; parallel tilts read as a glance travelling across something. Elongated on purpose — tilt is invisible on a round eye, and these were authored at 0.236x0.206, near enough to a circle that the 31 degrees did nothing at all.',
    expr: { id: 'scanning' as BotExpression['id'], gaze: { yaw: -9, pitch: -6, roll: -12 }, split: 19.6,
            eyes: [eye(0.196, 0.392, 31), eye(0.196, 0.392, 31)] }
  },
  {
    id: 'comparing',
    use: 'client',
    label: 'Comparing',
    when: 'Two records side by side, weighing one against the other.',
    why: 'Eyes at different heights rather than different widths. Vertical asymmetry reads as looking at two things at once, where horizontal asymmetry reads as a raised brow.',
    expr: { id: 'comparing' as BotExpression['id'], gaze: { yaw: 3, pitch: -1, roll: -7 }, split: 17.2,
            eyes: [eye(0.198, 0.578, -6), eye(0.240, 0.150, 11)] }
  },
  {
    id: 'certain',
    use: 'client',
    label: 'Certain',
    when: 'Highest evidence tier. Stated without hedging (O-14).',
    why: 'Level, tight gap, no tilt, medium height. Nothing about it is doing anything — which is the point. O-14 says strength where earned, and uniform hedging is a defect.',
    expr: { id: 'certain' as BotExpression['id'], gaze: { yaw: 0, pitch: 2, roll: -5 }, split: 12.2,
            eyes: pair(0.200, 0.430, 0) }
  },
  {
    id: 'doubting',
    use: 'client',
    label: 'Doubting',
    when: 'Something is off but not yet a finding.',
    why: 'A milder cross-check: slight asymmetry rather than one eye shut. The posture for a suspicion we have not earned the right to state.',
    expr: { id: 'doubting' as BotExpression['id'], gaze: { yaw: 6, pitch: 0, roll: -11 }, split: 16.8,
            eyes: [eye(0.248, 0.152, -26), eye(0.190, 0.512, 5)] }
  },
  {
    id: 'weary',
    use: 'client',
    label: 'Weary',
    when: 'Day three of a case. Still going.',
    why: 'Heavy lids via `open`, which none of the first six touched. Honest about a long case without complaining about it.',
    expr: { id: 'weary' as BotExpression['id'], gaze: { yaw: 0, pitch: -9, roll: -3 }, split: 15.2,
            eyes: pair(0.202, 0.512, -11, 0.40) }
  },
  {
    id: 'braced',
    use: 'client',
    label: 'Braced',
    when: 'About to deliver something the client will not want.',
    why: 'Narrow, wide gap, dead level. Not sad and not alarmed — steady. The face of someone who has checked twice before saying it.',
    expr: { id: 'braced' as BotExpression['id'], gaze: { yaw: 0, pitch: 0, roll: 0 }, split: 22.2,
            eyes: pair(0.262, 0.150, 0) }
  },
  {
    id: 'pleased',
    use: 'brand',
    label: 'Pleased',
    when: 'Marketing, social, a completed sign-up. Never beside a finding.',
    why: 'Warm: tall, slight upward tilt, head lifted. Tagged `brand` because pleasure about a parcel is a characterisation of it.',
    expr: { id: 'pleased' as BotExpression['id'], gaze: { yaw: 0, pitch: 11, roll: -12 }, split: 14.6,
            eyes: pair(0.240, 0.596, 21) }
  },
  {
    id: 'relieved',
    use: 'brand',
    label: 'Relieved',
    when: 'A long case closed. Internal celebration, external never.',
    why: 'Lids half down but eyes tall — tension leaving rather than absent. Reads as a breath out.',
    expr: { id: 'relieved' as BotExpression['id'], gaze: { yaw: 0, pitch: 6, roll: -8 }, split: 16.2,
            eyes: pair(0.208, 0.556, 9, 0.58) }
  }
]

/* ==========================================================================
 * bloub's sixteen, wrapped with English labels and a use tag.
 *
 * They are emotions, so almost all are `brand` or `internal`. `attentif`,
 * `mefiant`, `confus`, `curieux`, `blase` and `somnolent` describe attention or
 * doubt rather than a feeling about a subject, so those are client-safe.
 * ========================================================================== */

const BLOUB_META: Record<string, [string, ExpressionUse, string]> = {
  neutre:    ['Neutral',     'client',   'The measured rest pose from the reference video.'],
  attentif:  ['Attentive',   'client',   'Leaning in. Attention, not enthusiasm.'],
  surpris:   ['Surprised',   'brand',    'A reaction, which beside a finding is a verdict.'],
  excite:    ['Excited',     'brand',    'Marketing only.'],
  heureux:   ['Happy',       'brand',    'Happiness about a parcel characterises it.'],
  hilare:    ['Laughing',    'brand',    'Social and nothing else.'],
  colere:    ['Angry',       'brand',    'Never beside a record. Anger is a judgement.'],
  triste:    ['Sad',         'brand',    'Sadness about land is an opinion about its value.'],
  effraye:   ['Scared',      'brand',    'Alarm is a state, never a face, in client output.'],
  mefiant:   ['Suspicious',  'client',   'Doubt directed at evidence. Arguably our most on-brand borrowed face.'],
  confus:    ['Confused',    'client',   'The records do not agree with each other.'],
  curieux:   ['Curious',     'client',   'Following a thread.'],
  fier:      ['Proud',       'brand',    'Pride in our own work, not in a finding.'],
  timide:    ['Shy',         'brand',    'No product use; kept for completeness.'],
  blase:     ['Unimpressed', 'internal', 'The workbench, and the third identical defect this morning.'],
  somnolent: ['Drowsy',      'client',   'Dormant, waiting. Pairs with the sleep state.']
}

/**
 * Re-authored borrowed faces.
 *
 * Four of bloub's sixteen — happy, laughing, angry, proud — are geometrically
 * the same face: wide, short, tops converging, differing only by 6-16 degrees
 * of tilt. In their picker a label sits under each one; on their own they are
 * indistinguishable. Without a mouth or brows, "tops converge" cannot carry
 * four separate meanings, so these use different mechanisms instead:
 *
 *   happy     tall converging arcs  — height is what makes a curve read as a curve
 *   laughing  half-shut via `open`  — a mechanism none of the sixteen use
 *   angry     short, tight, head DOWN — a glare is aimed, not just tilted
 *   proud     level and head well UP  — chin up, not eyes-squeezed
 */
const REAUTHORED: Record<string, BotExpression> = {
  // split does more work than tilt here: 10 vs 21 is unmissable, 17 vs 24 degrees
  // is not. Every one of the four sits at a different point on BOTH axes.
  // Targeted at MEASURED output, not at input numbers. `open` is deliberately
  // left at 1 for all four: lidding an eye to 0.2 renders the same small blob
  // as halving its height, so the two levers collided and laughing came out
  // identical to angry. Separation here is carried by rendered eye height and
  // rendered gap, which are the two things that actually survive to the pixel.
  // tall+narrow / short+wide / tiny+tight / medium+level — separated on the two
  // axes that survive to pixels (rendered height and rendered gap) plus width,
  // which is the only lever left once tilt has been spent.
  heureux: { id: 'heureux' as BotExpression['id'], gaze: { yaw: 0, pitch: 5, roll: -4 },
             split: 17.0, eyes: pair(0.186, 0.618, 32) },
  hilare:  { id: 'hilare' as BotExpression['id'], gaze: { yaw: 0, pitch: 16, roll: -6 },
             split: 28.0, eyes: pair(0.360, 0.176, 12) },
  colere:  { id: 'colere' as BotExpression['id'], gaze: { yaw: 0, pitch: -13, roll: 0 },
             split: 8.0, eyes: pair(0.268, 0.148, 42) },
  fier:    { id: 'fier' as BotExpression['id'], gaze: { yaw: 0, pitch: 17, roll: -9 },
             split: 13.0, eyes: pair(0.184, 0.400, 0) }
}

export const BLOUB_EXPRESSIONS: HataDExpression[] = BLOUB.map((e) => {
  const m = BLOUB_META[e.id] ?? [e.id, 'brand' as ExpressionUse, '']
  const over = REAUTHORED[e.id]
  return {
    id: e.id, use: m[1], label: m[0], when: m[2],
    why: over
      ? 'Re-authored: bloub’s version is geometrically the same face as three others.'
      : 'From bloub, measured off the reference video.',
    expr: over ?? e
  }
})


/* ==========================================================================
 * MORE — a second batch.
 *
 * Niemann's rule for abstraction is the test here: the ultimate abstraction
 * falls flat and the literal one repels, so the right form is the one that
 * merely *reads as* the thing. None of these draw an emotion; each one is the
 * least geometry that reads as a way of paying attention.
 * ========================================================================== */

export const MORE_EXPRESSIONS: HataDExpression[] = [
  { id: 'squinting', use: 'client', label: 'Squinting',
    when: 'One line, read four times.', why: 'The narrowest he goes, and the tightest gap. Past this the eyes stop being eyes.',
    expr: { id: 'squinting' as BotExpression['id'], gaze: { yaw: 0, pitch: -12, roll: -3 }, split: 9.2, eyes: pair(0.256, 0.126, 12) } },

  { id: 'tracing', use: 'client', label: 'Tracing',
    when: 'Following a chain of ownership down a page.', why: 'Eyes staggered on the diagonal, small. The shape of a gaze moving along something rather than resting on it.',
    expr: { id: 'tracing' as BotExpression['id'], gaze: { yaw: -5, pitch: -8, roll: -14 }, split: 15.6, eyes: [eye(0.232, 0.146, 22), eye(0.198, 0.310, 22)] } },

  { id: 'weighing', use: 'client', label: 'Weighing',
    when: 'Two records, neither obviously right.', why: 'Wide-set and level with mirrored tilts held equal — the geometry of a balance that has not tipped.',
    expr: { id: 'weighing' as BotExpression['id'], gaze: { yaw: 0, pitch: 1, roll: 0 }, split: 20.6, eyes: pair(0.204, 0.398, 13) } },

  { id: 'sceptical', use: 'client', label: 'Sceptical',
    when: 'The record says so. He is not convinced yet.', why: 'One eye half-lidded rather than narrowed — `open`, not height. A different mechanism from cross-checking, so the two do not blur.',
    expr: { id: 'sceptical' as BotExpression['id'], gaze: { yaw: 8, pitch: 1, roll: -13 }, split: 17.8, eyes: [eye(0.212, 0.452, -14, 0.46), eye(0.190, 0.472, 4)] } },

  { id: 'patient', use: 'client', label: 'Patient',
    when: 'Day four. The clerk is still looking.', why: 'Tall but lidded. Present without pressing — waiting, not staring.',
    expr: { id: 'patient' as BotExpression['id'], gaze: { yaw: 0, pitch: 5, roll: -6 }, split: 16.4, eyes: pair(0.200, 0.520, 0, 0.72) } },

  { id: 'receptive', use: 'client', label: 'Receptive',
    when: 'You are telling him something.', why: 'The widest and most open in the set. Round eyes read as trustworthy, and this is where we spend that.',
    expr: { id: 'receptive' as BotExpression['id'], gaze: { yaw: 0, pitch: 7, roll: -9 }, split: 19.8, eyes: pair(0.214, 0.588, 0) } },

  { id: 'narrowing', use: 'client', label: 'Narrowing',
    when: 'Closing in. The answer is nearly out.', why: 'Mid-narrow with the tops converging and the gap tightening. Sits between reading and squinting on height, on purpose. Laid down rather than upright, because the converging tilt is the whole idea and a near-square eye cannot show one.',
    expr: { id: 'narrowing' as BotExpression['id'], gaze: { yaw: 0, pitch: -6, roll: -5 }, split: 11.8, eyes: pair(0.256, 0.168, 19) } },

  { id: 'locked', use: 'client', label: 'Locked',
    when: 'One thing, nothing else.', why: 'Tightest gap in the set, dead level, no tilt at all. Every other lever switched off is itself a statement.',
    expr: { id: 'locked' as BotExpression['id'], gaze: { yaw: 0, pitch: 0, roll: 0 }, split: 8.6, eyes: pair(0.196, 0.446, 0) } },

  { id: 'glancing', use: 'client', label: 'Glancing',
    when: 'Something moved at the edge of the case.', why: 'Both eyes tilted the same way, opposite to scanning. Parallel tilt reads as direction; mirrored tilt would read as mood.',
    expr: { id: 'glancing' as BotExpression['id'], gaze: { yaw: 11, pitch: 3, roll: 9 }, split: 18.2, eyes: [eye(0.212, 0.352, -28), eye(0.212, 0.352, -28)] } },

  { id: 'resolved', use: 'client', label: 'Resolved',
    when: 'It is settled and he will not be relitigating it.', why: 'Certain, but closer together and tipped slightly down. Confidence looks like a small posture, not a big one.',
    expr: { id: 'resolved' as BotExpression['id'], gaze: { yaw: 0, pitch: -3, roll: -4 }, split: 11.4, eyes: pair(0.206, 0.376, 0) } }
]

/**
 * Everything available: ours, the two later batches, and bloub's sixteen.
 * Declared last on purpose — it spreads every array above it, and a `const` is
 * in its temporal dead zone until evaluated, so building it earlier throws.
 */
export const ALL_EXPRESSIONS: HataDExpression[] = [
  ...HATAD_EXPRESSIONS,
  ...NEW_EXPRESSIONS,
  ...MORE_EXPRESSIONS,
  ...BLOUB_EXPRESSIONS
]

export const EXPRESSION_BY_KEY = new Map(ALL_EXPRESSIONS.map((e) => [e.id, e]))
