'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { submitRequest, ClearanceFormData } from '@/lib/submitRequest'
import { cn } from '@/lib/utils'
import { Upload, FileText, Trash2, ArrowRight } from 'lucide-react'
import { ClearanceNav } from '@/components/layout/ClearanceNav'
import type { Session } from '@supabase/supabase-js'

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 10

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

export default function UploadPage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [authStep, setAuthStep] = useState<'idle' | 'otp'>('idle')
  const [otpValue, setOtpValue] = useState('')
  const [submittedId, setSubmittedId] = useState<string | null>(null)
  const [resendCooldown, setResendCooldown] = useState(0)

  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ surveyNo: '', district: '', email: '', phone: '' })

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        supabase.auth.signOut()
        setSession(null)
        setSessionLoading(false)
        return
      }
      supabase.auth.getSession().then(({ data: { session: s } }) => {
        setSession(s)
        setSessionLoading(false)
      })
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })

    return () => subscription.unsubscribe()
  }, [])

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE,
    )
    setFiles((prev) => {
      const names = new Set(prev.map((p) => p.name))
      const unique = valid.filter((f) => !names.has(f.name))
      return [...prev, ...unique].slice(0, MAX_FILES)
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function buildFormData(): ClearanceFormData {
    return {
      tab: 'upload',
      files,
      address: form.surveyNo,
      district: form.district,
      taluk: '',
      village: '',
      surveyNo: '',
      applicantName: '',
      email: form.email,
      phone: form.phone,
    }
  }

  function validate(): boolean {
    if (files.length === 0) { setError('Please upload at least one document'); return false }
    if (!form.district.trim()) { setError('District is required'); return false }
    if (!form.email.trim()) { setError('Email is required'); return false }
    setError('')
    return true
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
      if (otpError) { setError(otpError.message); return }
      setAuthStep('otp')
      setResendCooldown(30)
      return
    }

    setSubmitting(true)
    try {
      const requestId = await submitRequest(session, buildFormData())
      setSubmittedId(requestId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
      setSubmitting(false)
    }
  }

  async function handleVerifyOtp() {
    if (otpValue.length < 6) { setError('Please enter the 6-digit code'); return }
    setSubmitting(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: form.email.trim(),
      token: otpValue,
      type: 'email',
    })

    if (verifyError) {
      setSubmitting(false)
      setError(verifyError.message)
      return
    }

    if (data.session) {
      try {
        const requestId = await submitRequest(data.session, buildFormData())
        setSubmittedId(requestId)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
        setSubmitting(false)
      }
    }
  }

  const inputClass =
    'w-full bg-white border border-[#CBD5E8] text-[#0C1525] placeholder:text-[#7A8FAD] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] transition-all'

  const selectClass =
    'w-full bg-white border border-[#CBD5E8] text-[#0C1525] text-sm px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B4FD8]/15 focus:border-[#1B4FD8] transition-all appearance-none cursor-pointer'

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
                      <motion.svg width="20" height="20" viewBox="0 0 20 20" fill="none">
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
                <p className="text-[#1B4FD8] text-xs font-medium tracking-[0.2em] uppercase mb-2">Request Confirmed</p>
                <h2 className="font-display text-[#0C1525] text-2xl font-bold tracking-tight mb-2">Your report is in queue</h2>
                <p className="text-[#7A8FAD] text-sm leading-relaxed">
                  We&apos;re cross-referencing official records.<br />Delivery in 2–3 hours.
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
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} className="mt-8 w-48">
                <div className="h-[3px] rounded-full bg-[#EBF0F8] overflow-hidden">
                  <motion.div
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ delay: 0.8, duration: 2, ease: 'linear' }}
                    className="h-full rounded-full bg-[#1B4FD8]"
                  />
                </div>
                <p className="text-[10px] text-[#CBD5E8] mt-2 text-center tracking-wide">Opening your tracking page…</p>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ClearanceNav backHref="/clearance" backLabel="Back to clearance" />

      {/* Header */}
      <div className="relative overflow-hidden border-b border-[#E8EDF5]">
        <div className="absolute inset-0 bg-gradient-to-b from-white to-[#F4F7FC]" />
        <div className="relative px-6 md:px-12 lg:px-20 xl:px-28 pt-14 pb-16 text-center">
          <p className="text-[#1B4FD8] text-xs font-medium tracking-[0.25em] uppercase mb-4">
            Upload Your Documents
          </p>
          <h1 className="font-display text-[#0C1525] text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            Submit Documents for Analysis
          </h1>
          <p className="text-[#7A8FAD] text-sm sm:text-base max-w-lg mx-auto leading-relaxed">
            Already have your EC, Patta, FMB, or Sale Deed? Upload them directly
            and we&apos;ll cross-reference every record.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-6 -mt-6 pb-16 relative z-10">
        <div className="bg-white rounded-2xl border border-[#CBD5E8]/60 shadow-[0_1px_3px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.03)] overflow-hidden">
          <div className="p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-6 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-5">
              {/* Drop zone */}
              <div>
                <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                  Documents <span className="text-red-500">*</span>
                  <span className="font-normal text-[#7A8FAD] ml-1.5">EC · Patta · FMB · Sale Deed · A-Register</span>
                </label>
                <div
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'border-2 border-dashed rounded-xl px-4 py-10 text-center cursor-pointer transition-all',
                    dragging
                      ? 'border-[#1B4FD8] bg-[#1B4FD8]/5 scale-[1.01]'
                      : 'border-[#CBD5E8] hover:border-[#1B4FD8]/40 hover:bg-[#F8FAFD]',
                  )}
                >
                  <div className="w-12 h-12 rounded-full bg-[#EBF0F8] flex items-center justify-center mx-auto mb-3">
                    <Upload size={20} className="text-[#1B4FD8]" />
                  </div>
                  <p className="text-sm text-[#3D5278]">
                    Drag & drop files here, or <span className="text-[#1B4FD8] font-semibold">browse</span>
                  </p>
                  <p className="text-[11px] text-[#7A8FAD] mt-1.5">PDF, JPG, PNG · Max 10 MB per file · Up to 10 files</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
                  />
                </div>

                {files.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {files.map((f) => (
                      <li key={f.name} className="flex items-center gap-3 bg-[#F8FAFD] border border-[#EBF0F8] rounded-lg px-4 py-2.5 text-xs">
                        <div className="w-7 h-7 rounded-md bg-[#1B4FD8]/10 flex items-center justify-center shrink-0">
                          <FileText size={13} className="text-[#1B4FD8]" />
                        </div>
                        <span className="truncate text-[#0C1525] flex-1 font-medium">{f.name}</span>
                        <span className="text-[#7A8FAD] shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); removeFile(f.name) }}
                          className="text-[#7A8FAD] hover:text-red-500 transition-colors cursor-pointer p-1"
                        >
                          <Trash2 size={13} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Survey No + District */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Survey / Patta Number
                    <span className="font-normal text-[#7A8FAD] ml-1.5">e.g. 89/3</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Survey or Patta number"
                    value={form.surveyNo}
                    onChange={(e) => setForm((p) => ({ ...p, surveyNo: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    District <span className="text-red-500">*</span>
                  </label>
                  <DistrictSelect
                    value={form.district}
                    onChange={(v) => setForm((p) => ({ ...p, district: v }))}
                  />
                </div>
              </div>

              {/* Email + Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3D5278] tracking-wide mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    className={inputClass}
                  />
                </div>
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
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming...
                    </span>
                  ) : 'Confirm & Submit →'}
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
                  {submitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {session ? 'Submitting...' : 'Sending code...'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      Submit Documents
                      <ArrowRight size={16} />
                    </span>
                  )}
                </button>
                <p className="mt-3 text-center text-[11px] text-[#7A8FAD]">
                  ₹1,500 per report · Delivered in 2–3 hours
                </p>
                <p className="mt-2 text-center text-[11px] text-[#7A8FAD]">
                  Don&apos;t have documents?{' '}
                  <a href="/clearance" className="text-[#1B4FD8] hover:text-[#1636D0] transition-colors">
                    Request by property details instead &rarr;
                  </a>
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
      </div>
    </div>
  )
}
