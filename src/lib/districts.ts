import { TN_DISTRICTS } from './constants'
import { SRO_CACHE, type SROEntry } from './sro'
import { toRevenueDistrict } from './district-map'

export { REGISTRATION_TO_REVENUE, toRevenueDistrict, sameDistrict } from './district-map'

/**
 * Offices the data marks closed, or as a joint sub-office.
 *
 * 121 of the 614 names carry one of these markers. A closed office must never
 * get its own page — it would be a page about somewhere that does not exist —
 * but its villages still belong to the district, and its historical register is
 * still where that village's older transactions are. So they are separated
 * rather than discarded.
 */
const CLOSED = /closed/i

/**
 * Municipal wards filed alongside villages.
 *
 * 2,359 of the 24,729 rows are town or city wards, not villages: "1 Ward",
 * "13dharmapuri Ward 13". Both are real jurisdictions an office serves, but
 * calling a ward a village is wrong, and the district pages were doing exactly
 * that — Coimbatore was reported as 278 villages when it is 239 villages and
 * 39 wards.
 */
const WARD = /\bward\b/i

/**
 * Tidies a place name for display without changing which place it is.
 *
 * The source is a government export and reads like one: ALL CAPS on 2,306
 * rows, leading serial numbers on 227, underscores standing in for spaces on
 * 251, doubled spaces on 303. Rendering that raw looks like a database dump
 * rather than a page, so it is normalised on the way out. The mapping is never
 * written back to the data file, which stays exactly as TNREGINET produced it.
 */
export function normalizePlaceName(raw: string): string {
  const seg = (t: string) =>
    t.length === 1 ? t.toUpperCase() : t.charAt(0).toUpperCase() + t.slice(1).toLowerCase()

  const word = (w: string) => {
    // Lead punctuation like "(Neeravi)" must not eat the capital.
    const lead = w.match(/^[^\p{L}]*/u)?.[0] ?? ''
    const rest = w.slice(lead.length)
    const cased = rest.includes('.') ? rest.split('.').map(seg).join('.') : seg(rest)
    return lead + cased
  }

  return raw
    .replace(/_/g, ' ')
    .replace(/^\s*\d+\s*[.-]?\s*/, '')
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(word)
    .join(' ')
}

export type SROProfile = {
  name: string
  /** Cleaned village names this office serves, alphabetical. */
  villages: string[]
  /** Cleaned ward names, kept separate from villages. */
  wards: string[]
}

export type DistrictProfile = {
  district: string
  /** Registration districts that roll up into it. */
  registrationDistricts: string[]
  zones: string[]
  villageCount: number
  /** Offices that can be linked to, largest first. */
  activeSROs: SROProfile[]
  /** Town and city wards, which are not villages and are counted apart. */
  wardCount: number
  /** Other revenue districts sharing this one's registration zone. */
  zoneSiblings: string[]
  /** Shut, but still holding the older register for their former villages. */
  closedSROs: string[]
}

/** Everything known about one revenue district. Built once, then cached. */
let profiles: Map<string, DistrictProfile> | null = null

function build(): Map<string, DistrictProfile> {
  type Acc = {
    reg: Set<string>
    zones: Set<string>
    active: Map<string, { villages: Set<string>; wards: Set<string> }>
    closed: Set<string>
  }
  const acc = new Map<string, Acc>()

  for (const entry of Object.values(SRO_CACHE) as SROEntry[]) {
    const key = toRevenueDistrict(entry.district)
    let row = acc.get(key)
    if (!row) {
      row = { reg: new Set(), zones: new Set(), active: new Map(), closed: new Set() }
      acc.set(key, row)
    }
    row.reg.add(entry.district)
    row.zones.add(entry.zone)

    if (CLOSED.test(entry.sro)) {
      row.closed.add(entry.sro)
      continue
    }
    let office = row.active.get(entry.sro)
    if (!office) {
      office = { villages: new Set(), wards: new Set() }
      row.active.set(entry.sro, office)
    }
    const place = normalizePlaceName(entry.village)
    if (place) (WARD.test(entry.village) ? office.wards : office.villages).add(place)
  }

  /* Which districts share a registration zone. Built across the whole set
     first, because a district cannot know its own siblings in isolation. */
  const byZone = new Map<string, Set<string>>()
  for (const [district, r] of acc) {
    for (const z of r.zones) {
      if (!byZone.has(z)) byZone.set(z, new Set())
      byZone.get(z)!.add(district)
    }
  }

  const out = new Map<string, DistrictProfile>()
  for (const [district, r] of acc) {
    const offices: SROProfile[] = [...r.active]
      .map(([name, o]) => ({
        name,
        villages: [...o.villages].sort((a, b) => a.localeCompare(b)),
        wards: [...o.wards].sort((a, b) => a.localeCompare(b)),
      }))
      .sort((a, b) => b.villages.length - a.villages.length || a.name.localeCompare(b.name))

    const siblings = new Set<string>()
    for (const z of r.zones) for (const d of byZone.get(z) ?? []) if (d !== district) siblings.add(d)

    out.set(district, {
      district,
      registrationDistricts: [...r.reg].sort(),
      zones: [...r.zones].sort(),
      villageCount: offices.reduce((n, o) => n + o.villages.length, 0),
      wardCount: offices.reduce((n, o) => n + o.wards.length, 0),
      activeSROs: offices,
      closedSROs: [...r.closed].sort(),
      zoneSiblings: [...siblings].sort(),
    })
  }
  return out
}

export function districtProfile(district: string): DistrictProfile | null {
  profiles ??= build()
  return profiles.get(district) ?? null
}

/** Districts that actually resolve to data. The list a page generator walks. */
export function coveredDistricts(): string[] {
  profiles ??= build()
  return TN_DISTRICTS.filter((d) => profiles!.has(d))
}

/** URL form of a district name. "Tiruchirappalli" -> "tiruchirappalli". */
export function districtSlug(district: string): string {
  return district.toLowerCase().replace(/\s+/g, '-')
}

/** The reverse, resolved against the real list so an unknown slug is null. */
export function districtFromSlug(slug: string): string | null {
  return coveredDistricts().find((d) => districtSlug(d) === slug) ?? null
}

/**
 * The district outline file spells four of them differently from the revenue
 * list. Kept here rather than edited into the generated geometry, which is
 * derived from a published shapefile and should stay as it was produced.
 */
const SHAPE_ALIAS: Record<string, string> = {
  Kancheepuram: 'Kanchipuram',
  Kanyakumari: 'Kanniyakumari',
  Tiruvallur: 'Thiruvallur',
  Tiruvarur: 'Thiruvarur',
}

/** The name this district goes by in TN_DISTRICT_PATHS. */
export function shapeName(district: string): string {
  return SHAPE_ALIAS[district] ?? district
}

/**
 * Where the district data comes from, and when.
 *
 * Every figure on a district page is derived from this one file, which was
 * retrieved from TNREGINET, the Registration Department's own portal. Third
 * party directories publish different totals; where they disagree with the
 * department, the department is right and they are stale.
 *
 * The date is when the file entered this repository, so it is the latest
 * defensible "as at". Update both when the data is pulled again: offices open
 * and close, and 30 in the current set are already marked closed.
 */
export const DISTRICT_DATA_SOURCE = {
  name: 'TNREGINET, Tamil Nadu Registration Department',
  url: 'https://tnreginet.gov.in',
  retrieved: 'March 2026',
} as const

/**
 * Districts whose page is finished enough to advertise.
 *
 * A district page earns its place on the strength of the statutory checks that
 * apply *there*; without them it is a table and some boilerplate, which is the
 * shape the March 2026 update penalised. The other 33 routes still exist and
 * still render honestly, they are simply not put in the sitemap until their
 * local checks are researched and verified.
 */
export function publishableDistricts(localChecks: Record<string, unknown>): string[] {
  return coveredDistricts().filter((d) => localChecks[d.toUpperCase()] !== undefined)
}
