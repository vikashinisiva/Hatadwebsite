'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface PlotMapProps {
  geojson: string
  height?: number
}

export function PlotMap({ geojson, height = 280 }: PlotMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    try {
      const parsed = typeof geojson === 'string' ? JSON.parse(geojson) : geojson

      const map = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        scrollWheelZoom: false,
        doubleClickZoom: false,
        touchZoom: false,
      })

      mapInstanceRef.current = map

      // Light minimal tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map)

      // Draw the plot boundary
      const geoLayer = L.geoJSON(parsed, {
        style: {
          color: '#1B4FD8',
          weight: 2.5,
          fillColor: '#1B4FD8',
          fillOpacity: 0.08,
          dashArray: '6, 4',
        },
      }).addTo(map)

      // Fit map to the boundary
      const bounds = geoLayer.getBounds()
      map.fitBounds(bounds, { padding: [30, 30] })

      // Add a marker at centroid
      const center = bounds.getCenter()
      L.circleMarker(center, {
        radius: 4,
        color: '#1B4FD8',
        fillColor: '#1B4FD8',
        fillOpacity: 1,
        weight: 0,
      }).addTo(map)

    } catch {
      // Invalid GeoJSON — hide the map
      if (mapRef.current) mapRef.current.style.display = 'none'
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [geojson])

  return (
    <div
      ref={mapRef}
      style={{ height, width: '100%' }}
      className="rounded-sm overflow-hidden"
    />
  )
}
