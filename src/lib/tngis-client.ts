/**
 * TNGIS Client-Side Lookup — runs directly from the user's browser.
 * Works because the user is in India and TNGIS allows browser requests.
 */

const BASE_URL = 'https://tngis.tn.gov.in/apps/generic_api'
const GI_VIEWER_API = 'https://tngis.tn.gov.in/apps/gi_viewer_api/api'
const IGR_URL = 'https://tngis.tn.gov.in/apps/thematic_viewer_api/v1/getfeatureInfo'
const GEOSERVER_URL = 'https://tngis.tn.gov.in/app/wms'
const FMB_URL = `${BASE_URL}/v1/sketch_fmb`
const EC_URL = `${GI_VIEWER_API}/encumbrance_certificate`
const MASTER_PLAN_URL = `${GI_VIEWER_API}/master_plan_feature_extract`

const HEADERS: Record<string, string> = {
  'X-APP-NAME': 'demo',
}

// ---------------------------------------------------------------------------
// Simple fetch wrapper
// ---------------------------------------------------------------------------

async function tngisPost<T>(url: string, body: Record<string, string>, opts?: { json?: boolean; timeout?: number; headers?: Record<string, string> }): Promise<T | null> {
  try {
    const headers: Record<string, string> = { ...HEADERS, ...opts?.headers }
    let fetchBody: string
    if (opts?.json) {
      headers['Content-Type'] = 'application/json'
      fetchBody = JSON.stringify(body)
    } else {
      headers['Content-Type'] = 'application/x-www-form-urlencoded'
      fetchBody = new URLSearchParams(body).toString()
    }

    const resp = await fetch(url, {
      method: 'POST',
      headers,
      body: fetchBody,
      signal: AbortSignal.timeout(opts?.timeout || 12000),
    })

    if (!resp.ok) return null
    return await resp.json() as T
  } catch {
    return null
  }
}

async function tngisGet<T>(url: string, params: Record<string, string>, timeout = 10000): Promise<T | null> {
  try {
    const qs = new URLSearchParams(params).toString()
    const resp = await fetch(`${url}?${qs}`, {
      method: 'GET',
      headers: HEADERS,
      signal: AbortSignal.timeout(timeout),
    })
    if (!resp.ok) return null
    return await resp.json() as T
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Types (inline — no import from server types needed)
// ---------------------------------------------------------------------------

interface LandData {
  district_code: string
  district_name: string
  taluk_code: string
  taluk_name: string
  village_code: string
  village_name: string
  survey_number: string
  sub_division: string | null
  is_fmb: number
  ulpin?: string
  rural_urban: string
  centroid?: string
  [key: string]: unknown
}

interface LandResponse { success: number; message?: string; data?: LandData | LandData[] }
interface GuidelineResponse { success: number; data?: Array<{ metric_rate: string; unit_id: string; land_name: string; land_type_grouping: string }> }
interface ThematicResponse { success: number; data?: Array<Record<string, string | number | null>> }
interface MasterPlanResponse { success: number; data?: { lpa_boundary?: { lpa_name: string } } }
interface ElevationResponse { features?: Array<{ properties?: { GRAY_INDEX?: number } }> }

export interface ClientLookupResult {
  land: LandData | null
  guidelineValue: { rate: string; unit: string; landName: string; grouping: string } | null
  elevation: number | null
  geology: string | null
  masterPlan: string | null
  fmbAvailable: boolean
  ecAvailable: boolean
  fetchTimeMs: number
}

// ---------------------------------------------------------------------------
// Main lookup — runs in the user's browser
// ---------------------------------------------------------------------------

export async function clientLookup(lat: number, lon: number): Promise<ClientLookupResult> {
  const start = Date.now()
  const result: ClientLookupResult = {
    land: null, guidelineValue: null, elevation: null, geology: null,
    masterPlan: null, fmbAvailable: false, ecAvailable: false, fetchTimeMs: 0,
  }

  // Step 1: Land details (must complete first)
  const landResp = await tngisPost<LandResponse>(`${BASE_URL}/v2/land_details`, {
    latitude: String(lat), longitude: String(lon), up: 'public',
  })

  if (!landResp || landResp.success !== 1) {
    result.fetchTimeMs = Date.now() - start
    return result
  }

  const land = Array.isArray(landResp.data) ? landResp.data[0] : landResp.data
  if (!land) {
    result.fetchTimeMs = Date.now() - start
    return result
  }
  result.land = land

  // Step 2: Parallel fetch
  const [gv, geo, masterPlan, elevation, fmb, ec] = await Promise.allSettled([
    // Guideline value
    tngisPost<GuidelineResponse>(IGR_URL, {
      latitude: String(lat), longitude: String(lon), layer_name: 'Thematic_XYZ',
    }, { headers: { 'X-APP-ID': 'te$t' } }),

    // Geology
    tngisPost<ThematicResponse>(`${GI_VIEWER_API}/getFeatureInfo`, {
      latitude: String(lat), longitude: String(lon), layer_name: 'geology',
    }),

    // Master plan
    tngisPost<MasterPlanResponse>(MASTER_PLAN_URL, {
      latitude: String(lat), longitude: String(lon),
    }),

    // Elevation
    tngisGet<ElevationResponse>(GEOSERVER_URL, {
      SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetFeatureInfo',
      LAYERS: 'generic_viewer:elevation_raster', QUERY_LAYERS: 'generic_viewer:elevation_raster',
      INFO_FORMAT: 'application/json', I: '128', J: '128',
      WIDTH: '256', HEIGHT: '256', CRS: 'EPSG:4326',
      BBOX: `${lat - 0.001},${lon - 0.001},${lat + 0.001},${lon + 0.001}`,
    }),

    // FMB check
    tngisPost<{ success: number }>(`${FMB_URL}`, {
      districtCode: land.district_code,
      talukCode: land.taluk_code.padStart(2, '0'),
      villageCode: land.village_code,
      surveyNumber: land.survey_number,
      subdivisionNumber: String(land.sub_division || ''),
      type: land.rural_urban,
    }, { timeout: 8000 }),

    // EC check
    tngisPost<{ status: string; EC?: { statusCode: number } }>(EC_URL, {
      revDistrictCode: land.district_code,
      revTalukCode: land.taluk_code,
      revVillageCode: land.village_code,
      survey_number: land.survey_number,
      sub_division_number: land.sub_division || '0',
    }, { json: true, timeout: 10000, headers: { 'Content-Type': 'application/json' } }),
  ])

  // Process results
  if (gv.status === 'fulfilled' && gv.value?.success === 1 && gv.value.data?.[0]) {
    const d = gv.value.data[0]
    if (Number(d.metric_rate) > 0) {
      result.guidelineValue = { rate: d.metric_rate, unit: d.unit_id, landName: d.land_name, grouping: d.land_type_grouping }
    }
  }

  if (geo.status === 'fulfilled' && geo.value?.success === 1 && geo.value.data?.[0]) {
    const g = geo.value.data[0]
    result.geology = (g.rock_type as string) || (g.lith_unit as string) || null
  }

  if (masterPlan.status === 'fulfilled' && masterPlan.value?.data?.lpa_boundary?.lpa_name) {
    result.masterPlan = masterPlan.value.data.lpa_boundary.lpa_name
  }

  if (elevation.status === 'fulfilled' && elevation.value?.features?.[0]?.properties?.GRAY_INDEX != null) {
    result.elevation = Math.round(elevation.value.features[0].properties.GRAY_INDEX)
  }

  if (fmb.status === 'fulfilled' && fmb.value?.success === 1) {
    result.fmbAvailable = true
  }

  if (ec.status === 'fulfilled' && ec.value?.status === 'success' && ec.value?.EC?.statusCode === 100) {
    result.ecAvailable = true
  }

  result.fetchTimeMs = Date.now() - start
  return result
}
