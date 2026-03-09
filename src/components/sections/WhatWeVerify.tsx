'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainerFast, fadeInUp } from '@/lib/animations'
import {
  Link2,
  Scale,
  Landmark,
  MapPinned,
  GitCompareArrows,
  ShieldCheck,
} from 'lucide-react'

const LAYERS = [
  { icon: Link2, title: 'Title & Ownership Chain' },
  { icon: Scale, title: 'Liabilities & Hidden Charges' },
  { icon: Landmark, title: 'Government Records' },
  { icon: MapPinned, title: 'Regulatory & Zone Status' },
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
          <div className="mb-16">
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

          {/* Verification scan rows */}
          <div
            className="rounded-lg border border-border/60 bg-white overflow-hidden"
            style={{ boxShadow: '0 4px 32px rgba(12,21,37,0.06)' }}
          >
            {LAYERS.map((layer, i) => {
              const Icon = layer.icon
              const delay = 0.3 + i * 0.35
              return (
                <div
                  key={layer.title}
                  className="relative border-b border-border/40 last:border-b-0"
                >
                  {/* Scan line background */}
                  <motion.div
                    className="absolute inset-0 bg-accent-blue/[0.04]"
                    initial={{ scaleX: 0 }}
                    animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay }}
                    style={{ transformOrigin: 'left' }}
                  />

                  <div className="relative flex items-center gap-4 sm:gap-5 px-6 sm:px-8 py-5 sm:py-6">
                    {/* Icon */}
                    <motion.div
                      className="w-10 h-10 rounded-lg bg-accent-blue/8 flex items-center justify-center text-accent-blue flex-shrink-0"
                      initial={{ opacity: 0, scale: 0.6 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                      transition={{ duration: 0.4, delay: delay + 0.15 }}
                    >
                      <Icon size={20} strokeWidth={1.7} />
                    </motion.div>

                    {/* Layer title */}
                    <motion.span
                      className="text-[15px] sm:text-base font-semibold text-text-primary flex-1"
                      initial={{ opacity: 0, x: -8 }}
                      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                      transition={{ duration: 0.4, delay: delay + 0.2 }}
                    >
                      {layer.title}
                    </motion.span>

                    {/* Verified badge */}
                    <motion.div
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                      transition={{ duration: 0.3, delay: delay + 0.45 }}
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-[11px] font-semibold tracking-[0.12em] uppercase text-emerald-600 hidden sm:block">
                        Verified
                      </span>
                    </motion.div>
                  </div>
                </div>
              )
            })}

            {/* Layer 5 — featured */}
            <div className="relative border-t-2 border-accent-blue/20">
              <motion.div
                className="absolute inset-0 bg-accent-blue/[0.05]"
                initial={{ scaleX: 0 }}
                animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 1.7 }}
                style={{ transformOrigin: 'left' }}
              />

              <div className="relative flex items-center gap-4 sm:gap-5 px-6 sm:px-8 py-6 sm:py-7">
                <motion.div
                  className="w-10 h-10 rounded-lg bg-accent-blue/12 flex items-center justify-center text-accent-blue flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
                  transition={{ duration: 0.4, delay: 1.85 }}
                >
                  <GitCompareArrows size={20} strokeWidth={1.7} />
                </motion.div>

                <div className="flex-1 min-w-0">
                  <motion.span
                    className="text-[15px] sm:text-base font-bold text-text-primary block"
                    initial={{ opacity: 0, x: -8 }}
                    animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }}
                    transition={{ duration: 0.4, delay: 1.9 }}
                  >
                    Cross-Document Contradictions
                  </motion.span>
                  <motion.span
                    className="text-xs text-text-muted mt-0.5 block"
                    initial={{ opacity: 0 }}
                    animate={isInView ? { opacity: 1 } : { opacity: 0 }}
                    transition={{ delay: 2.0 }}
                  >
                    Catches what single-document checks miss.
                  </motion.span>
                </div>

                <motion.div
                  className="flex items-center gap-2 flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3, delay: 2.15 }}
                >
                  <div className="w-5 h-5 rounded-full bg-accent-blue flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-accent-blue bg-accent-blue/10 border border-accent-blue/20 px-2 py-0.5 rounded-sm hidden sm:block">
                    Only HataD
                  </span>
                </motion.div>
              </div>
            </div>
          </div>

          {/* Shield trust block */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.5, delay: 2.4 }}
            className="mt-10 flex flex-col items-center gap-3"
          >
            <ShieldCheck size={28} className="text-emerald-500" strokeWidth={1.6} />
            <p className="text-sm text-text-muted tracking-wide text-center">
              No one else runs all five. We do.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
