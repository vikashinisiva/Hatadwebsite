'use client'

import { motion, useInView, AnimatePresence } from 'framer-motion'
import { useRef, useState, useEffect } from 'react'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { RadialGlow } from '@/components/ui/RadialGlow'
import { staggerContainer, fadeInUp } from '@/lib/animations'

const DEPTS = [
  'Revenue Dept',
  'Registration',
  'Survey Office',
  'Tahsildar',
  'Local Body',
  'Land Records',
]

/* Node centre positions — viewBox 400 × 260 */
const POS = [
  { x: 70, y: 55 },
  { x: 200, y: 55 },
  { x: 330, y: 55 },
  { x: 70, y: 200 },
  { x: 200, y: 200 },
  { x: 330, y: 200 },
]
const HUB = { x: 200, y: 127 }
const HUB_R = 24
const NW = 88, NH = 32

/* Compute a point on hub edge toward a target */
function hubEdge(target: { x: number; y: number }) {
  const dx = target.x - HUB.x
  const dy = target.y - HUB.y
  const len = Math.sqrt(dx * dx + dy * dy)
  return {
    x: HUB.x + (dx / len) * HUB_R,
    y: HUB.y + (dy / len) * HUB_R,
  }
}

/* Pairs that attempt — and fail — to connect */
const BROKEN: [number, number][] = [
  [0, 1], [1, 2], [0, 3], [2, 5], [3, 4], [4, 5],
]

/* Per-node jitter amplitude for chaos wobble */
const JIT = [
  { x: -5, y: -3 }, { x: 4, y: 5 }, { x: -3, y: -5 },
  { x: 5, y: 3 }, { x: -4, y: 4 }, { x: 3, y: -3 },
]

export function Problem() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!isInView) return
    let cancelled = false

    const loop = () => {
      if (cancelled) return
      // Chaos phase: 6s, then connected phase: 8s, then reset
      setConnected(false)
      const t1 = setTimeout(() => {
        if (cancelled) return
        setConnected(true)
        const t2 = setTimeout(() => {
          if (cancelled) return
          loop()
        }, 8000)
        timers.push(t2)
      }, 6000)
      timers.push(t1)
    }

    const timers: ReturnType<typeof setTimeout>[] = []
    loop()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [isInView])

  return (
    <section id="product" className="relative pt-96 pb-32 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      {/* Top fade to blend from hero */}
      <div
        className="absolute top-0 left-0 right-0 h-72 pointer-events-none z-[1]"
        style={{ background: 'linear-gradient(to bottom, #0C1525 0%, #131e33 25%, #1e2d4a 45%, #3d5278 65%, #8a9bba 82%, var(--color-background) 100%)' }}
      />
      <RadialGlow color="#CBD5E8" size="600px" opacity="0.5" position="100% 50%" />

      <div ref={ref}>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate={isInView ? 'visible' : 'hidden'}
        >
          <motion.div variants={fadeInUp}>
            <SectionLabel className="mb-6">The Problem</SectionLabel>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            {/* Left — text content */}
            <div>
              <motion.h2
                variants={fadeInUp}
                className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold text-text-primary leading-[1.1] tracking-tight mb-6"
              >
                Tamil Nadu Land Records Are Held Across Six Departments.{' '}
                <span className="text-text-muted font-light">None Are Required to Agree.</span>
              </motion.h2>

              <motion.p
                variants={fadeInUp}
                className="text-base sm:text-lg text-text-secondary leading-relaxed mb-10 text-justify"
              >
                Each department speaks a different language — and none of them talk to each other.
                Discrepancies stay hidden until the deal is done.
              </motion.p>

              <motion.div variants={fadeInUp}>
                <div className="h-px bg-gradient-to-r from-border via-border/50 to-transparent mb-6" />
                <blockquote className="font-display text-lg sm:text-xl text-text-primary font-medium leading-snug">
                  &ldquo;The problem was never the documents. It was the silence
                  between them.&rdquo;
                </blockquote>
              </motion.div>
            </div>

            {/* Right — two-state animated diagram */}
            <motion.div variants={fadeInUp} className="relative">
              <div
                className="rounded-xl border border-border bg-surface overflow-hidden"
                style={{ boxShadow: '0 4px 40px rgba(12,21,37,0.06)' }}
              >
                {/* Header bar */}
                <div className="flex items-center justify-between px-6 py-3.5 border-b border-border/60">
                  <motion.span
                    className="text-[10px] tracking-[0.15em] uppercase font-medium"
                    animate={{ color: connected ? '#1B4FD8' : '#7A8FAD' }}
                    transition={{ duration: 0.4 }}
                  >
                    {connected ? 'Connected State' : 'Current State'}
                  </motion.span>
                  <motion.span
                    className="text-[10px] tracking-[0.15em] uppercase font-semibold"
                    animate={{ color: connected ? '#1B4FD8' : '#DC2626' }}
                    transition={{ duration: 0.4 }}
                  >
                    {connected ? 'HataD Active' : 'No Connection'}
                  </motion.span>
                </div>

                {/* SVG canvas */}
                <div className="px-3 pt-5 pb-3">
                  <svg
                    viewBox="0 0 400 260"
                    className="w-full h-auto"
                    fill="none"
                    aria-label="Department connection diagram"
                    role="img"
                  >
                    {/* ── CHAOS LAYER ── */}
                    <AnimatePresence>
                      {!connected && (
                        <motion.g
                          key="chaos"
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          {BROKEN.map(([a, b], i) => {
                            const mx = (POS[a].x + POS[b].x) / 2
                            const my = (POS[a].y + POS[b].y) / 2
                            return (
                              <g key={`br-${i}`}>
                                {/* Dashed failed link */}
                                <motion.path
                                  d={`M${POS[a].x} ${POS[a].y}L${POS[b].x} ${POS[b].y}`}
                                  stroke="#CBD5E8"
                                  strokeWidth={1}
                                  strokeDasharray="3 5"
                                  initial={{ opacity: 0, pathLength: 0 }}
                                  animate={{ opacity: 0.5, pathLength: 1 }}
                                  transition={{ duration: 0.7, delay: 0.6 + i * 0.12, ease: 'easeOut' }}
                                />
                                {/* Red ✕ at midpoint */}
                                <motion.g
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 1.2 + i * 0.1 }}
                                  style={{ transformOrigin: `${mx}px ${my}px` }}
                                >
                                  <line x1={mx - 4} y1={my - 4} x2={mx + 4} y2={my + 4} stroke="#DC2626" strokeWidth={1.5} strokeLinecap="round" />
                                  <line x1={mx + 4} y1={my - 4} x2={mx - 4} y2={my + 4} stroke="#DC2626" strokeWidth={1.5} strokeLinecap="round" />
                                </motion.g>
                                {/* Signal dot that bounces back */}
                                <motion.circle
                                  r={2}
                                  fill="#DC2626"
                                  initial={{ opacity: 0 }}
                                  animate={{
                                    cx: [POS[a].x, mx, POS[a].x],
                                    cy: [POS[a].y, my, POS[a].y],
                                    opacity: [0, 0.7, 0],
                                  }}
                                  transition={{
                                    duration: 2.6,
                                    repeat: Infinity,
                                    delay: 1.8 + i * 0.3,
                                    ease: 'easeInOut',
                                  }}
                                />
                              </g>
                            )
                          })}
                        </motion.g>
                      )}
                    </AnimatePresence>

                    {/* ── CONNECTED LAYER ── */}
                    <AnimatePresence>
                      {connected && (
                        <motion.g key="conn">
                          {/* Hub-to-node lines — start from edge of hub */}
                          {POS.map((pos, i) => {
                            const edge = hubEdge(pos)
                            return (
                              <motion.path
                                key={`cl-${i}`}
                                d={`M${edge.x} ${edge.y}L${pos.x} ${pos.y}`}
                                stroke="#1B4FD8"
                                strokeWidth={1.5}
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.15 + i * 0.1, ease: [0.22, 1, 0.36, 1] }}
                              />
                            )
                          })}

                          {/* Expanding pulse ring */}
                          <motion.circle
                            cx={HUB.x}
                            cy={HUB.y}
                            r={HUB_R}
                            stroke="#1B4FD8"
                            strokeWidth={0.8}
                            fill="none"
                            initial={{ scale: 0.6, opacity: 0.6 }}
                            animate={{ scale: 3.5, opacity: 0 }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                            style={{ transformOrigin: `${HUB.x}px ${HUB.y}px` }}
                          />

                          {/* Hub circle */}
                          <motion.circle
                            cx={HUB.x}
                            cy={HUB.y}
                            r={HUB_R}
                            fill="#1B4FD8"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.05 }}
                            style={{ transformOrigin: `${HUB.x}px ${HUB.y}px` }}
                          />
                          <motion.text
                            x={HUB.x}
                            y={HUB.y + 1}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fill="white"
                            fontSize={8}
                            fontWeight={700}
                            letterSpacing="0.12em"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.3 }}
                          >
                            HATAD
                          </motion.text>

                          {/* Data-flow dots pulsing outward — all synced */}
                          {POS.map((pos, i) => {
                            const edge = hubEdge(pos)
                            return (
                              <motion.circle
                                key={`df-${i}`}
                                r={2.5}
                                fill="#1B4FD8"
                                animate={{
                                  cx: [edge.x, pos.x],
                                  cy: [edge.y, pos.y],
                                  opacity: [0.85, 0],
                                }}
                                transition={{
                                  duration: 3,
                                  repeat: Infinity,
                                  repeatDelay: 0.5,
                                  delay: 1.2,
                                  ease: [0.25, 0.1, 0.25, 1],
                                }}
                              />
                            )
                          })}
                        </motion.g>
                      )}
                    </AnimatePresence>

                    {/* ── DEPARTMENT NODES (always visible) ── */}
                    {DEPTS.map((dept, i) => {
                      const chaos = isInView && !connected
                      return (
                        <motion.g
                          key={dept}
                          initial={{ opacity: 0, y: 12 }}
                          animate={
                            isInView
                              ? chaos
                                ? {
                                    opacity: 1,
                                    y: 0,
                                    x: [0, JIT[i].x, 0, -JIT[i].x * 0.6, 0],
                                  }
                                : { opacity: 1, x: 0, y: 0 }
                              : { opacity: 0, y: 12 }
                          }
                          transition={
                            chaos
                              ? {
                                  opacity: { duration: 0.4, delay: 0.3 + i * 0.08 },
                                  y: { duration: 0.4, delay: 0.3 + i * 0.08 },
                                  x: { duration: 2.8 + i * 0.2, repeat: Infinity, ease: 'easeInOut' },
                                }
                              : { type: 'spring', stiffness: 260, damping: 22 }
                          }
                        >
                          {/* Node box */}
                          <motion.rect
                            x={POS[i].x - NW / 2}
                            y={POS[i].y - NH / 2}
                            width={NW}
                            height={NH}
                            rx={6}
                            strokeWidth={1}
                            animate={{
                              fill: connected ? '#EEF2FF' : '#F8FAFC',
                              stroke: connected ? '#1B4FD8' : '#CBD5E8',
                            }}
                            transition={{ duration: 0.4 }}
                          />

                          {/* Label */}
                          <text
                            x={POS[i].x}
                            y={POS[i].y + 1}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize={9.5}
                            fontWeight={500}
                            fill={connected ? '#1e40af' : '#64748B'}
                            style={{ fontFamily: 'inherit' }}
                          >
                            {dept}
                          </text>
                        </motion.g>
                      )
                    })}
                  </svg>
                </div>

                {/* Bottom status bar */}
                <AnimatePresence mode="wait">
                  {connected ? (
                    <motion.div
                      key="conn-bar"
                      className="flex items-center justify-between px-6 py-3 border-t border-accent-blue/20 bg-accent-blue/[0.04]"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.35 }}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                        <span className="text-xs font-semibold text-text-primary">1 Report</span>
                        <span className="text-xs text-text-secondary">connects all 6 sources</span>
                      </div>
                      <span className="text-[10px] tracking-[0.15em] uppercase font-medium text-accent-blue">
                        HataD
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="frag-bar"
                      className="flex items-center justify-between px-6 py-3 border-t border-border/60"
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#DC2626]/60 animate-pulse" />
                        <span className="text-xs text-[#DC2626]/80">6 departments · 0 connections</span>
                      </div>
                      <span className="text-[10px] tracking-[0.15em] uppercase text-text-muted/60">
                        Fragmented
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
