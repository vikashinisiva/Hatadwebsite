'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Download, Check } from 'lucide-react'
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

const STAGE_THRESHOLDS = [0, 2, 15, 60, 150, 180] // minutes

function getAnimStage(elapsedMs: number, status: string): number {
  if (status === 'ready') return 5
  const elapsedMin = elapsedMs / 60000
  if (elapsedMin < 2) return 0
  if (elapsedMin < 15) return 1
  if (elapsedMin < 60) return 2
  if (elapsedMin < 150) return 3
  return 4 // 150+ min, stay at 4
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
    // Stage 3 — conditional
    hasFlags === null
      ? { label: 'Analysis review', sub: 'Reviewing findings' }
      : hasFlags === false
        ? { label: 'Clearance confirmed', sub: 'No encumbrances or title conflicts detected', color: 'green' as const }
        : { label: 'Risk flagging', sub: 'Encumbrances or title conflicts detected', color: 'amber' as const },
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
      'Opening EC document...',
      'Checking document legibility...',
      'Verifying EC registration number...',
      'Cross-checking Patta holder name...',
      'FMB boundary check initiated...',
      'Document set validated.',
    ],
    2: [
      'Comparing EC owner vs Patta holder...',
      'Checking sale deed execution date vs EC entries...',
      'Verifying survey number consistency...',
      'Checking for undisclosed encumbrances...',
      'Validating mutation entries...',
      'Cross-document comparison complete.',
    ],
    4: [
      'Structuring risk register...',
      'Compiling title chain summary...',
      'Formatting HDD report...',
      'Final review in progress...',
    ],
  }

  if (stage === 3) {
    if (hasFlags === true) {
      return [
        'Encumbrance detected in EC entry 3...',
        'Title conflict flagged — owner mismatch...',
        'Litigation marker found...',
        'Documenting risk markers...',
      ]
    }
    if (hasFlags === false) {
      return [
        'Ownership chain verified...',
        'No encumbrances found in EC...',
        'Patta and Sale Deed consistent...',
        'Clearance confirmed.',
      ]
    }
    return [
      'Reviewing encumbrance entries...',
      'Checking litigation records...',
      'Validating title chain...',
      'Compiling findings...',
    ]
  }

  return lines[stage] || []
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
  const [countdown, setCountdown] = useState('')
  const [downloading, setDownloading] = useState(false)

  // Micro-activity log state
  const [visibleLines, setVisibleLines] = useState<string[]>([])
  const logIndexRef = useRef(0)

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

        // Poll every 30s
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
    const interval = setInterval(updateStage, 5000) // recalc every 5s
    return () => clearInterval(interval)
  }, [request])

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!request) return

    function tick() {
      if (request!.status === 'ready') {
        setCountdown('Completed')
        return
      }

      const remaining = new Date(request!.deadline).getTime() - Date.now()
      if (remaining <= 0) {
        setCountdown('Finalising your report...')
        return
      }

      const h = Math.floor(remaining / 3600000)
      const m = Math.floor((remaining % 3600000) / 60000)
      const s = Math.floor((remaining % 60000) / 1000)
      setCountdown(`${h}h ${m}m ${s}s`)
    }

    tick()
    const interval = setInterval(tick, 1000)
    return () => clearInterval(interval)
  }, [request])

  // ---------------------------------------------------------------------------
  // Micro-activity log cycling
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!request) return
    if (request.status === 'ready') {
      setVisibleLines([])
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
      setVisibleLines((prev) => {
        const next = [...prev, lines[logIndexRef.current]]
        return next.slice(-3) // keep max 3
      })
    }, 3500)

    return () => clearInterval(interval)
  }, [animStage, request])

  // ---------------------------------------------------------------------------
  // Download report
  // ---------------------------------------------------------------------------

  async function handleDownload() {
    if (!request?.report_url) return
    setDownloading(true)

    const { data, error } = await supabase.storage
      .from('clearance-reports')
      .createSignedUrl(request.report_url, 604800)

    setDownloading(false)

    if (error || !data?.signedUrl) {
      return
    }

    window.open(data.signedUrl, '_blank')
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
          <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-primary font-medium">Request not found</p>
          <a href="/clearance" className="text-sm text-[#C9A84C] mt-2 inline-block hover:underline">
            ← Back to clearance
          </a>
        </div>
      </div>
    )
  }

  if (!request) return null

  const docCount = request.document_urls?.length || 0
  const shortId = request.id.slice(0, 8).toUpperCase()

  return (
    <div className="min-h-screen bg-background">
      <ClearanceNav backHref="/profile" backLabel="My reports" />

      {/* Page title */}
      <div className="bg-[#0D1B2A] py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Tracking Report
          </h1>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs font-mono text-white/60">{shortId}</span>
            <span
              className={cn(
                'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm',
                request.status === 'ready'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300',
              )}
            >
              {request.status === 'ready' ? 'Ready' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Countdown */}
        <div className="bg-surface border border-border rounded-sm p-5 mb-8 text-center">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1">
            {request.status === 'ready' ? 'Status' : 'Estimated Time Remaining'}
          </p>
          <p className={cn(
            'text-2xl font-semibold tracking-tight',
            request.status === 'ready' ? 'text-emerald-600' : 'text-text-primary',
          )}>
            {countdown}
          </p>
        </div>

        {/* Stepper */}
        <div className="relative pl-8">
          {[0, 1, 2, 3, 4, 5].map((stageIndex) => {
            const stageDef = getStageDef(stageIndex, request.has_flags, docCount, request.created_at)
            const isDone = animStage > stageIndex
            const isActive = animStage === stageIndex
            const isPending = animStage < stageIndex

            // Connector line (before this stage, skip for first)
            const connector = stageIndex > 0 ? (
              <div
                className="absolute left-[11px] -translate-x-1/2"
                style={{
                  top: -24,
                  height: 24,
                  width: isDone || isActive ? 1 : 0.5,
                  background: isDone
                    ? '#0D1B2A'
                    : isActive
                      ? '#C9A84C'
                      : 'transparent',
                  borderLeft: isPending ? '0.5px dashed #CBD5E8' : 'none',
                }}
              />
            ) : null

            return (
              <div key={stageIndex} className="relative pb-8 last:pb-0">
                {connector}

                <div className="flex items-start gap-4">
                  {/* Circle */}
                  <div className="relative flex-shrink-0">
                    <div
                      className={cn(
                        'w-[22px] h-[22px] rounded-full flex items-center justify-center transition-all duration-300',
                        isDone && 'bg-[#0D1B2A]',
                        isActive && 'bg-[#C9A84C]',
                        isPending && 'bg-transparent border border-border',
                      )}
                    >
                      {isDone && (
                        <Check size={12} className="text-white" />
                      )}
                    </div>

                    {/* Pulsing ring on active */}
                    {isActive && (
                      <div
                        className="absolute inset-0 rounded-full animate-ping"
                        style={{
                          border: '1.5px solid #C9A84C',
                          opacity: 0.3,
                          animationDuration: '2s',
                        }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 -mt-0.5">
                    <p
                      className={cn(
                        'text-sm font-medium transition-colors duration-300',
                        isPending ? 'text-text-muted' : 'text-text-primary',
                        stageDef.color === 'green' && !isPending && 'text-emerald-700',
                        stageDef.color === 'amber' && !isPending && 'text-amber-700',
                      )}
                    >
                      {stageDef.label}
                    </p>
                    <p
                      className={cn(
                        'text-xs mt-0.5 transition-colors duration-300',
                        isPending ? 'text-text-muted/50' : 'text-text-secondary',
                        stageDef.color === 'green' && !isPending && 'text-emerald-600',
                        stageDef.color === 'amber' && !isPending && 'text-amber-600',
                      )}
                    >
                      {stageDef.sub}
                    </p>

                    {/* Download button for stage 5 when ready */}
                    {stageIndex === 5 && request.status === 'ready' && request.report_url && (
                      <button
                        onClick={handleDownload}
                        disabled={downloading}
                        className={cn(
                          'mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-sm text-sm font-semibold transition-all cursor-pointer',
                          'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238]',
                          downloading && 'opacity-60 cursor-not-allowed',
                        )}
                      >
                        <Download size={14} />
                        {downloading ? 'Generating link...' : 'Download report'}
                      </button>
                    )}

                    {/* Micro-activity log */}
                    {isActive && request.status !== 'ready' && (
                      <div className="mt-3 space-y-1 min-h-[48px]">
                        {visibleLines.map((line, i) => (
                          <p
                            key={`${animStage}-${line}-${i}`}
                            className="text-[11px] font-mono text-text-muted transition-opacity duration-500"
                            style={{
                              opacity: i === visibleLines.length - 1 ? 1 : 0.5,
                            }}
                          >
                            {line}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Processing message when overdue */}
                    {stageIndex === 4 && isActive && animStage === 4 && (
                      (() => {
                        const elapsed = Date.now() - new Date(request.created_at).getTime()
                        if (elapsed > 180 * 60 * 1000) {
                          return (
                            <p className="text-xs text-text-muted mt-2 italic">
                              Processing...
                            </p>
                          )
                        }
                        return null
                      })()
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-6">
          <a href="/clearance" className="text-xs text-text-muted hover:text-[#C9A84C] transition-colors">
            New request
          </a>
          <span className="text-border">·</span>
          <a href="/profile" className="text-xs text-text-muted hover:text-[#C9A84C] transition-colors">
            My reports
          </a>
        </div>
      </div>
    </div>
  )
}
