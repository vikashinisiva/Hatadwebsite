'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  Search,
  FileSearch,
  Compass,
  HardHat,
  Building2,
  KeyRound,
} from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { staggerContainer, fadeInUp } from '@/lib/animations'

const STAGES = [
  {
    icon: Search,
    num: '01',
    label: 'Land Discovery',
    description: 'Identify and evaluate potential land parcels with data-backed insights.',
    status: 'planned',
  },
  {
    icon: FileSearch,
    num: '02',
    label: 'Land Acquisition',
    sublabel: 'Land Clearance',
    description:
      'Cross-referenced document intelligence for every land decision.',
    status: 'live',
  },
  {
    icon: Compass,
    num: '03',
    label: 'Design Phase',
    description: 'Site-level data to inform layout, zoning, and compliance decisions.',
    status: 'coming',
  },
  {
    icon: HardHat,
    num: '04',
    label: 'Pre-Construction',
    description: 'Permits, approvals, and readiness intelligence before breaking ground.',
    status: 'coming',
  },
  {
    icon: Building2,
    num: '05',
    label: 'Construction',
    description: 'Progress tracking and compliance monitoring through completion.',
    status: 'coming',
  },
  {
    icon: KeyRound,
    num: '06',
    label: 'Handover',
    description: 'Final documentation, clearance verification, and ownership transfer.',
    status: 'coming',
  },
]

const activeIndex = STAGES.findIndex((s) => s.status === 'live')

export function BiggerPicture() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      {/* Subtle background band */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, transparent 0%, #EBF0F8 12%, #EBF0F8 88%, transparent 100%)',
        }}
      />
      <RadialGlow color="#1B4FD8" size="900px" opacity="0.04" position="50% 30%" />

      <div className="relative z-10" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header — 2-col */}
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-16 mb-14">
            <div>
              <motion.div variants={fadeInUp}>
                <SectionLabel className="mb-6">The Bigger Picture</SectionLabel>
              </motion.div>

              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
              >
                From First Glance{' '}
                <span className="text-text-secondary font-light">
                  to Final Handover.
                </span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-base text-text-muted font-medium mt-3"
              >
                Land Clearance is where we begin. Not where we end.
              </motion.p>
            </div>

            <div className="flex flex-col justify-end">
              <motion.p
                variants={fadeInUp}
                className="text-base text-text-secondary leading-relaxed text-justify"
              >
                India&apos;s infrastructure failures don&apos;t happen at construction. They
                happen in the gap between deciding to build and knowing what you&apos;re
                building on — the fragmented intelligence layer that no platform has ever
                properly solved.
              </motion.p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="relative h-px mb-0">
            <div className="absolute inset-0 bg-border" />
            <motion.div
              className="absolute top-0 left-0 h-full bg-accent-blue"
              initial={{ width: 0 }}
              animate={
                isInView
                  ? { width: `${((activeIndex + 0.5) / STAGES.length) * 100}%` }
                  : { width: 0 }
              }
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </div>

          {/* Desktop — 6-column stage cards */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-6">
              {STAGES.map((stage, i) => {
                const Icon = stage.icon
                const isActive = stage.status === 'live'
                const isPast = i < activeIndex

                return (
                  <motion.div
                    key={stage.label}
                    className={`relative pt-5 pb-6 px-4 ${
                      i < STAGES.length - 1 ? 'border-r border-border/40' : ''
                    } ${isActive ? 'bg-[#0C1525] rounded-b-lg' : ''}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={isInView ? { opacity: 1, y: 0 } : {}}
                    transition={{ duration: 0.5, delay: 0.3 + i * 0.08 }}
                  >
                    {/* Tick mark */}
                    <div
                      className="absolute top-0 left-0 w-px h-3"
                      style={{
                        background: isPast || isActive ? '#1B4FD8' : '#CBD5E8',
                      }}
                    />

                    {/* Number + status */}
                    <div className="flex items-center justify-between mb-4">
                      <span
                        className={`text-[10px] font-mono tracking-wider ${
                          isActive ? 'text-white/30' : 'text-text-muted/50'
                        }`}
                      >
                        {stage.num}
                      </span>
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 text-[9px] font-medium tracking-[0.15em] uppercase bg-accent-blue text-white rounded-full px-2.5 py-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                          Live
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium tracking-[0.15em] uppercase border border-border/60 text-text-muted/60 rounded-full px-2.5 py-0.5">
                          {isPast ? 'Planned' : 'Coming'}
                        </span>
                      )}
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-9 h-9 rounded-md flex items-center justify-center mb-3 ${
                        isActive
                          ? 'bg-accent-blue/20 border border-accent-blue/30'
                          : 'bg-surface-raised border border-border/60'
                      }`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.5}
                        className={isActive ? 'text-accent-blue' : 'text-text-muted'}
                      />
                    </div>

                    {/* Label */}
                    <h3
                      className={`text-sm font-semibold mb-1 leading-snug ${
                        isActive ? 'text-white' : isPast ? 'text-text-primary' : 'text-text-secondary'
                      }`}
                    >
                      {stage.label}
                    </h3>
                    {stage.sublabel && (
                      <p
                        className={`text-[11px] mb-2 ${
                          isActive ? 'text-accent-blue' : 'text-text-muted'
                        }`}
                      >
                        {stage.sublabel}
                      </p>
                    )}

                    {/* Description */}
                    <p
                      className={`text-[12px] leading-relaxed ${
                        isActive ? 'text-white/50' : 'text-text-muted'
                      }`}
                    >
                      {stage.description}
                    </p>
                  </motion.div>
                )
              })}
            </div>
          </div>

          {/* Mobile — compact vertical list */}
          <div className="lg:hidden mt-4">
            <div className="relative pl-6 border-l border-border">
              <motion.div
                className="absolute top-0 left-0 w-px bg-accent-blue"
                initial={{ height: 0 }}
                animate={
                  isInView
                    ? { height: `${((activeIndex + 0.5) / STAGES.length) * 100}%` }
                    : { height: 0 }
                }
                transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
                style={{ marginLeft: '-0.5px' }}
              />

              <div className="space-y-5">
                {STAGES.map((stage, i) => {
                  const isActive = stage.status === 'live'
                  return (
                    <motion.div
                      key={stage.label}
                      initial={{ opacity: 0, x: -12 }}
                      animate={isInView ? { opacity: 1, x: 0 } : {}}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.08 }}
                      className="relative"
                    >
                      <div
                        className="absolute -left-6 top-1.5 h-px w-3"
                        style={{ background: isActive ? '#1B4FD8' : '#CBD5E8' }}
                      />
                      <div className="flex items-baseline justify-between">
                        <div className="flex items-baseline gap-3">
                          <span className="text-[10px] font-mono text-text-muted">
                            {stage.num}
                          </span>
                          <div>
                            <p
                              className="text-sm font-semibold"
                              style={{
                                color: isActive ? '#1B4FD8' : '#3D5278',
                              }}
                            >
                              {stage.label}
                            </p>
                            <p className="text-[12px] text-text-muted mt-0.5">
                              {stage.description}
                            </p>
                          </div>
                        </div>
                        {isActive && (
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] uppercase text-accent-blue shrink-0">
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

          {/* Bottom row — paragraph + quote */}
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 mt-14 items-center">
            <motion.p
              variants={fadeInUp}
              className="text-base text-text-secondary leading-relaxed text-justify"
            >
              HataD is being built as a full-lifecycle Infrastructure Intelligence Hub —
              covering every decision from the first question about a piece of land to the
              moment you hand over what you built on it. Land Clearance is live because it
              is the first decision that determines every decision that follows.
            </motion.p>

            <motion.div variants={fadeInUp} className="text-right">
              <p className="text-xl sm:text-2xl font-display font-semibold text-text-primary italic">
                &ldquo;The Data You Need. Exactly When You Need It.&rdquo;
              </p>
            </motion.div>
          </div>

          {/* Bottom divider tagline */}
          <motion.div
            variants={fadeInUp}
            className="mt-14 flex items-center gap-6"
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
