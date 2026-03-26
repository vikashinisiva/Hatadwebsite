'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { Shield, AlertTriangle, FileSearch } from 'lucide-react'
import { track } from '@/lib/track'
import { useT } from '@/lib/i18n/context'

export function Testimonials() {
  const t = useT()

  const CASES = [
    {
      icon: AlertTriangle, tag: t('testimonials.case1Tag'), location: 'Tamil Nadu', type: 'Residential plot',
      headline: t('testimonials.case1Headline'), body: t('testimonials.case1Body'),
      result: t('testimonials.case1Result'), outcome: t('testimonials.case1Outcome'),
    },
    {
      icon: FileSearch, tag: t('testimonials.case2Tag'), location: 'Tamil Nadu', type: 'Residential plot',
      headline: t('testimonials.case2Headline'), body: t('testimonials.case2Body'),
      result: t('testimonials.case2Result'), outcome: t('testimonials.case2Outcome'),
    },
    {
      icon: Shield, tag: t('testimonials.case3Tag'), location: 'Tamil Nadu', type: 'Multi-owner residential',
      headline: t('testimonials.case3Headline'), body: t('testimonials.case3Body'),
      result: t('testimonials.case3Result'), outcome: t('testimonials.case3Outcome'),
    },
  ]
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative py-28 lg:py-36 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      {/* Subtle background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(27,79,216,0.03) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <div className="text-center mb-16">
            <motion.div variants={fadeInUp}>
              <SectionLabel>{t('testimonials.tag')}</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mt-5 mb-5"
            >
              {t('testimonials.title')}
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-text-secondary font-light max-w-2xl mx-auto"
            >
              {t('testimonials.subtitle')}
            </motion.p>
          </div>

          {/* Cases grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {CASES.map((c, i) => (
              <motion.div
                key={i}
                variants={fadeInUp}
                className="group relative bg-white border border-border rounded-sm p-8 hover:border-accent-blue/20 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(27,79,216,0.06)]"
              >
                {/* Tag */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-8 h-8 rounded-sm bg-accent-blue/8 flex items-center justify-center">
                    <c.icon size={15} className="text-accent-blue" />
                  </div>
                  <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-accent-blue">
                    {c.tag}
                  </span>
                </div>

                {/* Headline */}
                <p className="text-text-primary text-lg font-semibold leading-snug mb-3">
                  &ldquo;{c.headline}&rdquo;
                </p>

                {/* Body */}
                <p className="text-text-secondary text-sm leading-relaxed mb-4">
                  {c.body}
                </p>

                {/* Result — the punch line */}
                <p className="text-accent-blue text-sm font-semibold mb-6">
                  {c.result}
                </p>

                {/* Outcome */}
                <div className="border-t border-border pt-5 mt-auto">
                  <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-text-muted mb-1.5">
                    {t('testimonials.findings')}
                  </p>
                  <p className="text-xs text-text-secondary font-medium">
                    {c.outcome}
                  </p>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] text-text-muted">{c.location}</span>
                  <span className="text-border">&middot;</span>
                  <span className="text-[10px] text-text-muted">{c.type}</span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Trust line */}
          <motion.p
            variants={fadeInUp}
            className="text-center text-sm text-text-muted mt-12 mb-10"
          >
            {t('testimonials.anonymised')}
          </motion.p>

          {/* Post-anxiety CTA — highest conversion moment */}
          <motion.div
            variants={fadeInUp}
            className="mt-14 text-center"
          >
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight mb-2">
              {t('testimonials.ctaTitle')}
            </h3>
            <p className="text-lg text-text-secondary font-light mb-3">
              {t('testimonials.ctaSubtitle')}
            </p>
            <p className="text-sm text-text-muted mb-8">
              {t('testimonials.ctaDescription')}
            </p>
            <a
              href="/clearance"
              onClick={() => track('cta_click', 'post_testimonials')}
              className="inline-block bg-[#1B4FD8] text-white text-sm font-semibold px-5 sm:px-8 py-3.5 rounded-sm hover:bg-[#1636D0] transition-colors"
            >
              {t('testimonials.ctaButton')}
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
