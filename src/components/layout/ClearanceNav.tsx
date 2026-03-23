'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { User, LogOut, FileText, Plus, ArrowLeft } from 'lucide-react'

interface ClearanceNavProps {
  backHref?: string
  backLabel?: string
}

export function ClearanceNav({ backHref, backLabel }: ClearanceNavProps) {
  const [email, setEmail] = useState<string | null>(null)
  const [showMenu, setShowMenu] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setEmail(session?.user?.email ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setEmail(s?.user?.email ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/clearance'
  }

  return (
    <nav className="bg-[#0D1B2A] border-b border-white/5">
      <div className="max-w-5xl mx-auto px-6 h-12 flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          {backHref ? (
            <a
              href={backHref}
              className="flex items-center gap-1.5 text-white/50 hover:text-white text-xs transition-colors"
            >
              <ArrowLeft size={13} />
              <span>{backLabel || 'Back'}</span>
            </a>
          ) : (
            <a href="/" className="flex items-center gap-2">
              <span className="text-white font-semibold text-sm tracking-tight">HataD</span>
              <span className="text-white/30 text-[10px]">·</span>
              <span className="text-[#C9A84C] text-[10px] tracking-wider uppercase">Clearance</span>
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
                <div className="w-7 h-7 rounded-full bg-[#C9A84C]/20 border border-[#C9A84C]/30 flex items-center justify-center">
                  <span className="text-[#C9A84C] text-[10px] font-semibold">
                    {email[0].toUpperCase()}
                  </span>
                </div>
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-sm shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-border">
                      <p className="text-xs text-text-muted truncate">{email}</p>
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
                        href="/clearance"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        <Plus size={13} />
                        New Request
                      </a>
                      <a
                        href="/profile"
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-text-secondary hover:bg-surface-raised transition-colors"
                      >
                        <FileText size={13} />
                        My Reports
                      </a>
                    </div>
                    <div className="border-t border-border py-1">
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-surface-raised transition-colors w-full cursor-pointer"
                      >
                        <LogOut size={13} />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <a
              href="/clearance/auth?next=/clearance"
              className={cn(
                'text-xs font-medium px-3 py-1.5 rounded-sm transition-colors',
                'bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C]/20',
              )}
            >
              Sign In
            </a>
          )}
        </div>
      </div>
    </nav>
  )
}
