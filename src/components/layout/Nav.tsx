'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import { NAV_LINKS, SITE_NAME, SITE_TAGLINE } from '@/lib/constants'
import { ContactModal } from '@/components/ui/ContactModal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

export function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function handleNavClick(href: string) {
    setMobileOpen(false)
    const el = document.querySelector(href)
    if (el) el.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          'fixed top-0 left-0 right-0 z-40 h-16 flex items-center px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 transition-all duration-300',
          scrolled
            ? 'bg-background/90 backdrop-blur-md border-b border-border'
            : 'bg-transparent'
        )}
      >
        <div className="w-full flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <span className="text-text-primary font-semibold tracking-tight text-base">
              {SITE_NAME}
            </span>
            <span className="text-text-muted text-xs hidden sm:inline">·</span>
            <span className="text-text-muted text-xs hidden sm:inline tracking-wide">
              {SITE_TAGLINE}
            </span>
          </div>

          {/* Center nav — desktop */}
          <div className="hidden md:flex items-center gap-8">
            {NAV_LINKS.slice(0, 3).map((link) => (
              <button
                key={link.href}
                onClick={() => handleNavClick(link.href)}
                className="text-sm text-text-secondary hover:text-text-primary transition-colors tracking-wide cursor-pointer"
              >
                {link.label}
              </button>
            ))}
          </div>

          {/* Right CTA — desktop */}
          <div className="hidden md:flex items-center gap-3">
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
            className="md:hidden text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
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
            className="fixed inset-0 z-50 bg-background flex flex-col"
          >
            <div className="flex items-center justify-between px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 h-16 border-b border-border">
              <span className="text-text-primary font-semibold">{SITE_NAME}</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="text-text-secondary cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-2 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 pt-8">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.href}
                  onClick={() => handleNavClick(link.href)}
                  className="text-left text-2xl font-medium text-text-primary py-3 border-b border-border/50 cursor-pointer hover:text-accent-blue transition-colors"
                >
                  {link.label}
                </button>
              ))}
              <div className="pt-6">
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
