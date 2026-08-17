'use client'

import { useEffect, useRef, useState } from 'react'
import { ALL_SOURCES, SOURCE_CLUSTERS, SOURCE_COUNT } from '@/lib/departments'

/**
 * The descent — every record source, one at a time, on the way down.
 *
 * The scroll length is the argument. "We read 30+ departments" is a number you
 * skim past; travelling through all of them, watching a counter climb, is the
 * same fact at a size you feel. Nothing here is scaled up for effect — the
 * content genuinely is that long.
 *
 * Driven by IntersectionObserver rather than a scroll handler: no rAF loop to
 * stall in a background tab, no per-frame arithmetic, and the browser does the
 * work off the main thread. The counter recomputes from all rows on each
 * callback — 28 rects is nothing — so it reads correctly scrolling up as well
 * as down, which a high-water mark would not.
 */

export type DescentLabels = {
  index: string
  lead: string
  close: string
  closeSub: string
  of: string
}

/** Position of each source in the flat list, so rows can number themselves. */
const ORDER = new Map(ALL_SOURCES.map((s, i) => [s.name, i]))

export function DepartmentDescent({ labels }: { labels: DescentLabels }) {
  const listRef = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(0)

  useEffect(() => {
    const root = listRef.current
    if (!root) return
    const rows = Array.from(root.querySelectorAll<HTMLElement>('[data-i]'))
    if (!rows.length) return

    /* The line a row has to cross to count as read — just above centre, so the
       counter changes at the moment a row is actually being looked at. */
    const lineAt = () => window.innerHeight * 0.55

    const recount = () => {
      const line = lineAt()
      let n = 0
      for (const row of rows) {
        const passed = row.getBoundingClientRect().top < line
        row.toggleAttribute('data-lit', passed)
        if (passed) n++
      }
      setSeen(n)
    }

    const io = new IntersectionObserver(recount, {
      threshold: [0, 0.5, 1],
      rootMargin: '0px 0px -45% 0px',
    })
    rows.forEach((r) => io.observe(r))
    recount()
    window.addEventListener('resize', recount, { passive: true })
    return () => {
      io.disconnect()
      window.removeEventListener('resize', recount)
    }
  }, [])

  const pct = Math.round((seen / SOURCE_COUNT) * 100)

  return (
    <section className="dd" aria-label={labels.lead}>
      {/* Sticky rail. Holds position for the whole descent, which is what turns
          a long list into a journey with a distance left to run. */}
      <div className="dd-rail">
        <div className="dd-rail-inner">
          <p className="dd-index">
            <span className="dd-index-num">{labels.index}</span>
            <span className="dd-index-rule" aria-hidden />
            <span>{labels.lead}</span>
          </p>
          <p className="dd-count" aria-hidden>
            <span className="dd-count-now">{String(seen).padStart(2, '0')}</span>
            <span className="dd-count-of">
              {' '}
              {labels.of} {SOURCE_COUNT}
            </span>
          </p>
          <div className="dd-meter" aria-hidden>
            <span className="dd-meter-fill" style={{ transform: `scaleX(${pct / 100})` }} />
          </div>
        </div>
      </div>

      <div className="dd-list" ref={listRef}>
        {SOURCE_CLUSTERS.map((cluster) => (
          <div className="dd-cluster" key={cluster.id}>
            <h3 className="dd-cluster-label">{cluster.label}</h3>
            {cluster.sources.map((s) => (
              <div className="dd-row" key={s.name} data-i={ORDER.get(s.name)}>
                <span className="dd-n" aria-hidden>
                  {String((ORDER.get(s.name) ?? 0) + 1).padStart(2, '0')}
                </span>
                <span className="dd-body">
                  <span className="dd-name">{s.name}</span>
                  <span className="dd-rec">{s.records}</span>
                </span>
              </div>
            ))}
          </div>
        ))}

        {/* The payoff: the stake first, then what we do about it. */}
        <p className="dd-close">{labels.close}</p>
        <p className="dd-close-sub">{labels.closeSub}</p>
      </div>
    </section>
  )
}
