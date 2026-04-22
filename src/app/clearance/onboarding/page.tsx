'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { submitRequest, ClearanceFormData } from '@/lib/submitRequest'
import { STORAGE_KEYS } from '@/lib/constants'
import { Chrome } from './shared'
import { StepAccount, StepProperty, StepPay, StepTracking, PropertyData, GeoPreview } from './steps'
import './onboarding.css'

type StepIndex = 0 | 1 | 2 | 3

interface PaidPendingSubmit {
  paymentId: string
  property: PropertyData
  email: string
  savedAt: number
}

function loadPendingSubmit(): PaidPendingSubmit | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEYS.PAID_PENDING_SUBMIT)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PaidPendingSubmit
    if (!parsed?.paymentId || !parsed?.property) return null
    return parsed
  } catch { return null }
}

function clearPendingSubmit() {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEYS.PAID_PENDING_SUBMIT)
}

function OnboardingInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [activeStep, setActiveStep] = useState<StepIndex>(0)
  const [session, setSession] = useState<Session | null>(null)
  const [property, setProperty] = useState<PropertyData | null>(null)
  const [geoPreview, setGeoPreview] = useState<GeoPreview | null>(null)
  const [requestId, setRequestId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const stepperIndex = Math.min(activeStep, 3)

  useEffect(() => {
    const step = Number(params.get('step')) || 0
    if (step >= 0 && step <= 3) setActiveStep(step as StepIndex)
  }, [params])

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (s) {
        setSession(s)
        if (activeStep === 0) setActiveStep(1)
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
    })
    return () => subscription.unsubscribe()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function goTo(step: StepIndex) {
    setActiveStep(step)
  }

  async function runSubmit(paymentId: string, prop: PropertyData, activeSession: Session) {
    setSubmitting(true)
    setSubmitError('')
    try {
      const formData: ClearanceFormData = {
        files: [],
        address: '',
        district: prop.district,
        taluk: prop.taluk,
        village: prop.village,
        surveyNo: prop.surveyNo,
        applicantName: prop.applicantName,
        email: activeSession.user.email || '',
        phone: prop.phone,
      }
      const id = await submitRequest(activeSession, formData, paymentId)
      clearPendingSubmit()
      setRequestId(id)
      goTo(3)
    } catch (e) {
      setSubmitError(
        (e instanceof Error ? e.message : 'Something went wrong') +
          ' — your payment is safe. Tap retry to finish creating your report.',
      )
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePaid(paymentId: string) {
    if (!session || !property) return
    const pending: PaidPendingSubmit = {
      paymentId,
      property,
      email: session.user.email || '',
      savedAt: Date.now(),
    }
    try {
      sessionStorage.setItem(STORAGE_KEYS.PAID_PENDING_SUBMIT, JSON.stringify(pending))
    } catch { /* quota/private-mode — continue anyway */ }
    await runSubmit(paymentId, property, session)
  }

  function handleRetrySubmit() {
    const pending = loadPendingSubmit()
    if (!pending || !session) return
    setProperty(pending.property)
    runSubmit(pending.paymentId, pending.property, session)
  }

  // Recover from a crash/refresh between payment success and request creation.
  // If sessionStorage has a paid-but-unsubmitted entry and we have a session, auto-retry.
  useEffect(() => {
    if (!session) return
    const pending = loadPendingSubmit()
    if (!pending) return
    // If we already ended up on the tracking step with a requestId, the submit finished — clean up.
    if (requestId) { clearPendingSubmit(); return }
    // Don't auto-fire if a submit is already in progress
    if (submitting) return
    setProperty(pending.property)
    runSubmit(pending.paymentId, pending.property, session)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session])

  function handleExit() {
    router.push('/')
  }

  function handleTrackingDone() {
    if (requestId) router.push(`/clearance/track/${requestId}`)
  }

  return (
    <div className="ob-root">
      <Chrome onExit={handleExit} step={stepperIndex}/>
      <div className="ob-stage">
        {submitError && (
          <div style={{ padding: '16px 64px' }}>
            <div className="ob-error" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <span>{submitError}</span>
              {loadPendingSubmit() && (
                <button
                  onClick={handleRetrySubmit}
                  disabled={submitting || !session}
                  className="ob-btn ob-btn-primary"
                  style={{ flexShrink: 0 }}
                >
                  {submitting ? 'Retrying…' : 'Retry'}
                </button>
              )}
            </div>
          </div>
        )}

        {activeStep === 0 && (
          <StepAccount
            onSignedIn={(s) => { setSession(s); goTo(1) }}
          />
        )}
        {activeStep === 1 && session && (
          <StepProperty
            initial={property || undefined}
            prefilledName={(session.user.user_metadata?.full_name as string) || null}
            urlParams={{
              surveyNo: params.get('surveyNo') || undefined,
              district: params.get('district') || undefined,
              taluk: params.get('taluk') || undefined,
              village: params.get('village') || undefined,
            }}
            onNext={(data, preview) => { setProperty(data); setGeoPreview(preview || null); goTo(2) }}
            onBack={() => goTo(0)}
          />
        )}
        {activeStep === 1 && !session && (
          <StepAccount
            onSignedIn={(s) => { setSession(s) }}
          />
        )}
        {activeStep === 2 && session && property && (
          <StepPay
            property={property}
            geoPreview={geoPreview}
            session={session}
            onPaid={handlePaid}
            onBack={() => goTo(1)}
          />
        )}
        {activeStep === 2 && (!session || !property) && (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ color: '#7A8FAD', marginBottom: 20 }}>Please complete the previous steps first.</p>
            <button className="ob-btn ob-btn-primary" onClick={() => goTo(session ? 1 : 0)}>Go back</button>
          </div>
        )}
        {activeStep === 3 && requestId && (
          <StepTracking
            requestId={requestId}
            property={property}
            userEmail={session?.user?.email}
            onDone={handleTrackingDone}
          />
        )}
        {activeStep === 3 && !requestId && (
          <div style={{ padding: 64, textAlign: 'center' }}>
            <p style={{ color: '#7A8FAD', marginBottom: 20 }}>No active request yet.</p>
            <button className="ob-btn ob-btn-primary" onClick={() => goTo(0)}>Start onboarding</button>
          </div>
        )}

        {submitting && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(244,247,252,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 32, height: 32, border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite', margin: '0 auto' }}/>
              <p style={{ fontSize: 13, color: '#7A8FAD', marginTop: 16 }}>Creating your request...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div className="ob-root" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ width: 32, height: 32, border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite' }}/>
      </div>
    }>
      <OnboardingInner/>
    </Suspense>
  )
}
