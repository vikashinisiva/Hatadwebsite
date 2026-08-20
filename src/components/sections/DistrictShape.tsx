import { TN_DISTRICT_PATHS, TN_MAP_VIEWBOX } from '@/data/tn-districts-map'
import { shapeName } from '@/lib/districts'

/**
 * Tamil Nadu with one district lit.
 *
 * The whole state is drawn every time and only the subject is filled, so the
 * reader sees where in Tamil Nadu this district actually is rather than a shape
 * floating on its own. That context is the entire point: "Sivagangai" means
 * little to most buyers, "this piece of the south-east" means something.
 *
 * Pure geometry from a committed file, no client JS. It renders on the server,
 * costs nothing at runtime, and is genuinely different on all 38 pages, which
 * is what a generated page has to be to deserve to exist.
 */
export function DistrictShape({ district }: { district: string }) {
  const target = shapeName(district)
  const subject = TN_DISTRICT_PATHS.find((d) => d.name === target)

  return (
    <svg
      viewBox={TN_MAP_VIEWBOX}
      role="img"
      aria-label={`${district} shown within Tamil Nadu`}
      className="w-full h-auto"
    >
      {/* The rest of the state, quiet. */}
      {TN_DISTRICT_PATHS.map((d) => (
        <path
          key={d.name}
          d={d.d}
          fill="#E6ECF6"
          stroke="#CBD5E8"
          strokeWidth={1.2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
      {/* The subject, and a gold edge so it reads at any size. */}
      {subject && (
        <path
          d={subject.d}
          fill="#0C1525"
          stroke="#C9A84C"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  )
}
