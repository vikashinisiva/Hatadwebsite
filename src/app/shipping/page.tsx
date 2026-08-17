import type { Metadata } from 'next'
import { PolicyPage, PolicySection, CompanyAddress } from '@/components/layout/PolicyPage'
import { COMPANY, REPORT_TURNAROUND_HOURS, TN_DISTRICTS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Shipping & Delivery Policy',
  description: `How HataD land clearance reports are delivered: digitally, within ${REPORT_TURNAROUND_HOURS} hours, to your account on hatad.in.`,
  alternates: { canonical: '/shipping' },
}

export default function ShippingPage() {
  return (
    <PolicyPage title="Shipping & Delivery Policy" updated="August 17, 2026">
      <PolicySection heading="Nothing is shipped">
        <p>
          HataD delivers a digital report. There is no physical product, no courier, and no delivery
          charge. Nothing is posted to you and we do not need your postal address to fulfil an order.
        </p>
      </PolicySection>

      <PolicySection heading="How the report reaches you">
        <p>
          Your report is placed in your account on{' '}
          <a href="https://www.hatad.in" className="text-accent-blue underline">
            hatad.in
          </a>{' '}
          and you are emailed when it is ready. You download it from there, signed in as the account
          that placed the order.
        </p>
        <p className="mt-3">
          Reports are never sent as an email attachment and the download link is not a public
          address. It is issued against your signed-in session, because the report describes a
          specific person&rsquo;s land and should not be forwardable by anyone who obtains the URL.
        </p>
      </PolicySection>

      <PolicySection heading="How long it takes">
        <p>
          Standard delivery is within <strong>{REPORT_TURNAROUND_HOURS} hours</strong> of a completed
          payment, for the record set that can be read remotely. This is the ordinary case.
        </p>
        <p className="mt-3">
          Some records cannot be read remotely. Where a deed, an encumbrance certificate or a revenue
          extract exists only in physical form at a government office, retrieving it means attending
          that office during its working hours, and no online service can do it in{' '}
          {REPORT_TURNAROUND_HOURS} hours. Where your parcel needs one of these, we tell you before
          we begin, give you an expected date, and deliver the remotely readable findings on the
          standard clock rather than making you wait for everything.
        </p>
        <p className="mt-3">
          Delivery may also run late when a government portal or department is unavailable. If your
          report will be late for any reason, we email you rather than letting the deadline pass in
          silence.
        </p>
      </PolicySection>

      <PolicySection heading="Where we deliver">
        <p>
          We prepare reports for land in Tamil Nadu, in all {TN_DISTRICTS.length} districts. The
          report itself can be downloaded from anywhere.
        </p>
      </PolicySection>

      <PolicySection heading="If your report does not arrive">
        <p>
          Check the spam or promotions folder of the address you signed up with, then sign in at
          hatad.in and look at the order directly, since the report is there whether or not the email
          reached you.
        </p>
        <p className="mt-3">
          If it is not there and the expected time has passed, email{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>{' '}
          with your request number. Non-delivery is refundable in full under our{' '}
          <a href="/refunds" className="text-accent-blue underline">
            refund policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection heading="Contact">
        <CompanyAddress />
      </PolicySection>
    </PolicyPage>
  )
}
