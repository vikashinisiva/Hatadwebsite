'use client'

import { useState, useEffect, useRef, useCallback, Fragment, useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  Upload, RefreshCw, ChevronDown, ChevronUp, FileText, Download, MapPin,
  Search, LogOut, Filter,
} from 'lucide-react'

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

type StatusFilter = 'all' | 'pending' | 'overdue' | 'ready'
type SortField = 'deadline' | 'created_at'

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

function isOverdue(row: ClearanceRow): boolean {
  return row.status === 'pending' && new Date(row.deadline).getTime() < Date.now()
}

function requestType(row: ClearanceRow): 'upload' | 'property' {
  return row.document_urls?.length > 0 ? 'upload' : 'property'
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
  const [delayNotified, setDelayNotified] = useState<Set<string>>(new Set())
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [signedUrls, setSignedUrls] = useState<Record<string, Record<string, string>>>({})

  const [storedPassword, setStoredPassword] = useState('')

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [sortField, setSortField] = useState<SortField>('deadline')
  const [searchQuery, setSearchQuery] = useState('')

  // Check sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('hatad_admin_pwd')
    if (saved) {
      setStoredPassword(saved)
      setAuthed(true)
    }
  }, [])

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/update', {
        headers: { Authorization: `Bearer ${storedPassword}` },
      })
      if (res.status === 401) {
        setAuthed(false)
        sessionStorage.removeItem('hatad_admin_pwd')
        return
      }
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
  }, [storedPassword])

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

  // ---------------------------------------------------------------------------
  // Summary stats
  // ---------------------------------------------------------------------------

  const stats = useMemo(() => {
    const pending = rows.filter((r) => r.status === 'pending')
    const overdue = pending.filter((r) => isOverdue(r))
    const ready = rows.filter((r) => r.status === 'ready')

    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const completedToday = ready.filter((r) => {
      // Use created_at as proxy — report_url being set means it was completed
      // For a more accurate check we'd need a completed_at field
      return r.report_url && new Date(r.created_at) >= new Date(todayStart.getTime() - 7 * 86400000)
    })

    return {
      total: rows.length,
      pending: pending.length,
      overdue: overdue.length,
      ready: ready.length,
      completedRecent: completedToday.length,
    }
  }, [rows])

  // ---------------------------------------------------------------------------
  // Filtered + sorted rows
  // ---------------------------------------------------------------------------

  const filteredRows = useMemo(() => {
    let result = [...rows]

    // Status filter
    if (statusFilter === 'pending') result = result.filter((r) => r.status === 'pending' && !isOverdue(r))
    else if (statusFilter === 'overdue') result = result.filter((r) => isOverdue(r))
    else if (statusFilter === 'ready') result = result.filter((r) => r.status === 'ready')

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((r) =>
        r.id.toLowerCase().includes(q) ||
        r.notify_email.toLowerCase().includes(q) ||
        r.property_details?.district?.toLowerCase().includes(q) ||
        r.property_details?.surveyNo?.toLowerCase().includes(q) ||
        r.property_details?.applicantName?.toLowerCase().includes(q)
      )
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'deadline') {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

    return result
  }, [rows, statusFilter, searchQuery, sortField])

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async function handleAuth() {
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        sessionStorage.setItem('hatad_admin_pwd', password)
        setStoredPassword(password)
        setAuthed(true)
        setAuthError('')
      } else {
        setAuthError('Incorrect password')
      }
    } catch {
      setAuthError('Authentication failed')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('hatad_admin_pwd')
    setStoredPassword('')
    setAuthed(false)
    setRows([])
  }

  async function handleUploadReport(rowId: string, file: File) {
    setActionLoading(rowId)
    try {
      const formData = new FormData()
      formData.append('id', rowId)
      formData.append('file', file)
      formData.append('hasFlags', String(flagsState[rowId] ?? ''))

      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: { Authorization: `Bearer ${storedPassword}` },
        body: formData,
      })

      if (res.ok) {
        setRefreshKey((k) => k + 1)
      } else {
        const json = await res.json()
        console.error('Upload error:', json.error)
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  async function toggleRowExpand(row: ClearanceRow) {
    if (expandedRow === row.id) {
      setExpandedRow(null)
      return
    }
    setExpandedRow(row.id)

    if (row.document_urls?.length > 0 && !signedUrls[row.id]) {
      try {
        const res = await fetch('/api/admin/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${storedPassword}`,
          },
          body: JSON.stringify({ id: row.id, action: 'get_signed_urls', paths: row.document_urls }),
        })
        const json = await res.json()
        if (json.urls) {
          setSignedUrls((prev) => ({ ...prev, [row.id]: json.urls }))
        }
      } catch {
        // ignore
      }
    }
  }

  async function sendDelayNotice(rowId: string) {
    setActionLoading(rowId)
    try {
      const res = await fetch('/api/admin/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${storedPassword}`,
        },
        body: JSON.stringify({ id: rowId, action: 'send_delay' }),
      })
      if (res.ok) {
        setDelayNotified((prev) => new Set(prev).add(rowId))
      }
    } catch {
      // ignore
    } finally {
      setActionLoading(null)
    }
  }

  const [flagDropdown, setFlagDropdown] = useState<string | null>(null)
  const [flagConfirm, setFlagConfirm] = useState<string | null>(null)

  async function setFlag(rowId: string, value: boolean) {
    setFlagDropdown(null)
    setFlagConfirm(null)
    setFlagsState((prev) => ({ ...prev, [rowId]: value }))

    await fetch('/api/admin/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${storedPassword}`,
      },
      body: JSON.stringify({ id: rowId, action: 'set_flags', value }),
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

  const filterButtons: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: rows.length },
    { key: 'pending', label: 'Pending', count: stats.pending - stats.overdue },
    { key: 'overdue', label: 'Overdue', count: stats.overdue },
    { key: 'ready', label: 'Ready', count: stats.ready },
  ]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-[#0D1B2A] py-6 px-6">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-white text-xl font-semibold">HQ Panel</h1>
            <p className="text-white/40 text-xs mt-0.5">Clearance requests</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              className="text-white/60 hover:text-white transition-colors cursor-pointer p-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={handleLogout}
              className="text-white/40 hover:text-white transition-colors cursor-pointer p-2"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-surface border border-border rounded-sm px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Total</p>
            <p className="text-2xl font-bold text-text-primary mt-0.5">{stats.total}</p>
          </div>
          <div className="bg-surface border border-border rounded-sm px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Pending</p>
            <p className="text-2xl font-bold text-amber-600 mt-0.5">{stats.pending}</p>
          </div>
          <div className={cn(
            'bg-surface border rounded-sm px-4 py-3',
            stats.overdue > 0 ? 'border-red-200 bg-red-50/50' : 'border-border',
          )}>
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Overdue</p>
            <p className={cn('text-2xl font-bold mt-0.5', stats.overdue > 0 ? 'text-red-600' : 'text-text-primary')}>
              {stats.overdue}
            </p>
          </div>
          <div className="bg-surface border border-border rounded-sm px-4 py-3">
            <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.ready}</p>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-4">
          {/* Status filters */}
          <div className="flex items-center gap-1.5">
            <Filter size={12} className="text-text-muted mr-1" />
            {filterButtons.map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={cn(
                  'text-[11px] font-medium px-2.5 py-1 rounded-sm transition-colors cursor-pointer',
                  statusFilter === f.key
                    ? 'bg-[#0D1B2A] text-[#C9A84C]'
                    : 'bg-surface-raised text-text-muted hover:text-text-secondary',
                )}
              >
                {f.label}
                {f.count > 0 && (
                  <span className={cn(
                    'ml-1.5 text-[10px]',
                    statusFilter === f.key ? 'text-[#C9A84C]/60' : 'text-text-muted/60',
                  )}>
                    {f.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1.5 sm:ml-auto">
            <span className="text-[10px] text-text-muted uppercase tracking-wider">Sort:</span>
            <button
              onClick={() => setSortField('deadline')}
              className={cn(
                'text-[11px] font-medium px-2.5 py-1 rounded-sm transition-colors cursor-pointer',
                sortField === 'deadline'
                  ? 'bg-[#0D1B2A] text-[#C9A84C]'
                  : 'bg-surface-raised text-text-muted hover:text-text-secondary',
              )}
            >
              Urgency
            </button>
            <button
              onClick={() => setSortField('created_at')}
              className={cn(
                'text-[11px] font-medium px-2.5 py-1 rounded-sm transition-colors cursor-pointer',
                sortField === 'created_at'
                  ? 'bg-[#0D1B2A] text-[#C9A84C]'
                  : 'bg-surface-raised text-text-muted hover:text-text-secondary',
              )}
            >
              Newest
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            placeholder="Search by email, ID, district, survey no, or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(inputClass, 'pl-9 py-2')}
          />
        </div>

        {/* Table */}
        {loading && rows.length === 0 ? (
          <div className="flex justify-center py-20">
            <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
              <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <p className="text-center text-text-muted py-20 text-sm">
            {rows.length === 0 ? 'No requests yet' : 'No requests match your filters'}
          </p>
        ) : (
          <div className="overflow-visible">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">ID</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Type</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Email</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Submitted</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Deadline</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Status</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Flags</th>
                  <th className="text-[10px] uppercase tracking-wider text-text-muted font-medium py-3 px-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((row) => {
                  const deadline = relativeDeadline(row.deadline)
                  const isOverduePending = deadline.overdue && row.status === 'pending'
                  const isReady = row.status === 'ready'
                  const currentFlags = flagsState[row.id] ?? row.has_flags
                  const type = requestType(row)

                  return (
                    <Fragment key={row.id}>
                    <tr
                      className={cn(
                        'border-b border-border/50 transition-colors',
                        isReady && 'bg-emerald-50/50',
                        isOverduePending && 'bg-red-50/50',
                      )}
                    >
                      <td className="py-3 px-3">
                        <button
                          onClick={() => toggleRowExpand(row)}
                          className="inline-flex items-center gap-1.5 text-xs font-mono text-text-primary hover:text-[#C9A84C] transition-colors cursor-pointer"
                        >
                          {row.id.slice(0, 8).toUpperCase()}
                          {expandedRow === row.id ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                        </button>
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm',
                            type === 'upload'
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-purple-50 text-purple-600',
                          )}
                        >
                          {type === 'upload' ? 'Docs' : 'Property'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-text-secondary">{row.notify_email}</span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-xs text-text-muted">{formatDateIST(row.created_at)}</span>
                      </td>
                      <td className="py-3 px-3">
                        {isReady ? (
                          <span className="text-xs text-emerald-600 font-medium">Delivered</span>
                        ) : (
                          <span className={cn(
                            'text-xs',
                            deadline.overdue ? 'text-red-600 font-medium' : 'text-text-secondary',
                          )}>
                            {deadline.text}
                          </span>
                        )}
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
                        <div className="relative">
                          <button
                            onClick={() => setFlagDropdown(flagDropdown === row.id ? null : row.id)}
                            className={cn(
                              'text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-sm cursor-pointer transition-colors inline-flex items-center gap-1',
                              currentFlags === false && 'bg-emerald-100 text-emerald-700',
                              currentFlags === true && 'bg-amber-100 text-amber-700',
                              currentFlags === null && 'bg-gray-100 text-gray-500 hover:bg-gray-200',
                            )}
                          >
                            {currentFlags === false ? 'Clean' : currentFlags === true ? 'Flagged' : 'Set'}
                            <ChevronDown size={8} />
                          </button>

                          {flagDropdown === row.id && (
                            <>
                            <div className="fixed inset-0 z-30" onClick={() => setFlagDropdown(null)} />
                            <div className="absolute z-40 top-full left-0 mt-1 bg-white border border-border rounded-sm shadow-lg py-1 min-w-[120px]">
                              <button
                                onClick={() => setFlag(row.id, false)}
                                className={cn(
                                  'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer hover:bg-emerald-50',
                                  currentFlags === false ? 'text-emerald-700 font-semibold bg-emerald-50/50' : 'text-text-secondary',
                                )}
                              >
                                Clean
                              </button>
                              <button
                                onClick={() => {
                                  setFlagDropdown(null)
                                  setFlagConfirm(row.id)
                                }}
                                className={cn(
                                  'w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer hover:bg-amber-50',
                                  currentFlags === true ? 'text-amber-700 font-semibold bg-amber-50/50' : 'text-text-secondary',
                                )}
                              >
                                Flagged
                              </button>
                            </div>
                            </>
                          )}

                          {flagConfirm === row.id && (
                            <>
                            <div className="fixed inset-0 z-30" onClick={() => setFlagConfirm(null)} />
                            <div className="absolute z-40 top-full left-0 mt-1 bg-white border border-amber-200 rounded-sm shadow-lg p-3 min-w-[200px]">
                              <p className="text-xs text-text-primary font-medium mb-2">Mark as flagged?</p>
                              <p className="text-[10px] text-text-muted mb-3">Client will see an amber alert on their tracking page.</p>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => setFlag(row.id, true)}
                                  className="text-[11px] font-semibold px-3 py-1 rounded-sm bg-amber-500 text-white hover:bg-amber-600 transition-colors cursor-pointer"
                                >
                                  Confirm
                                </button>
                                <button
                                  onClick={() => setFlagConfirm(null)}
                                  className="text-[11px] font-medium px-3 py-1 rounded-sm bg-surface-raised text-text-muted hover:text-text-secondary transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                            </>
                          )}
                        </div>
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
                          {isReady ? (
                            <button
                              onClick={() => fileInputRefs.current[row.id]?.click()}
                              disabled={actionLoading === row.id}
                              className={cn(
                                'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer',
                                'bg-surface-raised text-text-muted hover:bg-gray-200 hover:text-text-secondary',
                                actionLoading === row.id && 'opacity-60 cursor-not-allowed',
                              )}
                            >
                              <Upload size={12} />
                              {actionLoading === row.id ? 'Uploading...' : 'Update report'}
                            </button>
                          ) : (
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
                              {actionLoading === row.id ? 'Uploading...' : 'Upload report'}
                            </button>
                          )}
                          {isOverduePending && !delayNotified.has(row.id) && (
                            <button
                              onClick={() => sendDelayNotice(row.id)}
                              disabled={actionLoading === row.id}
                              className={cn(
                                'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors cursor-pointer',
                                'bg-amber-100 text-amber-700 hover:bg-amber-200',
                                actionLoading === row.id && 'opacity-60 cursor-not-allowed',
                              )}
                            >
                              Notify delay
                            </button>
                          )}
                          {delayNotified.has(row.id) && (
                            <span className="text-[10px] text-amber-600 font-medium">Notified</span>
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRow === row.id && (
                      <tr className="bg-surface-raised/50">
                        <td colSpan={8} className="px-3 py-4">
                          <div className="flex flex-col gap-4 pl-1">
                            {/* Property details */}
                            {row.property_details && Object.keys(row.property_details).length > 0 && (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2 flex items-center gap-1.5">
                                  <MapPin size={10} />
                                  Property Details
                                </p>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5">
                                  {Object.entries(row.property_details).map(([key, val]) => (
                                    <div key={key}>
                                      <span className="text-[10px] text-text-muted capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}: </span>
                                      <span className="text-xs text-text-primary font-medium">{val}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Documents */}
                            {row.document_urls?.length > 0 ? (
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2 flex items-center gap-1.5">
                                  <FileText size={10} />
                                  Uploaded Documents ({row.document_urls.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {row.document_urls.map((path, i) => {
                                    const fileName = path.split('/').pop() || `Document ${i + 1}`
                                    const url = signedUrls[row.id]?.[path]
                                    return (
                                      <a
                                        key={path}
                                        href={url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => { if (!url) e.preventDefault() }}
                                        className={cn(
                                          'inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-sm font-medium transition-colors',
                                          url
                                            ? 'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238] cursor-pointer'
                                            : 'bg-gray-100 text-gray-400 cursor-wait',
                                        )}
                                      >
                                        <Download size={11} />
                                        {fileName.length > 25 ? fileName.slice(0, 22) + '...' : fileName}
                                      </a>
                                    )
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-text-muted italic">No documents uploaded — property details request</p>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                    </Fragment>
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
