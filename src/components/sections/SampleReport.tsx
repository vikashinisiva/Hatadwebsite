'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import { FileText, CheckCircle, AlertTriangle, Shield, MapPin, Scale } from 'lucide-react'
import { track } from '@/lib/track'

const REPORT_SECTIONS = [
  { icon: MapPin, label: 'Property Identification', desc: 'Survey number, ULPIN, location, land classification' },
  { icon: FileText, label: 'Encumbrance Certificate Analysis', desc: 'Full EC history with transaction-by-transaction breakdown' },
  { icon: Scale, label: 'Title Chain Verification', desc: 'Ownership chain mapped from current holder to origin' },
  { icon: Shield, label: 'Litigation & Court Records', desc: 'District court case search for disputes or injunctions' },
  { icon: CheckCircle, label: 'Cross-Document Contradictions', desc: 'Mismatches flagged across EC, Patta, FMB, and Sale Deed' },
  { icon: AlertTriangle, label: 'Risk Assessment & Recommendation', desc: 'Clear / Flagged verdict with detailed findings' },
]

export function SampleReport() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })

  return (
    <section className="relative py-28 lg:py-36 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, transparent 0%, #EBF0F8 30%, #EBF0F8 70%, transparent 100%)',
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto" ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Header */}
          <div className="text-center mb-14">
            <motion.div variants={fadeInUp}>
              <SectionLabel>Sample Report</SectionLabel>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mt-5 mb-4"
            >
              See exactly what you get.
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-text-secondary font-light max-w-2xl mx-auto"
            >
              Here&apos;s what a completed clearance report looks like. Every report you order follows this exact structure.
            </motion.p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Left — Report contents list (3 cols) */}
            <motion.div variants={fadeInUp} className="lg:col-span-3 lg:pt-8">
              <p className="text-[10px] font-medium tracking-[0.15em] uppercase text-text-muted mb-4">
                What&apos;s inside every report
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {REPORT_SECTIONS.map((section) => (
                  <motion.div
                    key={section.label}
                    variants={fadeInUp}
                    className="flex items-start gap-3 bg-white border border-border rounded-sm p-3.5 hover:border-accent-blue/20 transition-colors"
                  >
                    <div className="w-7 h-7 rounded-sm bg-accent-blue/8 flex items-center justify-center shrink-0 mt-0.5">
                      <section.icon size={13} className="text-accent-blue" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-primary">{section.label}</p>
                      <p className="text-[10px] text-text-muted mt-0.5 leading-relaxed">{section.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Right — Report preview + download (2 cols) */}
            <motion.div variants={fadeInUp} className="lg:col-span-2">
              <div className="bg-white border border-border rounded-sm overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                {/* Report header */}
                <div className="bg-[#0D1B2A] px-6 py-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-[#C9A84C]/20 flex items-center justify-center">
                      <FileText size={18} className="text-[#C9A84C]" />
                    </div>
                    <div>
                      <p className="text-white text-sm font-semibold">HataD Land Clearance Report</p>
                      <p className="text-white/40 text-[10px] tracking-wider uppercase mt-0.5">Demo · Thiruparankundram, Madurai</p>
                    </div>
                  </div>
                </div>

                {/* Report meta */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-text-muted">Survey No.</span>
                      <p className="text-text-primary font-medium mt-0.5">287/2B</p>
                    </div>
                    <div>
                      <span className="text-text-muted">District</span>
                      <p className="text-text-primary font-medium mt-0.5">Madurai</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Village</span>
                      <p className="text-text-primary font-medium mt-0.5">Thiruparankundram</p>
                    </div>
                    <div>
                      <span className="text-text-muted">Report Date</span>
                      <p className="text-text-primary font-medium mt-0.5">15 Mar 2026</p>
                    </div>
                  </div>
                </div>

                {/* Verdict preview */}
                <div className="px-6 py-4 border-b border-border">
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-200/60 rounded-sm px-4 py-3">
                    <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-amber-800">Items Flagged for Review</p>
                      <p className="text-[10px] text-amber-700 mt-0.5">This sample report contains flagged findings for demonstration</p>
                    </div>
                  </div>
                </div>

                {/* Request sample CTA */}
                <div className="px-6 py-5">
                  <a
                    href="https://wa.me/918122642341?text=Hi%2C%20I%E2%80%99d%20like%20to%20see%20a%20sample%20HataD%20clearance%20report."
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => track('sample_report', 'request')}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-sm text-sm font-semibold bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] transition-colors cursor-pointer"
                  >
                    Request a Sample Report
                  </a>
                </div>
              </div>

              <p className="text-center text-[10px] text-text-muted mt-4">
                This is a demo report created for illustration purposes. Your report will contain real, verified data for your specific property.
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
