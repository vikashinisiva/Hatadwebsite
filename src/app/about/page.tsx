import type { Metadata } from 'next'
import { PolicyPage, PolicySection, CompanyAddress } from '@/components/layout/PolicyPage'
import { COMPANY, TN_DISTRICTS, REPORT_TURNAROUND_HOURS } from '@/lib/constants'
import { SOURCE_CLAIM } from '@/lib/departments'

export const metadata: Metadata = {
  title: 'About Us',
  description: `About ${COMPANY.legalName}, which operates HataD, a land record verification service for Tamil Nadu.`,
  alternates: { canonical: '/about' },
}

export default function AboutPage() {
  return (
    <PolicyPage title="About Us" updated="August 17, 2026">
      <PolicySection heading="Who we are">
        <p>
          HataD is operated by {COMPANY.legalName}, a company registered in India and based in{' '}
          {COMPANY.city}, {COMPANY.region}.
        </p>
        <p className="mt-3">
          We verify land records for buyers, advocates, and lenders in Tamil Nadu. A buyer gives us
          a survey number, or their location on a map. We read what the government actually holds
          against that parcel and return a single report describing what we found.
        </p>
      </PolicySection>

      <PolicySection heading="What the service does">
        <p>
          Land records in Tamil Nadu are public, and they are scattered. Title sits with the
          Registration Department, tax and classification with Revenue, the boundary sketch with
          Survey, and a pending suit with the courts, which index by the names of the parties rather
          than by the land. {SOURCE_CLAIM} separate departments and courts hold a piece of the
          answer, and none of them was built to be read alongside the others.
        </p>
        <p className="mt-3">
          We read them together. The report sets out ownership and the chain of deeds behind it,
          encumbrances, the revenue classification, what the survey sketch shows, planning and
          acquisition status, and any custodial or statutory claim registered against the parcel.
          Every finding cites the record it came from.
        </p>
        <p className="mt-3">
          Not all of those records are online. Where a document exists only as a bound volume at an
          office, we send someone to read it rather than reporting that the trail stops at the point
          the state finished digitising.
        </p>
      </PolicySection>

      <PolicySection heading="What it is not">
        <p>
          A HataD report is an account of what the government records say, with the source named for
          each finding. It is not legal advice, not a title guarantee, and not insurance. It is
          written to be taken to an advocate, not to replace one.
        </p>
      </PolicySection>

      <PolicySection heading="Coverage and delivery">
        <p>
          All {TN_DISTRICTS.length} districts of Tamil Nadu. Standard reports are delivered within{' '}
          {REPORT_TURNAROUND_HOURS} hours of a completed order. Where a record has to be retrieved
          in person, delivery takes longer and we tell you before that work starts. See our{' '}
          <a href="/shipping" className="text-accent-blue underline">
            delivery policy
          </a>{' '}
          for detail.
        </p>
      </PolicySection>

      <PolicySection heading="Contact">
        <p>
          Questions about the service, or about a report already delivered, reach us at the address
          below. Our{' '}
          <a href="/contact" className="text-accent-blue underline">
            contact page
          </a>{' '}
          lists response times.
        </p>
        <CompanyAddress />
      </PolicySection>
    </PolicyPage>
  )
}
