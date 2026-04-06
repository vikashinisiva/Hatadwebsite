'use client'

import { useState, useEffect } from 'react'
import { track } from '@/lib/track'
import { useT } from '@/lib/i18n/context'

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false)
  const t = useT()

  useEffect(() => {
    function handleScroll() {
      const scrolled = window.scrollY
      const nearBottom = window.innerHeight + scrolled >= document.documentElement.scrollHeight - 200
      setVisible(scrolled > 600 && !nearBottom)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <div className="bg-white border-t border-[#E8EDF5] px-4 sm:px-8 py-3 flex items-center justify-between gap-4 shadow-[0_-2px_12px_rgba(0,0,0,0.06)]">
        <div className="min-w-0">
          <p className="text-[#0C1525] text-sm font-semibold truncate">{t('sticky.text')}</p>
          <p className="text-[#7A8FAD] text-[10px] hidden sm:block">{t('sticky.subtext')}</p>
        </div>
        <a href="/clearance" onClick={() => track('cta_click', 'sticky_bar')}
          className="shrink-0 bg-[#1B4FD8] text-white text-xs font-semibold px-5 py-2.5 rounded-sm hover:bg-[#1636D0] transition-colors">
          {t('sticky.button')}
        </a>
      </div>
    </div>
  )
}
