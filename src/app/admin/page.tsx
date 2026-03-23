'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import { Upload, RefreshCw } from 'lucide-react'

interface ClearanceRow {
  id: string
  user_id: string
  status: string
  has_flags: boolean | null
  property_details: Record<string, string> | null
  document_urls: string[]
  report_url: string | null
  notify_email: string
  deadline: string
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

function relativeDeadline(deadline: string): { text: string; overdue: boolean } {
  const remaining = new Date(deadline).getTime() - Date.now()
  if (remaining <= 0) {
    const elapsed = Math.abs(remaining)
    const h = Math.floor(elapsed / 3600000)
    const m = Math.floor((elapsed % 3600000) / 60000)
    return { text: h > 0 ? `Overdue by ${h}h ${m}m` : `Overdue by ${m}m`, overdue: true }
  }
  const h = Math.floor(remaining / 3600000)
  const m = Math.floor((remaining % 3600000) / 60000)
  return { text: h > 0 ? `${h}h ${m}m remaining` : `${m}m remaining`, overdue: false }
}

export default function AdminPage() {
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [rows, setRows] = useState<ClearanceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})
  const [flagsState, setFlagsState] = useState<Record<string, boolean | null>>({})

  // Check sessionStorage on mount
  useEffect(() => {
    if (sessionStorage.getItem('hatad_admin_authed') === 'true') {
      setAuthed(true)
    }
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/update')
      const json = await res.json()
      if (json.data) {
        setRows(json.data)
        const flags: Record<string, boolean | null> = {}
        for (const row of json.data as ClearanceRow[]) {
          flags[row.id] = row.has_flags
        }
        setFlagsState(flags)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) fetchData()
  }, [authed, refreshKey, fetchData])

  // Auto-refresh every 60s
  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 60000)
    return () => clearInterval(interval)
  }, [authed])

  // Deadline refresh every 60s
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!authed) return
    const interval = setInterval(() => setTick((t) => t + 1), 60000)
    return () => clearInterval(interval)
  }, [authed])

  function handleAuth() {
    if (password === process.env.NEXT_PUBLIC_ADMIN_PASSWORD) {
      sessionStorage.setItem('hatad_admin_authed', 'true')
      setAuthed(true)
      setAuthError('')
    } else {
      setAuthError('Incorrect password')
    }
  }

  async function handleUploadReport(rowId: string, file: File) {
    setActionLoading(rowId)
    try {
      const path = `${rowId}/report.pdf`
      const { error: uploadError } = await supabase.storage
        .from('clearance-reports')
        .upload(path, file, { contentType: 'application/pdf', upsert: true })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        setActionLoading(null)
        return
      }

      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: rowId,
          action: 'set_report',
          reportUrl: path,
          hasFlags: flagsState[rowId] ?? null,
        }),
      })

      if (res.ok) {
        setRefreshKey((k) => k + 1)
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function cycleFlags(rowId: string) {
    const current = flagsState[rowId]
    const next = current === null ? false : current === false ? true : null
    setFlagsState((prev) => ({ ...prev, [rowId]: next }))

    await fetch('/api/admin/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: rowId, action: 'set_flags', value: next }),
    })
  }

  const inputClass =
    'w-full bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors'

  // ---------------------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------------------

  if (!authed) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="w-full max-w-xs">
          <div className="bg-surface border border-border rounded-sm p-8">
            <h1 className="text-lg font-semibold text-text-primary text-center mb-6">
              Admin Access
            </h1>
            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-sm mb-4">
                {authError}
              </div>
            )}
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setAuthError('') }}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              className={cn(inputClass, 'text-center')}
              autoFocus
            />
            <button
              onClick={handleAuth}
              className="mt-4 w-full py-2.5 rounded-sm text-sm font-semibold bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] transition-colors cursor-pointer"
            >
              Enter →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------------------
  // Dashboard
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#0D1B2A] py-6 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">Admin Dashboard</h1>
            <p className="text-white/40 text-xs mt-0.5">Clearance requests</p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-white/60 hover:text-white transition-colors cursor-pointer p-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : rows.length === 0 ? (
          <p className="text-center text-text-muted py-20 text-sm">No requests yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">ID</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Email</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Submitted</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Deadline</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Status</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Flags</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const deadline = relativeDeadline(row.deadline)
                  const isOverduePending = deadline.overdue && row.status === 'pending'
                  const isReady = row.status === 'ready'
                  const currentFlags = flagsState[row.id] ?? row.has_flags

                  return (
                    <tr
                      key={row.id}
                      className={cn(
                        'border-b border-border/50 transition-colors',
                        isReady && 'bg-emerald-50/50',
                        isOverduePending && 'bg-red-50/50',
                      )}
                    >
                      <td className="py-3 px-3">
                        <span className="text-xs font-mono text-text-primary">
                          {row.id.slice(0, 8).toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-text-secondary">{row.notify_email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-text-muted">{formatDateIST(row.created_at)}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className={cn(
                          'text-xs',
                          deadline.overdue ? 'text-red-600 font-medium' : 'text-text-secondary',
                        )}>
                          {deadline.text}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm',
                            isReady
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-amber-100 text-amber-700',
                          )}
                        >
                          {isReady ? 'Ready' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <button
                          onClick={() => cycleFlags(row.id)}
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm cursor-pointer transition-colors',
                            currentFlags === false && 'bg-emerald-100 text-emerald-700',
                            currentFlags === true && 'bg-amber-100 text-amber-700',
                            currentFlags === null && 'bg-gray-100 text-gray-500',
                          )}
                        >
                          {currentFlags === false ? 'Clean' : currentFlags === true ? 'Flagged' : '—'}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <input
                            ref={(el) => { fileInputRefs.current[row.id] = el }}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadReport(row.id, file)
                              e.target.value = ''
                            }}
                          />
                          <button
                            onClick={() => fileInputRefs.current[row.id]?.click()}
                            disabled={actionLoading === row.id}
                            className={cn(
                              'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer',
                              'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238]',
                              actionLoading === row.id && 'opacity-60 cursor-not-allowed',
                            )}
                          >
                            <Upload size={12} />
                            {actionLoading === row.id ? 'Uploading...' : row.report_url ? 'Replace report' : 'Upload report'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
