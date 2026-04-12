import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
      <p className="text-xs font-medium tracking-[0.25em] uppercase text-text-muted mb-4">HataD</p>
      <h1 className="font-display text-6xl sm:text-8xl font-bold text-text-primary mb-4">404</h1>
      <p className="text-sm text-text-secondary mb-8">This page doesn&rsquo;t exist.</p>
      <Link
        href="/"
        className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-[#0C1525] text-white rounded-sm hover:bg-[#152238] transition-colors"
      >
        Back to HataD
      </Link>
    </div>
  )
}
