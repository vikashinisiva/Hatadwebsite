'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import {
  Download, CheckCircle2, Circle, CircleDotDashed,
  Shield, FileText, AlertTriangle, FileCheck, Clock, Lock, Plus, ArrowLeft,
} from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'
import { ClearanceNav } from '@/components/layout/ClearanceNav'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ClearanceRequest {
  id: string
  user_id: string
  status: string
  has_flags: boolean | null
  property_details: Record<string, string> | null
  document_urls: string[]
  report_url: string | null
  notify_email: string
  deadline: string
  created_at: string
}

// ---------------------------------------------------------------------------
// Stage definitions
// ---------------------------------------------------------------------------

function getAnimStage(elapsedMs: number, status: string): number {
  if (status === 'ready') return 6
  const elapsedMin = elapsedMs / 60000
  if (elapsedMin < 2) return 0
  if (elapsedMin < 15) return 1
  if (elapsedMin < 60) return 2
  if (elapsedMin < 150) return 3
  return 4
}

function getStageDef(index: number, hasFlags: boolean | null, docCount: number, createdAt: string) {
  const created = new Date(createdAt).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const stages: { label: string; sub: string; color?: 'green' | 'amber' }[] = [
    {
      label: 'Request received',
      sub: `${docCount} document${docCount !== 1 ? 's' : ''} secured · ${created}`,
    },
    {
      label: 'Document verification',
      sub: 'Checking completeness — EC · Patta · FMB',
    },
    {
      label: 'Cross-document analysis',
      sub: 'Comparing ownership chain across all submitted records',
    },
    hasFlags === null
      ? { label: 'Records matched', sub: 'Matching records across databases' }
      : hasFlags === false
        ? { label: 'Clearance confirmed', sub: 'No encumbrances or title conflicts detected', color: 'green' as const }
        : { label: 'Detailed review flagged', sub: 'Items identified for expert review — details in your report', color: 'amber' as const },
    {
      label: 'Report compilation',
      sub: 'Structuring findings into your HDD report',
    },
    {
      label: 'Report ready',
      sub: 'Your HataD clearance report is ready',
      color: 'green' as const,
    },
  ]
  return stages[index]
}

// ---------------------------------------------------------------------------
// Micro-activity log lines
// ---------------------------------------------------------------------------

function getLogLines(stage: number, hasFlags: boolean | null): string[] {
  const lines: Record<number, string[]> = {
    0: [
      'Securing uploaded files...',
      'Logging request to system...',
      'Assigning to analyst queue...',
      'Confirmation email sent.',
    ],
    1: [
      'Retrieving revenue records...',
      'Checking record completeness...',
      'Verifying registration details...',
      'Validating survey boundaries...',
      'Record set confirmed.',
    ],
    2: [
      'Checking ownership continuity...',
      'Verifying survey number consistency...',
      'Cross-referencing revenue records...',
      'Scanning for encumbrance entries...',
      'Validating mutation history...',
      'Cross-reference complete.',
    ],
    4: [
      'Structuring findings summary...',
      'Compiling title chain...',
      'Formatting clearance report...',
      'Final checks in progress...',
    ],
  }

  if (stage === 3) {
    if (hasFlags === true) {
      return [
        'Cross-referencing encumbrance records...',
        'Noting items for expert review...',
        'Documenting observations with references...',
        'Preparing detailed findings for your report...',
      ]
    }
    if (hasFlags === false) {
      return [
        'Ownership chain verified...',
        'No encumbrances found...',
        'All records consistent...',
        'Clearance confirmed.',
      ]
    }
    return [
      'Matching encumbrance entries...',
      'Checking litigation records...',
      'Validating title chain...',
      'Compiling findings...',
    ]
  }

  return lines[stage] || []
}

// ---------------------------------------------------------------------------
// ETA range — no live countdown, no false precision
// ---------------------------------------------------------------------------

function getEtaRange(createdAt: string): string {
  const submitted = new Date(createdAt)
  const fmt = (d: Date) =>
    d.toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  const lo = new Date(submitted.getTime() + 2 * 3600_000)
  const hi = new Date(submitted.getTime() + 3 * 3600_000)
  return `${fmt(lo)} – ${fmt(hi)} IST`
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TrackPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [request, setRequest] = useState<ClearanceRequest | null>(null)
  const [animStage, setAnimStage] = useState(0)
  const [downloading, setDownloading] = useState(false)
  const [showSharePrompt, setShowSharePrompt] = useState(false)
  const [reportDelivered, setReportDelivered] = useState(false)

  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const logIndexRef = useRef(0)

  const [expandedStages, setExpandedStages] = useState<number[]>([])

  function toggleStageExpansion(stageIndex: number) {
    setExpandedStages((prev) =>
      prev.includes(stageIndex) ? prev.filter((s) => s !== stageIndex) : [...prev, stageIndex],
    )
  }

  // ---------------------------------------------------------------------------
  // Auth + fetch
  // ---------------------------------------------------------------------------

  const fetchRequest = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('clearance_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      setNotFound(true)
      setLoading(false)
      return null
    }

    if (data.user_id !== userId) {
      setNotFound(true)
      setLoading(false)
      return null
    }

    setRequest(data as ClearanceRequest)
    setLoading(false)
    return data as ClearanceRequest
  }, [id])

  useEffect(() => {
    let pollInterval: ReturnType<typeof setInterval>

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push(`/clearance/auth?next=/clearance/track/${id}`)
        return
      }

      fetchRequest(session.user.id).then((req) => {
        if (!req) return

        pollInterval = setInterval(async () => {
          const { data } = await supabase
            .from('clearance_requests')
            .select('status, has_flags, report_url')
            .eq('id', id)
            .single()

          if (data) {
            setRequest((prev) => prev ? { ...prev, ...data } : prev)
          }
        }, 30000)
      })
    })

    return () => { if (pollInterval) clearInterval(pollInterval) }
  }, [id, fetchRequest, router])

  // ---------------------------------------------------------------------------
  // Compute anim stage from elapsed time
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!request) return

    function updateStage() {
      const elapsed = Date.now() - new Date(request!.created_at).getTime()
      const stage = getAnimStage(elapsed, request!.status)
      setAnimStage(stage)
    }

    updateStage()
    const interval = setInterval(updateStage, 5000)
    return () => clearInterval(interval)
  }, [request])

  // ---------------------------------------------------------------------------
  // Micro-activity log cycling
  // ---------------------------------------------------------------------------

  // Single rotating line — drives the "Currently: …" inline status
  useEffect(() => {
    if (!request) return
    if (request.status === 'ready') {
      setVisibleLines([])
      // Trigger delivery moment (only once)
      if (!reportDelivered) {
        setReportDelivered(true)
        // Auto-dismiss after 4 seconds
        setTimeout(() => setReportDelivered(false), 4000)
      }
      return
    }

    const lines = getLogLines(animStage, request.has_flags)
    if (lines.length === 0) {
      setVisibleLines([])
      return
    }

    logIndexRef.current = 0
    setVisibleLines([lines[0]])

    const interval = setInterval(() => {
      logIndexRef.current = (logIndexRef.current + 1) % lines.length
      setVisibleLines([lines[logIndexRef.current]])
    }, 3500)

    return () => clearInterval(interval)
  }, [animStage, request])

  // ---------------------------------------------------------------------------
  // Download report
  // ---------------------------------------------------------------------------

  async function handleDownload() {
    if (!request?.report_url) return
    setDownloading(true)

    try {
      const s = (await supabase.auth.getSession()).data.session
      if (!s) return
      const res = await fetch('/api/clearance/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ requestId: request.id }),
      })
      const json = await res.json()
      if (json.url) {
        window.open(json.url, '_blank')
        // Show share prompt 5 seconds after download
        setTimeout(() => setShowSharePrompt(true), 5000)
      }
    } catch {
      // ignore
    } finally {
      setDownloading(false)
    }
  }

  // ---------------------------------------------------------------------------
  // Animation variants
  // ---------------------------------------------------------------------------

  const taskVariants = {
    hidden: { opacity: 0, y: -4 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring' as const, stiffness: 500, damping: 30 },
    },
  }

  const subtaskListVariants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' as const },
    visible: {
      height: 'auto',
      opacity: 1,
      overflow: 'visible' as const,
      transition: {
        duration: 0.25,
        staggerChildren: 0.05,
        when: 'beforeChildren' as const,
        ease: [0.2, 0.65, 0.3, 0.9] as const,
      },
    },
    exit: {
      height: 0,
      opacity: 0,
      overflow: 'hidden' as const,
      transition: { duration: 0.2, ease: [0.2, 0.65, 0.3, 0.9] as const },
    },
  }

  const subtaskVariants = {
    hidden: { opacity: 0, x: -8 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { type: 'spring' as const, stiffness: 500, damping: 25 },
    },
    exit: { opacity: 0, x: -8, transition: { duration: 0.15 } },
  }

  // ---------------------------------------------------------------------------
  // Loading / not-found states
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center">
        <div className="w-40 h-[3px] rounded-full bg-[#E8EDF5] overflow-hidden">
          <div className="h-full rounded-full bg-[#1B4FD8] animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center px-6">
        <div className="bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-sm p-10 text-center max-w-sm w-full">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
            <AlertTriangle size={20} className="text-red-400" />
          </div>
          <p className="text-[#0C1525] font-semibold text-base">Report not found</p>
          <p className="text-[#7A8FAD] text-sm mt-2 leading-relaxed">
            This report doesn&apos;t exist or you don&apos;t have access to it.
          </p>
          <a
            href="/clearance"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-[#1B4FD8] hover:underline"
          >
            <ArrowLeft size={14} />
            Back to clearance
          </a>
        </div>
      </div>
    )
  }

  if (!request) return null

  const docCount = request.document_urls?.length || 0
  const shortId = request.id.slice(0, 8).toUpperCase()
  const isReady = request.status === 'ready'
  // Progress tied to elapsed time against the 2.5 hr midpoint of the delivery window.
  // Starts at 3%, reaches 95% at 150 min, so the bar moves ~0.6%/min — appropriate for a 2–3 hr timeline.
  const elapsedMin = (Date.now() - new Date(request.created_at).getTime()) / 60000
  const progressPercent = isReady ? 100 : Math.min(95, Math.max(3, (elapsedMin / 150) * 100))
  const isOverdue = !isReady && elapsedMin > 180 // past the 3-hour upper bound

  const verificationTasks = [0, 1, 2, 3, 4, 5].map((stageIndex) => {
    const stageDef = getStageDef(stageIndex, request.has_flags, docCount, request.created_at)
    const isDone = animStage > stageIndex
    const isActive = animStage === stageIndex
    const status = isDone ? 'completed' : isActive ? 'in-progress' : 'pending'
    const logLines = getLogLines(stageIndex, request.has_flags)

    return { stageIndex, stageDef, isDone, isActive, status, logLines }
  })

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[#F4F7FC]">
      <ClearanceNav backHref="/profile" backLabel="Profile" />

      {/* Report delivery moment */}
      <AnimatePresence>
        {reportDelivered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-6"
            style={{
              background: request?.has_flags
                ? 'linear-gradient(135deg, #0C1525 0%, #1a1a2e 100%)'
                : 'linear-gradient(135deg, #0C1525 0%, #064e3b 100%)',
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'w-20 h-20 rounded-full flex items-center justify-center mb-8',
                request?.has_flags ? 'bg-amber-500/20' : 'bg-emerald-500/20',
              )}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, duration: 0.3 }}
              >
                {request?.has_flags ? (
                  <AlertTriangle size={36} className="text-amber-400" />
                ) : (
                  <CheckCircle2 size={36} className="text-emerald-400" />
                )}
              </motion.div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="text-white text-2xl sm:text-3xl font-bold text-center max-w-md"
            >
              {request?.has_flags
                ? 'We found issues. Your report has the details.'
                : 'Your property has been cleared.'
              }
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.4 }}
              className="text-white/40 text-sm mt-4"
            >
              Your report is ready to download
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Hero ── */}
      <div className="relative bg-[#0C1525] overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#1B4FD8]/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#1B4FD8]/8 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />

        <div className="relative px-6 md:px-12 lg:px-20 xl:px-28 pt-10 pb-14">
          {/* Title row */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-8">
            <div>
              <p className="text-white/50 text-[10px] font-medium tracking-[0.25em] uppercase mb-3">
                Land Clearance Intelligence
              </p>
              <div className="flex items-center gap-3 mb-3">
                <h1 className="font-display text-white text-2xl sm:text-3xl font-bold tracking-tight">
                  Clearance Report
                </h1>
                <motion.span
                  key={isReady ? 'ready' : isOverdue ? 'overdue' : 'progress'}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={cn(
                    'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full',
                    isReady
                      ? 'bg-emerald-400/15 text-emerald-300 ring-1 ring-emerald-400/25'
                      : isOverdue
                        ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/25'
                        : 'bg-[#1B4FD8]/15 text-[#6B9FFF] ring-1 ring-[#1B4FD8]/25',
                  )}
                >
                  {isReady ? 'Complete' : isOverdue ? 'Finalising' : 'In Progress'}
                </motion.span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-white/35 text-xs">
                <span className="font-mono bg-white/5 border border-white/8 px-2 py-0.5 rounded text-white/50">
                  {shortId}
                </span>
                <span className="text-white/15">·</span>
                <span>
                  {new Date(request.created_at).toLocaleDateString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </span>
                {docCount > 0 && (
                  <>
                    <span className="text-white/15">·</span>
                    <span>{docCount} doc{docCount !== 1 ? 's' : ''} uploaded</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-1.5 mt-3">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/70 shrink-0" />
                <p className="text-[10px] text-white/30">
                  Submission secured · Reference{' '}
                  <span className="font-mono text-white/50">{request.id.slice(0, 8).toUpperCase()}</span>
                  {' '}· {new Date(request.created_at).toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true,
                  })} IST
                </p>
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
              className={cn(
                'shrink-0 px-5 py-4 rounded-xl border text-left sm:text-right',
                isReady
                  ? 'bg-emerald-400/8 border-emerald-400/15'
                  : isOverdue
                    ? 'bg-amber-400/8 border-amber-400/15'
                    : 'bg-white/5 border-white/8',
              )}
            >
              <p className="text-[10px] uppercase tracking-widest mb-1.5 text-white/30">
                {isReady ? 'Status' : isOverdue ? 'Update' : 'Delivery window'}
              </p>
              {isReady ? (
                <p className="text-2xl font-bold tracking-tight text-emerald-400">Complete</p>
              ) : isOverdue ? (
                <>
                  <p className="text-lg font-semibold text-amber-300 leading-tight">
                    Finalising your report
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">Taking a bit longer than usual — almost done</p>
                </>
              ) : (
                <>
                  <p className="text-lg font-semibold text-white leading-tight">
                    {getEtaRange(request.created_at)}
                  </p>
                  <p className="text-[10px] text-white/30 mt-1">~2–3 hrs from submission</p>
                </>
              )}
            </motion.div>
          </div>

          {/* Progress bar */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-widest text-white/25">Analysis progress</p>
              <p className="text-[10px] uppercase tracking-widest text-white/25 tabular-nums">
                {Math.round(progressPercent)}%
              </p>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <motion.div
                className={cn(
                  'h-full rounded-full',
                  isReady ? 'bg-emerald-400' : 'bg-gradient-to-r from-[#1B4FD8] to-[#6B9FFF]',
                )}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1.2, ease: [0.2, 0.65, 0.3, 0.9] }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 -mt-5 pb-16 relative z-10">

        {/* Ready — download banner */}
        {isReady && request.report_url && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl px-5 py-4 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <FileCheck size={16} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-800">Your report is ready</p>
                <p className="text-xs text-emerald-600/80 mt-0.5">
                  {request.has_flags
                    ? 'Complete analysis with flagged items explained — review recommended'
                    : 'HataD land clearance report is ready to download'}
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className={cn(
                'inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer shrink-0',
                'bg-emerald-600 text-white hover:bg-emerald-700',
                'shadow-md shadow-emerald-600/20 hover:-translate-y-px active:translate-y-0',
                downloading && 'opacity-60 cursor-not-allowed',
              )}
            >
              <Download size={14} />
              {downloading ? 'Preparing...' : 'Download'}
            </button>
          </motion.div>
        )}

        {/* Verification pipeline card */}
        <motion.div
          className="bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.2, 0.65, 0.3, 0.9] }}
        >
          {/* Card header */}
          <div className="px-6 pt-5 pb-4 border-b border-[#EBF0F8] flex items-center justify-between">
            <p className="text-[11px] font-semibold text-[#3D5278] tracking-widest uppercase">
              Verification Pipeline
            </p>
            <span className="text-[11px] text-[#7A8FAD]">
              {verificationTasks.filter((t) => t.isDone).length} / {verificationTasks.length} steps
            </span>
          </div>

          <LayoutGroup>
            <div className="px-4 pt-3 pb-4">
              {/*
                No space-y gap — connector segments must be seamless.
                Each li owns two line segments anchored to its icon geometry:
                  • above-icon: top:0 → height:12px  (connects FROM previous stage)
                  • below-icon: top:32px → bottom:0   (connects TO next stage)
                Icon wrapper carries a solid bg to mask whatever passes through it.
                Icon geometry: py-2.5(10) + mt-0.5(2) = top:12px, h-5(20px) = bottom:32px
              */}
              <ul className="relative">
                {verificationTasks.map((task) => {
                  const isExpanded = expandedStages.includes(task.stageIndex)
                  const hasSubtasks = task.logLines.length > 0
                  const isFirst = task.stageIndex === 0
                  const isLast  = task.stageIndex === verificationTasks.length - 1
                  const nextTask = verificationTasks[task.stageIndex + 1]

                  // Colour for the segment leaving this stage (going down to next)
                  const segColor = (s: string) => s === 'pending' ? '#EEF1F7' : '#CBD5E8'
                  const aboveColor = segColor(task.status)
                  const belowColor = nextTask ? segColor(nextTask.status) : '#EEF1F7'

                  // Icon wrapper bg must match its visual parent to mask the line
                  const iconBg = task.isActive ? '#F4F7FC' : '#ffffff'

                  return (
                    <motion.li
                      key={task.stageIndex}
                      className="relative"
                      initial="hidden"
                      animate="visible"
                      variants={taskVariants}
                    >
                      {/* Above-icon segment — skipped for first stage */}
                      {!isFirst && (
                        <span
                          className="absolute w-px pointer-events-none"
                          style={{ left: 22, top: 0, height: 12, backgroundColor: aboveColor }}
                        />
                      )}
                      {/* Below-icon segment — skipped for last stage */}
                      {!isLast && (
                        <span
                          className="absolute w-px pointer-events-none"
                          style={{ left: 22, top: 32, bottom: 0, backgroundColor: belowColor }}
                        />
                      )}

                      {/* Stage row */}
                      <div className={cn(
                        'flex items-start gap-4 px-3 py-2.5 rounded-xl transition-opacity',
                        task.isActive && 'bg-[#F4F7FC]',
                        task.status === 'pending' && 'opacity-30',
                      )}>
                        {/* Icon wrapper — persistent solid bg masks the line through AnimatePresence transitions */}
                        <div
                          className="relative z-10 flex-shrink-0 mt-0.5"
                          style={{ backgroundColor: iconBg }}
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={task.status}
                              initial={{ opacity: 0, scale: 0.7 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.7 }}
                              transition={{ duration: 0.18 }}
                            >
                              {task.status === 'completed' ? (
                                <CheckCircle2 className={cn(
                                  'h-5 w-5',
                                  task.stageDef.color === 'amber' ? 'text-amber-500' : 'text-emerald-500',
                                )} />
                              ) : task.status === 'in-progress' ? (
                                <CircleDotDashed className="h-5 w-5 text-[#1B4FD8]" />
                              ) : (
                                <Circle className="h-5 w-5 text-[#CBD5E8]" />
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </div>

                        {/* Label + active status line + badge */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-3">
                            <span className={cn(
                              'text-sm font-medium leading-snug',
                              task.status === 'completed' && !task.stageDef.color && 'text-[#7A8FAD] line-through decoration-[#CBD5E8]',
                              task.status === 'completed' && task.stageDef.color === 'green' && 'text-emerald-700',
                              task.status === 'completed' && task.stageDef.color === 'amber' && 'text-amber-700',
                              task.status === 'in-progress' && 'text-[#0C1525]',
                              task.status === 'pending' && 'text-[#B8C5DA]',
                            )}>
                              {task.stageDef.label}
                            </span>

                            {task.status !== 'pending' && (
                              <motion.span
                                key={task.status}
                                animate={{ scale: [1, 1.06, 1], transition: { duration: 0.3 } }}
                                className={cn(
                                  'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
                                  task.status === 'completed' && task.stageDef.color !== 'amber' &&
                                    'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100',
                                  task.status === 'completed' && task.stageDef.color === 'amber' &&
                                    'bg-amber-50 text-amber-600 ring-1 ring-amber-100',
                                  task.status === 'in-progress' &&
                                    'bg-[#1B4FD8]/8 text-[#1B4FD8] ring-1 ring-[#1B4FD8]/15',
                                )}
                              >
                                {task.status === 'in-progress' ? 'active' : task.status}
                              </motion.span>
                            )}
                          </div>

                          {/* Active: single rotating status line */}
                          {task.isActive && visibleLines.length > 0 && (
                            <div className="flex items-center justify-between mt-1 gap-3">
                              <AnimatePresence mode="wait">
                                <motion.p
                                  key={visibleLines[0]}
                                  initial={{ opacity: 0, y: 3 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: -3 }}
                                  transition={{ duration: 0.25 }}
                                  className="text-xs text-[#7A8FAD] font-mono truncate"
                                >
                                  <span className="text-[#7A8FAD]/60 mr-1 not-italic font-sans">Currently:</span>
                                  {visibleLines[0].replace(/\.\.\.$/, '')}
                                </motion.p>
                              </AnimatePresence>

                              {hasSubtasks && (
                                <button
                                  onClick={() => toggleStageExpansion(task.stageIndex)}
                                  className="shrink-0 text-[11px] text-[#7A8FAD] hover:text-[#1B4FD8] transition-colors cursor-pointer"
                                >
                                  {isExpanded ? 'Hide details' : 'View details'}
                                </button>
                              )}
                            </div>
                          )}

                          {/* Done stages with a color meaning — show the outcome line */}
                          {task.isDone && task.stageDef.color && (
                            <p className={cn(
                              'text-xs mt-0.5',
                              task.stageDef.color === 'green' ? 'text-emerald-500' : 'text-amber-500',
                            )}>
                              {task.stageDef.sub}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Detail log — hidden by default, shown via "View details" */}
                      <AnimatePresence>
                        {isExpanded && hasSubtasks && (
                          <motion.div
                            className="overflow-hidden"
                            variants={subtaskListVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                          >
                            <ul className="ml-11 mr-3 mt-1 mb-2 space-y-0.5 border-l border-dashed border-[#CBD5E8]/40 pl-3">
                              {task.logLines.map((line, lineIdx) => {
                                const isLineActive = task.isActive && visibleLines[0] === line
                                const isLineDone = task.isDone

                                return (
                                  <motion.li
                                    key={lineIdx}
                                    variants={subtaskVariants}
                                    initial="hidden"
                                    animate="visible"
                                    exit="exit"
                                    className="flex items-center gap-2 py-1"
                                  >
                                    {isLineDone ? (
                                      <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
                                    ) : isLineActive ? (
                                      <CircleDotDashed className="h-3 w-3 text-[#1B4FD8] shrink-0" />
                                    ) : (
                                      <Circle className="h-3 w-3 text-[#CBD5E8] shrink-0" />
                                    )}
                                    <span className={cn(
                                      'text-[11px] font-mono',
                                      isLineDone && 'text-[#B8C5DA] line-through',
                                      isLineActive && 'text-[#0C1525]',
                                      !isLineDone && !isLineActive && 'text-[#CBD5E8]',
                                    )}>
                                      {line}
                                    </span>
                                  </motion.li>
                                )
                              })}
                            </ul>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.li>
                  )
                })}
              </ul>
            </div>
          </LayoutGroup>
        </motion.div>

        {/* ── Flags reassurance banner ── */}
        {request.has_flags === true && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.05 }}
            className="mt-4 bg-amber-50/80 border border-amber-200/60 rounded-2xl px-5 py-4 flex items-start gap-3.5"
          >
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0 mt-0.5">
              <Shield size={16} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-amber-800">
                Flagged items are standard — here&apos;s what it means
              </p>
              <p className="text-xs text-amber-700/80 mt-1.5 leading-relaxed">
                Our automated scan cross-references multiple government databases and flags anything
                that needs a closer look — this is a routine part of every thorough clearance check.
                Common flags include older encumbrance entries, minor name variations, or pending mutations.
                Your report will explain each item in plain language with document references,
                so you know exactly what was found and what action (if any) is recommended.
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Official Data Sources ── */}
        <motion.div
          className="mt-4 bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] px-6 py-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1, ease: [0.2, 0.65, 0.3, 0.9] }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold text-[#3D5278] tracking-widest uppercase">
              Official Data Sources
            </p>
            <span className="text-[10px] text-[#7A8FAD] bg-[#F4F7FC] border border-[#EBF0F8] px-2.5 py-1 rounded-full">
              Tamil Nadu Government Records
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-3.5">
            {[
              { label: 'TNREGINET', sub: 'Encumbrance Certificate (EC)' },
              { label: 'Sub-Registrar Office', sub: 'Sale Deed · Title chain' },
              { label: 'Revenue Department', sub: 'Patta · A-Register' },
              { label: 'Taluk Office', sub: 'Mutation · FMB Records' },
              { label: 'DTCP / CMDA', sub: 'Layout approvals' },
              { label: 'District Court', sub: 'Litigation status' },
            ].map((src) => (
              <div key={src.label} className="flex items-start gap-2.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1B4FD8] mt-[5px] shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#0C1525]">{src.label}</p>
                  <p className="text-[10px] text-[#7A8FAD] mt-0.5">{src.sub}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-[#B8C5DA] border-t border-[#EBF0F8] pt-4 leading-relaxed">
            All records are cross-referenced against official Tamil Nadu government databases at the time of analysis.
            This report does not constitute legal advice and should be reviewed alongside a qualified advocate for
            transactions above ₹50 lakh or disputed titles.
          </p>
        </motion.div>

        {/* ── Trust & nav footer ── */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap justify-center gap-5 text-[11px] text-[#7A8FAD]">
            <span className="flex items-center gap-1.5">
              <Lock size={11} className="text-[#1B4FD8]" />
              End-to-end encrypted
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={11} className="text-[#1B4FD8]" />
              Auto-refreshes every 30s
            </span>
            <span className="flex items-center gap-1.5">
              <Shield size={11} className="text-[#1B4FD8]" />
              EC · Patta · FMB · Title chain · Mutation · Litigation · A-Register
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href="/clearance"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A8FAD] hover:text-[#1B4FD8] transition-colors"
            >
              <Plus size={12} />
              New request
            </a>
            <a
              href="/profile"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7A8FAD] hover:text-[#1B4FD8] transition-colors"
            >
              <FileText size={12} />
              Profile
            </a>
          </div>
        </div>
      </div>

      {/* Share prompt — slides up 5s after download */}
      <AnimatePresence>
        {showSharePrompt && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            <div className="bg-white border-t border-[#E8EDF5] px-6 py-4 flex items-center justify-between gap-4 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] max-w-2xl mx-auto rounded-t-xl">
              <div>
                <p className="text-sm text-[#0C1525] font-medium">Know someone buying land in Tamil Nadu?</p>
                <p className="text-xs text-[#7A8FAD] mt-0.5">Share HataD with them.</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent('Check your property before signing — HataD does land clearance reports in under 3 hours. https://hatad.in')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold px-4 py-2 rounded-sm bg-[#25D366] text-white hover:bg-[#20bd5a] transition-colors"
                >
                  Share →
                </a>
                <button
                  onClick={() => setShowSharePrompt(false)}
                  className="text-xs text-[#B8C5DA] hover:text-[#7A8FAD] transition-colors cursor-pointer px-2 py-2"
                >
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
