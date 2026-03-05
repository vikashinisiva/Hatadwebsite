'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { PERSONA_CARDS } from '@/lib/constants'
import { staggerContainerFast, fadeInUp } from '@/lib/animations'

export function WhoItsFor() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  const featured = PERSONA_CARDS[0]
  const secondary = PERSONA_CARDS.slice(1)

  return (
    <section id="who" className="relative py-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #EBF0F8 20%, #EBF0F8 80%, transparent 100%)',
        }}
      />

      <div className="relative z-10" ref={ref}>
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header — 2-col */}
          <div className="grid lg:grid-cols-2 gap-4 mb-16">
            <div>
              <motion.div variants={fadeInUp} className="mb-6">
                <SectionLabel>Who It&apos;s For</SectionLabel>
              </motion.div>
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
              >
                For the People Whose{' '}
                <span className="text-text-secondary font-light">
                  Decisions Cannot Be Wrong.
                </span>
              </motion.h2>
            </div>
          </div>

          {/* Featured persona — dark card */}
          <motion.div
            variants={fadeInUp}
            className="rounded-lg overflow-hidden mb-4"
            style={{
              background: '#0C1525',
              boxShadow: '0 4px 32px rgba(12,21,37,0.15)',
            }}
          >
            <div className="p-8 lg:p-10 flex flex-col sm:flex-row sm:items-center gap-6">
              <div className="flex-1">
                <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-accent-blue mb-3 block">
                  Primary Audience
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
                  {featured.title}
                </h3>
                <p className="text-sm text-white/50 leading-relaxed max-w-md">
                  {featured.body}
                </p>
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                <div className="h-px sm:h-16 sm:w-px w-full bg-white/10" />
              </div>
              <div className="flex-shrink-0">
                <span className="text-xs text-white/30 tracking-wide">
                  Most of our clients start here
                </span>
              </div>
            </div>
          </motion.div>

          {/* Secondary personas — 3-col bordered grid */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-px rounded-lg overflow-hidden border border-border/60"
            style={{ background: 'rgba(203,213,232,0.4)' }}
          >
            {secondary.map((card, i) => (
              <motion.div
                key={card.title}
                variants={fadeInUp}
                custom={i + 1}
                className="bg-white p-8"
              >
                <span className="text-[10px] font-mono text-text-muted mb-3 block">
                  {String(i + 2).padStart(2, '0')}
                </span>
                <h3 className="text-base font-semibold text-text-primary mb-2 leading-snug">
                  {card.title}
                </h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {card.body}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  )
}
