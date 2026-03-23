'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { submitRequest, ClearanceFormData } from '@/lib/submitRequest'
import { cn } from '@/lib/utils'
import { ClearanceNav } from '@/components/layout/ClearanceNav'

function base64ToFile(b64: string, name: string, type: string): File {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new File([bytes], name, { type })
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
            <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
          </div>
        </div>
      }
    >
      <AuthPageInner />
    </Suspense>
  )
}

function AuthPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [step, setStep] = useState<1 | 2>(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth(session)
      }
    })
  }, [])

  async function handlePostAuth(session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) {
    const next = searchParams.get('next') || '/clearance'
    const pending = sessionStorage.getItem('hatad_pending_submission')

    if (pending) {
      sessionStorage.removeItem('hatad_pending_submission')
      setLoading(true)
      setError('')

      try {
        const parsed = JSON.parse(pending)
        const formData: ClearanceFormData = {
          tab: parsed.tab,
          files: (parsed.files || []).map((f: { name: string; type: string; base64: string }) =>
            base64ToFile(f.base64, f.name, f.type),
          ),
          address: parsed.address || '',
          district: parsed.district || '',
          taluk: parsed.taluk || '',
          village: parsed.village || '',
          surveyNo: parsed.surveyNo || '',
          applicantName: parsed.applicantName || '',
          email: parsed.email || '',
        }

        const requestId = await submitRequest(session, formData)
        router.push(`/clearance/track/${requestId}`)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to submit request')
        setLoading(false)
      }
      return
    }

    router.push(next)
  }

  async function handleSendOtp() {
    if (!email.trim()) {
      setError('Please enter your email')
      return
    }
    setLoading(true)
    setError('')

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })

    setLoading(false)

    if (otpError) {
      setError(otpError.message)
      return
    }

    setStep(2)
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) {
      setError('Please enter the 6-digit code')
      return
    }
    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'email',
    })

    if (verifyError) {
      setLoading(false)
      setError(verifyError.message)
      return
    }

    if (data.session) {
      await handlePostAuth(data.session)
    } else {
      setLoading(false)
      setError('Verification failed. Please try again.')
    }
  }

  const inputClass =
    'w-full bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors text-center'

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClearanceNav backHref="/clearance" backLabel="Back to clearance" />
      <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-text-primary">
              Sign in to HataD
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Verify your identity to continue
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-sm mb-6">
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                  className={inputClass}
                  autoFocus
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-sm text-sm font-semibold tracking-wide transition-all cursor-pointer',
                  'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238]',
                  loading && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                    Sending...
                  </span>
                ) : (
                  'Send code →'
                )}
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-text-secondary text-center">
                We sent a code to{' '}
                <span className="font-medium text-text-primary">{email}</span>
              </p>
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  Verification Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="000000"
                  value={otp}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 6)
                    setOtp(val)
                    setError('')
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                  className={cn(inputClass, 'text-2xl tracking-[0.5em] font-mono')}
                  autoFocus
                />
              </div>
              <button
                onClick={handleVerifyOtp}
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-sm text-sm font-semibold tracking-wide transition-all cursor-pointer',
                  'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238]',
                  loading && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : (
                  'Verify →'
                )}
              </button>
              <button
                onClick={() => { setStep(1); setOtp(''); setError('') }}
                className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer py-1"
              >
                Use a different email
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-text-muted mt-6">
          HataD by Hypse Aero · Coimbatore, Tamil Nadu
        </p>
      </div>
      </div>
    </div>
  )
}
