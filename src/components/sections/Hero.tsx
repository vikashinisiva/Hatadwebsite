'use client'

import { motion } from 'framer-motion'
import { track } from '@/lib/track'
import Image from 'next/image'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/Button'
import PixelCard from '@/components/ui/PixelCard'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useT } from '@/lib/i18n/context'

const HeroBackground = dynamic(
  () => import('@/components/ui/HeroBackground').then(mod => ({ default: mod.HeroBackground })),
  { ssr: false }
)

export function Hero() {
  const t = useT()
  return (
    <section
      id="hero"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
    >
      {/* 3D Beams background */}
      <HeroBackground />

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 pt-28 pb-24 w-full">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.p
              variants={fadeInUp}
              className="text-xs font-medium tracking-[0.25em] uppercase text-white/50 mb-6"
            >
              {t('hero.tag')}
            </motion.p>

            <motion.h1
              variants={fadeInUp}
              className="font-display text-5xl sm:text-6xl lg:text-[4.25rem] xl:text-7xl font-bold leading-[1.05] text-white mb-6"
            >
              {t('hero.title')}{' '}
              <span className="text-gradient-hero-accent">{t('hero.subtitle')}</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg text-white/55 leading-relaxed mb-8 max-w-xl"
            >
              {t('hero.description')}
            </motion.p>

            <motion.div variants={fadeInUp} className="flex flex-wrap gap-4 items-center justify-center mb-10">
              <PixelCard variant="navy" gap={6} speed={50} className="!rounded-lg">
                <a href="/clearance" onClick={() => track('cta_click', 'hero')}>
                  <Button variant="primary" size="lg">
                    {t('hero.cta')}
                  </Button>
                </a>
              </PixelCard>
            </motion.div>

            {/* Trust markers */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center gap-5 text-xs text-white/40 tracking-wide"
            >
              <span>Cross-referenced verification</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Under 3 hours</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span>Tamil Nadu</span>
            </motion.div>

            {/* NVIDIA Inception badge */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center gap-4 mt-8 rounded-lg border border-white/10 bg-white/5 backdrop-blur-sm px-5 py-3.5 w-fit"
            >
              <Image
                src="/nvidia-inception-program-badge-rgb-for-screen.png"
                alt="NVIDIA Inception Program"
                width={120}
                height={120}
                className="object-contain brightness-150"
              />
              <div className="h-8 w-px bg-white/15" />
              <span className="text-base text-white/60 tracking-wide">
                Member of <span className="text-white font-semibold">NVIDIA Inception</span> Program
              </span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Bottom fade — dark to light page transition */}
      <div
        className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-[2]"
        style={{ background: 'linear-gradient(to bottom, transparent 0%, #0C1525 100%)' }}
      />

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2, duration: 1 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1.5"
      >
        <span className="text-[10px] uppercase tracking-[0.25em] text-white/60">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
          className="w-px h-7 bg-gradient-to-b from-white/60 to-transparent"
        />
      </motion.div>
    </section>
  )
}
