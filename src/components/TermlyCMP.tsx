'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { grantConsent, revokeConsent } from '@/lib/mixpanel'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

type Props = {
  websiteUUID: string
  autoBlock?: boolean
  masterConsentsOrigin?: string
}

/**
 * Termly's consent state, keyed by category. Only `analytics` concerns us.
 * Typed loosely on purpose: the categories a Termly account exposes depend on
 * how its banner is configured, and an unexpected key must not be a type error.
 */
type TermlyConsentState = Record<string, boolean | undefined>

declare global {
  interface Window {
    Termly?: {
      initialize: () => void
      getConsentState?: () => TermlyConsentState | undefined
      on?: (event: 'initialized' | 'consent', handler: () => void) => void
    }
  }
}

function TermlyCMPInner({ autoBlock, masterConsentsOrigin, websiteUUID }: Props) {
  const scriptSrc = useMemo(() => {
    const src = new URL(SCRIPT_SRC_BASE)
    src.pathname = `/resource-blocker/${websiteUUID}`
    if (autoBlock) src.searchParams.set('autoBlock', 'on')
    if (masterConsentsOrigin) src.searchParams.set('masterConsentsOrigin', masterConsentsOrigin)
    return src.toString()
  }, [autoBlock, masterConsentsOrigin, websiteUUID])

  const isScriptAdded = useRef(false)

  useEffect(() => {
    if (isScriptAdded.current) return
    const script = document.createElement('script')
    script.src = scriptSrc

    /*
     * Mixpanel is the one analytics tool here that Termly's autoBlock cannot
     * reach. autoBlock works by rewriting <script> tags whose src matches a
     * known third-party domain, and Mixpanel is imported as a bundled module
     * (src/lib/mixpanel.ts) rather than loaded from cdn.mxpnl.com — so there is
     * no tag to rewrite. The SDK therefore starts opted out and this is the
     * only thing that ever opts it in.
     *
     * Handlers are registered on load because Termly's event API does not
     * exist until its script has run.
     */
    script.onload = () => {
      const apply = () => {
        const state = window.Termly?.getConsentState?.()
        if (state?.analytics === true) grantConsent()
        else revokeConsent()
      }

      /* Fires again whenever the visitor changes their mind in the banner. */
      window.Termly?.on?.('consent', apply)
      window.Termly?.on?.('initialized', apply)

      /*
       * Fallback for an embed without the event API. Without this, a returning
       * visitor who already consented would never be opted in, and the gate
       * would read as "Mixpanel is broken" rather than "consent never arrived".
       */
      if (typeof window.Termly?.on !== 'function') apply()
    }

    document.head.appendChild(script)
    isScriptAdded.current = true
  }, [scriptSrc])

  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    window.Termly?.initialize()
  }, [pathname, searchParams])

  return null
}

export default function TermlyCMP(props: Props) {
  return (
    <Suspense fallback={null}>
      <TermlyCMPInner {...props} />
    </Suspense>
  )
}
