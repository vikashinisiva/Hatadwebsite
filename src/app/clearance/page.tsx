'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { ExternalLink, Download, ArrowRight } from 'lucide-react'
import { ClearanceNav } from '@/components/layout/ClearanceNav'
import type { Session } from '@supabase/supabase-js'

interface PastRequest {
  id: string
  status: string
  created_at: string
  property_details: Record<string, string> | null
  report_url: string | null
}

function formatDateIST(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function ClearancePage() {
  return (
    <Suspense>
      <ClearancePageInner />
    </Suspense>
  )
}

function ClearancePageInner() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [pastRequests, setPastRequests] = useState<PastRequest[]>([])
  const [downloading, setDownloading] = useState<string | null>(null)

  const loadPastRequests = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('clearance_requests')
      .select('id, status, created_at, property_details, report_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setPastRequests(data)
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setSessionLoading(false)
      if (s) loadPastRequests(s.user.id)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) loadPastRequests(s.user.id)
      else setPastRequests([])
    })
    return () => subscription.unsubscribe()
  }, [loadPastRequests])

  async function handleDownload(req: PastRequest) {
    if (!req.report_url) return
    setDownloading(req.id)
    try {
      const s = (await supabase.auth.getSession()).data.session
      if (!s) return
      const res = await fetch('/api/clearance/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${s.access_token}`,
        },
        body: JSON.stringify({ requestId: req.id }),
      })
      const json = await res.json()
      if (json.url) window.open(json.url, '_blank')
    } catch {
      // ignore
    } finally {
      setDownloading(null)
    }
  }

  const startNew = () => router.push('/clearance/onboarding')

  return (
    <div className="min-h-screen bg-[#F4F7FC]">
      <ClearanceNav />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-20">
        {/* Header */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-[26px] sm:text-[34px] font-bold tracking-tight text-[#0C1525] leading-[1.1]">
            Your verifications
          </h1>
          <p className="mt-2 text-[14px] sm:text-[15px] text-[#7A8FAD]">
            Track in-progress reports or start a new one.
          </p>
        </div>

        {/* Start new CTA — primary action */}
        <button
          onClick={startNew}
          className="w-full mb-8 group bg-[#0C1525] hover:bg-[#152238] text-white rounded-xl px-5 sm:px-6 py-4 sm:py-5 flex items-center justify-between transition-colors shadow-sm hover:shadow-md cursor-pointer"
        >
          <div className="text-left">
            <div className="text-[15px] sm:text-[16px] font-semibold">Start a new verification</div>
            <div className="text-[12px] sm:text-[13px] text-[#B8C5DA] mt-0.5">Flat ₹3,599 · delivered in under 3 hours</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-[#C9A84C] text-[#0C1525] flex items-center justify-center group-hover:translate-x-1 transition-transform shrink-0">
            <ArrowRight size={18} strokeWidth={2.4} />
          </div>
        </button>

        {/* Past requests */}
        {sessionLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-[#CBD5E8] border-t-[#1B4FD8] rounded-full animate-spin" />
          </div>
        ) : !session ? (
          <div className="bg-white border border-[#CBD5E8] rounded-xl px-6 py-10 text-center">
            <p className="text-[14px] text-[#3D5278]">
              Sign in from the verification flow to see your past reports here.
            </p>
          </div>
        ) : pastRequests.length === 0 ? (
          <div className="bg-white border border-[#CBD5E8] rounded-xl px-6 py-10 text-center">
            <p className="text-[14px] text-[#3D5278]">
              No verifications yet. Start your first one above.
            </p>
          </div>
        ) : (
          <div>
            <h2 className="text-xs font-semibold text-[#3D5278] tracking-wider uppercase mb-3 px-1">
              Past verifications
            </h2>
            <div className="space-y-2">
              {pastRequests.map((req) => {
                const district = req.property_details?.district
                const surveyNo = req.property_details?.surveyNo || req.property_details?.address
                const isReady = req.status === 'ready'

                return (
                  <div
                    key={req.id}
                    className={cn(
                      'bg-white border rounded-xl px-5 py-3.5 transition-all',
                      isReady ? 'border-emerald-200/80' : 'border-[#CBD5E8]',
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-mono text-[#7A8FAD] shrink-0">
                          {req.id.slice(0, 8).toUpperCase()}
                        </span>
                        {(district || surveyNo) && (
                          <span className="text-xs text-[#3D5278] truncate">
                            {[surveyNo, district].filter(Boolean).join(' · ')}
                          </span>
                        )}
                        <span
                          className={cn(
                            'text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full shrink-0',
                            isReady
                              ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200'
                              : 'bg-amber-50 text-amber-600 ring-1 ring-amber-200',
                          )}
                        >
                          {isReady ? 'Ready' : 'Pending'}
                        </span>
                      </div>
                      <span className="text-xs text-[#7A8FAD] shrink-0 ml-3 hidden sm:block">
                        {formatDateIST(req.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      {isReady && req.report_url && (
                        <button
                          onClick={() => handleDownload(req)}
                          disabled={downloading === req.id}
                          className={cn(
                            'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors cursor-pointer',
                            'bg-emerald-600 text-white hover:bg-emerald-700',
                            downloading === req.id && 'opacity-60 cursor-not-allowed',
                          )}
                        >
                          <Download size={12} />
                          {downloading === req.id ? 'Preparing...' : 'Download Report'}
                        </button>
                      )}
                      <a
                        href={`/clearance/track/${req.id}`}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium text-[#7A8FAD] hover:text-[#1B4FD8] transition-colors bg-[#F4F7FC] hover:bg-[#EBF0F8]"
                      >
                        <ExternalLink size={11} />
                        {isReady ? 'View details' : 'Track progress'}
                      </a>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
