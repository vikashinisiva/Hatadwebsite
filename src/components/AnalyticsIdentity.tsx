'use client'

import { useEffect, useRef } from 'react'

import { supabase } from '@/lib/supabase'
import { identifyUser, resetUser, trackEvent } from '@/lib/analytics'

/**
 * Binds Mixpanel's identity to the Supabase session, for the whole app.
 *
 * One subscription rather than identify() calls sprinkled through the auth
 * screens, because the rule is not "identify on login" — it is "identify on
 * login AND on every re-open while already signed in". A scattered version
 * reliably misses the re-open, and then a returning user's events land on a
 * fresh anonymous id and the funnel breaks silently at the join.
 *
 * onAuthStateChange gives all four transitions from one place:
 *   SIGNED_IN        a real sign-in  -> identify + sign_up_completed/login_completed
 *   INITIAL_SESSION  a restored one  -> identify only, no event (not a new login)
 *   SIGNED_OUT       logout          -> reset, or the next person to use this
 *                                      browser inherits this user's identity
 *
 * Mounted in layout.tsx so it covers the clearance flow, /profile and the
 * landing page alike.
 */
export function AnalyticsIdentity() {
  /* At most one login event per page load, whatever Supabase re-emits. */
  const loginTracked = useRef(false)

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user

      if (event === 'SIGNED_OUT' || !user) {
        if (event === 'SIGNED_OUT') resetUser()
        return
      }

      /*
       * provider is 'google' or 'email' (the OTP path). Anything else is new
       * and should be sent as-is rather than quietly coerced into one of the
       * two we know about.
       */
      const provider = user.app_metadata?.provider
      const method = provider === 'google' ? 'google' : 'email_otp'

      const fullName = typeof user.user_metadata?.full_name === 'string'
        ? user.user_metadata.full_name
        : undefined

      /*
       * identify() first, then the profile. A people.set() before identify can
       * land on the anonymous profile and never merge onto the real one.
       */
      identifyUser(user.id, {
        $email: user.email,
        $name: fullName,
        sign_up_method: method,
      })

      if (event !== 'SIGNED_IN' || loginTracked.current) return
      loginTracked.current = true

      /*
       * First-ever sign-in vs a return visit. On the first, Supabase sets
       * created_at and last_sign_in_at within the same moment; on every later
       * one they diverge permanently. Compared to each other rather than to
       * the clock, so a slow redirect cannot misclassify a signup as a login.
       */
      const createdAt = user.created_at ? new Date(user.created_at).getTime() : 0
      const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).getTime() : 0
      const isFirstSession = createdAt > 0 && Math.abs(lastSignIn - createdAt) < 5_000

      if (isFirstSession) trackEvent('sign_up_completed', { sign_up_method: method }, 'auth')
      else trackEvent('login_completed', { login_method: method }, 'auth')
    })

    return () => subscription.unsubscribe()
  }, [])

  return null
}
