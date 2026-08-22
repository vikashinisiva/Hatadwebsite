/**
 * Framework-free mount adapter for the bloub bot engine.
 *
 * bloub ships a Vue renderer; the engine underneath it (src/bot/*) has no
 * framework imports at all. This file is the missing half: it builds the SVG
 * once, then writes `engine.sample(t)` into it on every frame.
 *
 * The same shape ports to React unchanged — swap the `build()` call for a ref
 * and run `tick` inside a useEffect rAF loop. Nothing here touches the DOM in a
 * way React would fight over, because the SVG subtree is owned entirely by us.
 */
import { BotEngine, type BotFrame, type Look } from './bot/engine'
import { DEMI_VIEWBOX } from './bot/repere'
import { NOTIF_BLUE } from './bot/decor'
import { SHAPE_BY_ID, COLOR_BY_ID, mixHex } from './bot/skins'
import { EXPRESSION_BY_ID } from './bot/expressions'
import { RAYON } from './bot/repere'
import type { StateId } from './bot/states'

const NS = 'http://www.w3.org/2000/svg'
const VB = DEMI_VIEWBOX

let uidSeq = 0

/**
 * One rAF for every bot on the page.
 *
 * Each mount used to run its own loop, which is fine for two and rude for
 * thirty. The engine is a pure function of time, so a shared clock changes
 * nothing about what any individual bot renders.
 */
const ticking = new Set<(ms: number) => void>()
let rafId = 0

function pump(ms: number) {
  ticking.forEach((fn) => fn(ms))
  rafId = ticking.size ? requestAnimationFrame(pump) : 0
}
function join(fn: (ms: number) => void) {
  ticking.add(fn)
  if (!rafId) rafId = requestAnimationFrame(pump)
}
function leave(fn: (ms: number) => void) {
  ticking.delete(fn)
  if (!ticking.size && rafId) {
    cancelAnimationFrame(rafId)
    rafId = 0
  }
}

// A background tab does not need to animate anything.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
    } else if (ticking.size && !rafId) {
      rafId = requestAnimationFrame(pump)
    }
  })
}

export interface BotOptions {
  size?: number
  /** page background: the eyes are holes, so this shows through them */
  paper?: string
  ink?: string
  shape?: string
  expression?: string
  state?: StateId
  /** subtle form shading instead of a flat fill. Default true. */
  depth?: boolean
  /** breathing, weight on state changes, lean toward the gaze. Default true. */
  life?: boolean
}

function el<K extends keyof SVGElementTagNameMap>(tag: K): SVGElementTagNameMap[K] {
  return document.createElementNS(NS, tag)
}

/** Reconcile a <g>'s children to exactly `n` nodes of `tag`. */
function fit(parent: SVGElement, n: number, tag: 'path' | 'circle'): SVGElement[] {
  while (parent.childNodes.length > n) parent.removeChild(parent.lastChild!)
  while (parent.childNodes.length < n) parent.appendChild(el(tag))
  return Array.from(parent.childNodes) as SVGElement[]
}

export function mountBot(host: HTMLElement, opts: BotOptions = {}) {
  const size = opts.size ?? 120
  let paper = opts.paper ?? '#f4f6f9'
  const uid = `bot${uidSeq++}`
  const maskId = `${uid}-mask`

  // accept a raw hex as well as a bloub colour id — HataD's near-black is
  // #0c1525 (blue-biased), not bloub's neutral #0a0a0c
  function resolveInk(v: string | undefined) {
    if (v && v.charAt(0) === '#') return v
    return COLOR_BY_ID.get(v ?? 'encre')?.hex ?? '#0a0a0c'
  }
  let ink = resolveInk(opts.ink)
  const useDepth = opts.depth !== false
  const useLife = opts.life !== false

  /** Lift a hex toward white by `t`. Used only for the form highlight. */
  function lift(hex: string, t: number) {
    const v = parseInt(hex.slice(1), 16)
    const c = [(v >> 16) & 255, (v >> 8) & 255, v & 255].map((x) =>
      Math.round(x + (255 - x) * t)
    )
    return `#${c.map((x) => x.toString(16).padStart(2, '0')).join('')}`
  }
  function applyInk() {
    if (useDepth) {
      gStop1.setAttribute('stop-color', lift(ink, 0.095))
      gStopMid.setAttribute('stop-color', lift(ink, 0.015))
      gStop2.setAttribute('stop-color', ink)
      bodyFill.setAttribute('fill', `url(#${gradId})`)
    } else {
      bodyFill.setAttribute('fill', ink)
    }
  }

  const svg = el('svg')
  svg.setAttribute('viewBox', `${-VB} ${-VB} ${VB * 2} ${VB * 2}`)
  svg.setAttribute('width', String(size))
  svg.setAttribute('height', String(size))
  svg.setAttribute('role', 'img')
  svg.setAttribute('aria-label', 'HataD assistant')

  const defs = el('defs')
  const mask = el('mask')
  mask.setAttribute('id', maskId)
  mask.setAttribute('maskUnits', 'userSpaceOnUse')
  mask.setAttribute('x', String(-VB))
  mask.setAttribute('y', String(-VB))
  mask.setAttribute('width', String(VB * 2))
  mask.setAttribute('height', String(VB * 2))

  // white = body kept, black = punched out (eyes, notch)
  const maskBody = el('path')
  maskBody.setAttribute('fill', '#fff')
  const maskEyes = el('g')
  maskEyes.setAttribute('fill', '#000')
  const maskNotch = el('circle')
  maskNotch.setAttribute('fill', '#000')
  mask.append(maskBody, maskEyes, maskNotch)

  /**
   * Depth. A flat fill is the least expensive-looking thing a shape can be: a
   * sticker rather than an object. One radial gradient, offset up and left.
   *
   * Kept deliberately shallow, and decaying to the true colour by 45% of the
   * radius, so most of the body IS the ink. He must still read as black; the
   * gradient exists to stop him reading as paper, not to light him.
   */
  const bodyGrad = el('radialGradient')
  const gradId = `${uid}-form`
  bodyGrad.setAttribute('id', gradId)
  bodyGrad.setAttribute('cx', '34%')
  bodyGrad.setAttribute('cy', '26%')
  bodyGrad.setAttribute('r', '60%')
  const gStop1 = el('stop')
  gStop1.setAttribute('offset', '0')
  const gStopMid = el('stop')
  gStopMid.setAttribute('offset', '0.45')
  const gStop2 = el('stop')
  gStop2.setAttribute('offset', '1')
  bodyGrad.append(gStop1, gStopMid, gStop2)

  const gradHost = el('g')
  defs.append(mask, gradHost, bodyGrad)

  const arcsBack = el('g')
  arcsBack.setAttribute('fill', 'none')
  arcsBack.setAttribute('stroke-linecap', 'round')

  const dotsBack = el('g')

  const bodyGroup = el('g')
  // Opaque backing in the page colour: the eyes are holes, and without this the
  // back half of the orbit rings would show through them.
  const bodyPaper = el('path')
  bodyPaper.setAttribute('fill', paper)
  const bodyMasked = el('g')
  bodyMasked.setAttribute('mask', `url(#${maskId})`)
  const bodyFill = el('rect')
  bodyFill.setAttribute('x', String(-VB))
  bodyFill.setAttribute('y', String(-VB))
  bodyFill.setAttribute('width', String(VB * 2))
  bodyFill.setAttribute('height', String(VB * 2))
  bodyMasked.append(bodyFill)
  bodyGroup.append(bodyPaper, bodyMasked)

  const dotsFront = el('g')

  const notif = el('circle')
  notif.setAttribute('fill', NOTIF_BLUE)

  const arcsFront = el('g')
  arcsFront.setAttribute('fill', 'none')
  arcsFront.setAttribute('stroke-linecap', 'round')

  // everything lives under one group so breath, weight and lean are a single
  // transform rather than something each part has to know about
  const stage = el('g')
  stage.append(arcsBack, dotsBack, bodyGroup, dotsFront, notif, arcsFront)
  svg.append(defs, stage)
  host.appendChild(svg)
  applyInk()

  const engine = new BotEngine(
    100,
    opts.state ?? 'idle',
    SHAPE_BY_ID.get(opts.shape ?? 'cercle')?.radii ?? null,
    EXPRESSION_BY_ID.get(opts.expression ?? 'neutre') ?? null
  )

  function paintDots(g: SVGElement, dots: BotFrame['dots']) {
    // circle vs path is per-dot, so rebuild rather than reconcile by index
    while (g.firstChild) g.removeChild(g.firstChild)
    for (const d of dots) {
      const fill =
        d.color ?? (d.depth === undefined ? ink : mixHex(paper, ink, d.depth))
      if (d.d) {
        const p = el('path')
        p.setAttribute('d', d.d)
        p.setAttribute('fill', fill)
        p.setAttribute('opacity', String(d.opacity))
        p.setAttribute(
          'transform',
          `translate(${d.x} ${d.y}) rotate(${d.rot ?? 0}) scale(${RAYON})`
        )
        g.appendChild(p)
      } else {
        const c = el('circle')
        c.setAttribute('cx', String(d.x))
        c.setAttribute('cy', String(d.y))
        c.setAttribute('r', String(d.r))
        c.setAttribute('fill', fill)
        c.setAttribute('opacity', String(d.opacity))
        g.appendChild(c)
      }
    }
  }

  function paint(frame: BotFrame) {
    maskBody.setAttribute('d', frame.bodyPath)
    bodyPaper.setAttribute('d', frame.bodyPath)
    bodyGroup.setAttribute('opacity', String(frame.bodyAlpha))

    const eyeNodes = fit(maskEyes, frame.eyes.length, 'path')
    frame.eyes.forEach((eye, i) => {
      const n = eyeNodes[i]!
      n.setAttribute('d', eye.d)
      n.setAttribute('transform', eye.matrix)
      n.setAttribute('opacity', String(eye.alpha))
    })

    if (frame.notch) {
      maskNotch.setAttribute('cx', String(frame.notch.x))
      maskNotch.setAttribute('cy', String(frame.notch.y))
      maskNotch.setAttribute('r', String(frame.notch.r))
    } else {
      maskNotch.setAttribute('r', '0')
    }

    if (frame.notif) {
      notif.setAttribute('cx', String(frame.notif.x))
      notif.setAttribute('cy', String(frame.notif.y))
      notif.setAttribute('r', String(frame.notif.r))
      notif.setAttribute('opacity', '1')
    } else {
      notif.setAttribute('opacity', '0')
      notif.setAttribute('r', '0')
    }

    // gradients: one per arc, rebuilt when the set changes
    while (gradHost.firstChild) gradHost.removeChild(gradHost.firstChild)
    for (const arc of frame.arcs) {
      const lg = el('linearGradient')
      lg.setAttribute('id', `${uid}-${arc.id}`)
      lg.setAttribute('gradientUnits', 'userSpaceOnUse')
      lg.setAttribute('x1', String(arc.grad.x1))
      lg.setAttribute('y1', String(arc.grad.y1))
      lg.setAttribute('x2', String(arc.grad.x2))
      lg.setAttribute('y2', String(arc.grad.y2))
      arc.grad.stops.forEach((c, i) => {
        const s = el('stop')
        s.setAttribute('offset', String(i / Math.max(1, arc.grad.stops.length - 1)))
        s.setAttribute('stop-color', c)
        lg.appendChild(s)
      })
      gradHost.appendChild(lg)
    }

    const backNodes = fit(arcsBack, frame.arcs.length, 'path')
    const frontNodes = fit(arcsFront, frame.arcs.length, 'path')
    frame.arcs.forEach((arc, i) => {
      for (const [nodes, key] of [
        [backNodes, 'back'],
        [frontNodes, 'front']
      ] as const) {
        const n = nodes[i]!
        n.setAttribute('d', arc[key])
        n.setAttribute('stroke', `url(#${uid}-${arc.id})`)
        n.setAttribute('stroke-width', String(arc.width))
        n.setAttribute('opacity', String(arc.opacity))
      }
    })

    paintDots(frame.dotsBehind ? dotsBack : dotsFront, frame.dots)
    if (frame.dotsBehind) paintDots(dotsFront, [])
    else paintDots(dotsBack, [])
  }

  /**
   * Per-instance clock offset.
   *
   * `sample(t)` is pure and the blink schedule is fixed, so every bot that
   * starts on the same frame blinks and breathes on exactly the same tick.
   * With two on a page nobody notices; with sixty it reads as one object
   * repeated rather than sixty individuals. Offsetting the origin desyncs them
   * without touching the engine — and it stays deterministic per instance.
   */
  const phase = (uidSeq * 2.399963 + 0.618) % 11.7
  let t0 = 0
  let running = true
  let pausedAt = 0

  /* ---------------------------------------------------------------- life ---
   * The engine's transitions are exponential ease-outs that deliberately never
   * overshoot — measured off bloub's reference video, and correct for *that*
   * character. Ours can have weight. None of this touches the engine: it is one
   * transform on the stage group, so the silhouette stays exactly as sampled.
   */
  let breath = 0          // 0..1 phase
  let punch = 0           // 0..1, decays after a state change
  let leanX = 0
  let leanTarget = 0

  /**
   * Body language — the Luxo axis.
   *
   * Neither lamp in Luxo Jr. has a face; the whole performance is carriage.
   * Sinking reads as tired or chastened, rising as attention, a hop as arrival.
   * Our character has two eyes and no body, so this is the only posture
   * available to him — and it is entirely separate from what his eyes do.
   *
   *   drop  -1 = drawn up tall, +1 = sunk down
   *   tilt  head cocked, in units of ~7 degrees
   *   hop   one-shot impulse, decays
   */
  let drop = 0, dropTarget = 0
  let tilt = 0, tiltTarget = 0
  let hop = 0

  function stageTransform(t: number) {
    if (!useLife) return
    // breathing: ~4s cycle, under 1%. You never see it; you notice its absence.
    breath = Math.sin(t * 1.55) * 0.0075
    // weight: a state change lands, compresses, then settles. Critically damped
    // sine decay so it never wobbles like a cartoon.
    punch = Math.max(0, punch - 0.055)
    const p = punch * punch
    const sq = 1 + p * 0.11 * Math.sin(t * 26)
    const sx = (1 + breath) * sq
    const sy = (1 + breath) / (sq || 1)
    // lean: he tips a few degrees toward whatever he is looking at
    leanX += (leanTarget - leanX) * 0.09
    drop += (dropTarget - drop) * 0.08
    tilt += (tiltTarget - tilt) * 0.08
    hop = Math.max(0, hop - 0.045)

    // sinking compresses and settles low; rising stretches and lifts. Squash on
    // the way down and stretch on the way up is the oldest trick there is.
    const dy = drop * 13 - Math.sin(hop * Math.PI) * 26
    const carry = 1 - drop * 0.055 + Math.sin(hop * Math.PI) * 0.05
    const rot = leanX * 3.2 + tilt * 7

    stage.setAttribute(
      'transform',
      `translate(0 ${dy.toFixed(2)}) rotate(${rot.toFixed(3)}) ` +
      `scale(${(sx / (carry || 1)).toFixed(4)} ${(sy * carry).toFixed(4)})`
    )
  }

  function tick(ms: number) {
    if (!t0) t0 = ms - phase * 1000
    const t = (ms - t0) / 1000
    paint(engine.sample(t))
    stageTransform(t)
  }
  join(tick)

  const clock = () => (performance.now() - (t0 || performance.now())) / 1000

  return {
    engine,
    svg,
    /** Stop the rAF loop (offscreen tiles); `sample` is pure so resuming is exact. */
    pause() {
      if (!running) return
      running = false
      pausedAt = performance.now()
      leave(tick)
    },
    resume() {
      if (running) return
      running = true
      // shift the origin so the engine clock never advances while paused
      if (pausedAt && t0) t0 += performance.now() - pausedAt
      pausedAt = 0
      join(tick)
    },
    setState: (id: StateId) => {
      if (id !== engine.state) punch = 1
      engine.setState(id, clock())
    },
    /** `morph` is the catch-up time in seconds; short values read as a saccade
     *  rather than a glide. Defaults to the engine's own LOOK_MORPH (0.24s). */
    setLook: (look: Look | null, morph?: number) => {
      leanTarget = look ? Math.max(-1, Math.min(1, look.yaw / 16)) : 0
      engine.setLook(look, clock(), morph)
    },
    setShape: (id: string | number[]) =>
      engine.setShape(
        Array.isArray(id) ? id : (SHAPE_BY_ID.get(id)?.radii ?? null),
        clock()
      ),
    setExpression: (id: string | object | null) =>
      engine.setExpression(
        id && typeof id === 'object'
          ? (id as never)
          : (EXPRESSION_BY_ID.get(id as string) ?? null),
        clock()
      ),
    /** Apply a grammar posture: state, body and expression in one call. */
    setPosture(res: { state: string; shape: string; expression: unknown } | null) {
      if (!res) return
      if (res.state !== engine.state) punch = 1
      engine.setState(res.state as StateId, clock())
      const radii = hatadShapeRadii(res.shape) ?? SHAPE_BY_ID.get(res.shape)?.radii ?? null
      engine.setShape(radii, clock())
      engine.setExpression((res.expression ?? null) as never, clock())
      const c = (res as { posture?: { carry?: [number, number] } }).posture?.carry
      dropTarget = c ? c[0] : 0
      tiltTarget = c ? c[1] : 0
    },
    /**
     * Carriage, independent of the face.
     *   drop  -1 (drawn up) .. +1 (sunk)
     *   tilt  -1 (cocked left) .. +1 (cocked right)
     */
    setCarriage(d: number, t = 0) {
      dropTarget = Math.max(-1, Math.min(1, d))
      tiltTarget = Math.max(-1, Math.min(1, t))
    },
    /** One bounce. Arrival, or a small delight. */
    hop() {
      hop = 1
    },
    setPaper: (c: string) => {
      paper = c
      bodyPaper.setAttribute('fill', paper)
    },
    setInk: (id: string) => {
      ink = resolveInk(id)
      applyInk()
    },
    get state() {
      return engine.state
    },
    destroy() {
      running = false
      leave(tick)
      svg.remove()
    }
  }
}

export { lookTarget, YAW_MAX, PITCH_MAX, TURN, PITCH } from './gaze'
import { HATAD_SHAPES } from './hatad-shapes'
export { HATAD_SHAPES }

/** grammar domains map onto the four authored bodies */
const DOMAIN_SHAPE: Record<string, string> = {
  neutral: 'handcut', paper: 'patta', land: 'stone', issued: 'seal'
}
function hatadShapeRadii(name: string): number[] | null {
  const id = DOMAIN_SHAPE[name] ?? name
  const hit = HATAD_SHAPES.find((s) => s.id === id)
  return hit ? hit.radii : null
}
export { HATAD_EXPRESSIONS, NEUTRAL } from './hatad-expressions'
export { POSTURES, POSTURE_BY_ID, resolve as resolvePosture, FAMILY_DOMAIN } from './hatad-grammar'
export type { Domain, Posture, Resolved } from './hatad-grammar'
export type { StateId }
