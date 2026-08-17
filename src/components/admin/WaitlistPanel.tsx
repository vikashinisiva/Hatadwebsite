'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw, FileDown } from 'lucide-react'

/**
 * Waitlist view, rendered inside the HQ panel.
 *
 * Lives in its own file purely to keep hq-panel/page.tsx from growing — that
 * file already runs the payment-side admin actions and is long enough. It
 * receives the already-authenticated password from the parent; it does no auth
 * of its own and is never routable on its own.
 */

type Row = {
  contact: string
  kind: string
  source: string | null
  referral_code: string
  referred_by: string | null
  referrals: number
  created_at: string
}

type Payload = { total: number; phones: number; emails: number; rows: Row[] }

function formatIST(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function WaitlistPanel({ password }: { password: string }) {
  const [data, setData] = useState<Payload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    if (!password) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/waitlist/export?format=json', {
        headers: { Authorization: `Bearer ${password}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        setError(res.status === 401 ? 'Session expired — sign in again.' : `Failed (HTTP ${res.status}).`)
        return
      }
      setData(await res.json())
    } catch {
      setError('Network error loading the waitlist.')
    } finally {
      setLoading(false)
    }
  }, [password])

  useEffect(() => {
    load()
  }, [load])

  /* The CSV route requires an Authorization header, so it cannot be a plain
     link — fetch it, then hand the browser a blob. */
  async function downloadCsv() {
    const res = await fetch('/api/waitlist/export', {
      headers: { Authorization: `Bearer ${password}` },
    })
    if (!res.ok) return
    const url = URL.createObjectURL(await res.blob())
    const a = document.createElement('a')
    a.href = url
    a.download = `waitlist-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const topReferrers = (data?.rows ?? [])
    .filter((r) => r.referrals > 0)
    .sort((a, b) => b.referrals - a.referrals)
    .slice(0, 5)

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-5">
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div className="grid grid-cols-3 gap-3 flex-1 min-w-[260px] max-w-[520px]">
          {[
            { label: 'Total', value: data?.total ?? 0 },
            { label: 'Phone', value: data?.phones ?? 0 },
            { label: 'Email', value: data?.emails ?? 0 },
          ].map((s) => (
            <div key={s.label} className="bg-surface border border-border rounded-sm px-4 py-3">
              <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium">{s.label}</p>
              <p className="text-2xl font-bold text-text-primary mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="text-text-muted hover:text-text-primary transition-colors cursor-pointer p-2"
            title="Refresh"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={downloadCsv}
            className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary border border-border rounded-sm px-3 py-2 cursor-pointer transition-colors"
          >
            <FileDown size={13} /> CSV
          </button>
        </div>
      </div>

      {error && (
        <p className="bg-surface border border-red-200 text-red-600 text-sm rounded-sm px-4 py-3 mb-4">{error}</p>
      )}

      {topReferrers.length > 0 && (
        <div className="bg-surface border border-border rounded-sm px-4 py-3 mb-4">
          <p className="text-[10px] uppercase tracking-wider text-text-muted font-medium mb-2">Top referrers</p>
          {topReferrers.map((r) => (
            <div key={r.referral_code} className="flex items-center gap-3 text-xs py-0.5">
              <span className="font-mono text-accent-blue">{r.referral_code}</span>
              <span className="text-text-primary">{r.contact}</span>
              <span className="text-text-muted">brought {r.referrals}</span>
            </div>
          ))}
        </div>
      )}

      {!loading && data?.total === 0 ? (
        <p className="bg-surface border border-border text-text-secondary text-sm rounded-sm px-4 py-3">
          Nobody has joined the waitlist yet.
        </p>
      ) : (
        <div className="bg-surface border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border">
                {['Contact', 'Type', 'Joined', 'Code', 'Referred by', 'Brought', 'Source'].map((h) => (
                  <th
                    key={h}
                    className="text-left px-4 py-3 text-[10px] uppercase tracking-wider text-text-muted font-medium whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.contact} className="border-b border-border/50 last:border-0">
                  <td className="px-4 py-3 text-text-primary font-medium whitespace-nowrap">{r.contact}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.kind}</td>
                  <td className="px-4 py-3 text-text-secondary whitespace-nowrap">{formatIST(r.created_at)}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{r.referral_code || '—'}</td>
                  <td className="px-4 py-3 font-mono text-text-secondary">{r.referred_by || '—'}</td>
                  <td className="px-4 py-3 text-text-secondary">{r.referrals || '—'}</td>
                  <td className="px-4 py-3 text-text-muted">{r.source || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
