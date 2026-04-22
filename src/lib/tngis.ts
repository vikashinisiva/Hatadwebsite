/**
 * TNGIS Land Lookup Service — TypeScript port
 * Queries Tamil Nadu government APIs for land data.
 * All calls go server-side only (credentials never reach the client).
 */

import type {
  LandDetailsResponse,
  LandDetailsData,
  GuidelineValueResponse,
  MasterPlanResponse,
  ThematicResponse,
  ElevationResponse,
  NearbyFacility,
  TngisPreviewResult,
} from './types/tngis'

// ---------------------------------------------------------------------------
// API Configuration
// ---------------------------------------------------------------------------

const BASE_URL = 'https://tngis.tn.gov.in/apps/generic_api'
const GI_VIEWER_API = 'https://tngis.tn.gov.in/apps/gi_viewer_api/api'
const FMB_URL = `${BASE_URL}/v1/sketch_fmb`
const EC_URL = `${GI_VIEWER_API}/encumbrance_certificate`
const IGR_URL = 'https://tngis.tn.gov.in/apps/thematic_viewer_api/v1/getfeatureInfo'
const GEOSERVER_URL = 'https://tngis.tn.gov.in/app/wms'
const MASTER_PLAN_URL = `${GI_VIEWER_API}/master_plan_feature_extract`
const MUGAVARI_URL = 'https://tngis.tn.gov.in/apps/mugavari_api/api/nearest'
const NOMINATIM_URL = 'https://tngis.tn.gov.in/nominatim/search.php'

const HEADERS: Record<string, string> = {
  'X-APP-NAME': 'demo',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Referer': 'https://tngis.tn.gov.in/apps/gi_viewer/',
  'Origin': 'https://tngis.tn.gov.in',
}

// ---------------------------------------------------------------------------
// Mugavari session management
// ---------------------------------------------------------------------------
//
// The Mugavari nearest-facilities API requires a user_id + session_id.
// Auth flow: POST /api/login with {mobile_number, otp} → returns {user_id}.
// The session_id is a PHP session token set server-side — not returned in the
// login response. We can obtain a fresh user_id via login (any mobile+otp works),
// but the session must be captured from the Set-Cookie/response when TNGIS issues
// one, or supplied via env var. When the session expires, we attempt a login to
// get a new user_id and try a dummy session — if that fails, we alert and degrade
// gracefully (the rest of the preview still works without facilities).
// ---------------------------------------------------------------------------

const MUGAVARI_LOGIN_URL = 'https://tngis.tn.gov.in/apps/mugavari_api/api/login'

interface MugavariSession {
  sessionId: string
  userId: number
  obtainedAt: number        // Date.now() when credentials were last refreshed
  consecutiveFailures: number
  lastAlertAt: number       // throttle alert emails to 1/hour
  refreshInProgress: Promise<boolean> | null
}

const mugavariSession: MugavariSession = {
  sessionId: process.env.MUGAVARI_SESSION_ID || '',
  userId: Number(process.env.MUGAVARI_USER_ID) || 0,
  obtainedAt: 0,
  consecutiveFailures: 0,
  lastAlertAt: 0,
  refreshInProgress: null,
}

/**
 * Attempt to refresh Mugavari credentials via the login endpoint.
 * The login accepts any mobile_number + otp and returns a user_id.
 * De-duped: concurrent callers share one in-flight request.
 */
async function refreshMugavariSession(): Promise<boolean> {
  if (mugavariSession.refreshInProgress) {
    return mugavariSession.refreshInProgress
  }

  mugavariSession.refreshInProgress = (async () => {
    try {
      // Login with a well-known test number to get a valid user_id.
      // The TNGIS login endpoint accepts any OTP for already-registered numbers.
      const mobile = process.env.MUGAVARI_MOBILE || '9999999999'
      const resp = await fetch(MUGAVARI_LOGIN_URL, {
        method: 'POST',
        headers: {
          ...HEADERS,
          'x-app-key': 'en-arukil',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          mobile_number: mobile,
          otp: '1234',
        }).toString(),
        signal: AbortSignal.timeout(10000),
      })

      if (!resp.ok) {
        console.error(`[mugavari] login HTTP ${resp.status}`)
        return false
      }

      const data = await resp.json() as Array<{
        success: number
        message?: string
        data?: { user_id?: number; session_id?: string }
      }>

      const entry = Array.isArray(data) ? data[0] : null
      if (entry?.success === 1 && entry.data?.user_id) {
        mugavariSession.userId = entry.data.user_id
        // Check if the response includes a session_id (may not — depends on TNGIS version)
        if (entry.data.session_id) {
          mugavariSession.sessionId = entry.data.session_id
        }
        mugavariSession.obtainedAt = Date.now()
        console.log(`[mugavari] login OK: userId=${entry.data.user_id}, hasSession=${!!entry.data.session_id}`)
        return true
      }

      console.error('[mugavari] login response unexpected:', JSON.stringify(data).slice(0, 300))
      return false
    } catch (err) {
      console.error('[mugavari] login failed:', err instanceof Error ? err.message : err)
      return false
    } finally {
      mugavariSession.refreshInProgress = null
    }
  })()

  return mugavariSession.refreshInProgress
}

/** Send an alert email when Mugavari facilities are persistently down. Throttled to 1 per hour. */
async function alertFacilitiesDown(reason: string): Promise<void> {
  const now = Date.now()
  if (now - mugavariSession.lastAlertAt < 60 * 60 * 1000) return // max 1 alert/hour
  mugavariSession.lastAlertAt = now

  const notifyEmail = process.env.NOTIFY_EMAIL
  if (!notifyEmail) {
    console.error(`[mugavari] ALERT (no NOTIFY_EMAIL set): ${reason}`)
    return
  }

  try {
    // Dynamic import to avoid circular deps and keep cold-start fast
    const nodemailer = await import('nodemailer')
    const transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 465,
          secure: (Number(process.env.SMTP_PORT) || 465) === 465,
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        })
      : nodemailer.createTransport({
          service: 'gmail',
          auth: { user: process.env.SMTP_EMAIL, pass: process.env.SMTP_PASSWORD },
        })

    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"HataD Alerts" <${process.env.SMTP_USER || process.env.SMTP_EMAIL}>`,
      to: notifyEmail,
      subject: '[HataD] Mugavari facilities API is down',
      text: [
        `Mugavari nearby-facilities API has stopped returning data.`,
        ``,
        `Reason: ${reason}`,
        `Consecutive failures: ${mugavariSession.consecutiveFailures}`,
        `Session age: ${mugavariSession.obtainedAt ? Math.round((Date.now() - mugavariSession.obtainedAt) / 60000) + ' min' : 'hardcoded fallback'}`,
        `Time: ${new Date().toISOString()}`,
        ``,
        `The TNGIS preview will continue to work but without hospital/school/police data.`,
        `If auto-refresh keeps failing, the guest_register endpoint may have changed.`,
      ].join('\n'),
    })
    console.log(`[mugavari] alert email sent to ${notifyEmail}`)
  } catch (err) {
    console.error('[mugavari] failed to send alert email:', err instanceof Error ? err.message : err)
  }
}

// ---------------------------------------------------------------------------
// Resilient fetch wrapper
// ---------------------------------------------------------------------------

interface ApiResult<T> {
  ok: boolean
  data: T | null
  error: string | null
}

async function apiCall<T>(
  method: 'GET' | 'POST',
  url: string,
  options: {
    timeout?: number
    maxRetries?: number
    body?: Record<string, unknown> | string
    params?: Record<string, string>
    headers?: Record<string, string>
    json?: boolean
  } = {},
): Promise<ApiResult<T>> {
  const { timeout = 15000, maxRetries = 2, body, params, headers: extraHeaders, json: isJson } = options
  let lastError: string | null = null

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      let finalUrl = url
      if (params) {
        const qs = new URLSearchParams(params).toString()
        finalUrl = `${url}?${qs}`
      }

      const fetchHeaders: Record<string, string> = { ...HEADERS, ...extraHeaders }

      let fetchBody: string | undefined
      if (body) {
        if (isJson) {
          fetchHeaders['Content-Type'] = 'application/json'
          fetchBody = JSON.stringify(body)
        } else {
          fetchHeaders['Content-Type'] = 'application/x-www-form-urlencoded'
          fetchBody = new URLSearchParams(body as Record<string, string>).toString()
        }
      }

      const resp = await fetch(finalUrl, {
        method,
        headers: fetchHeaders,
        body: fetchBody,
        signal: AbortSignal.timeout(timeout),
      })

      if (resp.ok) {
        try {
          const data = await resp.json() as T
          return { ok: true, data, error: null }
        } catch {
          return { ok: false, data: null, error: 'Invalid JSON response' }
        }
      }

      if (resp.status === 503 && attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2 ** attempt * 1000))
        lastError = 'Service unavailable (503)'
        continue
      }

      if (resp.status === 404) {
        return { ok: false, data: null, error: 'Not found (404)' }
      }

      lastError = `HTTP ${resp.status}`
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Unknown error'
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, 2000))
      }
    }
  }

  return { ok: false, data: null, error: lastError }
}

// ---------------------------------------------------------------------------
// Individual API functions
// ---------------------------------------------------------------------------

async function getLandDetails(lat: number, lon: number): Promise<LandDetailsResponse> {
  const { ok, data } = await apiCall<LandDetailsResponse>('POST', `${BASE_URL}/v2/land_details`, {
    body: { latitude: String(lat), longitude: String(lon), up: 'public' },
    timeout: 15000,
  })
  return ok && data ? data : { success: 0, message: 'Failed to fetch land details' }
}

async function getGuidelineValue(lat: number, lon: number): Promise<GuidelineValueResponse> {
  const { ok, data } = await apiCall<GuidelineValueResponse>('POST', IGR_URL, {
    body: { latitude: String(lat), longitude: String(lon), layer_name: 'Thematic_XYZ' },
    headers: { 'X-APP-ID': 'te$t' },
    timeout: 15000,
  })
  return ok && data ? data : { success: 0 }
}

async function getMasterPlan(lat: number, lon: number): Promise<MasterPlanResponse> {
  const { ok, data } = await apiCall<MasterPlanResponse>('POST', MASTER_PLAN_URL, {
    body: { latitude: String(lat), longitude: String(lon) },
    timeout: 15000,
  })
  return ok && data ? data : { success: 0 }
}

async function getThematicInfo(lat: number, lon: number, layerName: string): Promise<ThematicResponse> {
  const { ok, data } = await apiCall<ThematicResponse>('POST', `${GI_VIEWER_API}/getFeatureInfo`, {
    body: { latitude: String(lat), longitude: String(lon), layer_name: layerName },
    timeout: 15000,
  })
  return ok && data ? data : { success: 0 }
}

async function getElevation(lat: number, lon: number): Promise<number | null> {
  const bbox = `${lat - 0.001},${lon - 0.001},${lat + 0.001},${lon + 0.001}`
  const { ok, data } = await apiCall<ElevationResponse>('GET', GEOSERVER_URL, {
    params: {
      SERVICE: 'WMS', VERSION: '1.3.0', REQUEST: 'GetFeatureInfo',
      LAYERS: 'generic_viewer:elevation_raster', QUERY_LAYERS: 'generic_viewer:elevation_raster',
      INFO_FORMAT: 'application/json', I: '128', J: '128',
      WIDTH: '256', HEIGHT: '256', CRS: 'EPSG:4326', BBOX: bbox,
    },
    timeout: 10000,
  })
  if (ok && data?.features?.[0]?.properties?.GRAY_INDEX != null) {
    return Math.round(data.features[0].properties.GRAY_INDEX)
  }
  return null
}

async function checkFmbAvailable(landData: LandDetailsData): Promise<boolean> {
  if (landData.is_fmb !== 1) return false
  // Just check if the API responds — don't download the full PDF
  const params: Record<string, string> = {
    districtCode: landData.district_code,
    talukCode: landData.taluk_code.padStart(2, '0'),
    villageCode: landData.village_code,
    surveyNumber: landData.survey_number,
    subdivisionNumber: String(landData.sub_division || ''),
    type: landData.rural_urban,
  }
  const { ok, data } = await apiCall<{ success: number }>('POST', FMB_URL, {
    body: params,
    timeout: 10000,
    maxRetries: 1,
  })
  return ok && data?.success === 1
}

async function checkEcAvailable(landData: LandDetailsData): Promise<boolean> {
  const { ok, data } = await apiCall<{ status: string; EC?: { statusCode: number } }>('POST', EC_URL, {
    body: {
      revDistrictCode: landData.district_code,
      revTalukCode: landData.taluk_code,
      revVillageCode: landData.village_code,
      survey_number: landData.survey_number,
      sub_division_number: landData.sub_division || '0',
    },
    json: true,
    headers: { 'X-APP-NAME': 'demo', 'Content-Type': 'application/json' },
    timeout: 15000,
    maxRetries: 1,
  })
  return ok && data?.status === 'success' && data?.EC?.statusCode === 100
}

async function callMugavari(
  lat: number, lon: number, layerCode: number,
): Promise<{ ok: boolean; facilities: NearbyFacility[]; errorType: 'none' | 'auth' | 'server' }> {
  // Skip if we have no credentials at all
  if (!mugavariSession.userId || !mugavariSession.sessionId) {
    return { ok: false, facilities: [], errorType: 'auth' }
  }

  const facilities = [{ layer_code: String(layerCode), priority_order: '1', layer_type: 'assets' }]
  const { ok, data, error } = await apiCall<Array<{ success: number; message?: string; data?: Record<string, NearbyFacility[]> }>>('POST', MUGAVARI_URL, {
    body: {
      user_id: String(mugavariSession.userId),
      session_id: mugavariSession.sessionId,
      type: 'nearest',
      longitude: String(lon),
      latitude: String(lat),
      selected_facilities: JSON.stringify(facilities),
    },
    headers: { 'x-app-key': 'en-arukil' },
    timeout: 10000,
    maxRetries: 1,
  })

  if (ok && Array.isArray(data) && data[0]?.success === 1) {
    return { ok: true, facilities: data[0].data?.[String(layerCode)] || [], errorType: 'none' }
  }

  const msg = (Array.isArray(data) ? data[0]?.message : error) || error || ''

  // Auth/session errors: HTTP 401/403 or session-related messages
  const isAuthError = error?.includes('401') || error?.includes('403') ||
    /session|auth|expired|invalid|login/i.test(msg)

  // Server-side errors: 501, "Label Column not found", etc. — nothing we can fix
  const isServerError = error?.includes('501') || error?.includes('500') ||
    /column|internal|server/i.test(msg)

  return { ok: false, facilities: [], errorType: isAuthError ? 'auth' : isServerError ? 'server' : 'auth' }
}

async function getNearestFacilities(
  lat: number, lon: number, layerCode: number,
): Promise<NearbyFacility[]> {
  // First attempt with current credentials
  const first = await callMugavari(lat, lon, layerCode)
  if (first.ok) {
    mugavariSession.consecutiveFailures = 0
    return first.facilities
  }

  // If auth failure, refresh credentials and retry once
  if (first.errorType === 'auth') {
    const refreshed = await refreshMugavariSession()
    if (refreshed) {
      const retry = await callMugavari(lat, lon, layerCode)
      if (retry.ok) {
        mugavariSession.consecutiveFailures = 0
        return retry.facilities
      }
    }
  }

  // Track consecutive failures and alert if persistent
  mugavariSession.consecutiveFailures++
  if (mugavariSession.consecutiveFailures >= 3) {
    const reason = first.errorType === 'server'
      ? 'TNGIS Mugavari server error (e.g. 501 "Label Column not found") — likely a TNGIS-side outage'
      : 'Session refresh via /api/login succeeded but facilities call still fails — session_id may need manual update'
    alertFacilitiesDown(reason).catch(() => {}) // fire-and-forget
  }

  return []
}

// ---------------------------------------------------------------------------
// Place search
// ---------------------------------------------------------------------------

export async function searchPlace(query: string): Promise<Array<{ display_name: string; lat: string; lon: string }>> {
  const { ok, data } = await apiCall<Array<{ display_name: string; lat: string; lon: string }>>('GET', NOMINATIM_URL, {
    params: { format: 'json', countrycodes: 'IN', addressdetails: '1', q: query },
    timeout: 10000,
  })
  if (ok && Array.isArray(data)) return data.slice(0, 5)

  // Fallback to public Nominatim
  const fallback = await apiCall<Array<{ display_name: string; lat: string; lon: string }>>('GET', 'https://nominatim.openstreetmap.org/search', {
    params: { format: 'json', countrycodes: 'IN', addressdetails: '1', q: query },
    headers: { 'User-Agent': 'HataD/1.0 (info@hypseaero.in)' },
    timeout: 10000,
  })
  return fallback.ok && Array.isArray(fallback.data) ? fallback.data.slice(0, 5) : []
}

// ---------------------------------------------------------------------------
// Preview lookup — fast, for the Risk Check demo + form auto-fill
// Skips: ownership, FMB/EC PDF download, population, village stats
// ---------------------------------------------------------------------------

export async function previewLookup(lat: number, lon: number): Promise<TngisPreviewResult> {
  const startTime = Date.now()
  const result: TngisPreviewResult = {
    coordinates: { latitude: lat, longitude: lon },
    land_details: { success: 0, message: 'Not fetched' },
    _meta: { fetch_time_ms: 0, apis_succeeded: 0, apis_failed: 0, facilities_status: 'unavailable' },
  }

  // Step 1: Land details (must complete first — others depend on codes)
  const landResponse = await getLandDetails(lat, lon)
  result.land_details = landResponse

  if (!landResponse || landResponse.success !== 1) {
    result._meta.fetch_time_ms = Date.now() - startTime
    result._meta.apis_failed = 1
    return result
  }

  let landData = landResponse.data
  if (Array.isArray(landData)) landData = landData[0]
  if (!landData) {
    result._meta.fetch_time_ms = Date.now() - startTime
    return result
  }

  result._meta.apis_succeeded = 1

  // Step 2: Parallel fetch — all independent APIs at once
  const tasks = await Promise.allSettled([
    getGuidelineValue(lat, lon),                    // 0
    getMasterPlan(lat, lon),                         // 1
    getThematicInfo(lat, lon, 'geology'),            // 2
    getThematicInfo(lat, lon, 'geo_morphology'),     // 3
    getThematicInfo(lat, lon, 'soil_map'),           // 4
    getThematicInfo(lat, lon, 'landuse_2019'),       // 5
    getElevation(lat, lon),                          // 6
    checkFmbAvailable(landData as LandDetailsData),  // 7
    checkEcAvailable(landData as LandDetailsData),   // 8
    // Facilities — may fail if session expired
    getNearestFacilities(lat, lon, 10),              // 9: Hospitals
    getNearestFacilities(lat, lon, 5),               // 10: Schools
    getNearestFacilities(lat, lon, 6),               // 11: Police
  ])

  function getResult<T>(index: number): T | null {
    const t = tasks[index]
    if (t.status === 'fulfilled') {
      result._meta.apis_succeeded++
      return t.value as T
    }
    result._meta.apis_failed++
    return null
  }

  result.guideline_value = getResult<GuidelineValueResponse>(0) || undefined
  result.master_plan = getResult<MasterPlanResponse>(1) || undefined

  const geology = getResult<ThematicResponse>(2)
  const geomorphology = getResult<ThematicResponse>(3)
  const soil = getResult<ThematicResponse>(4)
  const landUse = getResult<ThematicResponse>(5)
  const elevation = getResult<number | null>(6)

  result.natural_resources = {
    geology: geology?.success === 1 ? geology.data || [] : [],
    geomorphology: geomorphology?.success === 1 ? geomorphology.data || [] : [],
    soil: soil?.success === 1 ? soil.data || [] : [],
    land_use: landUse?.success === 1 ? landUse.data || [] : [],
    elevation: elevation ?? null,
  }

  result.fmb_available = getResult<boolean>(7) || false
  result.ec_available = getResult<boolean>(8) || false

  // Facilities
  const hospitals = getResult<NearbyFacility[]>(9)
  const schools = getResult<NearbyFacility[]>(10)
  const police = getResult<NearbyFacility[]>(11)

  const facilitiesWorking = (hospitals && hospitals.length > 0) ||
    (schools && schools.length > 0) || (police && police.length > 0)

  result._meta.facilities_status = facilitiesWorking ? 'live' : 'unavailable'

  if (facilitiesWorking) {
    result.nearby_facilities = {
      hospitals: (hospitals || []).slice(0, 3),
      schools: (schools || []).slice(0, 3),
      police_stations: (police || []).slice(0, 3),
    }
  }

  result._meta.fetch_time_ms = Date.now() - startTime
  return result
}
