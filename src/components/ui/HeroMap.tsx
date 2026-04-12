'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const CITIES = [
  { name: 'Coimbatore', center: [11.0168, 76.9558] as [number, number] },
  { name: 'Madurai',    center: [9.9252, 78.1198] as [number, number] },
  { name: 'Chennai',    center: [13.0827, 80.2707] as [number, number] },
  { name: 'Trichy',     center: [10.7905, 78.7047] as [number, number] },
]

interface HeroMapProps {
  cityIdx: number
  onReady: () => void
}

export function HeroMap({ cityIdx, onReady }: HeroMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const readyFired = useRef(false)

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current) return

    if (mapRef.current) {
      mapRef.current.remove()
      mapRef.current = null
    }

    const startCity = CITIES[cityIdx % CITIES.length]

    const map = L.map(containerRef.current, {
      center: startCity.center,
      zoom: 14,
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      keyboard: false,
      boxZoom: false,
    })

    mapRef.current = map

    const tileLayer = L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
      { maxZoom: 18 }
    ).addTo(map)

    // Fire onReady when first tiles load
    tileLayer.once('load', () => {
      if (!readyFired.current) {
        readyFired.current = true
        onReady()
      }
    })

    // Invalidate size after mount — dynamic import delays container sizing
    setTimeout(() => map.invalidateSize(), 50)
    setTimeout(() => map.invalidateSize(), 300)
    setTimeout(() => map.invalidateSize(), 800)

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
    // Only run on mount — cityIdx changes handled by the next effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Fly to new city when cityIdx changes (skip initial)
  const prevCityIdx = useRef(cityIdx)
  useEffect(() => {
    if (prevCityIdx.current === cityIdx) return
    prevCityIdx.current = cityIdx

    const map = mapRef.current
    if (!map) return

    const city = CITIES[cityIdx % CITIES.length]
    map.flyTo(city.center, 14, { duration: 2, easeLinearity: 0.5 })
  }, [cityIdx])

  return (
    <div
      ref={containerRef}
      className="hero-map-filter"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        minHeight: '600px',
      }}
    />
  )
}
