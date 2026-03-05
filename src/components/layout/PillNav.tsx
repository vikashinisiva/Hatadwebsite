'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import gsap from 'gsap'
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from '@/lib/constants'
import { ContactModal } from '@/components/ui/ContactModal'
import { Button } from '@/components/ui/Button'

export function PillNav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeLink, setActiveLink] = useState<string | null>(null)

  const navRef = useRef<HTMLDivElement>(null)
  const pillRef = useRef<HTMLDivElement>(null)
  const linkRefs = useRef<Map<string, HTMLButtonElement>>(new Map())

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
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

          {/* CTA */}
          <div className="pill-nav-cta">
            <ContactModal
              trigger={
                <Button variant="primary" size="sm">
                  Get Your Report
                </Button>
              }
            />
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
              <div style={{ paddingTop: '1.5rem' }}>
                <ContactModal
                  trigger={
                    <Button variant="primary" size="lg" className="w-full">
                      Get Your Land Clearance Report
                    </Button>
                  }
                />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
