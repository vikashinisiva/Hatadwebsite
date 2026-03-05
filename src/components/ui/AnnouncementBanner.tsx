'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import Image from 'next/image'

const STORAGE_KEY = 'hatad-nvidia-banner-dismissed'

export function AnnouncementBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(timer)
    }
  }, [])

  function dismiss() {
    setVisible(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-[#0C1525]/60 backdrop-blur-sm"
            onClick={dismiss}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
          >
            <div
              className="relative pointer-events-auto w-full max-w-md rounded-lg border border-border bg-surface p-8 text-center"
              style={{ boxShadow: '0 24px 80px rgba(12, 21, 37, 0.25)' }}
            >
              {/* Close */}
              <button
                onClick={dismiss}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                aria-label="Close announcement"
              >
                <X size={18} />
              </button>

              {/* Badge glow */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full blur-2xl opacity-20"
                    style={{ background: '#76B900' }}
                  />
                  <Image
                    src="/nvidia-inception-program-badge-rgb-for-screen.png"
                    alt="NVIDIA Inception Program"
                    width={120}
                    height={120}
                    className="relative object-contain"
                  />
                </div>
              </div>

              {/* Content */}
              <p className="text-[10px] tracking-[0.2em] uppercase font-medium text-accent-blue mb-3">
                Announcement
              </p>

              <h3 className="font-display text-2xl font-bold text-text-primary mb-3 leading-snug">
                HataD Joins the NVIDIA Inception Program
              </h3>

              <p className="text-sm text-text-secondary leading-relaxed mb-6">
                We&apos;ve been accepted into NVIDIA&apos;s Inception program — a platform for
                AI-driven startups building breakthrough technology. This accelerates our
                mission to bring intelligence infrastructure to land clearance.
              </p>

              <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-4" />

              <p className="text-xs text-text-muted">
                Powered by NVIDIA. Built for Tamil Nadu.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
