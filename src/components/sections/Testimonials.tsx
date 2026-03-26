'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { Shield, AlertTriangle, FileSearch } from 'lucide-react'
import { track } from '@/lib/track'

const CASES = [
  {
    icon: AlertTriangle,
    tag: 'Boundary & Litigation',
    location: 'Tamil Nadu',
    type: 'Residential plot',
    headline: 'The agent said it was clear. It wasn\u2019t.',
    body: 'An active civil dispute filed in 2021 had no trace in the EC or registration documents. Found only through court record cross-reference.',
    result: 'The buyer didn\u2019t sign.',
    outcome: 'Encumbrance + undisclosed active litigation',
  },
  {
    icon: FileSearch,
    tag: 'Undisclosed Mortgage',
    location: 'Tamil Nadu',
    type: 'Residential plot',
    headline: 'The documents looked clean. The liability wasn\u2019t.',
    body: 'A mortgage taken against the property in 2019 appeared nowhere in the documents the seller provided. Surfaced through cross-referencing multiple government records.',
    result: 'The buyer renegotiated.',
    outcome: 'Hidden mortgage + linked encumbrances',
  },
  {
    icon: Shield,
    tag: 'Fractured Title',
    location: 'Tamil Nadu',
    type: 'Multi-owner residential',
    headline: 'Three people claimed ownership. Only one was right.',
    body: 'Conflicting entries across Patta, A-Register, and Sale Deed \u2014 each showing a different owner. Full chain mapped. Title fracture point identified.',
    result: 'The buyer walked away.',
    outcome: 'Ownership conflict across 3 government records',
  },
]

export function Testimonials() {
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
              <SectionLabel>What We&apos;ve Found</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mt-5 mb-5"
            >
              What Our Clients Didn&apos;t Walk Into.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-text-secondary font-light max-w-2xl mx-auto"
            >
              Real findings from real clearance reports. Details anonymised to protect client confidentiality.
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
                    Findings
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
            All case details anonymised. Findings sourced from actual HataD clearance reports.
          </motion.p>

          {/* Post-anxiety CTA — highest conversion moment */}
          <motion.div
            variants={fadeInUp}
            className="mt-14 text-center"
          >
            <h3 className="font-display text-2xl sm:text-3xl font-bold text-text-primary leading-tight mb-2">
              Undisclosed mortgage. Active litigation. Fractured title.
            </h3>
            <p className="text-lg text-text-secondary font-light mb-3">
              All found before signing.
            </p>
            <p className="text-sm text-text-muted mb-8">
              One survey number. Every record. Under 3 hours.
            </p>
            <a
              href="/clearance"
              onClick={() => track('cta_click', 'post_testimonials')}
              className="inline-block bg-[#1B4FD8] text-white text-sm font-semibold px-8 py-3.5 rounded-sm hover:bg-[#1636D0] transition-colors"
            >
              Get Your Clearance Report &rarr;
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
