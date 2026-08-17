'use client'

import { useEffect, useMemo, useRef } from 'react'
import { TN_DISTRICT_PATHS, TN_MAP_VIEWBOX } from '@/data/tn-districts-map'

/**
 * Tamil Nadu, filling in district by district as the section is scrolled.
 *
 * Replaces a list of 38 names. The claim is coverage of the whole state, and a
 * shape that completes says that in one glance, where a column of names asked
 * the reader to count.
 *
 * Driven by scroll POSITION, not by a timer — the same rule the coverage
 * odometer follows, and for the same reason: a fast swipe past a timed
 * animation strands it half-played, while a position-mapped one simply lands
 * wherever the reader stopped and is complete the moment they are past it.
 *
 * The fill order is south to north, by real projected centroid, so it reads as
 * the state being covered rather than as a list being ticked off.
 */
export function DistrictMap({
  tallyRef,
}: {
  /* Optional readout of how many districts are lit. Written straight to the
     node's text rather than held in state — this changes on scroll frames, and
     re-rendering the tree to move one number would be absurd. */
  tallyRef?: React.RefObject<HTMLSpanElement | null>
}) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)


  /* South first. Larger y is further south in the projected viewBox. */
  const ordered = useMemo(
    () => TN_DISTRICT_PATHS.map((d, i) => ({ ...d, i })).sort((a, b) => b.c[1] - a.c[1]),
    [],
  )

  useEffect(() => {
    const wrap = wrapRef.current
    const svg = svgRef.current
    if (!wrap || !svg) return

    const paths = ordered
      .map((d) => svg.querySelector<SVGPathElement>(`[data-k="${d.i}"]`))
      .filter((p): p is SVGPathElement => !!p)
    if (!paths.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      /* Not nothing: the finished state. The map is information, and withholding
         it from someone who asked for less motion would withhold the point. */
      for (const p of paths) p.dataset.on = 'true'
      if (tallyRef?.current) tallyRef.current.textContent = String(paths.length)
      return
    }

    /*
     * Only the districts whose state actually changed are touched.
     *
     * Writing all 38 on every frame would be 38 style recalculations per scroll
     * tick for a handful of real transitions. Tracking how many are lit and
     * moving only the delta makes a scroll cost one write, or none.
     */
    let lit = 0
    let frame = 0

    /*
     * Progress comes from the TRACK, not from this element.
     *
     * The stage is sticky, so once it pins its own top stays at zero and its
     * rect would report no movement at all — the fill would freeze the instant
     * the section engaged. The track is the tall parent whose height IS the
     * scroll distance, and measuring it is what makes the pinned fill possible.
     */
    const track = wrap.closest<HTMLElement>('[data-cover-track]') ?? wrap

    const apply = () => {
      frame = 0
      const r = track.getBoundingClientRect()
      const travel = r.height - window.innerHeight
      const raw = travel <= 0 ? 1 : Math.max(0, Math.min(1, -r.top / travel))
      /* Complete at three quarters, so the last quarter of the track holds a
         finished map. Filling right up to the section boundary would mean the
         reader never sees the whole state at rest — which is the entire point
         of pinning it. */
      const p = Math.max(0, Math.min(1, raw / 0.75))

      const want = Math.round(p * paths.length)
      if (want === lit) return
      if (want > lit) for (let i = lit; i < want; i++) paths[i].dataset.on = 'true'
      else for (let i = lit - 1; i >= want; i--) paths[i].dataset.on = 'false'
      lit = want
      svg.dataset.done = want >= paths.length ? 'true' : 'false'

      if (tallyRef?.current) tallyRef.current.textContent = String(want)
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [ordered, tallyRef])

  return (
    <figure className="lt-map-fig" ref={wrapRef}>
      <svg
        ref={svgRef}
        viewBox={TN_MAP_VIEWBOX}
        role="img"
        aria-label={`${TN_DISTRICT_PATHS.length} districts of Tamil Nadu, all covered`}
      >
        {TN_DISTRICT_PATHS.map((d, i) => (
          /* Ordered alphabetically in the DOM and lit in geographic order via
             data-k, so the markup stays stable and diff-friendly. */
          <path key={d.name} d={d.d} data-k={i} data-on="false">
            <title>{d.name}</title>
          </path>
        ))}
      </svg>
    </figure>
  )
}
