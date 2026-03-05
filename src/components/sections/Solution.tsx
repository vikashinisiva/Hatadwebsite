'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, staggerContainerFast, fadeInUp, scaleIn } from '@/lib/animations'

const STEPS = [
  {
    num: '01',
    title: 'Cross-Reference',
    body: 'Every document is checked against every other — not just read in isolation.',
  },
  {
    num: '02',
    title: 'Detect Contradictions',
    body: 'Mismatched names, conflicting boundaries, differing extents — all flagged automatically.',
  },
  {
    num: '03',
    title: 'Map the Full Picture',
    body: 'One structured report covering ownership, liabilities, government records, and zoning.',
  },
]

export function Solution() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #EBF0F8 30%, #EBF0F8 70%, transparent 100%)',
        }}
      />

      <div className="relative z-10" ref={ref}>
        {/* Header — left aligned, 2-col */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid lg:grid-cols-2 gap-4 mb-20"
        >
          <div>
            <motion.div variants={fadeInUp}>
              <SectionLabel className="mb-6">The Solution</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
            >
              Land Clearance.{' '}
              <span className="text-text-secondary font-light">
                Not Just Document Review.
              </span>
            </motion.h2>
          </div>
          <div className="flex items-end lg:justify-end">
            <motion.p variants={fadeInUp} className="text-lg text-text-secondary leading-relaxed max-w-sm">
              Most due diligence reads what documents say. HataD checks whether they{' '}
              <span className="text-text-primary font-medium">agree.</span>
            </motion.p>
          </div>
        </motion.div>

        {/* Process steps — bordered cards */}
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="grid md:grid-cols-3 gap-px mb-16 rounded-lg overflow-hidden border border-border/60"
          style={{ background: 'rgba(203,213,232,0.4)' }}
        >
          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fadeInUp}
              className="relative bg-white p-8 lg:p-10"
            >
              {/* Step number + title row */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className="text-xs font-mono tracking-wider text-accent-blue">{step.num}</span>
                <h3 className="font-display text-lg font-semibold text-text-primary">
                  {step.title}
                </h3>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                {step.body}
              </p>

              {/* Bottom arrow indicator */}
              {i < STEPS.length - 1 && (
                <motion.div
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 w-6 h-6 rounded-full bg-surface-raised border border-border/60 items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={isInView ? { scale: 1 } : { scale: 0 }}
                  transition={{ duration: 0.3, delay: 0.5 + i * 0.15 }}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M3.5 2L6.5 5L3.5 8" stroke="#7A8FAD" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.div>
              )}
            </motion.div>
          ))}
        </motion.div>

        {/* Bottom — time badge + tagline */}
        <motion.div
          variants={scaleIn}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="flex flex-col sm:flex-row items-center justify-between gap-6"
        >
          <div
            className="flex items-center gap-4 rounded-full px-8 py-4"
            style={{
              background: '#FFFFFF',
              border: '1px solid rgba(160, 104, 24, 0.2)',
              boxShadow: '0 4px 24px rgba(160, 104, 24, 0.06)',
            }}
          >
            <span
              className="font-display text-3xl font-bold leading-none"
              style={{
                background: 'linear-gradient(135deg, #A06818 0%, #C9870A 50%, #A06818 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              &lt;3 hrs
            </span>
            <span className="w-px h-8 bg-border" />
            <span className="text-sm text-text-secondary leading-snug">
              Every report.<br />No exceptions.
            </span>
          </div>

          <p className="text-sm text-text-muted">
            Backed by data. Built for decisions worth crores.
          </p>
        </motion.div>
      </div>
    </section>
  )
}
