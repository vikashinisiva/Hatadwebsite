'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { staggerContainer, fadeInUp } from '@/lib/animations'

export function NvidiaInception() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden" ref={ref}>
      {/* Dark band */}
      <div className="relative bg-[#0C1525] py-20 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40">
        {/* Subtle NVIDIA green gradient accent */}
        <div
          className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-[0.06]"
          style={{ background: 'radial-gradient(ellipse at 80% 50%, #76B900, transparent 70%)' }}
        />

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
          className="relative z-10"
        >
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            {/* Badge */}
            <motion.div variants={fadeInUp} className="flex-shrink-0">
              <div className="bg-white rounded-lg p-5">
                <Image
                  src="/nvidia-inception-program-badge-rgb-for-screen.png"
                  alt="NVIDIA Inception Program"
                  width={180}
                  height={180}
                  className="object-contain"
                />
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div
              variants={fadeInUp}
              className="hidden lg:block w-px h-28 bg-white/10"
            />

            {/* Text */}
            <div className="text-center lg:text-left">
              <motion.p
                variants={fadeInUp}
                className="text-[10px] tracking-[0.2em] uppercase font-medium text-[#76B900] mb-3"
              >
                Partnership
              </motion.p>

              <motion.h3
                variants={fadeInUp}
                className="font-display text-2xl sm:text-3xl font-bold text-white leading-snug mb-3"
              >
                HataD is an NVIDIA Inception Member.
              </motion.h3>

              <motion.p
                variants={fadeInUp}
                className="text-sm text-white/50 leading-relaxed max-w-xl"
              >
                The same AI infrastructure behind autonomous vehicles and drug discovery
                now powers Tamil Nadu&apos;s most thorough land clearance process.
              </motion.p>
            </div>

            {/* Year badge — right aligned */}
            <motion.div
              variants={fadeInUp}
              className="lg:ml-auto flex-shrink-0"
            >
              <div className="flex items-center gap-3 rounded-full border border-white/10 px-5 py-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#76B900]" />
                <span className="text-xs text-white/40 tracking-wide">2025 — Present</span>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
