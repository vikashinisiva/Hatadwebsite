'use client'

import { Suspense, useEffect, useMemo, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

const SCRIPT_SRC_BASE = 'https://app.termly.io'

type Props = {
  websiteUUID: string
  autoBlock?: boolean
  masterConsentsOrigin?: string
}

declare global {
  interface Window {
    Termly?: { initialize: () => void }
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
