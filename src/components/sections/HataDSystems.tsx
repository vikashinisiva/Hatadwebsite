'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, fadeInUp } from '@/lib/animations'

const STAGES = [
  { label: 'Land Discovery', num: '01' },
  { label: 'Land Acquisition', num: '02', sublabel: 'Land Clearance', live: true },
  { label: 'Design Phase', num: '03' },
  { label: 'Pre-Construction', num: '04' },
  { label: 'Construction', num: '05' },
  { label: 'Handover', num: '06' },
]

export function HataDSystems() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  const activeIndex = STAGES.findIndex((s) => s.live)

  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      {/* Background band */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #EBF0F8 15%, #EBF0F8 85%, transparent 100%)',
        }}
      />

      <div className="relative z-10" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header — left aligned */}
          <div className="grid lg:grid-cols-2 gap-4 mb-16">
            <div>
              <motion.div variants={fadeInUp}>
                <SectionLabel className="mb-6">HataD Systems</SectionLabel>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
              >
                From First Glance to Final Handover.
              </motion.h2>
            </div>
            <div className="flex items-end lg:justify-end">
              <motion.p
                variants={fadeInUp}
                className="text-text-secondary text-lg leading-relaxed max-w-sm"
              >
                Intelligence at every stage of the infrastructure lifecycle. We start with land clearance.
              </motion.p>
            </div>
          </div>

          {/* Desktop — horizontal stage list */}
          <div className="hidden lg:block">
            {/* Progress bar */}
            <div className="relative h-px mb-0">
              <div className="absolute inset-0 bg-border" />
              <motion.div
                className="absolute top-0 left-0 h-full bg-accent-blue"
                initial={{ width: 0 }}
                animate={isInView ? { width: `${((activeIndex + 0.5) / STAGES.length) * 100}%` } : { width: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              />
            </div>

            <div className="grid grid-cols-6">
              {STAGES.map((stage, i) => {
                const isPast = i < activeIndex
                const isActive = i === activeIndex

                return (
                  <motion.div
                    key={stage.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                    className="relative pt-6 pr-6"
                  >
                    {/* Top tick mark */}
                    <div
                      className="absolute top-0 left-0 w-px h-3"
                      style={{
                        background: isPast || isActive ? '#1B4FD8' : '#CBD5E8',
                      }}
                    />

                    {/* Number */}
                    <span
                      className="text-[10px] font-mono tracking-wider block mb-2"
                      style={{ color: isActive ? '#1B4FD8' : '#7A8FAD' }}
                    >
                      {stage.num}
                    </span>

                    {/* Label */}
                    <p
                      className="text-sm font-semibold leading-snug mb-1"
                      style={{ color: isActive ? '#1B4FD8' : isPast ? '#0C1525' : '#3D5278' }}
                    >
                      {stage.label}
                    </p>

                    {stage.sublabel && (
                      <p className="text-xs text-text-muted">{stage.sublabel}</p>
                    )}

                    {/* Status */}
                    <div className="mt-3">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] uppercase text-accent-blue">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="text-[10px] tracking-[0.1em] uppercase text-text-muted">
                          {isPast ? 'Planned' : 'Coming Soon'}
                        </span>
                      )}
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Mobile — compact vertical list */}
          <div className="lg:hidden">
            <div className="relative pl-6 border-l border-border">
              {/* Progress fill */}
              <motion.div
                className="absolute top-0 left-0 w-px bg-accent-blue"
                initial={{ height: 0 }}
                animate={isInView ? { height: `${((activeIndex + 0.5) / STAGES.length) * 100}%` } : { height: 0 }}
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                style={{ marginLeft: '-0.5px' }}
              />

              <div className="space-y-6">
                {STAGES.map((stage, i) => {
                  const isActive = i === activeIndex
                  return (
                    <motion.div
                      key={stage.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      className="relative"
                    >
                      {/* Tick mark */}
                      <div
                        className="absolute -left-6 top-1.5 h-px w-3"
                        style={{ background: isActive ? '#1B4FD8' : '#CBD5E8' }}
                      />

                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-3">
                          <span className="text-[10px] font-mono text-text-muted">{stage.num}</span>
                          <p
                            className="text-sm font-semibold"
                            style={{ color: isActive ? '#1B4FD8' : '#3D5278' }}
                          >
                            {stage.label}
                          </p>
                        </div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] uppercase text-accent-blue">
                            <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse" />
                            Live
                          </span>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Bottom statement */}
          <motion.div
            variants={fadeInUp}
            className="mt-16 flex items-center gap-6"
          >
            <div className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
            <p className="text-sm text-text-muted tracking-wide whitespace-nowrap">
              6 stages · 1 platform · Starting with what matters most
            </p>
            <div className="h-px flex-1 bg-gradient-to-l from-border to-transparent" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
