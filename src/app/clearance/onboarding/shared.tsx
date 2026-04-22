'use client'

import { ReactNode } from 'react'

// ── Icons (Lucide paths, stroke 1.7) ───────────────────────
type IconName =
  | 'arrow' | 'back' | 'check' | 'close' | 'phone' | 'search' | 'shield'
  | 'mappin' | 'plus' | 'minus' | 'sparkle' | 'document' | 'lock'
  | 'layers' | 'clock' | 'scan' | 'download' | 'chat'

const ICON_PATHS: Record<IconName, ReactNode> = {
  arrow: <><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>,
  back: <><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></>,
  check: <polyline points="20 6 9 17 4 12"/>,
  close: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
  phone: <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>,
  search: <><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
  shield: <><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></>,
  mappin: <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
  plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
  minus: <line x1="5" y1="12" x2="19" y2="12"/>,
  sparkle: <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>,
  document: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></>,
  lock: <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  layers: <><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></>,
  clock: <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>,
  scan: <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><line x1="8" y1="12" x2="16" y2="12"/></>,
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
  chat: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>,
}

export function OBIcon({ name, size = 18, stroke = 1.7, style, className }: {
  name: IconName
  size?: number
  stroke?: number
  style?: React.CSSProperties
  className?: string
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round"
      style={style} className={className}>
      {ICON_PATHS[name]}
    </svg>
  )
}

// ── Stepper ──────────────────────────────────────────────
export function Stepper({ step, labels = ['Account', 'Property', 'Pay'] }: {
  step: number
  labels?: string[]
}) {
  // When step equals labels.length, all steps are done (post-completion view)
  return (
    <div className="ob-stepper">
      {labels.map((l, i) => {
        const st = i < step ? 'done' : i === step ? 'active' : ''
        return (
          <div key={i} style={{ display: 'contents' }}>
            <div className={`ob-step ${st}`}>
              <span className="ob-step-dot">
                {i < step ? <OBIcon name="check" size={14} stroke={2.4}/> : String(i+1).padStart(2,'0')}
              </span>
              <span className="ob-step-label">{l}</span>
            </div>
            {i < labels.length - 1 && (
              <div className={`ob-step-connector ${i < step ? 'filled' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Chrome (top bar with inline stepper) ─────────────────
export function Chrome({ onExit, step, labels }: {
  onExit?: () => void
  step?: number
  labels?: string[]
}) {
  return (
    <div className="ob-chrome">
      <div className="ob-chrome-wm">HATAD</div>
      {typeof step === 'number' && (
        <div className="ob-chrome-stepper">
          <Stepper step={step} labels={labels} />
        </div>
      )}
      <div className="ob-chrome-right">
        <button className="ob-exit-link" onClick={onExit}>Exit</button>
      </div>
    </div>
  )
}

// ── Coach mark ──────────────────────────────────────────
export function Coach({ children, label, top, left, right, bottom, onClose }: {
  children: ReactNode
  label?: string
  top?: number | string
  left?: number | string
  right?: number | string
  bottom?: number | string
  onClose?: () => void
}) {
  return (
    <div className="ob-coach" style={{ top, left, right, bottom }}>
      {onClose && (
        <button className="ob-coach-close" onClick={onClose}>
          <OBIcon name="close" size={12} stroke={2}/>
        </button>
      )}
      {label && <div className="ob-coach-label">{label}</div>}
      <div style={{ paddingRight: onClose ? 14 : 0 }}>{children}</div>
    </div>
  )
}

// ── Google logo SVG ─────────────────────────────────────
export function GoogleLogo({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  )
}
