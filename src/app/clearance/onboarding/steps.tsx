'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEYS, TN_DISTRICTS, EMAIL_REGEX, PHONE_REGEX, CLEARANCE_PRICE_PAISE } from '@/lib/constants'
import { OBIcon, Coach, GoogleLogo } from './shared'

// ═══════════════════════════════════════════════════════
// STEP 0 — Account (Google + Email OTP)
// ═══════════════════════════════════════════════════════

export function StepAccount({ onSignedIn }: { onSignedIn: (session: Session) => void }) {
  const [phase, setPhase] = useState<'email' | 'otp'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState('')
  const [resendIn, setResendIn] = useState(0)
  const otpRefs = useRef<(HTMLInputElement | null)[]>([])

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn(s => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  async function handleGoogleSignIn() {
    setGoogleLoading(true)
    setError('')
    sessionStorage.setItem(STORAGE_KEYS.OAUTH_NEXT, '/clearance/onboarding?step=1')
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/clearance/onboarding` },
    })
    if (err) {
      setError('Google sign-in failed. Please try again.')
      setGoogleLoading(false)
    }
  }

  async function handleSendOtp() {
    const trimmed = email.trim()
    if (!EMAIL_REGEX.test(trimmed)) {
      setError('Please enter a valid email address')
      return
    }
    setLoading(true)
    setError('')
    const { error: err } = await supabase.auth.signInWithOtp({
      email: trimmed,
      options: { shouldCreateUser: true },
    })
    setLoading(false)
    if (err) { setError('We couldn’t send the code. Please try again.'); return }
    setPhase('otp')
    setResendIn(42)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  async function handleResend() {
    if (resendIn > 0) return
    setError('')
    setOtp(['', '', '', '', '', ''])
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    if (err) { setError('Couldn’t resend the code. Please try again.'); return }
    setResendIn(42)
    setTimeout(() => otpRefs.current[0]?.focus(), 100)
  }

  async function handleVerify(token: string) {
    if (token.length < 6) return
    setLoading(true)
    setError('')
    const { data, error: err } = await supabase.auth.verifyOtp({
      email: email.trim(), token, type: 'email',
    })
    if (err || !data.session) {
      setLoading(false)
      setError('That code didn’t work. Check your email or resend.')
      return
    }
    onSignedIn(data.session)
  }

  function handleOtpChange(i: number, v: string) {
    if (!/^\d?$/.test(v)) return
    const next = [...otp]; next[i] = v; setOtp(next)
    if (v && i < 5) otpRefs.current[i+1]?.focus()
    const joined = next.join('')
    if (joined.length === 6) handleVerify(joined)
  }

  function handleOtpKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !otp[i] && i > 0) otpRefs.current[i-1]?.focus()
  }

  const emailValid = EMAIL_REGEX.test(email.trim())

  return (
    <div className="ob-panel">
      <div className="ob-panel-left ob-fade-in">
        <h1 className="ob-h1">
          {phase === 'email' ? (
            <><span>You check first.</span><br/><span className="light">Most buyers don&apos;t.</span></>
          ) : (
            <><span>Enter the code.</span><br/><span className="light">6 digits, 60 seconds.</span></>
          )}
        </h1>
        <p className="ob-sub">
          {phase === 'email'
            ? 'Sign in to continue. Your report is delivered over WhatsApp and email — no passwords to remember.'
            : <>We sent a 6-digit code to <b style={{ color: '#0C1525' }}>{email}</b>. It expires in 60 seconds.</>}
        </p>

        {error && <div className="ob-error">{error}</div>}

        {phase === 'email' && (
          <>
            <button className="ob-google-btn" onClick={handleGoogleSignIn} disabled={googleLoading || loading}>
              {googleLoading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(201,168,76,0.25)', borderTopColor: '#C9A84C', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite' }}/> Redirecting to Google...</>
              ) : (
                <><GoogleLogo/> Continue with Google</>
              )}
            </button>
            <div className="ob-divider">or continue with email</div>

            <div className="ob-field">
              <label className="ob-label">Email Address</label>
              <input
                type="email"
                className="ob-input"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError('') }}
                onKeyDown={(e) => { if (e.key === 'Enter' && emailValid) handleSendOtp() }}
              />
              <div className="ob-hint"><OBIcon name="lock" size={12}/> We never share your email. Used only for report delivery.</div>
            </div>
            <button className="ob-btn ob-btn-primary ob-btn-block" disabled={!emailValid || loading} onClick={handleSendOtp}>
              {loading ? (
                <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite' }}/> Sending code...</>
              ) : (
                <>Send code <OBIcon name="arrow" size={16} stroke={2}/></>
              )}
            </button>
            <div className="ob-legal">
              By continuing you agree to our <a href="/terms">Terms</a> and <a href="/privacy">Privacy Policy</a>.
              GST inclusive · Delivered in under 3 hours.
            </div>
          </>
        )}

        {phase === 'otp' && (
          <>
            <div className="ob-field">
              <label className="ob-label">Verification code</label>
              <div className="ob-otp">
                {otp.map((v, i) => (
                  <input key={i} ref={el => { otpRefs.current[i] = el }}
                    className={v ? 'filled' : ''}
                    value={v} maxLength={1} inputMode="numeric"
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <div className="ob-hint">
                <span>Didn&apos;t get the code?</span>
                <button
                  onClick={handleResend}
                  disabled={resendIn > 0}
                  style={{
                    background: 'transparent', border: 'none', padding: 0, marginLeft: 4,
                    color: resendIn > 0 ? '#7A8FAD' : '#1B4FD8',
                    cursor: resendIn > 0 ? 'not-allowed' : 'pointer',
                    fontFamily: 'inherit', fontSize: 12,
                  }}
                >
                  {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                </button>
              </div>
            </div>
            <div className="ob-footer-row">
              <button className="ob-btn ob-btn-ghost" onClick={() => { setPhase('email'); setOtp(['','','','','','']); setError('') }}>
                <OBIcon name="back" size={16}/> Change email
              </button>
              <button
                className="ob-btn ob-btn-primary"
                style={{ flex: 1 }}
                disabled={otp.join('').length < 6 || loading}
                onClick={() => handleVerify(otp.join(''))}
              >
                {loading ? 'Verifying...' : <>Verify &amp; continue <OBIcon name="arrow" size={16} stroke={2}/></>}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="ob-panel-right">
        <div className="ob-trust">
          <div className="ob-trust-label">Why we ask</div>
          <h3>One sign-in. <span className="light">One report. Delivered where you&apos;ll actually read it.</span></h3>
          <p style={{ fontSize: 14, color: '#3D5278', marginTop: 14, lineHeight: 1.55, fontWeight: 300 }}>
            Your report lands as a PDF link on email and WhatsApp. No app install, no login trails with the registrar.
          </p>
          <div className="ob-stat-row">
            <div className="ob-stat"><div className="ob-stat-num">10+</div><div className="ob-stat-lab">Gov records cross-checked</div></div>
            <div className="ob-stat"><div className="ob-stat-num">&lt;3<span style={{ fontSize: 16, fontWeight: 500 }}>hr</span></div><div className="ob-stat-lab">Delivery time, guaranteed</div></div>
            <div className="ob-stat"><div className="ob-stat-num">₹3,599</div><div className="ob-stat-lab">Flat fee, all in</div></div>
          </div>
          <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, color: '#7A8FAD', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            <OBIcon name="shield" size={14} style={{ color: '#059669' }}/>
            256-bit encrypted · Data retained 30 days
          </div>
        </div>

        {phase === 'otp' && (
          <Coach label="Tip" top={64} left={70}>
            Code usually arrives in ~8 seconds. If it doesn&apos;t, tap <b>Resend</b> — we&apos;ll route via a different gateway.
          </Coach>
        )}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 1 — Property (guided form + patta illustration)
// ═══════════════════════════════════════════════════════

export interface PropertyData {
  district: string
  taluk: string
  village: string
  surveyNo: string
  applicantName: string
  phone: string
}

export interface GeoPreview {
  isFmb?: number
  ulpin?: string
  ruralUrban?: 'rural' | 'urban'
  centroid?: string
}

type GeoPhase = 'idle' | 'locating' | 'fetching' | 'found' | 'error'

export function StepProperty({
  initial,
  prefilledName,
  urlParams,
  onNext,
  onBack,
}: {
  initial?: Partial<PropertyData>
  prefilledName?: string | null
  urlParams?: { surveyNo?: string; district?: string; taluk?: string; village?: string }
  onNext: (data: PropertyData, geoPreview?: GeoPreview) => void
  onBack: () => void
}) {
  const [geoPreview, setGeoPreview] = useState<GeoPreview | null>(null)
  const [data, setData] = useState<PropertyData>({
    district: initial?.district || urlParams?.district || 'Thoothukudi',
    taluk: initial?.taluk || urlParams?.taluk || '',
    village: initial?.village || urlParams?.village || '',
    surveyNo: initial?.surveyNo || urlParams?.surveyNo || '',
    applicantName: initial?.applicantName || prefilledName || '',
    phone: initial?.phone || '',
  })
  const [showCoach, setShowCoach] = useState(true)
  const [flashField, setFlashField] = useState<string | null>(null)
  const [autoFilled, setAutoFilled] = useState<Set<string>>(new Set())
  const [geoPhase, setGeoPhase] = useState<GeoPhase>('idle')
  const [geoLoading, setGeoLoading] = useState(false)

  const set = <K extends keyof PropertyData>(k: K, v: PropertyData[K]) => {
    setData(d => ({ ...d, [k]: v }))
    // User edited — remove auto-fill highlight
    setAutoFilled(prev => {
      if (!prev.has(k as string)) return prev
      const next = new Set(prev)
      next.delete(k as string)
      return next
    })
  }

  // Magic-fill from Risk Check URL params (one-time on mount)
  useEffect(() => {
    if (!urlParams || (!urlParams.surveyNo && !urlParams.district && !urlParams.taluk && !urlParams.village)) return
    const filled = new Set<string>()
    const stagger = (field: keyof PropertyData, value: string | undefined, delay: number) => {
      if (!value) return
      filled.add(field)
      setTimeout(() => {
        setData(d => ({ ...d, [field]: value }))
        setFlashField(field)
        setTimeout(() => setFlashField(null), 1200)
      }, delay)
    }
    stagger('surveyNo', urlParams.surveyNo, 500)
    stagger('district', urlParams.district, 1200)
    stagger('taluk', urlParams.taluk, 1900)
    stagger('village', urlParams.village, 2600)
    setTimeout(() => setAutoFilled(new Set(filled)), 500)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleUseLocation() {
    if (!navigator.geolocation) return
    setGeoLoading(true)
    setGeoPhase('locating')

    try {
      const perm = await navigator.permissions.query({ name: 'geolocation' })
      if (perm.state === 'denied') {
        setGeoLoading(false)
        setGeoPhase('error')
        return
      }
    } catch { /* permissions API not supported — proceed */ }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          setGeoPhase('fetching')
          const resp = await fetch('/api/tngis/lookup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
            signal: AbortSignal.timeout(15000),
          })
          if (!resp.ok) { setGeoPhase('error'); setGeoLoading(false); return }
          const sData = await resp.json()
          const ld = sData.land_details?.data
          const land = Array.isArray(ld) ? ld[0] : ld
          if (!land) { setGeoPhase('error'); setGeoLoading(false); return }

          const survey = (land.survey_number || '') + (land.sub_division ? `/${land.sub_division}` : '')
          const districtName = land.district_name || ''
          const talukName = land.taluk_name || ''
          const villageName = land.village_name || land.revenue_town_name || land.revenue_ward_name || ''

          setGeoPhase('found')
          setGeoPreview({
            isFmb: land.is_fmb,
            ulpin: land.ulpin,
            ruralUrban: land.rural_urban,
            centroid: land.centroid,
          })
          const filled = new Set<string>()
          const stagger = (field: keyof PropertyData, value: string, delay: number) => {
            if (!value) return
            filled.add(field)
            setTimeout(() => {
              setData(d => ({ ...d, [field]: value }))
              setFlashField(field)
              setTimeout(() => setFlashField(null), 1200)
            }, delay)
          }
          stagger('surveyNo', survey, 300)
          stagger('district', districtName, 800)
          stagger('taluk', talukName, 1300)
          stagger('village', villageName, 1800)
          setTimeout(() => setAutoFilled(new Set(filled)), 300)
        } catch { setGeoPhase('error') }
        finally { setGeoLoading(false) }
      },
      () => { setGeoPhase('error'); setGeoLoading(false) },
      { enableHighAccuracy: true, timeout: 15000 },
    )
  }

  const canContinue =
    data.district.trim() &&
    data.taluk.trim() &&
    data.village.trim() &&
    data.surveyNo.trim().length >= 2 &&
    data.applicantName.trim() &&
    PHONE_REGEX.test(data.phone.replace(/\s/g, ''))

  const fieldClass = (name: keyof PropertyData, base: string) => {
    const classes = [base]
    if (flashField === name) classes.push('ob-field-flash')
    if (autoFilled.has(name)) classes.push('pulled')
    return classes.join(' ')
  }

  return (
    <div className="ob-panel">
      <div className="ob-panel-left ob-fade-in">
        <h1 className="ob-h1">Where is the land? <span className="light">Tell us where to look.</span></h1>
        <p className="ob-sub">District, taluk, village, and the survey number from your patta. We&apos;ll show you exactly where to find it.</p>

        <button
          type="button"
          className="ob-geo-btn"
          onClick={handleUseLocation}
          disabled={geoLoading}
        >
          {geoPhase === 'locating' || geoPhase === 'fetching'
            ? (<><span style={{ width: 12, height: 12, border: '2px solid rgba(27,79,216,0.3)', borderTopColor: '#1B4FD8', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite' }}/>{geoPhase === 'locating' ? 'Getting your location...' : 'Pulling property records...'}</>)
            : (<><OBIcon name="mappin" size={13} stroke={2}/>Use my location to auto-fill</>)}
        </button>
        {geoPhase === 'error' && (
          <div className="ob-geo-status error">Couldn&apos;t locate your property. Please fill the form manually.</div>
        )}
        {geoPhase === 'found' && (
          <div className="ob-geo-status">
            <OBIcon name="sparkle" size={13} stroke={2} style={{ color: '#1B4FD8' }}/>
            Found your property — fields auto-filled below.
          </div>
        )}

        <div className="ob-field">
          <label className="ob-label">District</label>
          <select className={fieldClass('district', 'ob-select')} value={data.district} onChange={e => set('district', e.target.value)}>
            {TN_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="ob-field" style={{ marginBottom: 0 }}>
            <label className="ob-label">Taluk</label>
            <input className={fieldClass('taluk', 'ob-input')} placeholder="e.g. Kovilpatti" value={data.taluk} onChange={e => set('taluk', e.target.value)}/>
          </div>
          <div className="ob-field" style={{ marginBottom: 0 }}>
            <label className="ob-label">Village</label>
            <input className={fieldClass('village', 'ob-input')} placeholder="Village name" value={data.village} onChange={e => set('village', e.target.value)}/>
          </div>
        </div>

        <div className="ob-field" style={{ marginTop: 10 }}>
          <label className="ob-label">Survey Number</label>
          <input className={fieldClass('surveyNo', 'ob-input')} placeholder="e.g. 205/2" value={data.surveyNo} onChange={e => set('surveyNo', e.target.value)}/>
          <div className="ob-hint"><OBIcon name="document" size={12}/> Find this on your patta — in the first column of the land table.</div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="ob-field" style={{ marginBottom: 0 }}>
            <label className="ob-label">Your Name</label>
            <input className="ob-input" placeholder="Full name" value={data.applicantName} onChange={e => set('applicantName', e.target.value)}/>
          </div>
          <div className="ob-field" style={{ marginBottom: 0 }}>
            <label className="ob-label">Phone</label>
            <div className="ob-phone-row">
              <div className="ob-phone-prefix">+91</div>
              <input
                className="ob-input"
                placeholder="98765 43210"
                value={data.phone}
                maxLength={10}
                onChange={e => set('phone', e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>
        </div>

        <div className="ob-footer-row">
          <button className="ob-btn ob-btn-ghost" onClick={onBack}><OBIcon name="back" size={16}/> Back</button>
          <button className="ob-btn ob-btn-primary" style={{ flex: 1 }} disabled={!canContinue} onClick={() => onNext(data, geoPreview || undefined)}>
            Scan this parcel <OBIcon name="arrow" size={16} stroke={2}/>
          </button>
        </div>
      </div>

      <div className="ob-panel-right">
        <div className="ob-trust" style={{ position: 'relative' }}>
          <div className="ob-trust-label">Where to find your survey number</div>
          <h3>Check your patta. <span className="light">First column of the land table.</span></h3>

          {/* Patta replica */}
          <div style={{ marginTop: 14, background: PAPER_BG, border: '1px solid #CBD5E8', padding: '14px 18px', position: 'relative', fontFamily: 'var(--font-jetbrains), ui-monospace, Menlo, monospace' }}>
            {/* Centered masthead */}
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <svg width="36" height="36" viewBox="0 0 48 48" style={{ display: 'block', margin: '0 auto 6px', color: '#3D5278' }}>
                <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M 18 14 Q 18 10 21 9 Q 24 8 24 11 Q 24 8 27 9 Q 30 10 30 14"/>
                  <circle cx="21" cy="12" r="0.8" fill="currentColor"/>
                  <circle cx="27" cy="12" r="0.8" fill="currentColor"/>
                  <path d="M 16 16 Q 17 14 19 14 M 32 16 Q 31 14 29 14 M 22 15 Q 24 13 26 15"/>
                  <line x1="14" y1="18" x2="34" y2="18"/>
                  <circle cx="24" cy="24" r="5"/>
                  <line x1="24" y1="19" x2="24" y2="29"/>
                  <line x1="19" y1="24" x2="29" y2="24"/>
                  <line x1="20.5" y1="20.5" x2="27.5" y2="27.5"/>
                  <line x1="27.5" y1="20.5" x2="20.5" y2="27.5"/>
                  <path d="M 14 26 Q 16 25 17 27 L 17 29 L 15 29 Z"/>
                  <path d="M 34 26 Q 32 25 31 27 L 31 29 L 33 29 Z"/>
                  <path d="M 16 32 Q 24 29 32 32"/>
                  <path d="M 14 34 Q 18 32 22 34 Q 26 32 30 34 Q 32 33 34 34"/>
                  <path d="M 12 38 L 36 38"/>
                </g>
              </svg>
              <div style={{ fontSize: 9, letterSpacing: '0.12em', color: '#3D5278', fontWeight: 500 }}>GOVERNMENT OF TAMIL NADU</div>
              <div style={{ fontSize: 9, letterSpacing: '0.08em', color: '#7A8FAD', marginTop: 2 }}>Revenue &amp; Disaster Management Dept.</div>
              <div style={{ fontSize: 10, color: '#0C1525', marginTop: 4, fontWeight: 500 }}>Land Ownership Details : Survey No. 10(1)</div>
            </div>

            {/* Meta row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#3D5278', marginBottom: 4 }}>
              <span>District : {data.district || 'Thoothukudi'}</span>
              <span>Taluk : {data.taluk || 'Kovilpatti'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#3D5278', marginBottom: 12 }}>
              <span>Village : {data.village || 'Kovilpatti'}</span>
              <span>Patta No : <span style={{ color: '#0C1525' }}>366</span></span>
            </div>

            {/* Table */}
            <div style={{ border: '1px solid #7A8FAD', fontSize: 8.5 }}>
              {/* Header */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.4fr 1.4fr 1fr', borderBottom: '1px solid #7A8FAD', background: 'rgba(12,21,37,0.03)' }}>
                {['Survey No.', 'Sub-div.', 'Punjai', 'Nanjai', 'Extent'].map((h, i) => (
                  <div key={h} style={{ padding: '6px', borderRight: i < 4 ? '1px solid #7A8FAD' : 0, color: '#0C1525', fontWeight: 600, textAlign: 'center', letterSpacing: '0.04em' }}>{h}</div>
                ))}
              </div>
              {/* Highlighted row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.4fr 1.4fr 1fr' }}>
                <div style={{ padding: '10px 6px', borderRight: '1px solid #7A8FAD', textAlign: 'center', position: 'relative', background: 'rgba(27,79,216,0.08)', boxShadow: 'inset 0 0 0 2px #1B4FD8', color: '#1B4FD8', fontWeight: 700, fontSize: 11 }}>
                  {data.surveyNo || '205/2'}
                </div>
                <div style={{ padding: '10px 6px', borderRight: '1px solid #7A8FAD', textAlign: 'center', color: '#3D5278' }}>8</div>
                <div style={{ padding: '10px 6px', borderRight: '1px solid #7A8FAD', textAlign: 'center', color: '#3D5278' }}>0-19.50</div>
                <div style={{ padding: '10px 6px', borderRight: '1px solid #7A8FAD', textAlign: 'center', color: '#7A8FAD' }}>—</div>
                <div style={{ padding: '10px 6px', textAlign: 'center', color: '#3D5278' }}>1.08</div>
              </div>
              {/* Empty row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1.4fr 1.4fr 1fr', borderTop: '1px solid #7A8FAD', opacity: 0.5 }}>
                {[0,1,2,3,4].map(i => (
                  <div key={i} style={{ padding: '8px 6px', borderRight: i < 4 ? '1px solid #7A8FAD' : 0, textAlign: 'center', color: '#7A8FAD' }}>—</div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 10, fontSize: 8, color: '#7A8FAD', textAlign: 'center', fontFamily: 'var(--font-dm), system-ui, sans-serif' }}>
              Digitally signed · Tahsildar · eservices.tn.gov.in
            </div>
          </div>

          {/* WhatsApp fallback card */}
          <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'flex-start', marginTop: 14, padding: 14, background: '#FFFFFF', border: '1px solid #CBD5E8' }}>
            <div style={{ width: 36, height: 36, background: '#25D366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, borderRadius: 999 }}>
              <svg width="20" height="20" viewBox="0 0 32 32" fill="currentColor" aria-label="WhatsApp">
                <path d="M16.004 3C8.82 3 3 8.82 3 16c0 2.29.6 4.52 1.74 6.49L3 29l6.68-1.75A12.94 12.94 0 0 0 16.004 29C23.18 29 29 23.18 29 16S23.18 3 16.004 3zm0 23.6a10.55 10.55 0 0 1-5.38-1.47l-.39-.23-3.97 1.04 1.06-3.87-.25-.4A10.58 10.58 0 0 1 5.4 16c0-5.85 4.76-10.6 10.6-10.6S26.6 10.15 26.6 16s-4.76 10.6-10.6 10.6zm5.82-7.93c-.32-.16-1.88-.93-2.17-1.03-.29-.11-.5-.16-.71.16-.21.32-.82 1.03-1 1.25-.18.21-.37.24-.69.08-.32-.16-1.34-.49-2.56-1.57-.95-.84-1.59-1.88-1.77-2.2-.18-.32-.02-.5.14-.66.14-.14.32-.37.48-.55.16-.18.21-.32.32-.53.11-.21.05-.4-.03-.55-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.54-.71-.55h-.61c-.21 0-.55.08-.84.4-.29.32-1.1 1.08-1.1 2.63s1.13 3.05 1.29 3.26c.16.21 2.22 3.39 5.38 4.76.75.32 1.34.51 1.79.66.75.24 1.43.21 1.97.13.6-.09 1.88-.77 2.15-1.51.27-.74.27-1.38.19-1.51-.08-.13-.29-.21-.61-.37z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0C1525', marginBottom: 2 }}>Can&apos;t find it? WhatsApp us.</div>
              <div style={{ fontSize: 13, color: '#3D5278', fontWeight: 300, lineHeight: 1.5 }}>
                Send a photo of your patta to <a href="https://wa.me/918122642341" target="_blank" rel="noopener noreferrer" style={{ color: '#1B4FD8' }}>+91 81226 42341</a> — we&apos;ll fill this form for you. Free.
              </div>
            </div>
          </div>

          {showCoach && (
            <div style={{ position: 'absolute', top: 14, right: 14, maxWidth: 240, background: '#0D1B2A', color: '#fff', padding: '12px 14px', paddingRight: 34, fontSize: 12, lineHeight: 1.5, fontWeight: 300, boxShadow: '0 8px 24px rgba(12,21,37,0.2)' }}>
              <div style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C9A84C', fontWeight: 600, marginBottom: 6 }}>Don&apos;t worry</div>
              Type it how you see it. We verify every detail before charging you.
              <button onClick={() => setShowCoach(false)} style={{ position: 'absolute', top: 8, right: 8, background: 'transparent', border: 0, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
                <OBIcon name="close" size={12} stroke={2}/>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 2 — Pay (with pre-scan findings) — Razorpay
// ═══════════════════════════════════════════════════════

interface ScanItem {
  key: string
  label: string
  detail: string
  status: 'pending' | 'locked'
}

const MONO = 'var(--font-jetbrains), ui-monospace, "SF Mono", Menlo, monospace'
const INK = '#0C1525'
const RULE = '#7A8FAD'
const MUTED = '#3D5278'

// Subtle paper-grain noise, layered over cream. Warm-brown tint at ~9% alpha.
const PAPER_TEXTURE = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.35  0 0 0 0 0.27  0 0 0 0 0.17  0 0 0 0.09 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")"
const PAPER_BG = `${PAPER_TEXTURE} repeat, #FDFDFB`

function BillRow({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, padding: '6px 0', fontFamily: MONO, fontSize: 11.5, color: bold ? INK : MUTED, fontWeight: bold ? 600 : 400 }}>
      <span>{label}</span>
      <span style={{ flex: 1, borderBottom: '1px dotted #CBD5E8', transform: 'translateY(-3px)' }}/>
      <span style={{ color: INK, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

function BillSummary({ property }: { property: PropertyData }) {
  const parcelLabel = `${property.surveyNo || '—'} · ${property.village || '—'}`

  return (
    <div style={{
      background: PAPER_BG,
      border: `1px solid ${RULE}`,
      padding: '22px 26px',
      fontFamily: MONO,
      color: INK,
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.22em', color: MUTED, fontWeight: 600, textAlign: 'center', paddingBottom: 12, marginBottom: 14, borderBottom: `1px dashed ${RULE}` }}>
        ORDER SUMMARY
      </div>

      <BillRow label="Land Clearance Report" value="₹ 3,049.15"/>
      <BillRow label="GST @ 18%" value="₹ 549.85"/>

      <div style={{ fontSize: 10, color: MUTED, padding: '6px 0', fontFamily: MONO }}>
        Parcel {parcelLabel}
      </div>

      <div style={{ borderTop: `1px solid ${INK}`, marginTop: 10, paddingTop: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontFamily: MONO, fontWeight: 700 }}>
          <span style={{ fontSize: 10, letterSpacing: '0.16em', color: INK }}>TOTAL PAYABLE</span>
          <span style={{ flex: 1, borderBottom: '1px dotted #CBD5E8', transform: 'translateY(-3px)' }}/>
          <span style={{ fontSize: 20, color: INK }}>₹ 3,599</span>
        </div>
      </div>

      <div style={{ marginTop: 14, fontSize: 10.5, color: MUTED, textAlign: 'center', lineHeight: 1.6, fontFamily: MONO }}>
        GST inclusive · Delivered &lt; 3 hours
        <br/>
        100% refund if we miss the window
      </div>

      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px dashed ${RULE}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'var(--font-dm), system-ui, sans-serif' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: INK, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <OBIcon name="shield" size={12} stroke={2} style={{ color: '#059669' }}/>
          Razorpay secured
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, color: INK, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          <OBIcon name="clock" size={12} stroke={2} style={{ color: '#C9A84C' }}/>
          Avg 2h 14m
        </span>
      </div>
    </div>
  )
}

export function StepPay({
  property,
  geoPreview,
  session,
  onPaid,
  onBack,
}: {
  property: PropertyData
  geoPreview?: GeoPreview | null
  session: Session
  onPaid: (paymentId: string) => void
  onBack: () => void
}) {
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  const scanItems: ScanItem[] = [
    { key: 'patta', label: 'Patta Chitta record',     detail: `Village: ${property.village || '—'}`, status: 'pending' },
    { key: 'fmb',   label: 'FMB sketch availability', detail: geoPreview?.isFmb === 1 ? 'Sketch on file · ready to pull' : 'Checking sketch registry', status: 'pending' },
    { key: 'ulpin', label: 'ULPIN / parcel ID',       detail: geoPreview?.ulpin ? geoPreview.ulpin : 'Cross-matching to survey no.', status: 'pending' },
    { key: 'zone',  label: 'Land classification',     detail: geoPreview?.ruralUrban ? (geoPreview.ruralUrban === 'urban' ? 'Urban parcel' : 'Rural parcel') : 'Rural / urban lookup', status: 'pending' },
    { key: 'ec',    label: 'Encumbrance certificate', detail: 'Last 15 years · pending deep scan', status: 'locked' },
    { key: 'title', label: 'Title chain verification', detail: 'Origin → present · pending deep scan', status: 'locked' },
    { key: 'zoning',label: 'Master plan & zoning',    detail: 'Overlay check · pending deep scan', status: 'locked' },
  ]
  const unlockableCount = scanItems.filter(i => i.status === 'pending').length

  const [revealed, setRevealed] = useState(0)
  const [scanDone, setScanDone] = useState(false)

  useEffect(() => {
    if (revealed < unlockableCount) {
      const t = setTimeout(() => setRevealed(r => r + 1), 700)
      return () => clearTimeout(t)
    }
    const t = setTimeout(() => setScanDone(true), 400)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed])

  function renderStatus(item: ScanItem, idx: number) {
    if (item.status === 'locked') {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 10, letterSpacing: '0.1em', color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase' }}>
        <OBIcon name="lock" size={12} stroke={2}/>Locked
      </span>
    }
    if (idx >= revealed) {
      return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#7A8FAD' }}>
        <span style={{ width: 10, height: 10, border: '2px solid rgba(27,79,216,0.25)', borderTopColor: '#1B4FD8', borderRadius: '50%', animation: 'obSpin 0.7s linear infinite' }}/>
        Scanning
      </span>
    }
    return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#059669', fontWeight: 600 }}>
      <OBIcon name="check" size={13} stroke={2.4}/>Found
    </span>
  }

  // Load Razorpay checkout script
  useEffect(() => {
    if (document.getElementById('razorpay-checkout-js')) return
    const s = document.createElement('script')
    s.id = 'razorpay-checkout-js'
    s.src = 'https://checkout.razorpay.com/v1/checkout.js'
    document.body.appendChild(s)
  }, [])

  async function handlePay() {
    setProcessing(true)
    setError('')
    try {
      const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID
      if (!rzpKey) throw new Error('Payment is temporarily unavailable. Please try again shortly.')

      const orderRes = await fetch('/api/razorpay/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: session.user.email,
          phone: property.phone,
          name: property.applicantName,
          amount: CLEARANCE_PRICE_PAISE,
        }),
      })
      if (!orderRes.ok) throw new Error('Payment setup failed')
      const { orderId } = await orderRes.json()

      const rzp = new window.Razorpay({
        key: rzpKey,
        amount: CLEARANCE_PRICE_PAISE,
        currency: 'INR',
        name: 'HataD',
        description: 'Land Clearance Report',
        order_id: orderId,
        prefill: {
          email: session.user.email || '',
          contact: property.phone,
          name: property.applicantName,
        },
        theme: { color: '#0D1B2A', backdrop_color: 'rgba(12,21,37,0.6)' },
        handler: async (resp: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verifyRes = await fetch('/api/razorpay/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(resp),
            })
            if (!verifyRes.ok) throw new Error('Payment verification failed')
            const { paymentId } = await verifyRes.json()
            onPaid(paymentId)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Payment confirmation failed')
            setProcessing(false)
          }
        },
        modal: { ondismiss: () => setProcessing(false) },
      })
      rzp.open()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setProcessing(false)
    }
  }

  return (
    <div className="ob-panel">
      <div className="ob-panel-left ob-fade-in">
        <h1 className="ob-h1">
          {scanDone
            ? <>4 records found. <span className="light">3 need a deep check.</span></>
            : <>Pulling your parcel&apos;s <span className="light">public records…</span></>}
        </h1>
        <p className="ob-sub">
          {scanDone
            ? 'The items that usually hide problems — encumbrances, title chain, zoning overlays — unlock with the full verification.'
            : 'This takes a few seconds. We’re checking what’s available before you pay anything.'}
        </p>

        {error && <div className="ob-error">{error}</div>}

        <div style={{ border: '1px solid #CBD5E8', background: '#FFFFFF', marginBottom: 18 }}>
          {scanItems.map((item, i, arr) => (
            <div key={item.key} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, padding: '11px 16px', borderBottom: i < arr.length - 1 ? '1px solid #EBF0F8' : 'none', alignItems: 'center', opacity: item.status === 'locked' || i < revealed ? 1 : 0.55, transition: 'opacity 0.3s' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#0C1525' }}>{item.label}</div>
                <div style={{ fontSize: 11, color: '#7A8FAD', marginTop: 2 }}>{item.detail}</div>
              </div>
              {renderStatus(item, i)}
            </div>
          ))}
        </div>

        {scanDone && (
          <div className="ob-fade-in" style={{ marginBottom: 18, padding: '11px 14px', background: 'rgba(201,168,76,0.1)', borderLeft: '3px solid #C9A84C', fontSize: 12.5, lineHeight: 1.5, color: '#0C1525' }}>
            <b style={{ fontWeight: 600 }}>3 items need a deep scan.</b> <span style={{ color: '#3D5278' }}>These are where fraud hides — cross-references across Sub-Registrar, CMDA, and master plan records.</span>
          </div>
        )}

        <div className="ob-footer-row">
          <button className="ob-btn ob-btn-ghost" onClick={onBack} disabled={processing}>
            <OBIcon name="back" size={16}/> Back
          </button>
          <button className="ob-btn ob-btn-primary" style={{ flex: 1 }} onClick={handlePay} disabled={processing || !scanDone}>
            {processing
              ? <><span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'obSpin 0.8s linear infinite' }}/> Opening payment...</>
              : !scanDone
                ? <>Scanning {revealed}/{unlockableCount}…</>
                : <><OBIcon name="lock" size={15} stroke={2}/> Unlock full report — no charge if late</>}
          </button>
        </div>
      </div>

      <div className="ob-panel-right">
        <div style={{ marginBottom: 16, padding: '14px 16px', background: '#0C1525', color: '#FDFDFB', borderLeft: '3px solid #C9A84C' }}>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#C9A84C', fontWeight: 600, textTransform: 'uppercase', marginBottom: 6 }}>Why this is worth ₹3,599</div>
          <div style={{ fontSize: 13, lineHeight: 1.55, fontWeight: 300 }}>
            Median land fraud loss in Tamil Nadu: <b style={{ fontWeight: 600, color: '#fff' }}>₹14.2 lakh</b>.
            Median legal recovery time: <b style={{ fontWeight: 600, color: '#fff' }}>7 years</b>.
          </div>
        </div>
        <BillSummary property={property}/>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════
// STEP 3 — Verifying / tracking
// ═══════════════════════════════════════════════════════

const VERIFIERS = [
  { name: 'Vishal M.',       initials: 'VM' },
  { name: 'Vikashini S.',    initials: 'VS' },
  { name: 'Adhvik Vithun',   initials: 'AV' },
] as const

export function pickVerifier(seed: string) {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = ((h << 5) - h + seed.charCodeAt(i)) | 0
  return VERIFIERS[Math.abs(h) % VERIFIERS.length]
}

export function StepTracking({ requestId, property, userEmail, onDone }: {
  requestId: string
  property: PropertyData | null
  userEmail?: string | null
  onDone: () => void
}) {
  const shortId = requestId.slice(0, 8).toUpperCase()
  const verifier = useMemo(() => pickVerifier(requestId), [requestId])
  const now = new Date()
  const eta = new Date(now.getTime() + 3 * 60 * 60 * 1000)
  const isSameDay = eta.toDateString() === now.toDateString()
  const etaTime = eta.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
  const etaDate = eta.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
  const etaLabel = isSameDay ? `Today, ${etaTime}` : `${etaDate}, ${etaTime}`

  return (
    <div className="ob-panel ob-panel-centered">
      <div className="ob-panel-left ob-fade-in" style={{ justifyContent: 'center' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div className="ob-success-check" style={{ margin: '0 auto 24px', width: 64, height: 64 }}>
            <OBIcon name="check" size={30} stroke={3}/>
          </div>

          <h1 className="ob-h1" style={{ textWrap: 'balance' }}>
            Payment confirmed.
            <br/>
            <span className="light">We&apos;re on it.</span>
          </h1>

          <p className="ob-sub" style={{ maxWidth: 380, margin: '0 auto 20px' }}>
            Your parcel is being cross-verified against 10+ government record systems. You&apos;ll get an email and WhatsApp when the report is ready — within 3 hours.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: '#FFFFFF', border: '1px solid #CBD5E8', marginBottom: 24, textAlign: 'left' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#0C1525', color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 14, letterSpacing: '0.04em', flexShrink: 0, fontFamily: 'var(--font-jetbrains), ui-monospace, Menlo, monospace' }}>
              {verifier.initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#7A8FAD', letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 500, marginBottom: 2 }}>Your case is with</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#0C1525' }}>{verifier.name}</div>
              <div style={{ fontSize: 11.5, color: '#3D5278', marginTop: 1 }}>End-to-end on your verification, start to delivery.</div>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#059669', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' }}/>Online
            </span>
          </div>

          <button className="ob-btn ob-btn-primary ob-btn-block" onClick={onDone}>
            Go to tracking page <OBIcon name="arrow" size={16} stroke={2}/>
          </button>

          <p className="ob-legal" style={{ marginTop: 16, textAlign: 'center' }}>
            Need help? WhatsApp <a href="https://wa.me/918122642341" target="_blank" rel="noopener noreferrer">+91 81226 42341</a>
            <br/>
            <span style={{ color: '#7A8FAD' }}>We reply within 10 minutes.</span>
          </p>
        </div>
      </div>

      <div className="ob-panel-right" style={{ justifyContent: 'center' }}>
        <div className="ob-summary" style={{ maxWidth: 420, width: '100%' }}>
          <h4>Order summary</h4>

          <div className="ob-summary-row">
            <span className="k">Reference</span>
            <span className="v">HTD-{shortId}</span>
          </div>
          {property && (
            <>
              <div className="ob-summary-row">
                <span className="k">Survey No.</span>
                <span className="v">{property.surveyNo}</span>
              </div>
              <div className="ob-summary-row ob-summary-row-stacked">
                <span className="k">Location</span>
                <span className="v ob-summary-v-text">
                  {[property.village, property.taluk, property.district].filter(Boolean).join(' · ')}
                </span>
              </div>
              <div className="ob-summary-row">
                <span className="k">Applicant</span>
                <span className="v ob-summary-v-text">{property.applicantName}</span>
              </div>
              <div className="ob-summary-row">
                <span className="k">Phone</span>
                <span className="v">+91 {property.phone}</span>
              </div>
            </>
          )}
          {userEmail && (
            <div className="ob-summary-row ob-summary-row-stacked">
              <span className="k">Delivery</span>
              <span className="v ob-summary-v-text">{userEmail}</span>
            </div>
          )}
          <div className="ob-summary-row">
            <span className="k">Expected by</span>
            <span className="v ob-summary-v-text">{etaLabel}</span>
          </div>

          <div className="ob-summary-total">
            <span className="k">Paid</span>
            <span className="v">₹3,599</span>
          </div>
          <div className="ob-summary-foot">Inclusive of GST · 100% refund if delivery misses 3 hours</div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 16, paddingTop: 14, borderTop: '1px solid #CBD5E8' }}>
            <span className="ob-time-badge"><OBIcon name="clock" size={12} stroke={2}/> &lt; 3 HRS</span>
            <span style={{ fontSize: 11, color: '#7A8FAD' }}>Email + WhatsApp notify</span>
          </div>
        </div>
      </div>
    </div>
  )
}
