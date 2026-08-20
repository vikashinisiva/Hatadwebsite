import type { Metadata } from 'next'
import Link from 'next/link'
import {
  coveredDistricts,
  districtProfile,
  districtSlug,
  DISTRICT_DATA_SOURCE,
} from '@/lib/districts'
import { SiteFooter } from '@/components/layout/PolicyPage'
import { NavCTA } from '@/components/layout/ClearanceCTA'

export const metadata: Metadata = {
  title: 'Land Records by District, Tamil Nadu',
  description:
    'Every Tamil Nadu district, the Sub-Registrar Offices that serve it, and the villages under each office. Which office holds your parcel decides which register your deed sits in.',
  alternates: { canonical: '/tamil-nadu' },
  openGraph: {
    title: 'Tamil Nadu land records, district by district',
    description:
      'Sub-Registrar Offices and the villages each one serves, for all 38 districts.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'HataD',
    url: 'https://www.hatad.in/tamil-nadu',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'Tamil Nadu land records' }],
  },
}

export default function DistrictIndex() {
  const districts = coveredDistricts().map((d) => ({ name: d, p: districtProfile(d)! }))

  /* Grouped by registration zone rather than alphabetically. A zone is one
     Deputy Inspector General of Registration, so it is the unit practice
     actually varies by, and it puts neighbouring districts next to each
     other instead of scattering them across an A-to-Z list. */
  const byZone = new Map<string, typeof districts>()
  for (const d of districts) {
    const zone = d.p.zones[0]
    if (!byZone.has(zone)) byZone.set(zone, [])
    byZone.get(zone)!.push(d)
  }
  const zones = [...byZone.entries()].sort((a, b) => a[0].localeCompare(b[0]))

  const totalVillages = districts.reduce((n, d) => n + d.p.villageCount, 0)
  const totalOffices = districts.reduce((n, d) => n + d.p.activeSROs.length, 0)

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

      <div className="max-w-5xl mx-auto px-6 pt-12 pb-16">
        <h1 className="font-serif text-[2.4rem] md:text-[3.2rem] font-semibold tracking-[-0.02em] leading-[1.04] text-text-primary">
          Tamil Nadu, district by district
        </h1>
        <p className="mt-4 text-[17px] leading-relaxed text-text-secondary max-w-[52ch]">
          {totalOffices} Sub-Registrar Offices across {districts.length} districts, and the{' '}
          {totalVillages.toLocaleString('en-IN')} villages they serve between them. Which office
          holds your parcel decides which register your deed sits in, and how far back that register
          goes.
        </p>

        <div className="mt-14 space-y-10">
          {zones.map(([zone, list]) => (
            <section key={zone}>
              <h2 className="font-mono text-[11px] tracking-[0.14em] uppercase text-text-muted border-b border-border pb-2 mb-3">
                {zone} zone
              </h2>
              <ul className="grid sm:grid-cols-2 lg:grid-cols-3 gap-x-8">
                {list
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .map(({ name, p }) => (
                    <li key={name} className="py-2 border-b border-border">
                      <Link href={`/tamil-nadu/${districtSlug(name)}`} className="group block">
                        <span className="text-[15px] text-text-primary group-hover:text-accent-blue">
                          {name}
                        </span>
                        <span className="block font-mono text-[11px] text-text-muted tabular-nums mt-0.5">
                          {p.activeSROs.length} offices · {p.villageCount.toLocaleString('en-IN')}{' '}
                          villages
                        </span>
                      </Link>
                    </li>
                  ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-12 text-[12px] leading-relaxed text-text-muted max-w-[58ch]">
          Office and village mapping from{' '}
          <a
            href={DISTRICT_DATA_SOURCE.url}
            rel="noopener noreferrer"
            target="_blank"
            className="underline underline-offset-2"
          >
            {DISTRICT_DATA_SOURCE.name}
          </a>
          , retrieved {DISTRICT_DATA_SOURCE.retrieved}. Town and city wards are counted separately
          from villages on each district page.
        </p>

        <SiteFooter />
      </div>
    </div>
  )
}
