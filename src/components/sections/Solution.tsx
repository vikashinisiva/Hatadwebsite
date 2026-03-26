'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, staggerContainerFast, fadeInUp, scaleIn } from '@/lib/animations'
import { useT } from '@/lib/i18n/context'

export function Solution() {
  const t = useT()

  const STEPS = [
    { num: '01', title: t('solution.step1Title'), body: t('solution.step1Body') },
    { num: '02', title: t('solution.step2Title'), body: t('solution.step2Body') },
    { num: '03', title: t('solution.step3Title'), body: t('solution.step3Body') },
  ]
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
              <SectionLabel className="mb-6">{t('solution.tag')}</SectionLabel>
            </motion.div>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl font-bold text-text-primary leading-[1.1]"
            >
              {t('solution.title')}{' '}
              <span className="text-text-secondary font-light">
                {t('solution.titleLight')}
              </span>
            </motion.h2>
          </div>
          <div className="flex items-end lg:justify-end">
            <motion.p variants={fadeInUp} className="text-lg text-text-secondary leading-relaxed max-w-sm">
              {t('solution.description')}
            </motion.p>
          </div>
        </motion.div>

        {/* Process steps — card 02 visually dominant */}
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
              className={
                i === 1
                  ? 'relative bg-[#0D1B2A] p-5 sm:p-8 lg:p-10'
                  : 'relative bg-white p-5 sm:p-8 lg:p-10'
              }
            >
              {/* Step number + title row */}
              <div className="flex items-baseline gap-3 mb-3">
                <span className={`text-xs font-mono tracking-wider ${i === 1 ? 'text-[#C9A84C]' : 'text-accent-blue'}`}>{step.num}</span>
                <h3 className={`font-display font-semibold ${i === 1 ? 'text-xl text-white' : 'text-lg text-text-primary'}`}>
                  {step.title}
                </h3>
              </div>

              <p className={`text-sm leading-relaxed ${i === 1 ? 'text-white/60' : 'text-text-secondary'}`}>
                {step.body}
              </p>

              {i === 1 && (
                <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-medium tracking-[0.1em] uppercase text-[#C9A84C]/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C9A84C]" />
                  {t('solution.step2Label')}
                </div>
              )}

              {/* Arrow indicator */}
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
              {t('solution.timeLabel')}
            </span>
          </div>

          <div className="text-right sm:text-right">
            <p className="text-sm text-text-secondary font-medium mb-1">
              {t('solution.priceContext')}
            </p>
            <p className="text-lg font-semibold text-text-primary">
              ₹3,599
            </p>
            <p className="text-xs text-text-muted">
              GST inclusive · Delivered in under 3 hours
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
