import type { Metadata } from 'next'
import { PolicyPage, PolicySection } from '@/components/layout/PolicyPage'
import { CLEARANCE_PRICE_INR, REPORT_TURNAROUND_HOURS, TN_DISTRICTS, COMPANY } from '@/lib/constants'
import { SOURCE_CLAIM } from '@/lib/departments'

export const metadata: Metadata = {
  /* Carries the query, not just the section name. The layout appends
     "| HataD", so the title must not spend its words on the brand. */
  title: 'Land Clearance Report Pricing',
  description: `HataD land clearance report pricing. ${CLEARANCE_PRICE_INR} per parcel, inclusive of taxes, delivered within ${REPORT_TURNAROUND_HOURS} hours.`,
  alternates: { canonical: '/pricing' },
}

export default function PricingPage() {
  return (
    <PolicyPage title="Pricing" updated="August 17, 2026">
      <PolicySection heading="Land clearance report">
        <p className="text-2xl font-semibold text-text-primary">
          {CLEARANCE_PRICE_INR}{' '}
          <span className="text-sm font-normal text-text-secondary">per parcel</span>
        </p>
        <p className="mt-3">
          One price, charged once, for one survey number. Inclusive of all applicable taxes. There
          is no subscription, no per-department charge, and no fee for a report that comes back
          clean.
        </p>
      </PolicySection>

      <PolicySection heading="What is included">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            A search across {SOURCE_CLAIM} government departments and courts, selected for the
            parcel: a coastal plot and an inland one are not checked against the same list.
          </li>
          <li>
            Ownership and the chain of deeds behind it, encumbrances, revenue classification, the
            survey position, planning and acquisition status, and any custodial or statutory claim.
          </li>
          <li>Every finding cited to the record it came from.</li>
          <li>
            Retrieval of records that are not available online, including documents held only in
            physical form at a government office.
          </li>
          <li>Delivery within {REPORT_TURNAROUND_HOURS} hours for the standard record set.</li>
          <li>Any district in Tamil Nadu, all {TN_DISTRICTS.length} of them.</li>
        </ul>
      </PolicySection>

      <PolicySection heading="What is not included">
        <p>
          Statutory fees payable to a government department for a certified copy, where you ask us to
          obtain one on your behalf, are charged at cost and quoted to you before we incur them. We
          do not add a margin to them.
        </p>
        <p className="mt-3">
          Legal opinion, drafting, and representation are not included and are not services we offer.
        </p>
      </PolicySection>

      <PolicySection heading="Payment">
        <p>
          Payments are processed by Razorpay in Indian Rupees. We do not see or store your card or
          bank details. The full amount is payable before the report is prepared.
        </p>
        <p className="mt-3">
          Cancellations and refunds are governed by our{' '}
          <a href="/refunds" className="text-accent-blue underline">
            refund policy
          </a>
          . Delivery is described in our{' '}
          <a href="/shipping" className="text-accent-blue underline">
            delivery policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection heading="Changes to pricing">
        <p>
          We may change this price at any time. The price shown on the payment screen at the moment
          you pay is the price that applies to your order, and a change never applies to an order
          already placed.
        </p>
        <p className="mt-3">
          For bulk or institutional volumes, write to{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>
          .
        </p>
      </PolicySection>
    </PolicyPage>
  )
}
