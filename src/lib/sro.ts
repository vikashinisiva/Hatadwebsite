/**
 * SRO Cache — Village → Sub-Registrar Office lookup
 * 24,729 Tamil Nadu villages mapped to their SRO details.
 * Includes fuzzy matching for transliteration variants.
 */

import sroData from '@/data/sro_cache.json'

export interface SROEntry {
  zone: string
  district: string
  sro: string
  village: string
}

const cache = sroData as Record<string, SROEntry>

// ---------------------------------------------------------------------------
// Tamil transliteration normalization
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  let n = s.toLowerCase().trim()
  // Common Tamil transliteration collapses
  n = n.replace(/th/g, 't')
  n = n.replace(/sh/g, 's')
  n = n.replace(/ch/g, 's')
  n = n.replace(/ee/g, 'i')
  n = n.replace(/oo/g, 'u')
  n = n.replace(/ai/g, 'ay')
  n = n.replace(/ou/g, 'ow')
  // Collapse double consonants
  n = n.replace(/kk/g, 'k')
  n = n.replace(/pp/g, 'p')
  n = n.replace(/tt/g, 't')
  n = n.replace(/ll/g, 'l')
  n = n.replace(/nn/g, 'n')
  n = n.replace(/mm/g, 'm')
  n = n.replace(/rr/g, 'r')
  n = n.replace(/ss/g, 's')
  // Common suffix variants
  n = n.replace(/puram$/, 'puram')
  n = n.replace(/buram$/, 'puram')
  n = n.replace(/nalloor$/, 'nalur')
  n = n.replace(/nallur$/, 'nalur')
  n = n.replace(/mangalam$/, 'mangalam')
  // Strip non-alphanumeric
  n = n.replace(/[^a-z0-9]/g, '')
  return n
}

// ---------------------------------------------------------------------------
// Levenshtein distance (for fuzzy fallback)
// ---------------------------------------------------------------------------

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  if (m === 0) return n
  if (n === 0) return m
  // Optimize: if length difference > threshold, skip
  if (Math.abs(m - n) > 3) return Math.abs(m - n)

  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  )

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }
  return dp[m][n]
}

// ---------------------------------------------------------------------------
// Pre-build normalized index for fast lookup
// ---------------------------------------------------------------------------

let normalizedIndex: Map<string, string[]> | null = null

function getNormalizedIndex(): Map<string, string[]> {
  if (normalizedIndex) return normalizedIndex
  normalizedIndex = new Map()
  for (const key of Object.keys(cache)) {
    const norm = normalize(key)
    const existing = normalizedIndex.get(norm) || []
    existing.push(key)
    normalizedIndex.set(norm, existing)
  }
  return normalizedIndex
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Look up SRO for a village name. Uses:
 * 1. Exact match (lowercase)
 * 2. Normalized match (transliteration-aware)
 * 3. Fuzzy match (Levenshtein ≤ 2) within same district if provided
 */
export function lookupSRO(villageName: string, district?: string): SROEntry | null {
  if (!villageName?.trim()) return null

  const key = villageName.toLowerCase().trim().replace(/[.\s]+$/, '') // strip trailing dots/spaces

  // 1. Exact match
  if (cache[key]) return cache[key]

  // 2. Normalized match
  const norm = normalize(key)
  const index = getNormalizedIndex()
  const normMatches = index.get(norm)
  if (normMatches?.length) {
    // If district provided, prefer match in same district
    if (district) {
      const districtNorm = district.toLowerCase()
      const districtMatch = normMatches.find((k) => cache[k].district.toLowerCase() === districtNorm)
      if (districtMatch) return cache[districtMatch]
    }
    return cache[normMatches[0]]
  }

  // 3. Fuzzy match (only if district provided to narrow scope)
  if (district) {
    const districtNorm = district.toLowerCase()
    let bestKey: string | null = null
    let bestDist = Infinity

    for (const [k, entry] of Object.entries(cache)) {
      // Partial district match — "Coimbatore" matches "Coimbatore South", "Coimbatore North"
      const entryDist = entry.district.toLowerCase()
      if (entryDist !== districtNorm && !entryDist.startsWith(districtNorm) && !districtNorm.startsWith(entryDist)) continue
      const d = levenshtein(norm, normalize(k))
      if (d < bestDist && d <= 3) {
        bestDist = d
        bestKey = k
      }
    }

    if (bestKey) return cache[bestKey]
  }

  // 4. Last resort — try without district constraint (broader fuzzy)
  if (norm.length >= 5) {
    let bestKey: string | null = null
    let bestDist = Infinity

    for (const [k] of Object.entries(cache)) {
      const d = levenshtein(norm, normalize(k))
      if (d < bestDist && d <= 2) {
        bestDist = d
        bestKey = k
      }
    }

    if (bestKey) return cache[bestKey]
  }

  return null
}

/**
 * Get all unique villages for a district.
 */
export function getVillagesForDistrict(district: string): string[] {
  const districtLower = district.toLowerCase()
  const villages: string[] = []
  for (const entry of Object.values(cache)) {
    if (entry.district.toLowerCase() === districtLower) {
      villages.push(entry.village)
    }
  }
  return [...new Set(villages)].sort()
}

/**
 * Get all unique SRO offices for a district.
 */
export function getSROsForDistrict(district: string): string[] {
  const districtLower = district.toLowerCase()
  const sros: string[] = []
  for (const entry of Object.values(cache)) {
    if (entry.district.toLowerCase() === districtLower) {
      sros.push(entry.sro)
    }
  }
  return [...new Set(sros)].sort()
}
