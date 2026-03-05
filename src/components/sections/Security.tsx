'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { Shield, Lock, Eye, Server, FileCheck, UserCheck } from 'lucide-react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import DecryptedText from '@/components/ui/DecryptedText'
import { staggerContainerFast, fadeInUp } from '@/lib/animations'

const SECURITY_ITEMS = [
  {
    number: '01',
    icon: Server,
    title: 'Your Files Are Isolated from Every Other Client',
    description:
      'Each engagement runs in a fully isolated environment. Your documents are never co-mingled with another client\u2019s matter. What you upload is visible only to your account \u2014 not to other firms, other investors, or our team unless you explicitly share access.',
    tag: 'Client-level isolation',
  },
  {
    number: '02',
    icon: Lock,
    title: 'Encrypted in Transit and at Rest. Always.',
    description:
      'Every document travels over TLS 1.3 and is stored under AES-256 encryption. This isn\u2019t optional or premium \u2014 it\u2019s the baseline for every file on the platform, from the moment you upload to the moment it\u2019s deleted.',
    tag: 'TLS 1.3 \u00B7 AES-256',
  },
  {
    number: '03',
    icon: FileCheck,
    title: 'A Complete Log of Every Interaction with Your Matter',
    description:
      'Every access event, every analysis step, and every report generation is written to a tamper-proof audit trail. If you ever need to know who touched your matter and when \u2014 that record exists and cannot be altered.',
    tag: 'Immutable audit log',
  },
  {
    number: '04',
    icon: Shield,
    title: 'Your Documents Are Permanently Deleted After Delivery',
    subtitle: 'Signature Commitment',
    description:
      'Once your Land Clearance Report is delivered, all uploaded source documents are permanently purged from our systems. No archive. No hidden backup. No long-term storage of your client\u2019s most sensitive records. Clean deletion, confirmed.',
    tag: 'Zero residual storage',
  },
  {
    number: '05',
    icon: Eye,
    title: 'We Have Never Sold Client Data. We Never Will.',
    description:
      'Your property records are not a revenue source for us. We do not share, sell, licence, or reference client data for any purpose outside your specific engagement. Our business model is the report \u2014 not your information.',
    tag: 'Zero third-party sharing',
  },
  {
    number: '06',
    icon: UserCheck,
    title: 'Internal Access Is Strict, Logged, and Multi-Factor',
    description:
      'Only the personnel required for your specific analysis can access your matter \u2014 enforced by role-based access controls and multi-factor authentication. No broad internal visibility. Every internal access is logged against the audit trail.',
    tag: 'RBAC \u00B7 MFA enforced',
  },
]

const TRUST_BADGES = [
  { icon: Lock, label: 'TLS 1.3 + AES-256' },
  { icon: Server, label: 'Enterprise-grade hosting' },
  { icon: FileCheck, label: 'Tamper-proof audit log' },
  { icon: Shield, label: 'Zero data retention post-delivery' },
]

export function Security() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-80px' })

  return (
    <section className="relative overflow-hidden" ref={ref}>
      {/* Dark header block */}
      <div style={{ background: '#0C1525' }}>
        <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 pt-32 pb-20">
          <motion.div
            variants={staggerContainerFast}
            initial="hidden"
            animate={isInView ? 'visible' : 'hidden'}
          >
            <div className="grid lg:grid-cols-[1fr_1fr] gap-12 lg:gap-16 items-stretch">
              <div className="flex flex-col justify-center">
                <motion.div variants={fadeInUp} className="mb-6">
                  <SectionLabel className="!text-white/40 !border-white/10">
                    Data Security
                  </SectionLabel>
                </motion.div>

                <motion.h2
                  variants={fadeInUp}
                  className="font-display text-4xl sm:text-5xl font-bold text-white leading-[1.08] tracking-tight mb-5"
                >
                <DecryptedText
                  text="Your Documents"
                  animateOn="view"
                  speed={40}
                  maxIterations={15}
                  sequential
                  revealDirection="start"
                  className="text-white"
                  encryptedClassName="text-white/20"
                />{' '}
                <DecryptedText
                  text="Are Not Our Business."
                  animateOn="view"
                  speed={40}
                  maxIterations={15}
                  sequential
                  revealDirection="start"
                  className="text-white/40 font-light"
                  encryptedClassName="text-white/10 font-light"
                />
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg text-white/50 leading-relaxed"
              >
                  You&apos;re uploading Sale Deeds, Encumbrance Certificates, and Patta
                  records — documents that carry the financial and legal weight of
                  crore-level decisions. We handle them accordingly.
                </motion.p>
              </div>

              <motion.div
                variants={fadeInUp}
                className="rounded-lg border border-white/10 bg-white/[0.03] px-8 py-8 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-8 rounded-full bg-white/20" />
                    <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30">
                      Our Commitment
                    </span>
                  </div>
                  <p className="text-base sm:text-lg text-white/60 leading-relaxed italic">
                    &ldquo;After your report is delivered, your documents are gone.
                    No archive. No backup. No residual copy.&rdquo;
                  </p>
                </div>
                <div className="mt-8 pt-5 border-t border-white/[0.06] flex items-center gap-4">
                  <span className="text-[10px] font-medium tracking-[0.2em] uppercase text-white/30">
                    Automatic purge · Post-delivery
                  </span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Cards on light background */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 py-16">
        <motion.div
          variants={staggerContainerFast}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          {/* Security cards — 2 column grid */}
          <div className="grid md:grid-cols-2 gap-5">
            {SECURITY_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <motion.div
                  key={item.number}
                  variants={fadeInUp}
                  className="group relative rounded-lg border border-border/60 bg-white p-7 flex flex-col transition-all duration-300 hover:shadow-[0_4px_24px_rgba(12,21,37,0.06)]"
                >
                  {/* Number + tag row */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="text-[11px] font-mono text-text-muted">
                      {item.number}
                      {item.subtitle && (
                        <span className="ml-2 text-[10px] font-medium tracking-[0.15em] uppercase text-accent-blue">
                          · {item.subtitle}
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-medium tracking-[0.15em] uppercase text-text-muted/60 border border-border/60 rounded-full px-3 py-1">
                      {item.tag}
                    </span>
                  </div>

                  {/* Icon + Title */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-9 h-9 rounded-md bg-surface-raised flex items-center justify-center border border-border/60 transition-colors group-hover:bg-accent-blue/5 group-hover:border-accent-blue/20">
                      <Icon
                        size={16}
                        className="text-text-muted transition-colors group-hover:text-accent-blue"
                        strokeWidth={1.5}
                      />
                    </div>
                    <h3 className="text-base font-semibold text-text-primary leading-snug pt-1">
                      {item.title}
                    </h3>
                  </div>

                  {/* Description */}
                  <p className="text-[13px] text-text-secondary leading-relaxed text-justify flex-1">
                    {item.description}
                  </p>
                </motion.div>
              )
            })}
          </div>

          {/* Bottom trust bar */}
          <motion.div
            variants={fadeInUp}
            className="mt-14 rounded-lg border border-border/60 bg-white p-6"
          >
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
              {TRUST_BADGES.map((badge) => {
                const Icon = badge.icon
                return (
                  <div
                    key={badge.label}
                    className="flex items-center gap-3"
                  >
                    <div className="w-8 h-8 rounded-md bg-surface-raised flex items-center justify-center border border-border/60">
                      <Icon
                        size={14}
                        className="text-text-muted"
                        strokeWidth={1.5}
                      />
                    </div>
                    <span className="text-xs font-medium text-text-secondary leading-tight">
                      {badge.label}
                    </span>
                  </div>
                )
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
