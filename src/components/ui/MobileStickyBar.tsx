'use client'

import { useState, useEffect } from 'react'
import { track } from '@/lib/track'

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 600)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-[#E8EDF5] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <p className="text-[#0C1525] text-sm font-semibold truncate">
            Check your property &mdash; {'\u20B9'}3,599 &middot; Under 3 hours
          </p>
          <p className="text-[#7A8FAD] text-[10px] hidden sm:block">GST inclusive &middot; Document retrieval included</p>
        </div>
        <a
          href="/clearance"
          onClick={() => track('cta_click', 'sticky_bar')}
          className="shrink-0 bg-[#1B4FD8] text-white text-xs font-semibold px-5 py-2.5 rounded-sm hover:bg-[#1636D0] transition-colors"
        >
          Get Your Report &rarr;
        </a>
      </div>
    </div>
  )
}
