'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { track } from '@/lib/track'

/* ── Config ─────────────────────────────────────────────── */
const MAP_READY_TIMEOUT = 18000
const CITY_INTERVAL = 20000
const PAN_DELAY = 3000
const PAN_DURATION = 12000
const PAN_OFFSET = 0.004

const CITIES = [
  { name: 'Madurai',     lat: '9.9252° N',  lon: '78.1198° E', center: [78.1198, 9.9252] as [number, number] },
  { name: 'Trichy',      lat: '10.7905° N', lon: '78.7047° E', center: [78.7047, 10.7905] as [number, number] },
  { name: 'Coimbatore',  lat: '11.0168° N', lon: '76.9558° E', center: [76.9558, 11.0168] as [number, number] },
  { name: 'Chennai',     lat: '13.0827° N', lon: '80.2707° E', center: [80.2707, 13.0827] as [number, number] },
]

/* ── Hero ─────────────────────────────────────────────────── */
export function Hero() {
  const [cityIdx, setCityIdx] = useState(0)
  const [phase, setPhase] = useState<'globe' | 'zooming' | 'done'>('globe')
  const mapReadyRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)
  const heroRef = useRef<HTMLElement>(null)
  const cursorGlowRef = useRef<HTMLDivElement>(null)

  // ── Mapbox GL ──
  useEffect(() => {
    if (!mapContainerRef.current) return
    let cancelled = false

    import('mapbox-gl').then((mapboxgl) => {
      if (cancelled || !mapContainerRef.current) return

      if (!document.querySelector('link[href*="mapbox-gl"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.3.0/mapbox-gl.css'
        document.head.appendChild(link)
      }

      mapboxgl.default.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || ''

      const map = new mapboxgl.default.Map({
        container: mapContainerRef.current!,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [79.0, 11.0],
        zoom: 3.5,
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
        antialias: true,
        projection: 'globe',
        fadeDuration: 0,
        trackResize: true,
        refreshExpiredTiles: false,
      })

      mapInstanceRef.current = map

      map.on('style.load', () => {
        map.setFog({
          color: '#F4F7FC',
          'high-color': '#F4F7FC',
          'horizon-blend': 0.15,
          'space-color': '#F4F7FC',
          'star-intensity': 0,
        })
      })

      map.on('load', () => {
        const style = map.getStyle()
        style.layers?.forEach(l => {
          if (l.type === 'symbol') map.removeLayer(l.id)
          if (l.id.includes('building')) map.removeLayer(l.id)
        })

        if (!mapReadyRef.current) {
          mapReadyRef.current = true
          setPhase('zooming')

          const city = CITIES[0]

          // 1. Globe — gentle scan eastward (1.5s)
          setTimeout(() => {
            map.easeTo({ center: [80.0, 20.0], zoom: 3.2, bearing: -10, duration: 2000, easing: (t: number) => t })
          }, 300)

          // 2. Descend toward India — slight overshoot (3s)
          setTimeout(() => {
            map.flyTo({ center: [77.5, 18.0], zoom: 5.5, bearing: -6, duration: 3000, essential: true, curve: 1.1 })
          }, 2500)

          // 3. Correct — find Tamil Nadu (2.5s)
          setTimeout(() => {
            map.flyTo({ center: [78.5, 11.2], zoom: 8.5, bearing: 4, duration: 2500, essential: true, curve: 0.9 })
          }, 5800)

          // 4. Hover — reading the region (2s)
          setTimeout(() => {
            map.easeTo({ center: [78.2, 10.5], zoom: 10, bearing: 0, duration: 2000, easing: (t: number) => t * (2 - t) })
          }, 8500)

          // 5. Drop — lock flat onto city (2.5s)
          setTimeout(() => {
            map.flyTo({ center: city.center, zoom: 15, bearing: 0, pitch: 0, duration: 2500, essential: true, curve: 0.5 })
          }, 10800)

          // 6. Tilt — analysis mode (2s, ease-out)
          setTimeout(() => {
            map.easeTo({ pitch: 55, bearing: 20, duration: 2000, easing: (t: number) => 1 - Math.pow(1 - t, 3) })
          }, 13800)

          // 7. Branding
          setTimeout(() => startReveal(), 16200)
        }
      })
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reveal branding ──
  const startReveal = useCallback(() => {
    setPhase('done')
  }, [])

  // ── Timeout fallback ──
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!mapReadyRef.current) { mapReadyRef.current = true; startReveal() }
    }, MAP_READY_TIMEOUT)
    timersRef.current.push(fallback)
    return () => timersRef.current.forEach(clearTimeout)
  }, [startReveal])

  // ── Fly to new city ──
  const prevCityRef = useRef(0)
  const panTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    if (prevCityRef.current === cityIdx) return
    prevCityRef.current = cityIdx
    const map = mapInstanceRef.current
    if (!map) return
    if (panTimerRef.current) clearTimeout(panTimerRef.current)

    const city = CITIES[cityIdx % CITIES.length]
    const prevCity = CITIES[((cityIdx - 1) + CITIES.length) % CITIES.length]
    const dLon = city.center[0] - prevCity.center[0]
    const dLat = city.center[1] - prevCity.center[1]
    const dist = Math.sqrt(dLon * dLon + dLat * dLat)
    const flyDuration = Math.max(8000, Math.min(20000, dist * 5000))

    map.flyTo({ center: city.center, zoom: 15, pitch: 60, bearing: 30, duration: flyDuration, essential: true, curve: 0.8, speed: 0.3 })

    panTimerRef.current = setTimeout(() => {
      mapInstanceRef.current?.easeTo({
        center: [city.center[0] + PAN_OFFSET, city.center[1] + PAN_OFFSET * 0.5],
        bearing: 0, duration: PAN_DURATION, easing: (t: number) => t,
      })
    }, PAN_DELAY + flyDuration)

    return () => { if (panTimerRef.current) clearTimeout(panTimerRef.current) }
  }, [cityIdx])

  // ── Slow bearing drift ──
  useEffect(() => {
    if (phase !== 'done') return
    const map = mapInstanceRef.current
    if (!map) return

    function startDrift() {
      if (!mapInstanceRef.current) return
      const currentBearing = mapInstanceRef.current.getBearing()
      mapInstanceRef.current.easeTo({ bearing: currentBearing + 20, pitch: 55, duration: 60000, easing: (t: number) => t })
    }

    const t = setTimeout(startDrift, PAN_DELAY)
    const interval = setInterval(startDrift, 63000)
    return () => { clearTimeout(t); clearInterval(interval); mapInstanceRef.current?.stop() }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── City cycling ──
  useEffect(() => {
    if (phase !== 'done') return
    const interval = setInterval(() => setCityIdx(prev => (prev + 1) % CITIES.length), CITY_INTERVAL)
    return () => clearInterval(interval)
  }, [phase])

  // ── Cursor glow ──
  useEffect(() => {
    const hero = heroRef.current
    const glow = cursorGlowRef.current
    if (!hero || !glow) return

    function onMove(e: MouseEvent) {
      const rect = hero!.getBoundingClientRect()
      glow!.style.left = `${e.clientX - rect.left}px`
      glow!.style.top = `${e.clientY - rect.top}px`
      glow!.style.opacity = '1'
    }
    function onLeave() { glow!.style.opacity = '0' }

    hero.addEventListener('mousemove', onMove)
    hero.addEventListener('mouseleave', onLeave)
    return () => { hero.removeEventListener('mousemove', onMove); hero.removeEventListener('mouseleave', onLeave) }
  }, [])

  return (
    <section ref={heroRef} id="hero" className="relative h-[100dvh] min-h-[580px] w-full overflow-hidden bg-[#F4F7FC]">
      {/* ── Cursor glow ── */}
      <div
        ref={cursorGlowRef}
        className="hidden sm:block absolute z-[1] w-64 h-64 rounded-full pointer-events-none opacity-0 transition-opacity duration-300"
        style={{
          background: 'radial-gradient(circle, rgba(27,79,216,0.06) 0%, transparent 70%)',
          transform: 'translate(-50%, -50%)',
        }}
      />

      {/* ── Map (parallax) ── */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          width: '100%', height: '100%',
          zIndex: 0,
          willChange: 'transform',
          filter: 'brightness(0.74) contrast(1.55) saturate(1.18)',
        }}
      />


      {/* ── Branding ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 sm:px-6 pointer-events-none" style={{ contain: 'layout' }}>
        <div className="relative flex flex-col items-center text-center pointer-events-auto w-full max-w-lg sm:max-w-xl md:max-w-2xl lg:max-w-3xl xl:max-w-4xl">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="mt-7 sm:mt-9 text-[10px] sm:text-[11px] font-semibold tracking-[0.28em] uppercase text-[#0C1525]/55"
          >
            Before you sign
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
            className="mt-2.5 sm:mt-3 font-display font-bold tracking-tight leading-[1.08] text-[#0C1525] text-center mx-auto px-2"
            style={{
              fontSize: 'clamp(28px, 6.2vw, 64px)',
              maxWidth: 'min(100%, clamp(320px, 75vw, 900px))',
              textWrap: 'balance',
            }}
          >
            Is this land{' '}
            <em
              className="font-serif text-[#C9A84C]"
              style={{
                fontStyle: 'italic',
                fontSize: '0.88em',
                letterSpacing: '-0.01em',
                lineHeight: 1,
                verticalAlign: 'baseline',
              }}
            >
              actually
            </em>{' '}
            clean?
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="mt-3 sm:mt-4 text-[13.5px] sm:text-[15.5px] md:text-[17px] lg:text-[18px] text-[#0C1525]/70 leading-[1.45] text-center px-2 mx-auto"
            style={{ maxWidth: 'min(100%, clamp(320px, 60vw, 640px))', textWrap: 'balance' }}
          >
            1 in 3 land deals in Tamil Nadu has a legal defect. <span className="text-[#0C1525] font-medium">We find it before you pay.</span>
          </motion.p>

          {/* Verify line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.35 }}
            className="mt-3 sm:mt-4 text-[12px] sm:text-[13.5px] md:text-[14px] text-[#3D5278] leading-[1.55] text-center px-2 mx-auto"
            style={{ maxWidth: 'min(100%, clamp(320px, 56vw, 580px))', textWrap: 'balance' }}
          >
            We cross-verify <strong className="font-semibold text-[#0C1525]">10+ government records</strong> across six departments — and tell you before you pay.
          </motion.p>

          {/* Stat row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 1.55 }}
            className="mt-3 inline-flex items-center gap-2 sm:gap-3 text-[10.5px] sm:text-[11.5px] tracking-wide text-[#0C1525]/55"
          >
            <span className="font-semibold text-[#0C1525]">3 hrs</span>
            <span className="opacity-40">·</span>
            <span className="font-semibold text-[#0C1525]">₹3,599</span>
            <span className="opacity-40">·</span>
            <span>GST inclusive</span>
          </motion.div>

          {/* Survey input + Verify CTA */}
          <SurveyVerifyForm cityIdx={cityIdx}/>
        </div>
      </div>

      {/* ── Bottom bar with animated counters ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 4.5, duration: 0.6 }}
        className="absolute bottom-0 left-0 right-0 z-30"
      >
        <div className="hidden sm:flex bg-[#060B12] py-3 px-6 items-center justify-center gap-8 md:gap-16">
          <span className="inline-flex items-center gap-2 text-[10px] sm:text-xs text-white/75 tracking-wide font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <Counter end={12} duration={1800} /> reports delivered this week
          </span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">₹<Counter end={150} duration={2500} />Cr+ protected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium"><Counter end={300} duration={2000} />+ reports delivered</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">NVIDIA Inception Member</span>
        </div>
        <div className="flex sm:hidden bg-[#060B12] py-2.5 px-4 items-center justify-between">
          <span className="inline-flex items-center gap-1.5 text-[9px] text-white/65 tracking-wide font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <Counter end={12} duration={1800} /> this week
          </span>
          <span className="w-px h-2.5 bg-white/15" />
          <span className="text-[9px] text-white/60 tracking-wide font-medium">₹<Counter end={150} duration={2500} />Cr+ saved</span>
          <span className="w-px h-2.5 bg-white/15" />
          <span className="text-[9px] text-white/60 tracking-wide font-medium">NVIDIA Inception</span>
        </div>
      </motion.div>

      <div className="absolute bottom-10 sm:bottom-10 right-3 z-20 text-[7px] sm:text-[8px] text-[#7A8FAD]/40">
        © Mapbox © OpenStreetMap
      </div>
    </section>
  )
}
/* ── Survey Verify Form ──────────────────────────────────── */
type GeoMode = 'idle' | 'manual' | 'locating' | 'fetching' | 'found' | 'error' | 'denied'

interface FoundDetails {
  surveyNo: string
  district: string
  taluk: string
  village: string
}

function SurveyVerifyForm({ cityIdx }: { cityIdx: number }) {
  const [mode, setMode] = useState<GeoMode>('idle')
  const [value, setValue] = useState('')
  const [found, setFound] = useState<FoundDetails | null>(null)
  const city = CITIES[cityIdx % CITIES.length]
  const placeholder = `e.g. 142/3B, ${city.name}`

  async function handleUseLocation() {
    if (!navigator.geolocation) { setMode('error'); return }
    setMode('locating')
    track('hero_geo_click', 'hero')

    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' as PermissionName })
      if (perm.state === 'denied') { setMode('denied'); return }
    } catch { /* permissions API unsupported — proceed */ }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setMode('fetching')
        try {
          const resp = await fetch('/api/tngis/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            signal: AbortSignal.timeout(15000),
          })
          if (!resp.ok) { setMode('error'); return }
          const data = await resp.json()
          const ld = data.land_details?.data
          const land = Array.isArray(ld) ? ld[0] : ld
          if (!land) { setMode('error'); return }

          const survey = (land.survey_number || '') + (land.sub_division ? `/${land.sub_division}` : '')
          const district = land.district_name || ''
          const taluk = land.taluk_name || ''
          const village = land.village_name || land.revenue_town_name || land.revenue_ward_name || ''

          setFound({ surveyNo: survey, district, taluk, village })
          setMode('found')
          track('hero_geo_success', 'hero', { district })

          // Brief pause so the buyer sees the find, then route
          setTimeout(() => {
            const params = new URLSearchParams({ step: '1' })
            if (survey) params.set('surveyNo', survey)
            if (district) params.set('district', district)
            if (taluk) params.set('taluk', taluk)
            if (village) params.set('village', village)
            window.location.href = `/clearance/onboarding?${params.toString()}`
          }, 1600)
        } catch { setMode('error') }
      },
      (err) => {
        setMode(err.code === err.PERMISSION_DENIED ? 'denied' : 'error')
      },
      { enableHighAccuracy: true, timeout: 12000 },
    )
  }

  function handleSurveySubmit(e: React.FormEvent) {
    e.preventDefault()
    track('hero_survey_submit', 'hero', { hasSurvey: !!value.trim() })
    const trimmed = value.trim()
    const url = trimmed
      ? `/clearance/onboarding?step=1&surveyNo=${encodeURIComponent(trimmed)}`
      : '/clearance/onboarding'
    window.location.href = url
  }

  const isWorking = mode === 'locating' || mode === 'fetching'
  const showManual = mode === 'manual' || mode === 'denied' || mode === 'error'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 1.8, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-[480px] mt-7 sm:mt-8 mx-auto"
    >
      {/* PRIMARY: Geo button (or status) */}
      {!showManual && (
        <button
          type="button"
          onClick={handleUseLocation}
          disabled={isWorking || mode === 'found'}
          aria-label="Use my location to find this property"
          className="group relative w-full flex items-center justify-center gap-3 rounded-lg bg-[#0C1525] hover:bg-[#152238] text-white px-5 sm:px-6 py-4 sm:py-[18px] shadow-[0_10px_32px_-8px_rgba(12,21,37,0.32)] hover:shadow-[0_14px_36px_-6px_rgba(12,21,37,0.4)] transition-all duration-300 disabled:opacity-95 disabled:cursor-not-allowed cursor-pointer"
        >
          {mode === 'locating' && (
            <>
              <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight">Getting your location…</span>
            </>
          )}
          {mode === 'fetching' && (
            <>
              <span className="w-4 h-4 border-2 border-white/25 border-t-white rounded-full animate-spin" />
              <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight">Pulling property records…</span>
            </>
          )}
          {mode === 'found' && found && (
            <span className="flex items-center gap-2.5 text-[13.5px] sm:text-[14.5px] font-semibold tracking-tight">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Found {found.surveyNo || 'this parcel'} in {found.village || found.district}
            </span>
          )}
          {mode === 'idle' && (
            <>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="text-[14px] sm:text-[15px] font-semibold tracking-tight">Use my location to verify</span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </>
          )}
        </button>
      )}

      {/* Toggle to manual mode */}
      {!showManual && mode !== 'found' && (
        <p className="mt-2.5 text-[11px] sm:text-[12px] text-[#3D5278] text-center">
          Not on the property?{' '}
          <button
            type="button"
            onClick={() => { setMode('manual'); track('hero_manual_toggle', 'hero') }}
            className="font-medium text-[#0C1525] underline underline-offset-[3px] decoration-[#0C1525]/30 hover:decoration-[#0C1525] decoration-[1.5px] transition-all cursor-pointer"
          >
            Enter survey number instead
          </button>
        </p>
      )}

      {/* SECONDARY: Manual survey input (shown after toggle / on geo error) */}
      {showManual && (
        <>
          {mode === 'denied' && (
            <p className="mb-3 text-[11.5px] sm:text-[12.5px] text-[#B91C1C] text-center">
              Location access blocked. Enter your survey number to continue.
            </p>
          )}
          {mode === 'error' && (
            <p className="mb-3 text-[11.5px] sm:text-[12.5px] text-[#B91C1C] text-center">
              Couldn&apos;t locate this property. Enter the survey number to continue.
            </p>
          )}
          <form
            onSubmit={handleSurveySubmit}
            className="group relative flex items-stretch overflow-hidden rounded-lg bg-white ring-1 ring-[#0C1525]/12 shadow-[0_8px_28px_-10px_rgba(12,21,37,0.22)] focus-within:ring-[#0C1525] focus-within:shadow-[0_10px_32px_-8px_rgba(12,21,37,0.28)] transition-all duration-300"
          >
            <label
              htmlFor="hero-survey-input"
              className="flex items-center pl-4 pr-3.5 sm:pl-5 sm:pr-4 bg-[#F4F7FC] border-r border-[#0C1525]/10 text-[9.5px] sm:text-[10.5px] font-semibold tracking-[0.18em] uppercase text-[#3D5278] cursor-text select-none"
            >
              Survey&nbsp;No.
            </label>
            <input
              id="hero-survey-input"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={placeholder}
              aria-label="Survey number"
              className="flex-1 min-w-0 bg-transparent text-left text-[14px] sm:text-[15px] text-[#0C1525] placeholder:text-[#7A8FAD]/70 px-3.5 sm:px-4 py-3.5 sm:py-4 outline-none font-medium tracking-tight"
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="submit"
              aria-label="Continue with this survey number"
              className="flex items-center gap-2 px-5 sm:px-6 bg-[#0C1525] text-white text-[13px] sm:text-[14px] font-semibold tracking-tight hover:bg-[#152238] transition-colors cursor-pointer"
            >
              Continue
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="transition-transform group-hover:translate-x-0.5 group-focus-within:translate-x-0.5"
                aria-hidden="true"
              >
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </form>
          <p className="mt-2.5 text-[11px] sm:text-[12px] text-[#7A8FAD] text-center">
            We&apos;ll ask for village &amp; district on the next step.{' '}
            <button
              type="button"
              onClick={() => setMode('idle')}
              className="text-[#0C1525] underline underline-offset-[2px] decoration-[#0C1525]/30 hover:decoration-[#0C1525] cursor-pointer"
            >
              Use location instead
            </button>
          </p>
        </>
      )}

      {/* Sample report fallback */}
      <p className="mt-3 sm:mt-3.5 text-[11.5px] sm:text-[12.5px] text-[#3D5278] text-center">
        Or{' '}
        <a
          href="https://wa.me/918122642341?text=Hi%2C%20I%E2%80%99d%20like%20to%20see%20a%20sample%20HataD%20clearance%20report."
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('sample_report', 'hero')}
          className="font-medium text-[#0C1525] underline underline-offset-[3px] decoration-[#0C1525]/30 hover:decoration-[#0C1525] decoration-[1.5px] transition-all"
        >
          see a sample report
        </a>{' '}
        first <span className="text-[#7A8FAD]">— no signup needed.</span>
      </p>
    </motion.div>
  )
}

/* ── Animated Counter ────────────────────────────────────── */
function Counter({ end, duration }: { end: number; duration: number }) {
  const [count, setCount] = useState(0)
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    const start = performance.now()

    function tick(now: number) {
      const pct = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - pct, 3)
      setCount(Math.round(eased * end))
      if (pct < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [end, duration])

  return <>{count}</>
}

