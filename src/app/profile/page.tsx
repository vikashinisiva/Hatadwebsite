'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { LogOut, Mail, Clock, ExternalLink } from 'lucide-react'
import { ClearanceNav } from '@/components/layout/ClearanceNav'
import type { User } from '@supabase/supabase-js'

interface PastRequest {
  id: string
  status: string
  created_at: string
}

function formatDateIST(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
}

export default function ProfilePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [requests, setRequests] = useState<PastRequest[]>([])
  const [signingOut, setSigningOut] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push('/clearance/auth?next=/profile')
        return
      }
      setUser(session.user)
      fetchRequests(session.user.id)
      setLoading(false)
    })
  }, [router])

  async function fetchRequests(userId: string) {
    const { data } = await supabase
      .from('clearance_requests')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setRequests(data)
  }

  async function handleSignOut() {
    setSigningOut(true)
    await supabase.auth.signOut()
    router.push('/clearance')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
          <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      <ClearanceNav />

      {/* Page title */}
      <div className="bg-[#0D1B2A] py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl font-semibold tracking-tight">Profile</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* User info card */}
        <div className="bg-surface border border-border rounded-sm p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#0D1B2A] flex items-center justify-center">
              <span className="text-[#C9A84C] font-semibold text-sm">
                {(user.email?.[0] || '?').toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary">{user.email}</p>
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} className="text-text-muted" />
                <p className="text-[11px] text-text-muted">
                  Joined {formatDateIST(user.created_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-text-muted bg-surface-raised border border-border rounded-sm px-3 py-2">
            <Mail size={12} />
            <span>{user.email}</span>
          </div>
        </div>

        {/* Past requests */}
        {requests.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-text-secondary tracking-wide uppercase mb-3">
              Your Requests
            </h2>
            <div className="space-y-2">
              {requests.map((req) => (
                <a
                  key={req.id}
                  href={`/clearance/track/${req.id}`}
                  className="flex items-center justify-between bg-surface border border-border rounded-sm px-4 py-3 hover:border-[#C9A84C]/50 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-text-muted">
                      {req.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm',
                        req.status === 'ready'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700',
                      )}
                    >
                      {req.status === 'ready' ? 'Ready' : 'Pending'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{formatDateIST(req.created_at)}</span>
                    <ExternalLink size={12} className="text-text-muted group-hover:text-[#C9A84C] transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {requests.length === 0 && (
          <div className="bg-surface border border-border rounded-sm p-6 mb-6 text-center">
            <p className="text-sm text-text-muted">No clearance requests yet</p>
            <a href="/clearance" className="text-xs text-[#C9A84C] hover:underline mt-2 inline-block">
              Request your first report →
            </a>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3">
          <a
            href="/clearance"
            className="block w-full py-3 rounded-sm text-sm font-semibold tracking-wide text-center bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] transition-colors"
          >
            Request clearance report →
          </a>

          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className={cn(
              'w-full py-3 rounded-sm text-sm font-medium tracking-wide transition-colors cursor-pointer',
              'bg-surface border border-border text-text-secondary hover:border-red-300 hover:text-red-600',
              signingOut && 'opacity-60 cursor-not-allowed',
            )}
          >
            <span className="flex items-center justify-center gap-2">
              <LogOut size={14} />
              {signingOut ? 'Signing out...' : 'Sign out'}
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-text-muted mt-8">
          HataD by Hypse Aero · Coimbatore, Tamil Nadu
        </p>
      </div>
    </div>
  )
}
