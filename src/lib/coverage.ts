import SRO_CACHE from '@/data/sro_cache.json'
import { TN_DISTRICTS } from '@/lib/constants'

/**
 * Coverage figures, counted from the SRO cache rather than typed into copy.
 *
 * SERVER ONLY. sro_cache.json is 3.4 MB; importing this from a client component
 * would ship the whole village table to the browser to display four numbers.
 * Call it from a server component and pass the result down as props.
 *
 * The numbers are computed once at module load, which for a statically rendered
 * page means once at build time.
 */

export type Coverage = {
  /** Distinct villages in the lookup table. */
  villages: number
  /** Distinct sub-registrar offices, keyed with their district — SRO names
   *  repeat across districts, so counting names alone undercounts. */
  sros: number
  /** IGR registration zones. */
  zones: number
  /**
   * Revenue districts, from TN_DISTRICTS.
   *
   * Deliberately NOT counted from the cache: that file lists 56 *registration*
   * districts (Chennai North/South/Central, Coimbatore North, Karaikudi …),
   * which is a different administrative division from the 38 revenue districts
   * the rest of the page refers to. Both are real; conflating them would put a
   * wrong number on the page.
   */
  districts: number
}

type Row = { zone?: string; district?: string; sro?: string; village?: string }

function compute(): Coverage {
  const rows = Object.values(SRO_CACHE as Record<string, Row>)
  const villages = new Set<string>()
  const sros = new Set<string>()
  const zones = new Set<string>()

  for (const r of rows) {
    if (!r?.district) continue
    if (r.village) villages.add(`${r.district}|${r.village}`)
    if (r.sro) sros.add(`${r.district}|${r.sro}`)
    if (r.zone) zones.add(r.zone)
  }

  return {
    villages: villages.size,
    sros: sros.size,
    zones: zones.size,
    districts: TN_DISTRICTS.length,
  }
}

export const COVERAGE: Coverage = compute()
