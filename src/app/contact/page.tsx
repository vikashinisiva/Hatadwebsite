import type { Metadata } from 'next'
import { PolicyPage, PolicySection, CompanyAddress } from '@/components/layout/PolicyPage'
import { COMPANY } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Contact Us',
  description: `Contact ${COMPANY.legalName}, which operates HataD. Email, phone, and registered office in ${COMPANY.city}, ${COMPANY.region}.`,
  alternates: { canonical: '/contact' },
}

export default function ContactPage() {
  return (
    <PolicyPage title="Contact Us" updated="August 17, 2026">
      <PolicySection heading="Registered office">
        <p>HataD is operated by {COMPANY.legalName}.</p>
        <CompanyAddress />
      </PolicySection>

      <PolicySection heading="How to reach us">
        <p>
          <strong>Email.</strong>{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>{' '}
          is the fastest route and the one we prefer, because it leaves both of us a record. If your
          question concerns a report you have already ordered, quote the request number from your
          confirmation email.
        </p>
        <p className="mt-3">
          <strong>Phone.</strong>{' '}
          <a href={`tel:${COMPANY.phoneHref}`} className="text-accent-blue underline">
            {COMPANY.phone}
          </a>
          , Monday to Saturday, 10:00 to 18:00 IST, excluding public holidays in Tamil Nadu.
        </p>
      </PolicySection>

      <PolicySection heading="Response times">
        <p>
          We reply to email within one working day. Questions about an order already in progress are
          answered the same working day.
        </p>
        <p className="mt-3">
          If you have not heard from us within two working days, assume the message did not arrive
          and call rather than waiting.
        </p>
      </PolicySection>

      <PolicySection heading="Complaints and grievances">
        <p>
          Write to{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>{' '}
          with the word &ldquo;Grievance&rdquo; in the subject line and include your request number.
          We acknowledge within two working days and aim to resolve within fifteen working days of
          acknowledgement.
        </p>
        <p className="mt-3">
          Refund and cancellation questions are handled under our{' '}
          <a href="/refunds" className="text-accent-blue underline">
            refund policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection heading="What we cannot do by phone or email">
        <p>
          We cannot give legal advice, confirm whether you should proceed with a purchase, or
          interpret a report as a recommendation. We report what the records say and cite the source.
          The decision, and the legal opinion behind it, belongs with your advocate.
        </p>
      </PolicySection>
    </PolicyPage>
  )
}
