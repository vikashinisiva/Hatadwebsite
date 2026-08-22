'use client'

/**
 * React binding for the HataD companion.
 *
 * Drop this file into the Next.js app alongside `src/`. It is a client
 * component: the character owns its SVG subtree outright, so React never
 * reconciles anything inside it and there is nothing to fight over.
 *
 *   <Companion posture="reading" domain="paper" caption="Revenue Department" />
 *
 * The caption is mirrored into an aria-live region, so a screen reader hears
 * what he is doing rather than being told there is an image.
 */
import { useEffect, useRef, useState } from 'react'
import { createCompanion, type Companion as Instance, type PostureId } from '../hatad'
import { EXPRESSION_BY_KEY } from '../hatad-expressions'
import type { Domain } from '../hatad-grammar'
import { RULES } from '../spec'

export interface CompanionProps {
  posture: PostureId
  domain?: Domain
  caption?: string
  size?: number
  gaze?: boolean
  className?: string
  /** hide the visible caption but keep it for assistive tech */
  captionHidden?: boolean
  /**
   * A momentary FACE, overriding the posture's own, for as long as it is set.
   *
   * This is the seam the prototype names when it says "poke a state directly —
   * 'you clicked me' is not a ledger condition". A reaction to the reader is
   * not a claim about a record, so it does not go through `postureFor`, and it
   * is the one place the `brand` expressions are reachable.
   *
   * It does NOT weaken the guarantee that matters. The build gate refuses to
   * bind a non-client expression to a POSTURE, and postures are what render
   * beside a finding; this overrides the face for a moment on a marketing
   * surface, where the README is explicit that "he can be as expressive as you
   * like". Never set it from anything a ledger row decides.
   */
  react?: string | null
  /**
   * A STATE to play, overriding the posture's own for as long as it is set.
   *
   * Distinct from `react`, which overrides the face. Part of what the engine
   * can do lives on the state axis rather than the expression axis — `burst`
   * is the obvious one, and no expression can reach it. Cleared the same way:
   * by re-showing the posture, so the grammar takes back both axes together.
   */
  playState?: string | null
  /**
   * A point on screen for him to watch, instead of the pointer.
   *
   * Read through a ref by the gaze clock, so it can change every frame without
   * rebuilding him — `size` and `gaze` remount by design, this must not.
   */
  lookAt?: { x: number; y: number } | null
}

export function Companion({
  posture,
  domain = 'neutral',
  caption,
  size = RULES.defaultSize,
  gaze = true,
  className,
  captionHidden = false,
  lookAt = null,
  react = null,
  playState = null
}: CompanionProps) {
  const host = useRef<HTMLDivElement>(null)
  const inst = useRef<Instance | null>(null)
  const [spoken, setSpoken] = useState(caption ?? '')

  /* Held in a ref, not a dependency: the gaze clock polls it at 14Hz and the
     target moves with the map, so making it a dependency would rebuild him
     several times a second. */
  const look = useRef<{ x: number; y: number } | null>(lookAt)
  useEffect(() => {
    look.current = lookAt
  }, [lookAt])

  // mount once; `size` and `gaze` are construction-time, so changing them
  // remounts rather than silently doing nothing
  useEffect(() => {
    if (!host.current) return
    const c = createCompanion(host.current, {
      size,
      gaze,
      onCaption: setSpoken,
      target: () => look.current
    })
    inst.current = c
    return () => {
      c.destroy()
      inst.current = null
    }
  }, [size, gaze])

  useEffect(() => {
    inst.current?.show(posture, { domain, caption })
  }, [posture, domain, caption])

  /*
   * Applied after the posture effect above, and cleared by re-showing rather
   * than by setting null: null tells the engine to fall back to the STATE's
   * own face, which is not the same thing as the posture's chosen expression.
   * Re-showing restores exactly what the grammar resolved.
   */
  useEffect(() => {
    const c = inst.current
    if (!c) return
    /*
     * Resolved to the expression OBJECT, not passed as a name.
     *
     * `setExpression` looks a string up in the engine's own map, which holds
     * only bloub's original sixteen — so `surpris` and `confus` resolve but
     * `pleased`, `relieved`, `braced` and every other face authored for HataD
     * silently become null and nothing happens. Two thirds of the range is
     * unreachable by name. EXPRESSION_BY_KEY covers all forty, and the setter
     * already accepts an object and passes it straight through.
     */
    if (react) c.bot.setExpression(EXPRESSION_BY_KEY.get(react)?.expr ?? react)
    else c.show(posture, { domain, caption })
  }, [react, posture, domain, caption])

  /* Last, so a state override outranks the other two: an entrance is the whole
     silhouette doing something, and there is nothing to resolve underneath it
     while it runs. */
  useEffect(() => {
    const c = inst.current
    if (!c) return
    /* The engine's setState is typed to its own StateId union; the prop is a
       plain string so a caller does not have to import the union just to name
       an entrance. Narrowed here, at the one place that knows both. */
    if (playState) c.bot.setState(playState as Parameters<typeof c.bot.setState>[0])
    else c.show(posture, { domain, caption })
  }, [playState, posture, domain, caption])

  return (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', gap: '.6rem' }}>
      <div ref={host} aria-hidden="true" style={{ lineHeight: 0 }} />
      <span
        role="status"
        aria-live="polite"
        style={
          captionHidden
            ? { position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap' }
            : undefined
        }
      >
        {spoken}
      </span>
    </div>
  )
}

/**
 * Bind him straight to a ledger row — the shape we actually want at call sites,
 * because it removes the chance of choosing a posture that contradicts the data.
 *
 *   <CompanionForRow row={source.ledger} domain="paper" caption={source.name} />
 */
import { postureFor, type LedgerRow } from '../hatad'

export function CompanionForRow({
  row,
  ...rest
}: { row: LedgerRow } & Omit<CompanionProps, 'posture'>) {
  return <Companion posture={postureFor(row)} {...rest} />
}

export default Companion
