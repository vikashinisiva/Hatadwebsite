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
    if (!mapRef.current) return
    // Cleanup any previous map instance (React strict mode double-render)
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove()
      mapInstanceRef.current = null
    }

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

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
      }).addTo(map)

      // First: add invisible boundary to get bounds for fitting
      const ghostLayer = L.geoJSON(parsed, {
        style: { opacity: 0, fillOpacity: 0 },
      }).addTo(map)

      const bounds = ghostLayer.getBounds()
      map.fitBounds(bounds, { padding: [30, 30] })

      // Animate the boundary drawing after tiles load
      map.whenReady(() => {
        setTimeout(() => {
          // Extract coordinates for the animated polyline
          const coords: L.LatLng[] = []
          ghostLayer.eachLayer((layer) => {
            if ('getLatLngs' in layer) {
              const latLngs = (layer as L.Polygon).getLatLngs()
              const flat = Array.isArray(latLngs[0]) ? latLngs[0] as L.LatLng[] : latLngs as L.LatLng[]
              coords.push(...flat)
              // Close the polygon
              if (flat.length > 0) coords.push(flat[0])
            }
          })

          if (coords.length === 0) {
            // Fallback: just show static boundary
            L.geoJSON(parsed, {
              style: { color: '#1B4FD8', weight: 2.5, fillColor: '#1B4FD8', fillOpacity: 0.08, dashArray: '6, 4' },
            }).addTo(map)
            return
          }

          // Animate: draw the boundary point by point
          const animatedLine = L.polyline([], {
            color: '#1B4FD8',
            weight: 2.5,
          }).addTo(map)

          const duration = 1200 // ms
          const stepTime = duration / coords.length
          let i = 0

          function drawStep() {
            if (i < coords.length) {
              animatedLine.addLatLng(coords[i])
              i++
              setTimeout(drawStep, stepTime)
            } else {
              // Drawing complete — add fill
              L.geoJSON(parsed, {
                style: {
                  color: '#1B4FD8',
                  weight: 2.5,
                  fillColor: '#1B4FD8',
                  fillOpacity: 0.08,
                },
              }).addTo(map)

              // Remove the animated line (replaced by filled polygon)
              map.removeLayer(animatedLine)

              // Add centroid marker with a pop-in effect
              const center = bounds.getCenter()
              const marker = L.circleMarker(center, {
                radius: 0,
                color: '#1B4FD8',
                fillColor: '#1B4FD8',
                fillOpacity: 1,
                weight: 0,
              }).addTo(map)

              // Animate marker radius
              let r = 0
              function growMarker() {
                r += 0.5
                marker.setRadius(r)
                if (r < 5) requestAnimationFrame(growMarker)
              }
              requestAnimationFrame(growMarker)
            }
          }

          drawStep()
        }, 300) // small delay after map ready
      })

      // Remove ghost layer after animation starts
      setTimeout(() => map.removeLayer(ghostLayer), 500)

    } catch {
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
