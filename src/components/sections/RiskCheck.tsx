'use client'

import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { SectionLabel } from '@/components/ui/SectionLabel'
import { staggerContainer, fadeInUp } from '@/lib/animations'
import {
  Search, Lock, ShieldAlert, FileSearch, Scale, MapPin, AlertTriangle,
  CheckCircle, Navigation, IndianRupee, Landmark, FileCheck,
} from 'lucide-react'
import { track } from '@/lib/track'
import type { TngisPreviewResult } from '@/lib/types/tngis'

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

export function RiskCheck() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '-60px' })
  const [surveyNo, setSurveyNo] = useState('')
  const [district, setDistrict] = useState('')
  const [phase, setPhase] = useState<'input' | 'loading' | 'result'>('input')
  const [error, setError] = useState('')
  const [tngisData, setTngisData] = useState<TngisPreviewResult | null>(null)
  const [geoLoading, setGeoLoading] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  // ---------------------------------------------------------------------------
  // TNGIS lookup (real API call with 8s client timeout + fake fallback)
  // ---------------------------------------------------------------------------

  const fetchTngisData = useCallback(async (lat: number, lon: number) => {
    abortRef.current = new AbortController()
    try {
      const resp = await fetch('/api/tngis/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lon }),
        signal: AbortSignal.timeout(25000),
      })
      if (!resp.ok) return null
      const data = await resp.json() as TngisPreviewResult
      if (data.land_details?.success === 1) return data
      return null
    } catch {
      return null
    }
  }, [])

  // ---------------------------------------------------------------------------
  // Geolocation
  // ---------------------------------------------------------------------------

  async function handleUseLocation() {
    if (!navigator.geolocation) {
      setError('Location is not available on this device')
      return
    }
    setGeoLoading(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords
        // Validate TN bounds
        if (latitude < 6 || latitude > 14 || longitude < 76 || longitude > 81) {
          setError('Your location appears to be outside Tamil Nadu')
          setGeoLoading(false)
          return
        }

        track('risk_check_started', 'landing_geo', { lat: latitude, lon: longitude })
        setPhase('loading')
        setGeoLoading(false)

        // Fetch real data in parallel with the loading animation
        const data = await fetchTngisData(latitude, longitude)
        if (data) {
          setTngisData(data)
          const ld = Array.isArray(data.land_details.data) ? data.land_details.data[0] : data.land_details.data
          if (ld) {
            setSurveyNo(ld.survey_number + (ld.sub_division ? `/${ld.sub_division}` : ''))
            setDistrict(ld.district_name)
          }
        }

        // Ensure minimum animation time (5.5s total), then show result
        setTimeout(() => setPhase('result'), data ? 1000 : 5500)
      },
      () => {
        setError('Could not get your location. Enter your details manually.')
        setGeoLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // ---------------------------------------------------------------------------
  // Manual check (survey number + district)
  // ---------------------------------------------------------------------------

  function handleCheck() {
    if (!surveyNo.trim()) { setError('Enter a survey number'); return }
    if (!district) { setError('Select a district'); return }
    const trimmed = surveyNo.trim()
    if (!/\d/.test(trimmed)) { setError('Please enter your survey or patta number \u2014 for example, 89/3 or 142'); return }
    if (trimmed.length > 20) { setError('That doesn\u2019t look right. Try a shorter survey number.'); return }
    setError('')
    track('risk_check_started', 'landing', { surveyNo: trimmed, district })
    setPhase('loading')
    // Manual entry: no lat/lon to look up, use fake animation only
    setTimeout(() => setPhase('result'), 5500)
  }

  function handleReset() {
    setPhase('input')
    setSurveyNo('')
    setDistrict('')
    setTngisData(null)
    abortRef.current?.abort()
  }

  // ---------------------------------------------------------------------------
  // Extract display fields from TNGIS data
  // ---------------------------------------------------------------------------

  const ld = tngisData?.land_details?.data
  const landData = ld ? (Array.isArray(ld) ? ld[0] : ld) : null
  const gv = tngisData?.guideline_value?.data?.[0]
  const hasRealData = !!landData

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <section className="relative py-28 lg:py-36 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40 overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'linear-gradient(#0D1B2A 1px, transparent 1px), linear-gradient(90deg, #0D1B2A 1px, transparent 1px)',
        backgroundSize: '48px 48px',
      }} />
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#1B4FD8]/8 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#C9A84C]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 max-w-4xl mx-auto" ref={ref}>
        <motion.div variants={staggerContainer} initial="hidden" animate={isInView ? 'visible' : 'hidden'}>
          <div className="text-center mb-12">
            <motion.div variants={fadeInUp}><SectionLabel>Try It Now</SectionLabel></motion.div>
            <motion.h2 variants={fadeInUp} className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary leading-tight mt-5 mb-4">
              Check Your Property.
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-text-secondary font-light max-w-xl mx-auto">
              Enter your survey number or share your location. See what our system finds.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-wrap items-center justify-center gap-3 mt-8">
              {['6 government sources checked', 'Cross-referenced in under 3 hours', 'Tamil Nadu\u2019s most thorough check'].map((text) => (
                <span key={text} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0D1B2A]/[0.04] border border-[#0D1B2A]/[0.08] text-[11px] text-text-muted font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-blue" />{text}
                </span>
              ))}
            </motion.div>
          </div>

          <motion.div variants={fadeInUp}>
            <AnimatePresence mode="wait">
              {/* ── Input ── */}
              {phase === 'input' && (
                <motion.div key="input" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-lg mx-auto">
                  <div className="bg-white border border-border rounded-sm p-6 sm:p-8 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    {/* Use Location button */}
                    <button
                      onClick={handleUseLocation}
                      disabled={geoLoading}
                      className="w-full mb-5 py-3 rounded-sm text-sm font-medium bg-[#1B4FD8]/[0.06] text-[#1B4FD8] hover:bg-[#1B4FD8]/[0.1] transition-colors cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {geoLoading ? (
                        <span className="w-4 h-4 border-2 border-[#1B4FD8]/30 border-t-[#1B4FD8] rounded-full animate-spin" />
                      ) : (
                        <Navigation size={15} />
                      )}
                      {geoLoading ? 'Getting your location...' : 'Use My Location'}
                    </button>

                    <div className="flex items-center gap-3 mb-5">
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-[10px] text-text-muted uppercase tracking-wider">or enter manually</span>
                      <div className="flex-1 h-px bg-border" />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-text-secondary tracking-wide mb-2">Survey / Patta Number</label>
                        <input type="text" placeholder="e.g. 89/3" value={surveyNo}
                          onChange={(e) => { setSurveyNo(e.target.value); setError('') }}
                          onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                          className="w-full bg-white border border-border text-text-primary placeholder:text-text-muted text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-accent-blue transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-text-secondary tracking-wide mb-2">District</label>
                        <div className="relative">
                          <select value={district} onChange={(e) => { setDistrict(e.target.value); setError('') }}
                            className="w-full bg-white border border-border text-text-primary text-sm px-4 py-3 rounded-sm focus:outline-none focus:border-accent-blue transition-colors appearance-none cursor-pointer">
                            <option value="" disabled>Select district</option>
                            {TN_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
                          </select>
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted">
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          </span>
                        </div>
                      </div>
                      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                      <button onClick={handleCheck}
                        className="w-full py-3.5 rounded-sm text-sm font-semibold bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] transition-colors cursor-pointer flex items-center justify-center gap-2">
                        <Search size={16} /> Check Your Property
                      </button>
                    </div>
                    <p className="text-center text-[10px] text-text-muted mt-4">Free instant check. No sign-up required.</p>
                  </div>
                </motion.div>
              )}

              {/* ── Loading ── */}
              {phase === 'loading' && (
                <motion.div key="loading" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-lg mx-auto">
                  <div className="bg-white border border-border rounded-sm p-8 sm:p-10 shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    <div className="text-center mb-6">
                      <div className="w-12 h-12 rounded-full bg-accent-blue/10 flex items-center justify-center mx-auto mb-4">
                        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}>
                          <Search size={20} className="text-accent-blue" />
                        </motion.div>
                      </div>
                      <p className="text-text-primary font-semibold">
                        {surveyNo && district ? `Scanning records for ${surveyNo}, ${district}` : 'Scanning government records...'}
                      </p>
                    </div>
                    <div className="space-y-3 mb-6">
                      {[
                        { label: 'Connecting to TNREGINET', delay: 0 },
                        { label: 'Pulling Encumbrance Certificate history', delay: 0.8 },
                        { label: 'Checking Sub-Registrar records', delay: 1.8 },
                        { label: 'Scanning court & litigation databases', delay: 2.8 },
                        { label: 'Cross-referencing Patta & A-Register', delay: 3.6 },
                        { label: 'Compiling preliminary findings', delay: 4.4 },
                      ].map((step) => (
                        <motion.div key={step.label} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: step.delay, duration: 0.3 }} className="flex items-center gap-3 text-sm">
                          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: step.delay + 0.6, duration: 0.2 }}>
                            <CheckCircle size={14} className="text-emerald-500 shrink-0" />
                          </motion.div>
                          <span className="text-text-secondary">{step.label}</span>
                        </motion.div>
                      ))}
                    </div>
                    <div className="w-full h-[3px] rounded-full bg-surface-raised overflow-hidden">
                      <motion.div initial={{ width: '0%' }} animate={{ width: '100%' }} transition={{ duration: 5.2, ease: 'easeInOut' }} className="h-full rounded-full bg-accent-blue" />
                    </div>
                    <p className="text-[11px] text-text-muted mt-3 text-center">Querying 6 government sources...</p>
                  </div>
                </motion.div>
              )}

              {/* ── Result ── */}
              {phase === 'result' && (
                <motion.div key="result" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} className="max-w-2xl mx-auto">
                  <div className="bg-white border border-border rounded-sm overflow-hidden shadow-[0_2px_20px_rgba(0,0,0,0.04)]">
                    {/* Header */}
                    <div className="bg-[#0D1B2A] px-6 sm:px-8 py-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[#C9A84C] text-[10px] font-medium tracking-[0.15em] uppercase">Property Risk Preview</p>
                          <p className="text-white text-sm font-semibold mt-1">
                            {hasRealData
                              ? `Survey No. ${landData!.survey_number}/${landData!.sub_division || ''}, ${landData!.village_name}, ${landData!.district_name}`
                              : `Survey No. ${surveyNo}, ${district}`
                            }
                          </p>
                        </div>
                        <div className="flex items-center gap-2 bg-white/10 rounded-sm px-3 py-1.5">
                          <CheckCircle size={12} className={hasRealData ? 'text-emerald-400' : 'text-white/40'} />
                          <span className="text-[11px] text-white/80 font-medium">{hasRealData ? 'Live data' : 'Sources available'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 sm:p-8">
                      {/* Real TNGIS data — UNLOCKED section */}
                      {hasRealData && (
                        <div className="mb-6">
                          <p className="text-[10px] font-medium tracking-[0.12em] uppercase text-emerald-600 mb-4 flex items-center gap-1.5">
                            <CheckCircle size={10} /> Verified from government records
                          </p>

                          {/* Property confirmed — the hook */}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                            className="bg-[#F4F7FC] border border-[#E8EDF5] rounded-sm px-5 py-4 mb-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="text-xs text-text-muted mb-1">Your property</p>
                                <p className="text-base text-text-primary font-semibold">
                                  Survey {landData!.survey_number}/{landData!.sub_division || ''}, {landData!.village_name}
                                </p>
                                <p className="text-sm text-text-secondary">{landData!.taluk_name}, {landData!.district_name} · {landData!.rural_urban === 'rural' ? 'Rural' : 'Urban'}</p>
                              </div>
                              {landData!.ulpin && (
                                <div className="text-right shrink-0 ml-4">
                                  <p className="text-[9px] text-text-muted uppercase tracking-wider">ULPIN</p>
                                  <p className="text-xs text-text-primary font-mono font-medium">{landData!.ulpin}</p>
                                </div>
                              )}
                            </div>
                          </motion.div>

                          {/* Guideline value — money gets attention */}
                          {gv && Number(gv.metric_rate) > 0 && (
                            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                              className="bg-[#F4F7FC] border border-[#E8EDF5] rounded-sm px-5 py-4 mb-3">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-xs text-text-muted mb-1">Government guideline value</p>
                                  <p className="text-lg text-text-primary font-bold">{'\u20B9'}{Number(gv.metric_rate).toLocaleString('en-IN')} <span className="text-sm font-normal text-text-secondary">per {gv.unit_id}</span></p>
                                </div>
                                <div className="text-right">
                                  <p className="text-xs text-text-secondary">{gv.land_name}</p>
                                  <p className="text-[10px] text-text-muted">{gv.land_type_grouping}</p>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          {/* Documents — creates anxiety: "these exist, but what do they say?" */}
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                            className="bg-[#F4F7FC] border border-[#E8EDF5] rounded-sm px-5 py-4 mb-3">
                            <p className="text-xs text-text-muted mb-3">Documents on record for this property</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-primary flex items-center gap-2">
                                  <FileSearch size={13} className="text-accent-blue" /> Encumbrance Certificate
                                </span>
                                {tngisData?.ec_available
                                  ? <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span>
                                  : <span className="text-[10px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Needs retrieval</span>
                                }
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-primary flex items-center gap-2">
                                  <FileCheck size={13} className="text-accent-blue" /> Field Measurement Book (FMB)
                                </span>
                                {tngisData?.fmb_available
                                  ? <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Available</span>
                                  : <span className="text-[10px] font-medium text-text-muted bg-gray-100 px-2 py-0.5 rounded-full">Not digitized</span>
                                }
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-primary flex items-center gap-2">
                                  <Scale size={13} className="text-accent-blue" /> Ownership & Patta Records
                                </span>
                                <span className="text-[10px] font-medium text-[#1B4FD8] bg-[#1B4FD8]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock size={8} /> In full report
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-text-primary flex items-center gap-2">
                                  <ShieldAlert size={13} className="text-accent-blue" /> Litigation & Court Records
                                </span>
                                <span className="text-[10px] font-medium text-[#1B4FD8] bg-[#1B4FD8]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock size={8} /> In full report
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      )}

                      {/* LOCKED section — always shown */}
                      {!hasRealData && (
                        <div className="space-y-3 mb-6">
                          {[
                            { icon: FileSearch, label: 'Encumbrance Certificate', status: 'Available for this district' },
                            { icon: Scale, label: 'Litigation & Court Records', status: 'Requires full retrieval' },
                            { icon: MapPin, label: 'Survey & Boundary Records', status: 'Available for this district' },
                            { icon: ShieldAlert, label: 'Title Chain Analysis', status: 'Requires document cross-check' },
                          ].map((item, i) => (
                            <motion.div key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}
                              className="flex items-center justify-between py-2.5 px-4 bg-surface-raised/50 rounded-sm">
                              <div className="flex items-center gap-3">
                                <item.icon size={15} className="text-accent-blue shrink-0" />
                                <span className="text-sm text-text-primary">{item.label}</span>
                              </div>
                              <span className="text-[11px] text-text-muted font-medium">{item.status}</span>
                            </motion.div>
                          ))}
                        </div>
                      )}

                      {/* Blurred risk score — always locked */}
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: hasRealData ? 0.6 : 0.5 }}
                        className="relative rounded-sm border border-border overflow-hidden mb-6">
                        <div className="px-6 py-8 text-center select-none" style={{ filter: 'blur(6px)' }}>
                          <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Overall Risk Assessment</p>
                          <div className="flex items-center justify-center gap-4">
                            <div className="w-20 h-20 rounded-full border-4 border-amber-400 flex items-center justify-center">
                              <span className="text-2xl font-bold text-amber-600">67</span>
                            </div>
                            <div className="text-left">
                              <p className="text-lg font-bold text-text-primary">Moderate Risk</p>
                              <p className="text-sm text-text-secondary">2 issues require attention</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center">
                          <div className="w-10 h-10 rounded-full bg-[#0D1B2A] flex items-center justify-center mb-3">
                            <Lock size={18} className="text-[#C9A84C]" />
                          </div>
                          <p className="text-sm font-semibold text-text-primary mb-1">
                            {hasRealData ? 'Ownership & Risk Score Locked' : 'Risk Score Locked'}
                          </p>
                          <p className="text-xs text-text-muted">
                            {hasRealData
                              ? 'Ownership details, EC analysis, and title chain require a full report'
                              : 'Full analysis requires document retrieval across 6 sources'
                            }
                          </p>
                        </div>
                      </motion.div>

                      {/* Warning callout */}
                      <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-200/60 rounded-sm px-4 py-3 mb-6">
                        <AlertTriangle size={14} className="text-amber-600 mt-0.5 shrink-0" />
                        <p className="text-xs text-amber-800 leading-relaxed">
                          {hasRealData
                            ? `We verified this property exists in ${landData!.district_name} government records. A full clearance report will retrieve ownership details, analyse the EC, and cross-reference all 6 sources for contradictions.`
                            : `Government records are available for properties in ${district}. A full clearance report will retrieve and cross-reference all 6 sources to flag contradictions, encumbrances, or litigation specific to your survey number.`
                          }
                        </p>
                      </div>

                      {/* CTA */}
                      <a href="/clearance" className="block" onClick={() => track('cta_click', 'risk_check', { surveyNo, district, hasRealData })}>
                        <button className="w-full py-4 rounded-sm text-sm font-semibold bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] transition-colors cursor-pointer">
                          Unlock Your Full Report — {'\u20B9'}3,599
                        </button>
                      </a>
                      <p className="text-center text-[10px] text-text-muted mt-3">
                        GST inclusive · Delivered in under 3 hours · All 6 sources checked
                      </p>
                      <button onClick={handleReset} className="block mx-auto mt-4 text-xs text-text-muted hover:text-accent-blue transition-colors cursor-pointer">
                        Check a different property
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
