'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { track } from '@/lib/track'
import { Button } from '@/components/ui/Button'

/* ── Config ─────────────────────────────────────────────── */
const REVEAL_DELAY = 500       // brief pause before map fades in
const FADE_DURATION = 1500     // map fade-in duration
const MAP_READY_TIMEOUT = 5000
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
  const [phase, setPhase] = useState<'waiting' | 'fading' | 'done'>('waiting')
  const [mapOpacity, setMapOpacity] = useState(0)
  const mapReadyRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const rafRef = useRef<number | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<mapboxgl.Map | null>(null)

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
        center: CITIES[0].center,
        zoom: 13,
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
        antialias: true,
      })

      mapInstanceRef.current = map

      map.on('load', () => {
        const style = map.getStyle()
        style.layers?.forEach(l => {
          if (l.type === 'symbol') map.setLayoutProperty(l.id, 'visibility', 'none')
          if (l.id.includes('poi') || l.id.includes('transit')) map.setLayoutProperty(l.id, 'visibility', 'none')
        })

        if (!mapReadyRef.current) {
          mapReadyRef.current = true
          startReveal()
        }
      })
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Simple fade reveal ──
  const startReveal = useCallback(() => {
    const t = setTimeout(() => {
      setPhase('fading')
      const start = performance.now()

      function tick(now: number) {
        const pct = Math.min((now - start) / FADE_DURATION, 1)
        const eased = 1 - Math.pow(1 - pct, 2)
        setMapOpacity(eased)
        if (pct < 1) {
          rafRef.current = requestAnimationFrame(tick)
        } else {
          setPhase('done')
        }
      }
      rafRef.current = requestAnimationFrame(tick)
    }, REVEAL_DELAY)
    timersRef.current.push(t)
  }, [])

  // ── 5s timeout fallback ──
  useEffect(() => {
    const fallback = setTimeout(() => {
      if (!mapReadyRef.current) {
        mapReadyRef.current = true
        startReveal()
      }
    }, MAP_READY_TIMEOUT)
    timersRef.current.push(fallback)
    return () => {
      timersRef.current.forEach(clearTimeout)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
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

    map.flyTo({
      center: city.center, zoom: 13, pitch: 0, bearing: 0,
      duration: flyDuration, essential: true, curve: 0.8, speed: 0.3,
    })

    panTimerRef.current = setTimeout(() => {
      mapInstanceRef.current?.easeTo({
        center: [city.center[0] + PAN_OFFSET, city.center[1] + PAN_OFFSET * 0.5],
        bearing: 0, duration: PAN_DURATION, easing: (t: number) => t,
      })
    }, PAN_DELAY + flyDuration)

    return () => { if (panTimerRef.current) clearTimeout(panTimerRef.current) }
  }, [cityIdx])

  // ── Initial slow pan ──
  useEffect(() => {
    if (phase !== 'done') return
    const map = mapInstanceRef.current
    if (!map) return
    const city = CITIES[cityIdx % CITIES.length]
    const t = setTimeout(() => {
      map.easeTo({
        center: [city.center[0] + PAN_OFFSET, city.center[1] + PAN_OFFSET * 0.5],
        bearing: 0, duration: PAN_DURATION, easing: (t: number) => t,
      })
    }, PAN_DELAY)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // ── City cycling ──
  useEffect(() => {
    if (phase !== 'done') return
    const interval = setInterval(() => {
      setCityIdx(prev => (prev + 1) % CITIES.length)
    }, CITY_INTERVAL)
    return () => clearInterval(interval)
  }, [phase])

  return (
    <section id="hero" className="relative h-screen min-h-[600px] w-full overflow-hidden bg-[#F4F7FC]">
      {/* ── Map ── */}
      <div
        ref={mapContainerRef}
        className=""
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          opacity: mapOpacity,
        }}
      />

      {/* ── Branding (always centered, map fades in behind it) ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
        <div className="relative flex flex-col items-center text-center pointer-events-auto">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold tracking-[0.3em] text-[#0C1525]"
            style={{ textShadow: '0 2px 16px rgba(244,247,252,0.9)', marginRight: '-0.3em' }}
          >
            HATAD
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 h-px w-10 bg-[#0C1525]/15 origin-center"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-5 text-sm sm:text-base font-semibold text-[#0C1525]/80 max-w-md leading-relaxed"
          >
            1 in 3 land deals in Tamil Nadu has a legal defect.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-3 text-[11px] sm:text-xs text-[#0C1525]/45 max-w-sm leading-relaxed"
          >
            We cross-verify 10+ government records and tell you before you pay. 3 hours. ₹3,599.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.7 }}
          >
            <CoordinateTyper cityIdx={cityIdx} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 3.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10"
          >
            <a href="/clearance" onClick={() => track('cta_click', 'hero')}>
              <Button variant="primary" size="lg">
                Verify Before You Buy →
              </Button>
            </a>
          </motion.div>
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.5, duration: 0.6 }}
        className="absolute bottom-0 left-0 right-0 z-30"
      >
        <div className="bg-[#0C1525] py-3 px-6 flex items-center justify-center gap-8 sm:gap-16">
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">47 fraud cases detected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">₹150Cr+ protected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">300+ reports delivered</span>
        </div>
      </motion.div>

      <div className="absolute bottom-10 right-3 z-20 text-[8px] text-[#7A8FAD]/40">
        © Mapbox © OpenStreetMap
      </div>
    </section>
  )
}

/* ── CoordinateTyper ─────────────────────────────────────── */
function CoordinateTyper({ cityIdx }: { cityIdx: number }) {
  const [charIdx, setCharIdx] = useState(0)
  const [paused, setPaused] = useState(false)
  const prevCityRef = useRef(cityIdx)

  const city = CITIES[cityIdx % CITIES.length]
  const fullText = `${city.lat}, ${city.lon} — ${city.name}`

  useEffect(() => {
    if (prevCityRef.current !== cityIdx) {
      prevCityRef.current = cityIdx
      setCharIdx(0)
      setPaused(false)
    }
  }, [cityIdx])

  useEffect(() => {
    if (paused) return
    if (charIdx >= fullText.length) { setPaused(true); return }
    const t = setTimeout(() => setCharIdx(prev => prev + 1), 60)
    return () => clearTimeout(t)
  }, [charIdx, paused, fullText.length])

  return (
    <p className="mt-3 sm:mt-4 h-5 text-[10px] sm:text-xs tracking-[0.12em] text-[#0C1525]/40 tabular-nums">
      {fullText.slice(0, charIdx)}
      {!paused && <span className="animate-pulse">|</span>}
    </p>
  )
}
