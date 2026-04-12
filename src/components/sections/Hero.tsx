'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { track } from '@/lib/track'
import { Button } from '@/components/ui/Button'

/* ── Config ─────────────────────────────────────────────── */
const MAP_READY_TIMEOUT = 18000  // longer for globe zoom sequence
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
        center: [79.0, 11.0],  // center of Tamil Nadu
        zoom: 2,               // globe view
        pitch: 0,
        bearing: 0,
        interactive: false,
        attributionControl: false,
        antialias: true,
        projection: 'globe',
        fadeDuration: 0,          // instant tile transitions (no fade flicker)
        trackResize: true,
        refreshExpiredTiles: false, // don't re-fetch tiles during animation
      })

      mapInstanceRef.current = map

      // Globe atmosphere styling
      map.on('style.load', () => {
        map.setFog({
          color: 'rgba(244, 247, 252, 0.9)',
          'high-color': 'rgba(200, 210, 230, 0.5)',
          'horizon-blend': 0.05,
          'space-color': '#F4F7FC',
          'star-intensity': 0,
        })
      })

      map.on('load', () => {
        // Remove ALL labels, icons, symbols — clean map, no glitching text
        const style = map.getStyle()
        style.layers?.forEach(l => {
          if (l.type === 'symbol') {
            map.removeLayer(l.id)
          }
        })

        // Start globe → city zoom (multi-step, searching feel)
        if (!mapReadyRef.current) {
          mapReadyRef.current = true
          setPhase('zooming')

          const city = CITIES[0]

          // Step 1: slow rotate on globe, scanning (2s)
          setTimeout(() => {
            map.easeTo({
              center: [82.0, 22.0],
              zoom: 2.5,
              bearing: -20,
              duration: 2500,
              easing: (t: number) => t,
            })
          }, 500)

          // Step 2: drift toward India, slight overshoot west (searching)
          setTimeout(() => {
            map.flyTo({
              center: [76.0, 19.0],
              zoom: 5,
              bearing: -12,
              duration: 3500,
              essential: true,
              curve: 1.2,
            })
          }, 3200)

          // Step 3: correct east — found Tamil Nadu, slow approach
          setTimeout(() => {
            map.flyTo({
              center: [78.8, 11.5],
              zoom: 8,
              bearing: 8,
              duration: 3000,
              essential: true,
              curve: 1,
            })
          }, 7000)

          // Step 4: pause-drift while "reading" the region
          setTimeout(() => {
            map.easeTo({
              center: [78.3, 10.8],
              zoom: 9.5,
              bearing: 3,
              duration: 2500,
              easing: (t: number) => t * (2 - t), // ease-out
            })
          }, 10200)

          // Step 5: lock — snap bearing straight, final approach
          setTimeout(() => {
            map.flyTo({
              center: city.center,
              zoom: 13,
              bearing: 0,
              pitch: 0,
              duration: 3000,
              essential: true,
              curve: 0.6,
            })
          }, 13000)

          // Branding after final zoom
          setTimeout(() => startReveal(), 16500)
        }
      })
    })

    return () => {
      cancelled = true
      if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Reveal branding after zoom completes ──
  const startReveal = useCallback(() => {
    setPhase('done')
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
    <section id="hero" className="relative h-[100dvh] min-h-[580px] w-full overflow-hidden bg-[#F4F7FC]">
      {/* ── Map ── */}
      <div
        ref={mapContainerRef}
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 0,
          willChange: 'transform',
          contain: 'layout style paint',
        }}
      />

      {/* ── Branding ── */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center px-5 sm:px-6 pointer-events-none" style={{ contain: 'layout' }}>
        <div className="relative flex flex-col items-center text-center pointer-events-auto w-full max-w-lg sm:max-w-xl">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="font-display text-[2.5rem] sm:text-5xl md:text-6xl lg:text-8xl xl:text-9xl font-bold tracking-[0.2em] sm:tracking-[0.3em] text-[#0C1525]"
            style={{ textShadow: '0 2px 16px rgba(244,247,252,0.9)', marginRight: '-0.2em' }}
          >
            HATAD
          </motion.h1>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-4 sm:mt-5 h-px w-8 sm:w-10 bg-[#0C1525]/15 origin-center"
          />

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="mt-4 sm:mt-5 text-[13px] sm:text-sm md:text-base font-semibold text-[#0C1525]/80 max-w-[280px] sm:max-w-md leading-relaxed"
          >
            1 in 3 land deals in Tamil Nadu has a legal defect.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] md:text-xs text-[#0C1525]/45 max-w-[260px] sm:max-w-sm leading-relaxed"
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
            className="mt-8 sm:mt-10"
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
        {/* Desktop: horizontal row */}
        <div className="hidden sm:flex bg-[#0C1525] py-3 px-6 items-center justify-center gap-8 md:gap-16">
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">47 fraud cases detected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">₹150Cr+ protected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">300+ reports delivered</span>
        </div>
        {/* Mobile: compact row */}
        <div className="flex sm:hidden bg-[#0C1525] py-2.5 px-4 items-center justify-between">
          <span className="text-[9px] text-white/60 tracking-wide font-medium">47 frauds caught</span>
          <span className="w-px h-2.5 bg-white/15" />
          <span className="text-[9px] text-white/60 tracking-wide font-medium">₹150Cr+ saved</span>
          <span className="w-px h-2.5 bg-white/15" />
          <span className="text-[9px] text-white/60 tracking-wide font-medium">300+ reports</span>
        </div>
      </motion.div>

      <div className="absolute bottom-10 sm:bottom-10 right-3 z-20 text-[7px] sm:text-[8px] text-[#7A8FAD]/40">
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
    <p className="mt-2 sm:mt-4 h-5 text-[9px] sm:text-[10px] md:text-xs tracking-[0.08em] sm:tracking-[0.12em] text-[#0C1525]/40 tabular-nums">
      {fullText.slice(0, charIdx)}
      {!paused && <span className="animate-pulse">|</span>}
    </p>
  )
}
