import { COMPANY } from '@/lib/constants'

/**
 * Shared chrome for the statutory pages.
 *
 * /terms, /privacy and /cookies each hand-roll this same header and container.
 * The five pages added for Razorpay share it instead: eight copies of a dark
 * bar and a max-width column is eight places for them to drift apart, and the
 * one thing these pages must not do is disagree with each other.
 *
 * The older three are deliberately left alone. They still name Hypse Aero
 * Private Limited throughout, and reconciling that is a decision about which
 * entity is the merchant, not a refactor.
 */
export function PolicyPage({
  title,
  updated,
  children,
}: {
  title: string
  /** Shown under the title. Written as a literal date per page, not generated,
      so a redeploy cannot silently claim the policy changed today. */
  updated: string
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0D1B2A] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.15em] uppercase mb-2">
            HataD · Land Clearance Intelligence
          </p>
          <h1 className="text-white text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-white/40 text-xs mt-1">Last updated: {updated}</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">{children}</div>
      </div>
    </div>
  )
}

/** A titled block. Every one of these pages is a stack of them. */
export function PolicySection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section>
      <h2 className="text-base font-semibold text-text-primary mb-2">{heading}</h2>
      {children}
    </section>
  )
}

/**
 * The registered-entity block, identical everywhere it appears.
 *
 * Renders the street line only when COMPANY.registeredAddress is set. While it
 * is empty the address reads city, region, country, which is true. An invented
 * street on a page a payment processor reads is worse than a short one.
 */
export function CompanyAddress() {
  return (
    <p className="mt-3">
      {COMPANY.legalName}
      <br />
      {COMPANY.registeredAddress && (
        <>
          {COMPANY.registeredAddress}
          <br />
        </>
      )}
      {COMPANY.city}, {COMPANY.region}
      <br />
      {COMPANY.country}
      <br />
      Phone:{' '}
      <a href={`tel:${COMPANY.phoneHref}`} className="text-accent-blue underline">
        {COMPANY.phone}
      </a>
      <br />
      Email:{' '}
      <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
        {COMPANY.email}
      </a>
    </p>
  )
}
