'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import gsap from 'gsap'
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from '@/lib/constants'
import { Button } from '@/components/ui/Button'
import { useI18n } from '@/lib/i18n/context'
import { supabase } from '@/lib/supabase'

export function PillNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeLink, setActiveLink] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const { locale, setLocale, t } = useI18n()

  const navRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsSignedIn(!!session)
      setAvatarUrl((session?.user?.user_metadata?.avatar_url as string) || null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setIsSignedIn(!!s)
      setAvatarUrl((s?.user?.user_metadata?.avatar_url as string) || null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Track active section via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = []
    NAV_LINKS.forEach((link) => {
      const el = document.querySelector(link.href)
      if (!el) return
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveLink(link.href)
          }
        },
        { rootMargin: '-40% 0px -55% 0px' }
      )
      observer.observe(el)
      observers.push(observer)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [])

  const animatePill = useCallback(
    (el: HTMLButtonElement | null) => {
      if (!pillRef.current || !navRef.current || !el) {
        if (pillRef.current) gsap.to(pillRef.current, { opacity: 0, duration: 0.2 })
        return
      }
      const navRect = navRef.current.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      gsap.to(pillRef.current, {
        x: elRect.left - navRect.left,
        width: elRect.width,
        opacity: 1,
        duration: 0.35,
        ease: 'power2.out',
      })
    },
    []
  )

  // Animate pill to active link on change
  useEffect(() => {
    if (activeLink) {
      const el = linkRefs.current.get(activeLink)
      if (el) animatePill(el)
    }
  }, [activeLink, animatePill])

  function handleNavClick(href: string) {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  function handleMouseEnter(href: string) {
    const el = linkRefs.current.get(href)
    if (el) animatePill(el)
  }

  function handleMouseLeave() {
    if (activeLink) {
      const el = linkRefs.current.get(activeLink)
      if (el) animatePill(el)
    } else {
      if (pillRef.current) gsap.to(pillRef.current, { opacity: 0, duration: 0.2 })
    }
  }

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="pill-nav-wrapper"
        data-scrolled={scrolled}
      >
        <div className="pill-nav-inner">
          {/* Logo */}
          <div className="pill-nav-logo">
            <span className="pill-nav-logo-name">{SITE_NAME}</span>
            <span className="pill-nav-logo-sep">·</span>
            <span className="pill-nav-logo-tagline">{SITE_TAGLINE}</span>
          </div>

          {/* Center links with pill */}
          <div
            ref={navRef}
            className="pill-nav-links"
            onMouseLeave={handleMouseLeave}
          >
            {/* Animated pill */}
            <div ref={pillRef} className="pill-nav-pill" />

            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                ref={(el) => {
                  if (el) linkRefs.current.set(link.href, el)
                }}
                onClick={() => handleNavClick(link.href)}
                onMouseEnter={() => handleMouseEnter(link.href)}
                className="pill-nav-link"
                data-active={activeLink === link.href}
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Language toggle + Auth + CTA */}
          <div className="pill-nav-cta flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
              className="text-xs font-medium px-2.5 py-1.5 rounded-sm transition-colors cursor-pointer bg-[#0D1B2A]/5 hover:bg-[#0D1B2A]/10 text-text-secondary hover:text-text-primary"
              title={locale === 'en' ? 'தமிழில் காண' : 'View in English'}
            >
              {locale === 'en' ? 'தமிழ்' : 'EN'}
            </button>
            {isSignedIn ? (
              <a href="/profile" className="shrink-0">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full border border-border" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#0D1B2A]/8 border border-border flex items-center justify-center">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-text-secondary"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                )}
              </a>
            ) : (
              <a href="/clearance/auth?next=/profile" className="text-xs font-medium px-3 py-1.5 rounded-sm transition-colors bg-[#0D1B2A] text-white hover:bg-[#152238]">
                Sign In
              </a>
            )}
            <a href="/clearance/onboarding">
              <Button variant="primary" size="sm">
                {t('nav.getReport')}
              </Button>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="pill-nav-mobile-toggle"
          >
            <Menu size={20} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pill-nav-mobile-overlay"
          >
            <div className="pill-nav-mobile-header">
              <span className="pill-nav-logo-name" style={{ color: 'var(--color-text-primary)' }}>
                {SITE_NAME}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="pill-nav-mobile-close"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="pill-nav-mobile-links">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="pill-nav-mobile-link"
                >
                  {link.label}
                </button>
              ))}
              <div style={{ paddingTop: '1.5rem' }} className="space-y-3">
                {isSignedIn ? (
                  <a href="/profile" className="block w-full text-sm font-medium py-2.5 rounded-sm text-center transition-colors bg-surface-raised text-text-secondary hover:text-text-primary">
                    My Profile
                  </a>
                ) : (
                  <a href="/clearance/auth?next=/profile" className="block w-full text-sm font-medium py-2.5 rounded-sm text-center transition-colors bg-surface-raised text-text-secondary hover:text-text-primary">
                    Sign In
                  </a>
                )}
                <button
                  onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
                  className="w-full text-sm font-medium py-2.5 rounded-sm transition-colors cursor-pointer bg-surface-raised text-text-secondary hover:text-text-primary"
                >
                  {locale === 'en' ? 'தமிழில் காண' : 'View in English'}
                </button>
                <a href="/clearance/onboarding">
                  <Button variant="primary" size="lg" className="w-full">
                    {t('hero.cta')}
                  </Button>
                </a>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
