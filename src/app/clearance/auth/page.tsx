'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { STORAGE_KEYS } from '@/lib/constants'
import { ClearanceNav } from '@/components/layout/ClearanceNav'

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
  const [step, setStep] = useState<'google' | 'email' | 'otp'>('google')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingSession, setCheckingSession] = useState(true)

  // Check if already authenticated
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handlePostAuth(session)
      } else {
        setCheckingSession(false)
      }
    })
  }, [])

  async function handlePostAuth(_session: NonNullable<Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session']>) {
    const next = searchParams.get('next') || '/clearance'
    router.push(next)
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')

    const next = searchParams.get('next') || '/profile'
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_NEXT, next)

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/clearance/auth` },
    })

    if (oauthError) {
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleSendOtp() {
    if (!email.trim()) { setError('Please enter your email'); return }
    setLoading(true)
    setError('')

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    setLoading(false)

    if (otpError) {
      setError('We couldn\u2019t send the code. Please check your email and try again.')
      return
    }
    setStep('otp')
  }

  async function handleVerifyOtp() {
    if (otp.length < 6) { setError('Please enter the 6-digit code from your email'); return }
    setLoading(true)
    setError('')

    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp,
      type: 'email',
    })

    if (verifyError) {
      setLoading(false)
      setError('That code didn\u2019t work. Please check and try again, or request a new one.')
      return
    }

    if (data.session) {
      await handlePostAuth(data.session)
    } else {
      setLoading(false)
      setError('Something went wrong. Please try again.')
    }
  }

  const inputClass =
    'w-full bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#1B4FD8] focus:ring-2 focus:ring-[#1B4FD8]/15 transition-colors text-center'

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClearanceNav backHref="/clearance" backLabel="Back to clearance" />
      <div className="flex-1 flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-surface border border-border rounded-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-xl font-semibold text-text-primary">
              {step === 'otp' ? 'Check your email' : 'Sign in to HataD'}
            </h1>
            <p className="text-sm text-text-muted mt-1">
              {step === 'otp'
                ? <>Code sent to <span className="font-medium text-text-primary">{email}</span></>
                : 'Sign in to continue'
              }
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-sm mb-6">
              {error}
            </div>
          )}

          {/* Step: Google + Email entry */}
          {(step === 'google' || step === 'email') && (
            <div className="space-y-4">
              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={loading || googleLoading}
                className={cn(
                  'w-full flex items-center justify-center gap-3 py-3 rounded-sm text-sm font-medium tracking-wide transition-all cursor-pointer',
                  'bg-white border border-border text-text-primary hover:bg-surface-raised',
                  (loading || googleLoading) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {googleLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                    Redirecting to Google...
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
                      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-[11px] text-text-muted uppercase tracking-wider">or</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {/* Email input */}
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
                />
              </div>
              <button
                onClick={handleSendOtp}
                disabled={loading}
                className={cn(
                  'w-full py-3 rounded-sm text-sm font-semibold tracking-wide transition-all cursor-pointer',
                  'bg-[#0C1525] text-white hover:bg-[#152238]',
                  loading && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                  </span>
                ) : 'Send code →'}
              </button>
            </div>
          )}

          {/* Step: OTP verification */}
          {step === 'otp' && (
            <div className="space-y-4">
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
                  onChange={(e) => { setOtp(e.target.value.replace(/\D/g, '').slice(0, 6)); setError('') }}
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
                  'bg-[#0C1525] text-white hover:bg-[#152238]',
                  loading && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : 'Verify →'}
              </button>
              <button
                onClick={() => { setStep('google'); setOtp(''); setError('') }}
                className="w-full text-xs text-text-muted hover:text-text-secondary transition-colors cursor-pointer py-1"
              >
                Use a different method
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
