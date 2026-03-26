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
import { track } from '@/lib/track'
import { useT } from '@/lib/i18n/context'

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

// PROCESS_STEPS moved inside component to access t()

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
  const t = useT()
  const router = useRouter()

  const PROCESS_STEPS = [
    { icon: FileCheck, label: t('steps.submit'), desc: t('steps.submitDesc') },
    { icon: Shield, label: t('steps.verify'), desc: t('steps.verifyDesc') },
    { icon: CheckCircle, label: t('steps.report'), desc: t('steps.reportDesc') },
  ]
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
  const [geoLoading, setGeoLoading] = useState(false)
  const [geoPhase, setGeoPhase] = useState<'idle' | 'locating' | 'fetching' | 'found' | 'error'>('idle')
  const [geoDetails, setGeoDetails] = useState<{
    survey: string; district: string; taluk: string; village: string
    landType: string; guideline?: string; landClass?: string; ulpin?: string; elevation?: number
  } | null>(null)
  const [sroInfo, setSroInfo] = useState<string | null>(null)
  const [flashField, setFlashField] = useState<string | null>(null)

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

  // Geolocation auto-fill — progressive discovery
  async function handleUseLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    setGeoPhase('locating')
    setGeoDetails(null)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords
          setGeoPhase('fetching')

          const res = await fetch('/api/tngis/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: latitude, lon: longitude }),
            signal: AbortSignal.timeout(15000),
          })

          if (res.ok) {
            const data = await res.json()
            const ld = data.land_details?.data
            const land = Array.isArray(ld) ? ld[0] : ld
            const gv = data.guideline_value?.data?.[0]

            if (land) {
              const survey = land.survey_number + (land.sub_division ? `/${land.sub_division}` : '')

              // Show the discovery card first
              setGeoDetails({
                survey,
                district: land.district_name,
                taluk: land.taluk_name,
                village: land.village_name,
                landType: land.rural_urban === 'rural' ? 'Rural' : 'Urban',
                guideline: gv ? `\u20B9${Number(gv.metric_rate).toLocaleString('en-IN')} per ${gv.unit_id}` : undefined,
                landClass: gv?.land_name || undefined,
                ulpin: land.ulpin || undefined,
                elevation: data.natural_resources?.elevation ?? undefined,
              })
              setGeoPhase('found')

              // Auto-fill form fields one by one — the magic effect
              const fill = (field: string, value: string, delay: number) => {
                setTimeout(() => {
                  setForm((p) => ({ ...p, [field]: value }))
                  setFlashField(field)
                  setTimeout(() => setFlashField(null), 800)
                }, delay)
              }
              fill('surveyNo', survey, 400)
              fill('district', land.district_name, 900)
              fill('taluk', land.taluk_name, 1400)
              fill('village', land.village_name, 1900)

              track('geo_autofill', 'clearance', { district: land.district_name, survey: land.survey_number })
            } else {
              setGeoPhase('error')
            }
          } else {
            setGeoPhase('error')
          }
        } catch {
          setGeoPhase('error')
        } finally {
          setGeoLoading(false)
        }
      },
      () => {
        setGeoLoading(false)
        setGeoPhase('error')
        setError('Could not get your location. Please enter details manually.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // SRO lookup when village changes
  useEffect(() => {
    if (!form.village.trim() || form.village.length < 3) { setSroInfo(null); return }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/sro?village=${encodeURIComponent(form.village)}${form.district ? `&district=${encodeURIComponent(form.district)}` : ''}`)
        if (res.ok) {
          const data = await res.json()
          setSroInfo(`SRO Office: ${data.sro}, ${data.zone} Zone`)
        } else {
          setSroInfo(null)
        }
      } catch { setSroInfo(null) }
    }, 500) // debounce
    return () => clearTimeout(timeout)
  }, [form.village, form.district])

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
    track('payment_initiated', 'clearance', { district: form.district, surveyNo: form.surveyNo })

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
            track('payment_completed', 'clearance', { requestId, district: form.district })
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
                  {t('clearance.confirmTitle')}
                </p>
                <h2 className="font-display text-[#0C1525] text-2xl font-bold tracking-tight mb-2">
                  {t('clearance.confirmHeading')}
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
                <span className="text-[#7A8FAD] text-xs">{t('clearance.confirmReference')}</span>
                <span className="text-[#0C1525] text-xs font-mono font-semibold tracking-wider">
                  {submittedId.slice(0, 8).toUpperCase()}
                </span>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.65 }}
                className="mt-5 text-[#7A8FAD] text-sm text-center leading-relaxed"
              >
                {t('clearance.confirmRetrieving')}
              </motion.p>

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
                  {t('clearance.confirmRedirect')}
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
            {t('clearance.heroTag')}
          </p>
          <h1 className="font-display text-[#0C1525] text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            {t('clearance.heroTitle')}
          </h1>
          <p className="text-[#7A8FAD] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            {t('clearance.heroDescription')}
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
        <p className="text-center text-[15px] text-[#7A8FAD] mb-6">
          {t('clearance.trustLine')}
        </p>

        <div className="bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            {/* Geolocation — progressive discovery */}
            {geoPhase === 'idle' && (
              <button
                onClick={handleUseLocation}
                className="w-full mb-5 py-3.5 rounded-lg text-sm font-medium bg-[#1B4FD8]/[0.06] text-[#1B4FD8] hover:bg-[#1B4FD8]/[0.1] transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                {t('clearance.useLocation')}
              </button>
            )}

            {(geoPhase === 'locating' || geoPhase === 'fetching') && (
              <div className="bg-[#F8FAFD] border border-[#E8EDF5] rounded-lg p-5 mb-5 text-center">
                <div className="w-10 h-10 rounded-full bg-[#1B4FD8]/10 flex items-center justify-center mx-auto mb-3">
                  <span className="w-5 h-5 border-2 border-[#1B4FD8]/30 border-t-[#1B4FD8] rounded-full animate-spin" />
                </div>
                <p className="text-[#0C1525] text-sm font-medium">
                  {geoPhase === 'locating' ? 'Getting your location...' : 'Pulling property records...'}
                </p>
              </div>
            )}

            {geoPhase === 'found' && geoDetails && (
              <div className="mb-5 bg-[#F8FAFD] border border-emerald-200/60 rounded-lg p-5">
                <p className="text-emerald-600 text-[10px] font-semibold tracking-[0.15em] uppercase mb-4 flex items-center gap-1.5">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  Property found from government records
                </p>
                <p className="text-[10px] text-[#7A8FAD] mt-3">Edit any field below if needed</p>
              </div>
            )}

            {geoPhase === 'error' && (
              <div className="bg-red-50 border border-red-200/60 rounded-lg px-4 py-3 mb-5 flex items-center justify-between">
                <p className="text-xs text-red-700">Could not find property records. Please fill in your details manually.</p>
                <button onClick={() => setGeoPhase('idle')} className="text-xs text-red-500 hover:text-red-700 font-medium cursor-pointer ml-3 shrink-0">Try again</button>
              </div>
            )}

            <div className="space-y-5">
              {/* Survey / Patta Number — full width, prominent */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  {t('clearance.surveyLabel')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. 89/3"
                  value={form.surveyNo}
                  onChange={(e) => setField('surveyNo', e.target.value)}
                  className={cn(inputClass, 'text-base py-3.5', flashField === 'surveyNo' && 'animate-field-flash')}
                  autoFocus
                />
                <p className="text-[12px] text-[#B8C5DA] mt-1.5">{t('clearance.surveyHelper')}</p>
              </div>

              {/* District — full width */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  {t('clearance.districtLabel')} <span className="text-red-500">*</span>
                </label>
                <div className={cn(flashField === 'district' && 'animate-field-flash rounded-lg')}>
                  <DistrictSelect
                    value={form.district}
                    onChange={(v) => setField('district', v)}
                  />
                </div>
              </div>

              {/* Taluk + Village — one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    {t('clearance.talukLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Tambaram"
                    value={form.taluk}
                    onChange={(e) => setField('taluk', e.target.value)}
                    className={cn(inputClass, flashField === 'taluk' && 'animate-field-flash')}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    {t('clearance.villageLabel')}
                  </label>
                  <input
                    type="text"
                    placeholder="Village name"
                    value={form.village}
                    onChange={(e) => setField('village', e.target.value)}
                    className={cn(inputClass, flashField === 'village' && 'animate-field-flash')}
                  />
                  {sroInfo && (
                    <p className="mt-1.5 text-[10px] text-[#1B4FD8] font-medium flex items-center gap-1">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                      {sroInfo}
                    </p>
                  )}
                </div>
              </div>

              {/* Applicant Name + Phone — one row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    {t('clearance.nameLabel')}
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
                    {t('clearance.phoneLabel')} <span className="text-red-500">*</span>
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
                  {t('clearance.emailLabel')} <span className="text-red-500">*</span>
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
                      {paymentProcessing ? t('clearance.processingPayment') : session ? t('clearance.preparingCheckout') : t('clearance.sendingCode')}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      {t('clearance.payButton')}
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#3D5278] bg-[#F4F7FC] border border-[#E8EDF5] px-3 py-1.5 rounded-full">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    {t('clearance.trustEncrypted')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#3D5278] bg-[#F4F7FC] border border-[#E8EDF5] px-3 py-1.5 rounded-full">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    {t('clearance.trust6Sources')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-[#3D5278] bg-[#F4F7FC] border border-[#E8EDF5] px-3 py-1.5 rounded-full">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                    {t('clearance.trustUnder3h')}
                  </span>
                </div>
                <p className="mt-3 text-center text-[12px] text-[#B8C5DA]">
                  {t('clearance.confirmationNote')}
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
            {t('clearance.faqTitle') !== 'clearance.faqTitle' ? t('clearance.faqTitle') : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-3">
            {[
              { q: t('faq.q1'), a: t('faq.a1') },
              { q: t('faq.q2'), a: t('faq.a2') },
              { q: t('faq.q3'), a: t('faq.a3') },
              { q: t('faq.q4'), a: t('faq.a4') },
              { q: t('faq.q5'), a: t('faq.a5') },
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
