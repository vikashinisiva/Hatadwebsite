'use client'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <p className="text-xs font-medium tracking-[0.25em] uppercase text-text-muted mb-4">HataD</p>
      <h1 className="font-display text-4xl sm:text-5xl font-bold text-text-primary mb-4">Something went wrong</h1>
      <p className="text-sm text-text-secondary mb-8">We&rsquo;re looking into it. Try again.</p>
      <button
        onClick={reset}
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-[#0C1525] text-white rounded-sm hover:bg-[#152238] transition-colors cursor-pointer"
      >
        Try Again
      </button>
    </div>
  )
}
