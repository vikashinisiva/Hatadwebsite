'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { track } from '@/lib/track'
import { Button } from '@/components/ui/Button'

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

const HEADLINE = '1 in 3 land deals in Tamil Nadu has a legal defect.'

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
          filter: 'brightness(0.82) contrast(1.15)',
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
            className="mt-4 sm:mt-5 h-px w-8 sm:w-10 bg-[#060B12]/15 origin-center"
          />

          {/* Typing headline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 1 }}
            className="mt-4 sm:mt-5"
          >
            <HeadlineTyper />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 3.5 }}
            className="mt-2 sm:mt-3 text-[10px] sm:text-[11px] md:text-xs text-[#0C1525]/45 max-w-[260px] sm:max-w-sm leading-relaxed"
          >
            We cross-verify 10+ government records and tell you before you pay. 3 hours. ₹3,599.
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 3.8 }}
          >
            <CoordinateTyper cityIdx={cityIdx} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 sm:mt-10 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
          >
            <a href="/clearance/onboarding" onClick={() => track('cta_click', 'hero')}>
              <Button variant="primary" size="lg">
                Verify Before You Buy →
              </Button>
            </a>
            <a
              href="https://wa.me/918122642341?text=Hi%2C%20I%E2%80%99d%20like%20to%20see%20a%20sample%20HataD%20clearance%20report."
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('sample_report', 'hero')}
              className="inline-flex items-center justify-center px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-[#0C1525]/60 border border-[#0C1525]/30 rounded-sm hover:border-[#0C1525]/50 hover:text-[#0C1525]/80 transition-colors"
            >
              Request a Sample Report
            </a>
          </motion.div>
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
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium"><Counter end={47} duration={2000} /> fraud cases detected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">₹<Counter end={150} duration={2500} />Cr+ protected</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium"><Counter end={300} duration={2000} />+ reports delivered</span>
          <span className="w-px h-3 bg-white/20" />
          <span className="text-[10px] sm:text-xs text-white/70 tracking-wide font-medium">NVIDIA Inception Member</span>
        </div>
        <div className="flex sm:hidden bg-[#060B12] py-2.5 px-4 items-center justify-between">
          <span className="text-[9px] text-white/60 tracking-wide font-medium"><Counter end={47} duration={2000} /> frauds caught</span>
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

/* ── Headline Typer ──────────────────────────────────────── */
function HeadlineTyper() {
  const [charIdx, setCharIdx] = useState(0)

  useEffect(() => {
    if (charIdx >= HEADLINE.length) return
    const t = setTimeout(() => setCharIdx(prev => prev + 1), 45)
    return () => clearTimeout(t)
  }, [charIdx])

  return (
    <p className="text-[13px] sm:text-sm md:text-base font-semibold text-[#0C1525]/80 max-w-[280px] sm:max-w-md leading-relaxed">
      {HEADLINE.slice(0, charIdx)}
      {charIdx < HEADLINE.length && <span className="animate-pulse">|</span>}
    </p>
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

/* ── Coordinate Typer ────────────────────────────────────── */
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
