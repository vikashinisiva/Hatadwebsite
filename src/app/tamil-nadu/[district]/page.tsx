import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  coveredDistricts,
  districtFromSlug,
  districtProfile,
  districtSlug,
  DISTRICT_DATA_SOURCE,
} from '@/lib/districts'
import { SCAN_STEPS_BASE, LOCAL_SCAN_STEPS, SOURCE_CLAIM, BUYER_FACTS } from '@/lib/departments'
import { DistrictShape } from '@/components/sections/DistrictShape'
import { SiteFooter } from '@/components/layout/PolicyPage'
import { ClearanceCTA, NavCTA } from '@/components/layout/ClearanceCTA'

export function generateStaticParams() {
  return coveredDistricts().map((d) => ({ district: districtSlug(d) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ district: string }>
}): Promise<Metadata> {
  const name = districtFromSlug((await params).district)
  if (!name) return {}
  const p = districtProfile(name)!
  return {
    title: `Land Record Verification in ${name}`,
    description: `${p.activeSROs.length} Sub-Registrar Offices serve ${p.villageCount} villages in ${name}. Which office holds your parcel, how far back its register goes, and the statutory checks that apply here.`,
    alternates: { canonical: `/tamil-nadu/${districtSlug(name)}` },
  }
}

export default async function DistrictPage({
  params,
}: {
  params: Promise<{ district: string }>
}) {
  const name = districtFromSlug((await params).district)
  if (!name) notFound()
  const p = districtProfile(name)!
  const local = LOCAL_SCAN_STEPS[name.toUpperCase()] ?? []
  const biggest = p.activeSROs[0]

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm tracking-[0.14em] text-text-primary">
            HATAD
          </Link>
          <NavCTA />
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-16">
        <nav className="font-mono text-[11px] tracking-[0.09em] uppercase text-text-muted mb-6">
          <Link href="/" className="hover:text-accent-blue">
            Tamil Nadu
          </Link>
          <span className="mx-2 opacity-40">/</span>
          <span className="text-text-secondary">{name}</span>
        </nav>

        {/* Hero: the district's own outline, in the state. */}
        <div className="grid md:grid-cols-[1fr_15rem] lg:grid-cols-[1fr_18rem] gap-6 md:gap-10 items-center">
          <div className="order-2 md:order-1">
            <h1 className="font-serif text-[2.4rem] md:text-[3.4rem] font-semibold tracking-[-0.02em] leading-[1.02] text-text-primary text-balance">
              {name}
            </h1>
            <p className="mt-4 text-[17px] leading-relaxed text-text-secondary max-w-[46ch]">
              {p.villageCount.toLocaleString('en-IN')} villages
              {p.wardCount > 0 && ` and ${p.wardCount} town wards`}, {p.activeSROs.length}{' '}
              Sub-Registrar {p.activeSROs.length === 1 ? 'Office' : 'Offices'}, and{' '}
              {local.length > 0 ? (
                <>
                  <strong className="text-text-primary font-semibold">
                    {local.length} statutory {local.length === 1 ? 'check' : 'checks'}
                  </strong>{' '}
                  that apply here and almost nowhere else in Tamil Nadu.
                </>
              ) : (
                <>the {SCAN_STEPS_BASE.length} checks that run on every parcel in the state.</>
              )}
            </p>

            <dl className="mt-8 flex flex-wrap gap-x-10 gap-y-4 font-mono text-[11px] tracking-[0.06em] uppercase text-text-muted">
              <div>
                <dt>Registration</dt>
                <dd className="mt-1 text-[13px] normal-case tracking-normal text-text-secondary font-sans">
                  {p.registrationDistricts.join(', ')}
                </dd>
              </div>
              <div>
                <dt>Zone</dt>
                <dd className="mt-1 text-[13px] normal-case tracking-normal text-text-secondary font-sans">
                  {p.zones.join(', ')}
                </dd>
              </div>
              {biggest && (
                <div>
                  <dt>Largest office</dt>
                  <dd className="mt-1 text-[13px] normal-case tracking-normal text-text-secondary font-sans">
                    {biggest.name}, {biggest.villages.length} villages
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {/* Small: a locator mark above the headline, sized so it reads without
              taking the screen. Medium and up: the full plate beside it. */}
          <div className="order-1 md:order-2 w-24 sm:w-28 md:w-auto">
            <DistrictShape district={name} />
          </div>
        </div>

        {/* checks */}
        <section className="mt-20 border-t border-border pt-10">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-muted mb-2">
            The checks
          </p>
          <h2 className="font-serif text-[1.7rem] md:text-[2.1rem] font-semibold tracking-tight text-text-primary mb-6">
            {local.length > 0
              ? `Four run everywhere. ${local.length === 1 ? 'One does' : `${local.length} do`} not.`
              : 'What runs on every parcel in the state.'}
          </h2>

          <ol className="divide-y divide-border border-y border-border">
            {[...SCAN_STEPS_BASE, ...local].map((step, i) => {
              const isLocal = i >= SCAN_STEPS_BASE.length
              return (
                <li
                  key={step.label}
                  className={`grid grid-cols-[2.2rem_1fr] gap-4 py-4 ${isLocal ? 'bg-[#FBF7EA]' : ''}`}
                >
                  <span className="font-mono text-[11px] text-text-muted tabular-nums pt-1 pl-3">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="pr-3">
                    <span className="font-mono text-[13px] tracking-[0.05em] text-text-primary">
                      {step.label}
                    </span>
                    {isLocal && (
                      <span className="ml-2 font-mono text-[9.5px] tracking-[0.1em] uppercase text-[#8A6F1E]">
                        {name} only
                      </span>
                    )}
                    {(step.detail ?? step.why) && (
                      <p className="text-[14px] leading-relaxed text-text-secondary mt-1 max-w-[58ch]">
                        {step.detail ?? step.why}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="mt-4 text-[13px] text-text-muted max-w-[58ch]">
            Every parcel is read against all {SOURCE_CLAIM} sources regardless; these are the ones
            this district triggers by where it is.
          </p>
        </section>

        {/* offices */}
        <section className="mt-16">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-muted mb-2">
            The offices
          </p>
          <h2 className="font-serif text-[1.7rem] md:text-[2.1rem] font-semibold tracking-tight text-text-primary mb-2">
            Where {name}&rsquo;s deeds are registered
          </h2>
          <p className="text-[15px] text-text-secondary mb-6 max-w-[56ch]">
            Which office holds your parcel decides which register your deed sits in, and how far back
            that register goes. Ordered by the number of villages each one serves.
          </p>

          {/* Names are in the markup, collapsed rather than absent: they are the
              most searched thing on the page and the answer to "which office
              covers my village", but 278 of them would bury everything else. */}
          <ul className="border-t border-border">
            {p.activeSROs.map((office) => (
              <li key={office.name} className="border-b border-border">
                <details className="group">
                  <summary className="flex items-baseline gap-3 py-2.5 cursor-pointer list-none text-[13.5px] sm:text-[14px]">
                    <span className="text-text-primary min-w-0">{office.name}</span>
                    <span className="flex-1 border-b border-dotted border-[#CBD5E8] translate-y-[-3px]" />
                    <span className="font-mono text-[12px] text-text-muted tabular-nums whitespace-nowrap">
                      {office.villages.length}
                      {office.wards.length > 0 && ` + ${office.wards.length}w`}
                    </span>
                  </summary>
                  <div className="pb-4 pt-1 text-[13px] leading-relaxed text-text-secondary">
                    {office.villages.join(' · ')}
                    {office.wards.length > 0 && (
                      <p className="mt-2 text-text-muted">
                        <span className="font-mono text-[11px] uppercase tracking-[0.08em]">
                          Wards:
                        </span>{' '}
                        {office.wards.join(' · ')}
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ul>
          <p className="mt-5 text-[12px] leading-relaxed text-text-muted max-w-[58ch]">
            Office and village mapping from{' '}
            <a
              href={DISTRICT_DATA_SOURCE.url}
              rel="noopener noreferrer"
              target="_blank"
              className="underline underline-offset-2"
            >
              {DISTRICT_DATA_SOURCE.name}
            </a>
            , retrieved {DISTRICT_DATA_SOURCE.retrieved}. Offices open and close; where a third party
            directory disagrees with the department, the department is the record.
          </p>
        </section>

        {p.zoneSiblings.length > 0 && (
          <section className="mt-12">
            <p className="text-[15px] leading-relaxed text-text-secondary max-w-[58ch]">
              {name} sits in the {p.zones.join(' and ')} registration{' '}
              {p.zones.length > 1 ? 'zones' : 'zone'}, which also covers{' '}
              {p.zoneSiblings.map((sib, i) => (
                <span key={sib}>
                  {i > 0 && (i === p.zoneSiblings.length - 1 ? ' and ' : ', ')}
                  <Link
                    href={`/tamil-nadu/${districtSlug(sib)}`}
                    className="text-accent-blue underline underline-offset-2"
                  >
                    {sib}
                  </Link>
                </span>
              ))}
              . A zone is supervised by one Deputy Inspector General of Registration, so practice
              and record-keeping tend to be consistent across it.
            </p>
          </section>
        )}

        {p.closedSROs.length > 0 && (
          <section className="mt-12">
            <div className="border-l-2 border-[#A6402F] pl-5">
              <h3 className="font-semibold text-text-primary mb-1.5">
                {p.closedSROs.length === 1
                  ? 'One office is closed'
                  : `${p.closedSROs.length} offices are closed`}
              </h3>
              <p className="text-[15px] leading-relaxed text-text-secondary max-w-[58ch]">
                {p.closedSROs.join(', ')}. The villages were redistributed, but the historical
                register did not move with them, and a search that stops at the current office will
                not reach it.
              </p>
            </div>
          </section>
        )}

        <section className="mt-16 border-t border-border pt-10">
          <h2 className="font-serif text-[1.7rem] md:text-[2.1rem] font-semibold tracking-tight text-text-primary mb-3">
            What is online, and what is not
          </h2>
          <p className="text-[15px] leading-relaxed text-text-secondary max-w-[58ch]">
            TNREGINET returns encumbrance data from the point each office was digitised. Everything
            before that exists as bound volumes at the office itself, indexed by hand. A title chain
            that stops at the digitisation year is the visible half of one.{' '}
            <Link
              href="/journal/when-land-records-contradict-tamil-nadu"
              className="text-accent-blue underline underline-offset-2"
            >
              More on what the records do not show
            </Link>
            .
          </p>
        </section>

        {/* The practical half. The statutory checks above are what no
            competitor can write; this is what every buyer actually searches
            for, and both belong on the page. Emitted as FAQPage schema from
            the same source it renders from. */}
        <section className="mt-16 border-t border-border pt-10">
          <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-muted mb-2">
            Before you buy
          </p>
          <h2 className="font-serif text-[1.7rem] md:text-[2.1rem] font-semibold tracking-tight text-text-primary mb-6">
            What it costs, and what it does not settle
          </h2>
          <div className="space-y-6">
            {BUYER_FACTS.items.map((f) => (
              <div key={f.q}>
                <p className="text-[15px] font-semibold text-text-primary mb-1">{f.q}</p>
                <p className="text-[15px] leading-relaxed text-text-secondary max-w-[60ch]">{f.a}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-[12px] text-text-muted">
            Rates verified {BUYER_FACTS.verified}. Check against the Registration Department before a
            transaction.
          </p>
        </section>

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              inLanguage: 'en-IN',
              mainEntity: BUYER_FACTS.items.map((f) => ({
                '@type': 'Question',
                name: f.q,
                acceptedAnswer: { '@type': 'Answer', text: f.a },
              })),
            }),
          }}
        />

        <ClearanceCTA district={name} />

        <SiteFooter />
      </div>
    </div>
  )
}
