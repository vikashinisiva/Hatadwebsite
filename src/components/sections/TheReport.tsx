'use client'

import { useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Phone, MessageCircle, Mail } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { Button } from '@/components/ui/Button'
import { TiltedCard } from '@/components/ui/TiltedCard'
import { REPORT_ITEMS } from '@/lib/constants'
import { staggerContainer, fadeInUp, slideInRight } from '@/lib/animations'

export function TheReport() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })
  const [showContact, setShowContact] = useState(false)

  return (
    <section id="report" className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div ref={ref}>
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left */}
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <motion.div variants={fadeInUp}>
              <SectionLabel className="mb-6">The Report</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1] mb-6"
            >
              Not a Summary.
              <br />
              <span className="text-text-secondary font-light">
                A Decision Instrument.
              </span>
            </motion.h2>

            <motion.p variants={fadeInUp} className="text-lg text-text-secondary leading-relaxed mb-8">
              A complete risk verdict, ownership chain analysis, liability summary,
              regulatory compliance status, contradiction log with severity ratings,
              and recommended actions.
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4">
              <a href="/clearance/onboarding">
                <Button variant="primary" size="md">
                  Request Your Report
                </Button>
              </a>
              <button
                onClick={() => setShowContact((v) => !v)}
                className="px-5 py-2.5 rounded-sm border border-border bg-transparent text-sm font-medium text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors cursor-pointer"
              >
                Talk to the Team
              </button>
            </motion.div>

            <AnimatePresence>
              {showContact && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div className="flex flex-wrap gap-3 mt-5">
                    <a
                      href="https://wa.me/918122642341"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                    >
                      <MessageCircle size={15} /> WhatsApp
                    </a>
                    <a
                      href="tel:+918122642341"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
                    >
                      <Phone size={15} /> Call Us
                    </a>
                    <a
                      href="mailto:info@hypseaero.in"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
                    >
                      <Mail size={15} /> Email
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Right — Mock Report UI styled like real HataD report */}
          <motion.div
            variants={slideInRight}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <TiltedCard rotateAmplitude={10} scaleOnHover={1.04}>
            <div
              className="rounded overflow-hidden select-none"
              style={{ boxShadow: '0 12px 48px rgba(12,21,37,0.14), 0 2px 8px rgba(12,21,37,0.06)' }}
            >
              {/* Dark header */}
              <div style={{ background: '#0C1525' }} className="px-5 py-4">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-sm font-bold text-white tracking-[0.04em]">
                    Hata<span className="text-white/80">D</span>
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                    <span className="text-[8px] font-mono uppercase text-white/40 tracking-wider">
                      Confidential
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-white/50 tracking-[0.15em]">
                    Plot Clearance Report
                  </span>
                  <span
                    className="text-[10px] font-mono px-2 py-0.5 rounded-sm"
                    style={{ background: 'rgba(160,104,24,0.15)', border: '1px solid rgba(160,104,24,0.3)', color: '#D4A04A' }}
                  >
                    &lt;3 hrs
                  </span>
                </div>
              </div>

              {/* Red risk band */}
              <div style={{ background: '#8B1A1A' }} className="px-5 py-3 flex items-center gap-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-white leading-none">28</span>
                  <span className="text-[10px] text-white/40 font-mono">/100</span>
                </div>
                <div className="h-6 w-px bg-white/15" />
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-white uppercase tracking-[0.08em]">
                    High Risk — Do Not Proceed
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[8px] font-mono text-white/50">3 Blocking</span>
                    <span className="text-[8px] font-mono text-white/50">4 Advisory</span>
                  </div>
                </div>
              </div>

              {/* Report sections checklist */}
              <div className="bg-white divide-y divide-border/40">
                {REPORT_ITEMS.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between px-5 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <CheckCircle2 size={14} className="text-accent-blue flex-shrink-0" />
                      <span className="text-sm text-text-primary">{item.label}</span>
                    </div>
                    {item.badge && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-sm tracking-wide"
                        style={{
                          background: 'rgba(220, 38, 38, 0.1)',
                          border: '1px solid rgba(220, 38, 38, 0.25)',
                          color: '#DC2626',
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="bg-white px-5 py-3.5 border-t border-border/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-text-muted">Delivered in under 3 hours</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: i < 4 ? '#1B4FD8' : '#CBD5E8' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            </TiltedCard>
          </motion.div>
        </div>

        {/* Callout bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.5 }}
          className="mt-20 relative"
        >
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mb-8" />
          <p className="text-center font-display text-2xl sm:text-3xl text-text-primary font-medium tracking-tight">
            Under 3 hours.{' '}
            <span className="text-text-secondary font-light">Every report.</span>{' '}
            No exceptions.
          </p>
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent mt-8" />
        </motion.div>
      </div>
    </section>
  )
}
