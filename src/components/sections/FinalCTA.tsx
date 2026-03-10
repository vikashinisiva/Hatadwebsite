'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ContactModal } from '@/components/ui/ContactModal'
import { Button } from '@/components/ui/Button'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { Phone, MessageCircle, Mail } from 'lucide-react'

export function FinalCTA() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section
      id="contact"
      className="relative py-32 lg:py-40 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(27,79,216,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Headline group */}
          <div className="text-center mb-12">
            <motion.p
              variants={fadeInUp}
              className="text-xs font-medium tracking-[0.25em] uppercase text-accent-blue mb-6"
            >
              Get Started
            </motion.p>

            <motion.h2
              variants={fadeInUp}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-text-primary leading-[1.1] mb-5"
            >
              The Land Is Waiting.
            </motion.h2>

            <motion.p
              variants={fadeInUp}
              className="text-lg sm:text-xl text-text-secondary font-light max-w-xl mx-auto"
            >
              Don&apos;t let unclear records define a decision worth crores.
            </motion.p>
          </div>

          {/* Process — minimal inline */}
          <motion.div
            variants={fadeInUp}
            className="flex items-center justify-center gap-3 sm:gap-5 mb-12 text-text-muted text-sm"
          >
            <span className="text-text-secondary">Submit</span>
            <span className="text-border">—</span>
            <span className="text-text-secondary">Verify</span>
            <span className="text-border">—</span>
            <span className="text-text-secondary">Decide</span>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            variants={fadeInUp}
            className="flex flex-wrap gap-4 justify-center"
          >
            <ContactModal
              trigger={
                <Button variant="primary" size="lg">
                  Start Your Land Clearance
                </Button>
              }
            />
          </motion.div>

          {/* Just want to talk? */}
          <motion.div variants={fadeInUp} className="mt-10">
            <p className="text-center text-sm text-text-muted mb-4">
              Just want to talk? Reach us directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <a
                href="https://wa.me/918122642341"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-emerald-400 hover:text-emerald-600 transition-colors"
              >
                <MessageCircle size={16} /> WhatsApp
              </a>
              <a
                href="tel:+918122642341"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
              >
                <Phone size={16} /> Call Us
              </a>
              <a
                href="mailto:hatad@hypseaero.in"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm border border-border bg-white text-sm font-medium text-text-primary hover:border-accent-blue hover:text-accent-blue transition-colors"
              >
                <Mail size={16} /> Email
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
