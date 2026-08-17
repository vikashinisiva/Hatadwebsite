import { SOURCE_CLUSTERS, SOURCE_COUNT } from '@/lib/departments'

/**
 * Six families of record, twenty-eight sources, one document.
 *
 * Sits beside the closing call to action, where the reader has finished the
 * argument and is deciding. It restates the whole proposition in one glance
 * rather than in another paragraph — the closing band was three lines of copy
 * and a field, with the right half of the page empty.
 *
 * Every label and every number here is read from SOURCE_CLUSTERS. Nothing is
 * typed in, so the diagram cannot come to disagree with the list in section 02
 * the way a hand-drawn figure would the first time a source is added.
 *
 * Deliberately static. The page already carries a map camera, a scroll reveal,
 * an odometer and a drifting rule; a fifth thing in motion at the moment of
 * asking for an email competes with the ask. It is also the one element here
 * that must render identically with or without JavaScript.
 */

/* Laid out in a fixed viewBox and scaled by CSS: the geometry is hand-placed,
   so it has to be resolution-independent rather than responsive. */
const W = 520
const H = 300
const HUB_X = 430
const HUB_Y = H / 2
const ROW_X = 232
const TOP = 44
const STEP = 42

export function ConvergenceDiagram() {
  const rows = SOURCE_CLUSTERS.map((cluster, i) => ({
    label: cluster.label,
    count: cluster.sources.length,
    y: TOP + i * STEP,
  }))

  return (
    <figure className="lt-conv">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${SOURCE_COUNT} record sources across ${rows.length} families, combined into one report`}
      >
        {/* Curves first, so the dots and the hub sit on top of them. */}
        <g className="lt-conv-lines">
          {rows.map((r) => (
            <path
              key={r.label}
              d={`M ${ROW_X} ${r.y} C ${ROW_X + 90} ${r.y} ${HUB_X - 70} ${HUB_Y} ${HUB_X - 8} ${HUB_Y}`}
            />
          ))}
        </g>

        <g className="lt-conv-rows">
          {rows.map((r) => (
            <g key={r.label}>
              {/* Right-aligned so the ragged edge falls away from the curves and
                  every line starts at the same x. */}
              <text className="lt-conv-label" x={196} y={r.y} dominantBaseline="middle" textAnchor="end">
                {r.label}
              </text>
              <text className="lt-conv-count" x={210} y={r.y} dominantBaseline="middle" textAnchor="middle">
                {r.count}
              </text>
              <circle cx={ROW_X} cy={r.y} r={2.5} />
            </g>
          ))}
        </g>

        {/* The only ink on the diagram. Everything else is hairline. */}
        <rect className="lt-conv-hub" x={HUB_X - 6} y={HUB_Y - 6} width={12} height={12} />
        <text className="lt-conv-hub-label" x={HUB_X} y={HUB_Y + 26} textAnchor="middle">
          ONE REPORT
        </text>
      </svg>

      {/*
        The same data, for every width the fan does not survive.

        An SVG scales with its viewBox, so the labels shrank with it: on a 360px
        phone the family names rendered at 7.1px and the counts at 5.8px, and
        they were still only ~8px at 901px. Enlarging the type inside the
        viewBox does not rescue it — the labels are right-aligned into a
        196-unit gutter and would run straight into the curves.

        So below 1100px the geometry is dropped and the numbers are kept. The
        curves were always the decoration; the six families and the count are
        the argument, and a list states them at full size.
      */}
      <ul className="lt-conv-list">
        {rows.map((r) => (
          <li key={r.label}>
            <span>{r.label}</span>
            <span className="lt-conv-list-n">{r.count}</span>
          </li>
        ))}
        <li className="lt-conv-list-total">
          <span>One report</span>
          <span className="lt-conv-list-n">{SOURCE_COUNT}</span>
        </li>
      </ul>

      <figcaption>
        {SOURCE_COUNT} sources · {rows.length} families of record
      </figcaption>
    </figure>
  )
}
