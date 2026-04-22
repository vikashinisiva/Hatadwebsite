'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { STORAGE_KEYS } from '@/lib/constants'

/**
 * Global OAuth callback handler.
 * When Supabase redirects back with tokens in the URL hash (#access_token=...),
 * - Pre-hydration script in layout.tsx hides the page instantly
 * - This component takes over once React mounts, shows a personalized overlay,
 *   waits for the session, then hard-navigates to the destination
 */
export function AuthCallback() {
  const pathname = usePathname()
  const [isProcessing, setIsProcessing] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)
  const [authError, setAuthError] = useState<string | null>(null)

  useEffect(() => {
    if (pathname === '/clearance/auth') return

    const hash = window.location.hash
    const qs = new URLSearchParams(window.location.search)

    // Handle OAuth errors (user cancelled, denied consent, etc.)
    const err = qs.get('error') || (hash.includes('error=') && new URLSearchParams(hash.slice(1)).get('error'))
    if (err) {
      const msg = qs.get('error_description') || 'Sign-in was cancelled.'
      setAuthError(msg)
      setIsProcessing(true)
      // Clean the URL
      window.history.replaceState(null, '', pathname)
      // Auto-dismiss after 3 seconds
      setTimeout(() => setIsProcessing(false), 3000)
      return
    }

    if (!hash.includes('access_token=')) return

    setIsProcessing(true)

    // Read destination once upfront — race-safe
    const destination = sessionStorage.getItem(STORAGE_KEYS.OAUTH_NEXT) || '/profile'

    let hasRedirected = false
    function redirect() {
      if (hasRedirected) return
      hasRedirected = true
      sessionStorage.removeItem(STORAGE_KEYS.OAUTH_NEXT)
      // Remove the pre-hydration overlay so no double-flash
      const preOverlay = document.getElementById('__hatad_auth_overlay')
      if (preOverlay) preOverlay.remove()
      window.location.href = destination
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        const name = (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || null
        setUserName(name)
      }
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        subscription.unsubscribe()
        redirect()
      }
    })

    // Poll fallback in case event fired before listener attached
    let cancelled = false
    async function pollSession() {
      for (let i = 0; i < 20; i++) {
        if (cancelled || hasRedirected) return
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          const name = (session.user.user_metadata?.full_name as string) || session.user.email?.split('@')[0] || null
          setUserName(name)
          subscription.unsubscribe()
          redirect()
          return
        }
        await new Promise(r => setTimeout(r, 400))
      }
      subscription.unsubscribe()
      redirect()
    }
    pollSession()

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [pathname])

  // Remove pre-hydration overlay when React's overlay mounts
  useEffect(() => {
    if (isProcessing) {
      const preOverlay = document.getElementById('__hatad_auth_overlay')
      if (preOverlay) preOverlay.remove()
      const preStyle = document.getElementById('__hatad_auth_overlay_style')
      if (preStyle) preStyle.remove()
    }
  }, [isProcessing])

  if (!isProcessing) return null

  // Error state (cancelled / denied)
  if (authError) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-4">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <p className="text-sm font-semibold text-text-primary">Sign-in interrupted</p>
          <p className="text-xs text-text-muted mt-2">{authError}</p>
        </div>
      </div>
    )
  }

  // Signing in overlay — shows user's name once available
  return (
    <div className="fixed inset-0 z-[9999] bg-background flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin mx-auto" />
        <p className="text-sm text-text-muted mt-4">
          {userName ? <>Welcome, <span className="text-text-primary font-medium">{userName}</span></> : 'Signing you in...'}
        </p>
      </div>
    </div>
  )
}
