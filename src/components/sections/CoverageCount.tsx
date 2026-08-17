'use client'

import { useEffect, useRef } from 'react'

/**
 * The count — villages, climbing to the real total as you scroll.
 *
 * "38 districts" is the weakest number available: every service in Tamil Nadu
 * covers 38 districts, because that is simply the state. The figure worth
 * showing is the one nobody can wave away, and watching it climb past twenty
 * thousand is a different kind of statement from reading it.
 *
 * There is already a counter on this page, in the descent above. This one is
 * deliberately its opposite in every dimension that matters: centre of the
 * screen rather than a side rail, five digits rather than two, and scrubbed
 * directly by scroll rather than stepped by what has been read.
 *
 * Values are written straight to the DOM rather than through state — this
 * updates every frame, and re-rendering the tree sixty times a second to change
 * five custom properties would be pure waste.
 */

export type CoverageFact = { value: string; label: string }

export function CoverageCount({
  total,
  label,
  facts,
  trackSelector,
  compact,
}: {
  total: number
  label: string
  facts: CoverageFact[]
  /*
   * Where to read scroll progress from, when this is not the thing that moves.
   *
   * Inside a sticky stage its own rect stops moving the moment the stage pins,
   * so it would either finish instantly or never start. Given a selector it
   * measures that ancestor — the tall track — instead.
   */
  trackSelector?: string
  /*
   * Drops this component's own track and sticky stage.
   *
   * On its own it is a scrollytelling block: a 210svh track with a sticky stage
   * inside, which is what gives the number room to decelerate. Nested inside
   * another pinned stage that becomes a track inside a track — 1554px of height
   * stuffed into a 740px box that cannot scroll, pushing everything else out of
   * it. Compact renders the same figures as an ordinary block and takes its
   * progress from `trackSelector` instead.
   */
  compact?: boolean
}) {
  const sectionRef = useRef<HTMLDivElement>(null)
  const numRef = useRef<HTMLParagraphElement>(null)

  /*
   * The formatted total is the template: every character becomes either a wheel
   * or a literal separator, so grouping comes from Intl rather than a hardcoded
   * assumption about where the commas fall.
   */
  const template = new Intl.NumberFormat('en-IN').format(total)
  const digitCount = template.replace(/\D/g, '').length

  useEffect(() => {
    const own = sectionRef.current
    const section = trackSelector ? (own?.closest<HTMLElement>(trackSelector) ?? own) : own
    const num = numRef.current
    if (!section || !num) return

    const wheels = Array.from(num.querySelectorAll<HTMLElement>('[data-w]'))
    if (!wheels.length) return

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let frame = 0
    const apply = () => {
      frame = 0
      const r = section.getBoundingClientRect()
      const travel = r.height - window.innerHeight

      /*
       * Eased so the number does not crawl the whole way. It moves quickly out
       * of nothing, then decelerates onto the real figure — which is the part
       * worth reading, and the part the reader should arrive at rather than
       * race past.
       */
      const raw = travel <= 0 ? 1 : Math.max(0, Math.min(1, -r.top / travel))
      const p = reduced ? 1 : 1 - Math.pow(1 - raw, 3)

      const value = Math.round(p * total)
      const digits = String(value).padStart(digitCount, '0')
      for (let i = 0; i < wheels.length; i++) {
        wheels[i].style.setProperty('--d', digits[i] ?? '0')
      }
      num.dataset.done = value >= total ? 'true' : 'false'
    }

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(apply)
    }

    apply()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    document.addEventListener('visibilitychange', onScroll)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      document.removeEventListener('visibilitychange', onScroll)
    }
  }, [total, digitCount, trackSelector])

  let seen = -1

  return (
    <div className={compact ? 'cc cc-compact' : 'cc'} ref={sectionRef}>
      <div className="cc-stage">
        {/* aria-hidden: a screen reader should be told the figure once, not
            read a number that changes sixty times a second. */}
        <p className="cc-num" ref={numRef} data-done="false" aria-hidden>
          {template.split('').map((ch, i) => {
            if (!/\d/.test(ch)) {
              return (
                <span className="cc-sep" key={i}>
                  {ch}
                </span>
              )
            }
            seen++
            return <span className="cc-digit" data-w={seen} key={i} style={{ '--d': 0 } as React.CSSProperties} />
          })}
        </p>
        <p className="cc-label" aria-hidden>
          {label}
        </p>

        <ul className="cc-facts">
          {facts.map((f) => (
            <li key={f.label}>
              <span className="cc-fact-n">{f.value}</span>
              <span className="cc-fact-l">{f.label}</span>
            </li>
          ))}
        </ul>

        <span className="sr-only">
          {new Intl.NumberFormat('en-IN').format(total)} {label}
          {facts.map((f) => `, ${f.value} ${f.label}`).join('')}
        </span>
      </div>
    </div>
  )
}
