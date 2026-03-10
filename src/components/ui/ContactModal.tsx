'use client'

import { useState, useRef, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, FileText, Trash2 } from 'lucide-react'
import Stepper, { Step } from './Stepper'

interface ContactModalProps {
  trigger: React.ReactNode
}

export function ContactModal({ trigger }: ContactModalProps) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [stepError, setStepError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({
    name: '',
    company: '',
    countryCode: '+91',
    phone: '',
    email: '',
    district: '',
    village: '',
    surveyNo: '',
    documents: '',
    urgency: 'standard',
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
    if (stepError) setStepError('')
  }

  const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per file
  const MAX_FILES = 5
  const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const valid = Array.from(incoming).filter((f) => {
      if (!ACCEPTED_TYPES.includes(f.type)) return false
      if (f.size > MAX_FILE_SIZE) return false
      return true
    })
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

  function validateStep(step: number): boolean {
    if (step === 1) {
      if (!form.name.trim()) { setStepError('Name is required'); return false }
      if (!form.phone.trim()) { setStepError('Phone number is required'); return false }
    }
    if (step === 2) {
      if (!form.district.trim()) { setStepError('District is required'); return false }
      if (!form.village.trim()) { setStepError('Village / Area is required'); return false }
    }
    setStepError('')
    return true
  }

  async function handleComplete() {
    setSubmitting(true)
    setError('')
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      files.forEach((f) => fd.append('files', f))

      const res = await fetch('/api/contact', {
        method: 'POST',
        body: fd,
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Something went wrong')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleOpenChange(v: boolean) {
    setOpen(v)
    if (!v) {
      setTimeout(() => {
        setSubmitted(false)
        setError('')
        setStepError('')
        setFiles([])
      }, 300)
    }
  }

  const inputClass =
    'w-full bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-accent-blue transition-colors'

  return (
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild onOpenAutoFocus={(e) => e.preventDefault()}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 bg-surface border border-border rounded-sm p-8 shadow-2xl"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <Dialog.Title className="text-xl font-semibold text-text-primary">
                      Request a Land Clearance Report
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-text-secondary mt-1">
                      Complete the steps below. We&apos;ll follow up within 2 hours.
                    </Dialog.Description>
                  </div>
                  <Dialog.Close asChild>
                    <button className="text-text-muted hover:text-text-primary transition-colors cursor-pointer">
                      <X size={18} />
                    </button>
                  </Dialog.Close>
                </div>

                {(error || stepError) && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-sm mb-4">
                    {error || stepError}
                  </div>
                )}

                {submitting ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="py-14 flex flex-col items-center gap-5"
                  >
                    <div className="w-40 h-[3px] rounded-full bg-surface-raised overflow-hidden">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-accent-blue/40 via-accent-blue to-accent-blue/40"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{ duration: 1.4, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
                        style={{ width: '60%' }}
                      />
                    </div>
                    <p className="text-sm text-text-muted tracking-wide">Submitting your request…</p>
                  </motion.div>
                ) : submitted ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 rounded-full bg-accent-blue/20 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-accent-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-text-primary font-medium">Request Received</p>
                    <p className="text-text-secondary text-sm mt-2">
                      We&apos;ll be in touch shortly to begin your clearance.
                    </p>
                  </div>
                ) : (
                  <Stepper
                    initialStep={1}
                    onFinalStepCompleted={handleComplete}
                    onBeforeNext={validateStep}
                    backButtonText="Previous"
                    nextButtonText="Next"
                    stepLabels={['Details', 'Property', 'Documents']}
                  >
                    {/* Step 1 — Contact Info */}
                    <Step>
                      <div className="space-y-4">
                        <p className="text-xs font-medium tracking-wider uppercase text-text-muted mb-4">
                          Your Details
                        </p>
                        <div>
                          <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                            Full Name <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="name"
                            placeholder="Enter your full name"
                            value={form.name}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                            Phone Number <span className="text-red-500">*</span>
                          </label>
                          <div className="flex gap-2">
                            <select
                              name="countryCode"
                              value={form.countryCode}
                              onChange={handleChange}
                              className="bg-surface-raised border border-border text-text-primary text-sm px-2 py-2.5 rounded-sm focus:outline-none focus:border-accent-blue transition-colors w-[100px] flex-shrink-0"
                            >
                              <option value="+91">🇮🇳 +91</option>
                              <option value="+1">🇺🇸 +1</option>
                              <option value="+44">🇬🇧 +44</option>
                              <option value="+971">🇦🇪 +971</option>
                              <option value="+65">🇸🇬 +65</option>
                              <option value="+60">🇲🇾 +60</option>
                              <option value="+61">🇦🇺 +61</option>
                              <option value="+49">🇩🇪 +49</option>
                              <option value="+33">🇫🇷 +33</option>
                              <option value="+81">🇯🇵 +81</option>
                              <option value="+86">🇨🇳 +86</option>
                              <option value="+966">🇸🇦 +966</option>
                              <option value="+974">🇶🇦 +974</option>
                              <option value="+94">🇱🇰 +94</option>
                            </select>
                            <input
                              type="tel"
                              name="phone"
                              placeholder="Phone number"
                              value={form.phone}
                              onChange={handleChange}
                              className="bg-surface-raised border border-border text-text-primary placeholder:text-text-muted text-sm px-3 py-2.5 rounded-sm focus:outline-none focus:border-accent-blue transition-colors flex-1 min-w-0"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                              Email
                            </label>
                            <input
                              type="email"
                              name="email"
                              placeholder="Optional"
                              value={form.email}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                              Company / Firm
                            </label>
                            <input
                              type="text"
                              name="company"
                              placeholder="Optional"
                              value={form.company}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </Step>

                    {/* Step 2 — Property Details */}
                    <Step>
                      <div className="space-y-4">
                        <p className="text-xs font-medium tracking-wider uppercase text-text-muted mb-4">
                          Property Information
                        </p>
                        <div>
                          <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                            District <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            name="district"
                            placeholder="e.g. Chengalpattu, Chennai"
                            value={form.district}
                            onChange={handleChange}
                            className={inputClass}
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                              Village / Area <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              name="village"
                              placeholder="Village name"
                              value={form.village}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                              Survey Number
                            </label>
                            <input
                              type="text"
                              name="surveyNo"
                              placeholder="e.g. 89/3"
                              value={form.surveyNo}
                              onChange={handleChange}
                              className={inputClass}
                            />
                          </div>
                        </div>
                      </div>
                    </Step>

                    {/* Step 3 — Documents & Urgency */}
                    <Step>
                      <div className="space-y-4">
                        <p className="text-xs font-medium tracking-wider uppercase text-text-muted mb-4">
                          Documents & Timeline
                        </p>
                        <div>
                          <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                            Documents Available
                          </label>
                          <textarea
                            name="documents"
                            placeholder="e.g. Sale deed, Patta, EC, Parent documents..."
                            value={form.documents}
                            onChange={handleChange}
                            rows={3}
                            className={`${inputClass} resize-none`}
                          />
                        </div>
                        {/* Upload area */}
                        <div>
                          <label className="block text-xs text-text-secondary tracking-wide mb-1.5">
                            Upload Documents <span className="text-text-muted">(PDF, JPG, PNG — max 10 MB each)</span>
                          </label>
                          <div
                            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                            onDragLeave={() => setDragging(false)}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-sm px-4 py-5 text-center cursor-pointer transition-colors ${
                              dragging
                                ? 'border-accent-blue bg-accent-blue/5'
                                : 'border-border hover:border-accent-blue/50'
                            }`}
                          >
                            <Upload size={20} className="mx-auto text-text-muted mb-1.5" />
                            <p className="text-xs text-text-secondary">
                              Drag & drop files here, or <span className="text-accent-blue font-medium">browse</span>
                            </p>
                            <p className="text-[10px] text-text-muted mt-1">Up to {MAX_FILES} files</p>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept=".pdf,.jpg,.jpeg,.png,.webp"
                              multiple
                              className="hidden"
                              onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
                            />
                          </div>

                          {files.length > 0 && (
                            <ul className="mt-2 space-y-1.5">
                              {files.map((f) => (
                                <li key={f.name} className="flex items-center gap-2 bg-surface-raised border border-border rounded-sm px-3 py-1.5 text-xs">
                                  <FileText size={14} className="text-accent-blue shrink-0" />
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
                            Urgency
                          </label>
                          <select
                            name="urgency"
                            value={form.urgency}
                            onChange={handleChange}
                            className={inputClass}
                          >
                            <option value="standard">Standard (Under 3 hours)</option>
                            <option value="urgent">Urgent (Priority queue)</option>
                          </select>
                        </div>
                        <div className="bg-surface-raised border border-border rounded-sm px-4 py-3 mt-2">
                          <p className="text-xs text-text-muted">
                            By submitting, you agree that our team will review your property details and reach out to begin the verification process.
                          </p>
                        </div>
                      </div>
                    </Step>
                  </Stepper>
                )}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
