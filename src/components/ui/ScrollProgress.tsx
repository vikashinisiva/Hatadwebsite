'use client'

import { useState, useEffect } from 'react'

const STEPS = [
  { label: 'Understand the risk', threshold: 0.15 },
  { label: 'See how it works', threshold: 0.45 },
  { label: 'Get your report', threshold: 0.75 },
]

export function ScrollProgress() {
  const [active, setActive] = useState(0)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show on first visit
    if (typeof window === 'undefined') return
    const seen = localStorage.getItem('hatad_scroll_seen')
    if (seen) return
    setShow(true)

    function handleScroll() {
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      let current = 0
      for (let i = STEPS.length - 1; i >= 0; i--) {
        if (scrollPercent >= STEPS[i].threshold) { current = i; break }
      }
      setActive(current)

      // Hide and mark as seen once they reach the bottom
      if (scrollPercent > 0.9) {
        localStorage.setItem('hatad_scroll_seen', '1')
        setShow(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!show) return null

  return (
    <div className="fixed right-4 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col items-end gap-6">
      {STEPS.map((step, i) => (
        <div key={step.label} className="flex items-center gap-2.5 group">
          <span
            className={`text-[10px] tracking-wide transition-all duration-300 ${
              i === active ? 'text-text-secondary opacity-100' : 'text-text-muted opacity-0 group-hover:opacity-70'
            }`}
          >
            {step.label}
          </span>
          <div
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? 'w-2.5 h-2.5 bg-[#1B4FD8]'
                : i < active
                  ? 'w-2 h-2 bg-[#1B4FD8]/30'
                  : 'w-1.5 h-1.5 bg-[#CBD5E8]'
            }`}
          />
        </div>
      ))}
    </div>
  )
}
