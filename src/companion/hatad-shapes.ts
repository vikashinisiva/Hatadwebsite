/**
 * Candidate HataD silhouettes.
 *
 * bloub's body is a radial profile r(theta) sampled at 64 angles, so a new
 * silhouette is just a new array — every state, morph and eye-fit keeps working
 * because the engine only ever interpolates radii. Nothing here touches the
 * measured animation profiles in `bot/profiles.ts`; those stay faithful to the
 * reference video, which is what makes the motion read correctly.
 *
 * theta = 0 points right and increases clockwise (screen y goes down).
 */
import { PROFILE_SAMPLES } from './bot/profiles'
import { superellipseProfile, unionOfCirclesProfile } from './bot/shape'

const ANGLES = Array.from({ length: PROFILE_SAMPLES }, (_, i) => (i / PROFILE_SAMPLES) * Math.PI * 2)

/** Scale so every candidate carries the same visual weight as the circle. */
function normalize(radii: number[], max = 1): number[] {
  const peak = Math.max(...radii)
  if (peak <= 0) return radii
  const k = max / peak
  return radii.map((r) => r * k)
}

/**
 * Dilate a polygon by `rc` — discs packed along the perimeter, unioned. The
 * result is the polygon with every corner rounded to radius `rc`, which is what
 * a cut stone actually looks like.
 */
function roundedPolygon(verts: Array<[number, number]>, rc: number, per = 14) {
  const circles: Array<{ x: number; y: number; r: number }> = []
  for (let i = 0; i < verts.length; i++) {
    const [ax, ay] = verts[i]!
    const [bx, by] = verts[(i + 1) % verts.length]!
    for (let k = 0; k < per; k++) {
      const t = k / per
      circles.push({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t, r: rc })
    }
  }
  return unionOfCirclesProfile(circles)
}

/**
 * 1 — SURVEY STONE
 * The stone planted at a parcel corner: the physical object that answers
 * "where does this land end". Squat, FLAT-TOPPED and slightly tapered — the
 * flat top is the whole point, because a stone that narrows to a dome is just
 * bloub's egg with extra steps.
 */
export const surveyStone = normalize(
  roundedPolygon(
    [
      [-0.60, 0.52],  // base, wide
      [0.60, 0.52],
      [0.42, -0.54],  // top, narrower but flat
      [-0.42, -0.54]
    ],
    0.20
  ),
  1.02
)

/**
 * 2 — SEAL
 * The circle they already like, with a milled edge like a registration seal.
 * 12 lobes: fine enough to read as an official stamp up close, and at favicon
 * size it collapses back to a circle. (64 samples caps us at 32 cycles before
 * aliasing, so 12 is comfortably safe.)
 */
export const seal = normalize(
  ANGLES.map((a) => 1 + 0.032 * Math.cos(12 * a)),
  1.0
)

/**
 * 3 — PATTA FOLD
 * A record with its top-right corner turned up. A rounded square, then a
 * straight chamfer across that corner — the one asymmetry becomes the mark.
 * Chamfer is a half-plane n·p <= c; along a ray from the centre that is simply
 * t = c / (n·dir), so the profile is min(square, chamfer).
 */
const NX = Math.SQRT1_2
const NY = -Math.SQRT1_2 // up-right; screen y is inverted
const CHAMFER = 0.99
export const pattaFold = normalize(
  superellipseProfile(4.2, 1, 1).map((r, i) => {
    const dx = Math.cos(ANGLES[i]!)
    const dy = Math.sin(ANGLES[i]!)
    const nd = NX * dx + NY * dy
    if (nd <= 0) return r
    return Math.min(r, CHAMFER / nd)
  }),
  1.0
)

/**
 * 4 — HAND-CUT
 * Their circle, ours. Two low harmonics at ~2.5% — a circle struck by hand
 * rather than drawn with a compass. The most conservative option: everything
 * that makes the character likeable survives untouched.
 */
export const handCut = normalize(
  ANGLES.map((a) => 1 + 0.026 * Math.cos(2 * a + 0.9) + 0.014 * Math.cos(3 * a + 2.4)),
  1.01
)

export const HATAD_SHAPES: Array<{ id: string; label: string; note: string; radii: number[] }> = [
  {
    id: 'stone',
    label: 'Survey stone',
    note: 'The stone at the corner of the parcel. Grounded and flat-footed — the most different, and the most ours.',
    radii: surveyStone
  },
  {
    id: 'seal',
    label: 'Seal',
    note: 'The circle you like, with a milled edge. Reads as a registration seal up close, a circle at 16px.',
    radii: seal
  },
  {
    id: 'patta',
    label: 'Patta fold',
    note: 'A record with the corner turned up. One asymmetry does all the work, and it survives at favicon size.',
    radii: pattaFold
  },
  {
    id: 'handcut',
    label: 'Hand-cut',
    note: 'Their circle, struck by hand instead of drawn with a compass. Lowest risk; keeps everything intact.',
    radii: handCut
  }
]
