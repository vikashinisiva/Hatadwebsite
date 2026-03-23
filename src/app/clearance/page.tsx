'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { submitRequest, ClearanceFormData } from '@/lib/submitRequest'
import { cn } from '@/lib/utils'
import { Upload, FileText, Trash2, ExternalLink } from 'lucide-react'
import { ClearanceNav } from '@/components/layout/ClearanceNav'
import type { Session } from '@supabase/supabase-js'

interface PastRequest {
  id: string
  status: string
  created_at: string
}

const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 10

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

export default function ClearancePage() {
  const router = useRouter()
  const [session, setSession] = useState<Session | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [pastRequests, setPastRequests] = useState<PastRequest[]>([])
  const [activeTab, setActiveTab] = useState<'upload' | 'property'>('upload')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Upload tab state
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadForm, setUploadForm] = useState({ address: '', district: '', email: '' })

  // Property tab state
  const [propertyForm, setPropertyForm] = useState({
    district: '',
    taluk: '',
    village: '',
    surveyNo: '',
    applicantName: '',
    email: '',
  })

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s)
      setSessionLoading(false)
      if (s) fetchPastRequests(s.user.id)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (s) fetchPastRequests(s.user.id)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function fetchPastRequests(userId: string) {
    const { data } = await supabase
      .from('clearance_requests')
      .select('id, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    if (data) setPastRequests(data)
  }

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter(
      (f) => ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE,
    )
    setFiles((prev) => {
      const names = new Set(prev.map((p) => p.name))
      const unique = valid.filter((f) => !names.has(f.name))
      return [...prev, ...unique].slice(0, MAX_FILES)
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles((prev) => prev.filter((f) => f.name !== name))
  }, [])

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }

  function buildFormData(): ClearanceFormData {
    if (activeTab === 'upload') {
      return {
        tab: 'upload',
        files,
        address: uploadForm.address,
        district: uploadForm.district,
        taluk: '',
        village: '',
        surveyNo: '',
        applicantName: '',
        email: uploadForm.email,
      }
    }
    return {
      tab: 'property',
      files: [],
      address: '',
      district: propertyForm.district,
      taluk: propertyForm.taluk,
      village: propertyForm.village,
      surveyNo: propertyForm.surveyNo,
      applicantName: propertyForm.applicantName,
      email: propertyForm.email,
    }
  }

  function validate(): boolean {
    if (activeTab === 'upload') {
      if (!uploadForm.district.trim()) { setError('District is required'); return false }
      if (!uploadForm.email.trim()) { setError('Email is required'); return false }
    } else {
      if (!propertyForm.district.trim()) { setError('District is required'); return false }
      if (!propertyForm.email.trim()) { setError('Email is required'); return false }
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return
    setError('')

    const formData = buildFormData()

    if (!session) {
      // Save to sessionStorage and redirect to auth
      const serializable = {
        ...formData,
        files: [] as { name: string; type: string; base64: string }[],
      }
      // Serialize files to base64
      for (const file of formData.files) {
        const buffer = await file.arrayBuffer()
        const base64 = btoa(
          new Uint8Array(buffer).reduce((data, byte) => data + String.fromCharCode(byte), ''),
        )
        serializable.files.push({ name: file.name, type: file.type, base64 })
      }
      sessionStorage.setItem('hatad_pending_submission', JSON.stringify(serializable))
      router.push('/clearance/auth?next=/clearance')
      return
    }

    setSubmitting(true)
    try {
      const requestId = await submitRequest(session, formData)
      router.push(`/clearance/track/${requestId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass =
    'w-full bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-[#C9A84C] transition-colors'

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
          <div className="h-full rounded-full bg-[#C9A84C] animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ClearanceNav />

      {/* Page title */}
      <div className="bg-[#0D1B2A] py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-xl font-semibold tracking-tight">
            Request a Clearance Report
          </h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Past requests */}
        {pastRequests.length > 0 && (
          <div className="mb-10">
            <h2 className="text-sm font-medium text-text-secondary tracking-wide uppercase mb-3">
              Your Requests
            </h2>
            <div className="space-y-2">
              {pastRequests.map((req) => (
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
                    <span className="text-xs text-text-muted">
                      {formatDateIST(req.created_at)}
                    </span>
                    <ExternalLink size={12} className="text-text-muted group-hover:text-[#C9A84C] transition-colors" />
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            onClick={() => { setActiveTab('upload'); setError('') }}
            className={cn(
              'px-5 py-3 text-sm font-medium tracking-wide transition-colors cursor-pointer',
              activeTab === 'upload'
                ? 'text-[#0D1B2A] border-b-2 border-[#C9A84C]'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Upload Documents
          </button>
          <button
            onClick={() => { setActiveTab('property'); setError('') }}
            className={cn(
              'px-5 py-3 text-sm font-medium tracking-wide transition-colors cursor-pointer',
              activeTab === 'property'
                ? 'text-[#0D1B2A] border-b-2 border-[#C9A84C]'
                : 'text-text-muted hover:text-text-secondary',
            )}
          >
            Request by Property
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-sm mb-6">
            {error}
          </div>
        )}

        {/* Tab A — Upload Documents */}
        {activeTab === 'upload' && (
          <div className="space-y-5">
            {/* Drop zone */}
            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                Documents · <span className="text-text-muted">EC · Patta · FMB · Sale Deed · A-Register</span>
              </label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-sm px-4 py-8 text-center cursor-pointer transition-colors',
                  dragging
                    ? 'border-[#C9A84C] bg-[#C9A84C]/5'
                    : 'border-border hover:border-[#C9A84C]/50',
                )}
              >
                <Upload size={24} className="mx-auto text-text-muted mb-2" />
                <p className="text-sm text-text-secondary">
                  Drag & drop files here, or <span className="text-[#C9A84C] font-medium">browse</span>
                </p>
                <p className="text-[11px] text-text-muted mt-1">PDF, JPG, PNG — up to 10 MB each</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  multiple
                  className="hidden"
                  onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
                />
              </div>

              {files.length > 0 && (
                <ul className="mt-3 space-y-1.5">
                  {files.map((f) => (
                    <li key={f.name} className="flex items-center gap-2 bg-surface-raised border border-border rounded-sm px-3 py-2 text-xs">
                      <FileText size={14} className="text-[#C9A84C] shrink-0" />
                      <span className="truncate text-text-primary flex-1">{f.name}</span>
                      <span className="text-text-muted shrink-0">{(f.size / 1024).toFixed(0)} KB</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeFile(f.name) }}
                        className="text-text-muted hover:text-red-500 transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                Property Address / Survey Number
              </label>
              <input
                type="text"
                placeholder="e.g. Survey 89/3, Kelambakkam"
                value={uploadForm.address}
                onChange={(e) => setUploadForm((p) => ({ ...p, address: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                District <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Chengalpattu"
                value={uploadForm.district}
                onChange={(e) => setUploadForm((p) => ({ ...p, district: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={uploadForm.email}
                onChange={(e) => setUploadForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Tab B — Request by Property */}
        {activeTab === 'property' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chennai"
                  value={propertyForm.district}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, district: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  Taluk
                </label>
                <input
                  type="text"
                  placeholder="e.g. Tambaram"
                  value={propertyForm.taluk}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, taluk: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  Village
                </label>
                <input
                  type="text"
                  placeholder="Village name"
                  value={propertyForm.village}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, village: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                  Survey / Patta Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. 89/3"
                  value={propertyForm.surveyNo}
                  onChange={(e) => setPropertyForm((p) => ({ ...p, surveyNo: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                Applicant Name
              </label>
              <input
                type="text"
                placeholder="Your full name"
                value={propertyForm.applicantName}
                onChange={(e) => setPropertyForm((p) => ({ ...p, applicantName: e.target.value }))}
                className={inputClass}
              />
            </div>

            <div>
              <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={propertyForm.email}
                onChange={(e) => setPropertyForm((p) => ({ ...p, email: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            'mt-8 w-full py-3.5 rounded-sm text-sm font-semibold tracking-wide transition-all cursor-pointer',
            'bg-[#0D1B2A] text-[#C9A84C] hover:bg-[#152238]',
            submitting && 'opacity-60 cursor-not-allowed',
          )}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-[#C9A84C]/30 border-t-[#C9A84C] rounded-full animate-spin" />
              Submitting...
            </span>
          ) : (
            'Request clearance report →'
          )}
        </button>
      </div>
    </div>
  )
}
