'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { User, LogOut, Plus, ArrowLeft } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'

function LangToggle() {
  const { locale, setLocale } = useI18n()
  return (
    <button
      onClick={() => setLocale(locale === 'en' ? 'ta' : 'en')}
      className="text-[11px] font-medium px-2 py-1 rounded-sm bg-surface-raised text-text-muted hover:text-text-primary transition-colors cursor-pointer"
    >
      {locale === 'en' ? 'தமிழ்' : 'EN'}
    </button>
  )
}

interface ClearanceNavProps {
  backHref?: string
  backLabel?: string
}

export function ClearanceNav({ backHref, backLabel }: ClearanceNavProps) {
  const [email, setEmail] = useState<string | null>(null)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [displayName, setDisplayName] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    function updateUser(session: { user: { email?: string; user_metadata?: Record<string, unknown> } } | null) {
      setEmail(session?.user?.email ?? null)
      setAvatarUrl((session?.user?.user_metadata?.avatar_url as string) || null)
      setDisplayName((session?.user?.user_metadata?.full_name as string) || null)
    }

    supabase.auth.getSession().then(({ data: { session } }) => updateUser(session))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => updateUser(s))

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    window.location.href = '/clearance'
  }

  return (
    <nav className="bg-white border-b border-[#E8EDF5]">
      <div className="px-6 md:px-12 lg:px-20 xl:px-28 h-16 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          {backHref ? (
            <a
              href={backHref}
              className="flex items-center gap-1.5 text-[#7A8FAD] hover:text-[#0C1525] text-xs transition-colors"
            >
              <ArrowLeft size={13} />
              <span>{backLabel || 'Back'}</span>
            </a>
          ) : (
            <a href="/" className="flex items-center gap-2">
              <span className="text-[#0C1525] font-semibold text-base tracking-tight">HataD</span>
              <span className="text-[#CBD5E8] text-xs">·</span>
              <span className="text-[#1B4FD8] text-xs tracking-wide">Clearance</span>
            </a>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-3">
          {email ? (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="flex items-center gap-2 cursor-pointer"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-7 h-7 rounded-full border border-border" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1B4FD8]/10 border border-[#1B4FD8]/20 flex items-center justify-center">
                    <span className="text-[#1B4FD8] text-[10px] font-semibold">
                      {email[0].toUpperCase()}
                    </span>
                  </div>
                )}
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-sm shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-border flex items-center gap-2.5">
                      {avatarUrl ? (
                        <img src={avatarUrl} alt="" className="w-8 h-8 rounded-full border border-border shrink-0" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#0D1B2A] flex items-center justify-center shrink-0">
                          <span className="text-[#C9A84C] font-semibold text-xs">{email[0].toUpperCase()}</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        {displayName && <p className="text-xs font-medium text-text-primary truncate">{displayName}</p>}
                        <p className="text-[11px] text-text-muted truncate">{email}</p>
                      </div>
                    </div>
                    <div className="py-1">
                      <a
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        <User size={13} />
                        Profile
                      </a>
                      <a
                        href="/clearance/onboarding"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        <Plus size={13} />
                        New Request
                      </a>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleSignOut}
                        disabled={signingOut}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-surface-raised transition-colors w-full cursor-pointer disabled:opacity-50"
                      >
                        {signingOut ? (
                          <><span className="w-3 h-3 border-2 border-red-300 border-t-red-500 rounded-full animate-spin" /> Signing out...</>
                        ) : (
                          <><LogOut size={13} /> Sign Out</>
                        )}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a
              href="/clearance/auth?next=/profile"
              className={cn(
                'text-xs font-medium px-4 py-2 rounded-md transition-all',
                'bg-[#0C1525] text-white hover:bg-[#152238] shadow-sm shadow-[#1B4FD8]/20',
              )}
            >
              Sign In
            </a>
          )}
          <LangToggle />
        </div>
      </div>
    </nav>
  )
}
