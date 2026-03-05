'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainerFast, fadeInUp } from '@/lib/animations'

const CHECKS = [
  { label: 'Title & Ownership Chain', coverage: 92, delay: 0.3 },
  { label: 'Liabilities & Hidden Charges', coverage: 88, delay: 0.45 },
  { label: 'Government Records', coverage: 85, delay: 0.6 },
  { label: 'Regulatory & Zone Status', coverage: 90, delay: 0.75 },
]

export function WhatWeVerify() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section id="verify" className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div ref={ref}>
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <div className="grid lg:grid-cols-2 gap-8 mb-16">
            <div>
              <motion.div variants={fadeInUp} className="mb-6">
                <SectionLabel>What We Verify</SectionLabel>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
              >
                Five Layers.{' '}
                <span className="text-text-secondary font-light">Zero Blind Spots.</span>
              </motion.h2>
            </div>
          </div>

          {/* Mock verification dashboard */}
          <motion.div
            variants={fadeInUp}
            className="rounded-lg border border-border/60 bg-white overflow-hidden"
            style={{ boxShadow: '0 4px 32px rgba(12,21,37,0.06)' }}
          >
            {/* Dashboard header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-4 border-b border-border/60 bg-surface-raised/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-accent-blue animate-pulse" />
                <span className="text-xs font-medium tracking-[0.15em] uppercase text-text-muted">
                  Verification Report
                </span>
              </div>
              <motion.span
                className="text-[10px] font-mono tracking-wider text-accent-blue"
                initial={{ opacity: 0 }}
                animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                transition={{ delay: 1.2 }}
              >
                4 / 4 COMPLETE
              </motion.span>
            </div>

            {/* Verification rows */}
            <div className="divide-y divide-border/40">
              {CHECKS.map((check, i) => (
                <div
                  key={check.label}
                  className="grid grid-cols-[1fr_auto] sm:grid-cols-[200px_1fr_60px] items-center gap-4 sm:gap-6 px-6 sm:px-8 py-5"
                >
                  {/* Label */}
                  <div className="flex items-center gap-3">
                    <motion.div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: '#1B4FD8' }}
                      initial={{ scale: 0 }}
                      animate={isInView ? { scale: 1 } : { scale: 0 }}
                      transition={{ duration: 0.3, delay: check.delay + 0.4 }}
                    />
                    <span className="text-sm font-medium text-text-primary">{check.label}</span>
                  </div>

                  {/* Bar — hidden on small, visible on sm+ */}
                  <div className="hidden sm:block">
                    <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: 'linear-gradient(90deg, #1B4FD8 0%, #3B6FE8 100%)' }}
                        initial={{ width: 0 }}
                        animate={isInView ? { width: `${check.coverage}%` } : { width: 0 }}
                        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: check.delay }}
                      />
                    </div>
                  </div>

                  {/* Percentage */}
                  <motion.span
                    className="text-sm font-semibold text-accent-blue text-right font-mono"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: check.delay + 0.6 }}
                  >
                    {check.coverage}%
                  </motion.span>
                </div>
              ))}
            </div>

            {/* Contradiction row — featured */}
            <div
              className="border-t-2 border-accent-blue/20 px-6 sm:px-8 py-5"
              style={{ background: 'rgba(27,79,216,0.03)' }}
            >
              <div className="grid grid-cols-[1fr_auto] sm:grid-cols-[200px_1fr_auto] items-center gap-4 sm:gap-6">
                <div className="flex items-center gap-3">
                  <motion.div
                    className="w-3 h-3 rounded-full border-2 border-accent-blue flex-shrink-0"
                    initial={{ scale: 0 }}
                    animate={isInView ? { scale: 1 } : { scale: 0 }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                  />
                  <span className="text-sm font-semibold text-text-primary">Cross-Document Contradictions</span>
                </div>

                {/* Full bar on sm+ */}
                <div className="hidden sm:block">
                  <div className="h-2 rounded-full bg-surface-raised overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: 'linear-gradient(90deg, #1B4FD8 0%, #3B6FE8 100%)' }}
                      initial={{ width: 0 }}
                      animate={isInView ? { width: '100%' } : { width: 0 }}
                      transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.9 }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <motion.span
                    className="text-sm font-bold text-accent-blue font-mono"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 1.3 }}
                  >
                    100%
                  </motion.span>
                  <motion.span
                    className="text-[10px] font-medium tracking-[0.12em] uppercase text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2.5 py-1 rounded-sm whitespace-nowrap"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 1.4 }}
                  >
                    Unique to HataD
                  </motion.span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom note */}
          <motion.div
            variants={fadeInUp}
            className="mt-8 flex items-center gap-6"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <p className="text-sm text-text-muted tracking-wide whitespace-nowrap">
              No one else runs all five. We do.
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
