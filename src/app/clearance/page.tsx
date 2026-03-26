'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Script from 'next/script'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { submitRequest, ClearanceFormData } from '@/lib/submitRequest'
import { cn } from '@/lib/utils'
import { ExternalLink, Shield, Clock, FileCheck, ArrowRight, CheckCircle, Download } from 'lucide-react'
import { ClearanceNav } from '@/components/layout/ClearanceNav'
import type { Session } from '@supabase/supabase-js'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void; close: () => void }
  }
}

interface PastRequest {
  id: string
  status: string
  created_at: string
  property_details: Record<string, string> | null
  report_url: string | null
}

// All 38 Tamil Nadu districts — canonical spelling for lookup accuracy
const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivagangai', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Villupuram', 'Virudhunagar',
]

const PROCESS_STEPS = [
  { icon: FileCheck, label: 'Submit', desc: 'Enter property details & pay' },
  { icon: Shield, label: 'Verify', desc: '6 government sources cross-checked' },
  { icon: CheckCircle, label: 'Report', desc: 'Download in under 3 hours' },
]

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
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [pastRequests, setPastRequests] = useState<PastRequest[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authStep, setAuthStep] = useState<'idle' | 'otp'>('idle')
  const [otpValue, setOtpValue] = useState('')
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [downloading, setDownloading] = useState<string | null>(null)
  const [paymentProcessing, setPaymentProcessing] = useState(false)
  const razorpayLoaded = useRef(false)

  const [form, setForm] = useState({
    surveyNo: '',
    district: '',
    taluk: '',
    village: '',
    applicantName: '',
    phone: '',
    email: '',
  })

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        supabase.auth.signOut().catch(() => {})
        setSession(null)
        setSessionLoading(false)
        return
      }
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s)
        setSessionLoading(false)
        if (s) fetchPastRequests(s.user.id)
      }).catch(() => {
        setSession(null)
        setSessionLoading(false)
      })
    }).catch(() => {
      supabase.auth.signOut().catch(() => {})
      setSession(null)
      setSessionLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      if (!s) {
        setSession(null)
        return
      }
      setSession(s)
      fetchPastRequests(s.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPastRequests(userId: string) {
    const { data } = await supabase
      .from('clearance_requests')
      .select('id, status, created_at, property_details, report_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setPastRequests(data)
  }

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

  function buildFormData(): ClearanceFormData {
    return {
      tab: 'property',
      files: [],
      address: '',
      district: form.district,
      taluk: form.taluk,
      village: form.village,
      surveyNo: form.surveyNo,
      applicantName: form.applicantName,
      email: form.email,
      phone: form.phone,
    }
  }

  function validate(): boolean {
    if (!form.surveyNo.trim()) { setError('Please enter your survey or patta number'); return false }
    if (!form.district.trim()) { setError('Please select your district'); return false }
    if (!form.phone.trim()) { setError('Please enter your phone number'); return false }
    if (!form.email.trim()) { setError('Please enter your email address'); return false }
    setError('')
    return true
  }

  async function openRazorpayCheckout(currentSession: Session) {
    setPaymentProcessing(true)
    setError('')

    try {
      // 1. Create order on server
      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          phone: form.phone.trim(),
          name: form.applicantName.trim(),
          amount: 359900,
        }),
      })

      if (!orderRes.ok) {
        throw new Error('Something went wrong while setting up payment. Please try again.')
      }

      const { orderId } = await orderRes.json()

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: 359900,
        currency: 'INR',
        name: 'HataD',
        description: 'Land Clearance Report',
        order_id: orderId,
        prefill: {
          email: form.email.trim(),
          contact: form.phone.trim(),
          name: form.applicantName.trim(),
        },
        theme: {
          color: '#0D1B2A',
          backdrop_color: 'rgba(12,21,37,0.6)',
        },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            })

            if (!verifyRes.ok) {
              throw new Error('We couldn\u2019t confirm your payment. Please try again or contact us.')
            }

            const { paymentId } = await verifyRes.json()

            const requestId = await submitRequest(currentSession, buildFormData(), paymentId)
            setSubmittedId(requestId)
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Your payment went through but we hit an issue submitting your request. Please contact us and we\u2019ll sort it out.')
          } finally {
            setPaymentProcessing(false)
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentProcessing(false)
            setSubmitting(false)
          },
        },
      }

      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please refresh and try again.')
      setPaymentProcessing(false)
      setSubmitting(false)
    }
  }

  async function handleSubmit() {
    if (!validate()) return
    setError('')

    if (!session) {
      setSubmitting(true)
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: form.email.trim(),
        options: { shouldCreateUser: true },
      })
      setSubmitting(false)
      if (otpError) { setError('We couldn\u2019t send the code. Please check your email and try again.'); return }
      setAuthStep('otp')
      setResendCooldown(30)
      return
    }

    setSubmitting(true)
    await openRazorpayCheckout(session)
  }

  async function handleVerifyOtp() {
    if (otpValue.length < 6) { setError('Please enter the 6-digit code from your email'); return }
    setSubmitting(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email.trim(),
      token: otpValue,
      type: 'email',
    })

    if (verifyError) {
      setSubmitting(false)
      setError('That code didn\u2019t work. Please check and try again, or request a new one.')
      return
    }

    if (data.session) {
      await openRazorpayCheckout(data.session)
    }
  }

  const inputClass =
    'w-full bg-white border border-[#CBD5E8] text-[#0C1525] placeholder:text-[#7A8FAD] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] transition-all'

  const selectClass =
    'w-full bg-white border border-[#CBD5E8] text-[#0C1525] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] transition-all appearance-none cursor-pointer'

  const setField = useCallback((key: string, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
  }, [])

  function DistrictSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
    return (
      <div className="relative">
        <select value={value} onChange={(e) => onChange(e.target.value)} className={cn(selectClass, !value && 'text-[#7A8FAD]')}>
          <option value="" disabled>Select district</option>
          {TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#7A8FAD]">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </span>
      </div>
    )
  }

  useEffect(() => {
    if (!submittedId) return
    const t = setTimeout(() => router.push(`/clearance/track/${submittedId}`), 2800)
    return () => clearTimeout(t)
  }, [submittedId, router])

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-[#F4F7FC] flex items-center justify-center">
        <div className="w-40 h-[3px] rounded-full bg-[#E8EDF5] overflow-hidden">
          <div className="h-full rounded-full bg-[#1B4FD8] animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC]">
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => { razorpayLoaded.current = true }}
      />
      {/* Submission confirmation overlay */}
      <AnimatePresence>
        {submittedId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center px-6"
          >
            <div className="absolute inset-0 opacity-[0.03]" style={{
              backgroundImage: 'linear-gradient(#0C1525 1px, transparent 1px), linear-gradient(90deg, #0C1525 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }} />

            <motion.div
              initial={{ scale: 0.88, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex flex-col items-center text-center max-w-sm"
            >
              <div className="relative mb-7">
                <div className="w-20 h-20 rounded-full bg-[#1B4FD8]/8 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-[#1B4FD8]/12 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.3, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                      className="w-10 h-10 rounded-full bg-[#1B4FD8] flex items-center justify-center shadow-lg shadow-[#1B4FD8]/30"
                    >
                      <motion.svg
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
                        width="20" height="20" viewBox="0 0 20 20" fill="none"
                      >
                        <motion.path
                          d="M5 10.5l3.5 3.5 6.5-7"
                          stroke="white"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.55, duration: 0.4, ease: 'easeOut' }}
                        />
                      </motion.svg>
                    </motion.div>
                  </div>
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.4 }}
              >
                <p className="text-[#1B4FD8] text-xs font-medium tracking-[0.2em] uppercase mb-2">
                  Request Confirmed
                </p>
                <h2 className="font-display text-[#0C1525] text-2xl font-bold tracking-tight mb-2">
                  Your report is in queue
                </h2>
                <p className="text-[#7A8FAD] text-sm leading-relaxed">
                  We&apos;re cross-referencing official records.<br />
                  Delivery in 2–3 hours.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.35 }}
                className="mt-6 flex items-center gap-2 bg-[#F4F7FC] border border-[#E8EDF5] rounded-lg px-4 py-2.5"
              >
                <span className="text-[#7A8FAD] text-xs">Reference</span>
                <span className="text-[#0C1525] text-xs font-mono font-semibold tracking-wider">
                  {submittedId.slice(0, 8).toUpperCase()}
                </span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="mt-8 w-48"
              >
                <div className="h-[3px] rounded-full bg-[#EBF0F8] overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.8, duration: 2, ease: 'linear' }}
                    className="h-full rounded-full bg-[#1B4FD8]"
                  />
                </div>
                <p className="text-[10px] text-[#CBD5E8] mt-2 text-center tracking-wide">
                  Opening your tracking page…
                </p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClearanceNav />

      {/* Hero Header */}
      <div className="relative overflow-hidden border-b border-[#E8EDF5]">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-[#F4F7FC]" />
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[#1B4FD8]/5 rounded-full blur-[120px] -translate-y-1/3 translate-x-1/4 pointer-events-none" />

        <div className="relative px-6 md:px-12 lg:px-20 xl:px-28 pt-16 pb-20 text-center">
          <p className="text-[#1B4FD8] text-xs font-medium tracking-[0.25em] uppercase mb-4">
            Land Clearance Intelligence
          </p>
          <h1 className="font-display text-[#0C1525] text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Request Your Clearance Report
          </h1>
          <p className="text-[#7A8FAD] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Tell us your property details.
            We retrieve every document on record — including ones most buyers never know to ask for.
          </p>

          {/* Process Timeline */}
          <div className="mt-12 flex items-start justify-center gap-0">
            {PROCESS_STEPS.map((step, i) => (
              <div key={step.label} className="flex items-start">
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.15, duration: 0.4 }}
                  className="flex flex-col items-center w-28 sm:w-36"
                >
                  {/* Icon circle */}
                  <div className={cn(
                    'relative w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all',
                    i === 0
                      ? 'bg-[#1B4FD8] text-white shadow-lg shadow-[#1B4FD8]/25'
                      : 'bg-white border-2 border-[#E8EDF5] text-[#B8C5DA]',
                  )}>
                    <step.icon size={20} />
                    {/* Step number */}
                    <span className={cn(
                      'absolute -top-1 -right-1 w-5 h-5 rounded-full text-[9px] font-bold flex items-center justify-center',
                      i === 0
                        ? 'bg-white text-[#1B4FD8] shadow-sm ring-1 ring-[#1B4FD8]/20'
                        : 'bg-[#F4F7FC] text-[#B8C5DA] ring-1 ring-[#E8EDF5]',
                    )}>
                      {i + 1}
                    </span>
                  </div>

                  {/* Label */}
                  <p className={cn(
                    'text-xs font-semibold tracking-wide mt-3',
                    i === 0 ? 'text-[#1B4FD8]' : 'text-[#7A8FAD]',
                  )}>
                    {step.label}
                  </p>

                  {/* Description */}
                  <p className="text-[10px] text-[#B8C5DA] mt-1 text-center leading-snug hidden sm:block px-1">
                    {step.desc}
                  </p>
                </motion.div>

                {/* Connector line */}
                {i < PROCESS_STEPS.length - 1 && (
                  <div className="flex items-center mt-6 sm:mt-7">
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5 + i * 0.2, duration: 0.4 }}
                      className="w-8 sm:w-14 h-[2px] bg-gradient-to-r from-[#1B4FD8]/30 to-[#E8EDF5] origin-left"
                    />
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.7 + i * 0.2 }}
                    >
                      <ArrowRight size={12} className="text-[#CBD5E8]" />
                    </motion.div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 -mt-6 pb-16 relative z-10">
        {/* Past requests */}
        {pastRequests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-semibold text-[#3D5278] tracking-wider uppercase mb-3 px-1">
              Your Requests
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

        {/* Form Card */}
        <div className="bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Survey / Patta Number — full width, prominent */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  Survey / Patta Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 89/3"
                  value={form.surveyNo}
                  onChange={(e) => setField('surveyNo', e.target.value)}
                  className={cn(inputClass, 'text-base py-3.5')}
                  autoFocus
                />
              </div>

              {/* District — full width */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <DistrictSelect
                  value={form.district}
                  onChange={(v) => setField('district', v)}
                />
              </div>

              {/* Taluk + Village — one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Taluk
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tambaram"
                    value={form.taluk}
                    onChange={(e) => setField('taluk', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Village
                  </label>
                  <input
                    type="text"
                    placeholder="Village name"
                    value={form.village}
                    onChange={(e) => setField('village', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Applicant Name + Phone — one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Applicant Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={form.applicantName}
                    onChange={(e) => setField('applicantName', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setField('phone', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>

              {/* Email — full width */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setField('email', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* OTP step */}
            {authStep === 'otp' ? (
              <div className="mt-8 space-y-3">
                <div className="bg-[#F8FAFD] border border-[#EBF0F8] rounded-xl px-5 py-3.5 text-center">
                  <p className="text-sm text-[#3D5278]">
                    We sent a one-time code to{' '}
                    <span className="font-semibold text-[#0C1525]">{form.email}</span>
                  </p>
                </div>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otpValue}
                  autoFocus
                  onChange={(e) => { setOtpValue(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  className={cn(inputClass, 'text-center text-2xl tracking-[0.5em] font-mono')}
                />
                <button
                  onClick={handleVerifyOtp}
                  disabled={submitting || otpValue.length < 6}
                  className={cn(
                    'w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer',
                    'bg-[#1B4FD8] text-white hover:bg-[#1636D0] shadow-lg shadow-[#1B4FD8]/20',
                    (submitting || otpValue.length < 6) && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {submitting || paymentProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {paymentProcessing ? 'Processing payment...' : 'Confirming...'}
                    </span>
                  ) : 'Confirm & Pay ₹3,599 →'}
                </button>
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={async () => {
                      setError('')
                      setOtpValue('')
                      setSubmitting(true)
                      const { error: otpError } = await supabase.auth.signInWithOtp({
                        email: form.email.trim(),
                        options: { shouldCreateUser: true },
                      })
                      setSubmitting(false)
                      if (otpError) { setError(otpError.message); return }
                      setResendCooldown(30)
                    }}
                    disabled={submitting || resendCooldown > 0}
                    className="text-xs text-[#1B4FD8] hover:text-[#1636D0] transition-colors py-1 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                  <span className="text-[#CBD5E8]">·</span>
                  <button
                    onClick={() => { setAuthStep('idle'); setOtpValue(''); setError(''); setResendCooldown(0) }}
                    className="text-xs text-[#7A8FAD] hover:text-[#3D5278] transition-colors py-1 cursor-pointer"
                  >
                    Use a different email
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className={cn(
                    'mt-8 w-full py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all cursor-pointer',
                    'bg-[#1B4FD8] text-white hover:bg-[#1636D0] shadow-lg shadow-[#1B4FD8]/20',
                    'hover:shadow-xl hover:shadow-[#1B4FD8]/25 hover:-translate-y-px',
                    submitting && 'opacity-60 cursor-not-allowed',
                  )}
                >
                  {submitting || paymentProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {paymentProcessing ? 'Processing payment...' : session ? 'Preparing checkout...' : 'Sending code...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Pay ₹3,599 & Request Report
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] text-[#7A8FAD]">
                  ₹3,599 per report (GST inclusive) · Delivered in 2–3 hours · Document retrieval included
                </p>
                <p className="mt-2 text-center text-[11px] text-[#7A8FAD]">
                  Have your documents already?{' '}
                  <a href="/clearance/upload" className="text-[#1B4FD8] hover:text-[#1636D0] transition-colors">
                    Upload them instead &rarr;
                  </a>{' '}
                  <span className="text-[#B8C5DA]">₹1,599 (GST inclusive)</span>
                </p>
                <p className="mt-2 text-center text-[10px] text-[#B8C5DA]">
                  By submitting, you agree to our{' '}
                  <a href="/terms" className="text-[#7A8FAD] hover:text-[#1B4FD8] underline transition-colors">Terms &amp; Conditions</a>
                  {' '}and{' '}
                  <a href="/privacy" className="text-[#7A8FAD] hover:text-[#1B4FD8] underline transition-colors">Privacy Policy</a>.
                </p>
              </>
            )}
          </div>
        </div>

        {/* Trust Signals */}
        <div className="mt-8 flex flex-wrap justify-center gap-6 text-[11px] text-[#7A8FAD]">
          <span className="flex items-center gap-1.5">
            <Clock size={13} className="text-[#1B4FD8]" />
            Delivered in 2–3 hours
          </span>
          <span className="flex items-center gap-1.5">
            <Shield size={13} className="text-[#1B4FD8]" />
            End-to-end encrypted
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={13} className="text-[#1B4FD8]" />
            EC · Patta · FMB · Title chain · Mutation · Litigation · A-Register
          </span>
        </div>

        {/* FAQ */}
        <div className="mt-12">
          <h2 className="text-center text-xs font-semibold text-[#3D5278] tracking-wider uppercase mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'What documents will you retrieve?',
                a: 'We retrieve the Encumbrance Certificate (EC) from TNREGINET, Patta and A-Register from the Revenue Department, FMB from the Taluk Office, Sale Deed and title chain from the Sub-Registrar, mutation records, and litigation status from the District Court. All records are cross-referenced in your report.',
              },
              {
                q: 'How long does the report take?',
                a: 'Most reports are delivered within 2–3 hours of submission. If your report takes longer due to complex records or high volume, we\u2019ll notify you by email with an updated timeline.',
              },
              {
                q: 'Is my data secure?',
                a: 'Yes. Your data is stored on encrypted cloud infrastructure with row-level access controls \u2014 only you can access your requests and reports. Download links expire after 7 days, and uploaded documents are permanently deleted after your report is delivered.',
              },
              {
                q: 'What if I need a refund?',
                a: 'Once a request is submitted, document retrieval begins immediately, so refunds are not available. If we\u2019re unable to retrieve sufficient records, a full refund is issued automatically. If we process the wrong property due to our error, we\u2019ll reprocess at no charge within 24 hours.',
              },
              {
                q: 'Can I use this report for a bank loan or legal transaction?',
                a: 'The report is a comprehensive clearance check, but it does not constitute legal advice or title insurance. We recommend sharing it with your advocate or bank for transactions above \u20B950 lakh or involving disputed titles.',
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group bg-white border border-[#CBD5E8]/60 rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer text-sm font-medium text-[#0C1525] hover:text-[#1B4FD8] transition-colors list-none">
                  {item.q}
                  <svg
                    className="w-4 h-4 text-[#CBD5E8] group-open:rotate-180 transition-transform shrink-0 ml-3"
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-xs text-[#3D5278] leading-relaxed border-t border-[#EBF0F8] pt-3">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
