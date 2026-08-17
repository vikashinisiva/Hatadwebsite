import type { Metadata } from 'next'
import { PolicyPage, PolicySection, CompanyAddress } from '@/components/layout/PolicyPage'
import { COMPANY, REPORT_TURNAROUND_HOURS } from '@/lib/constants'

export const metadata: Metadata = {
  title: 'Cancellation & Refund Policy',
  description:
    'When a HataD land clearance report can be cancelled, when it can be refunded, and how long a refund takes.',
  alternates: { canonical: '/refunds' },
}

/*
 * The commercial terms here are business decisions, not derived facts. The
 * windows and periods below (cancellation before work starts, a 7 day window to
 * raise a problem, 5 to 7 working days to process) are the ones already implied
 * by /terms, written out concretely because "generally non-refundable" is not a
 * policy a payment processor can assess. Change them here if the business
 * decides differently, and change /terms section 5 to match.
 */
export default function RefundsPage() {
  return (
    <PolicyPage title="Cancellation & Refund Policy" updated="August 17, 2026">
      <PolicySection heading="The short version">
        <p>
          Cancel before we start work and you get everything back. Once we have started, the work is
          people reading records on your behalf and it cannot be returned, so it is not refundable.
          If we fail to deliver, or we get something wrong, you get your money back.
        </p>
      </PolicySection>

      <PolicySection heading="Cancelling before work begins">
        <p>
          You may cancel at any point before we begin preparing your report, for a full refund of the
          amount paid, with no deduction.
        </p>
        <p className="mt-3">
          To cancel, email{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>{' '}
          with your request number. Work usually begins shortly after payment, so a cancellation is
          only effective if it reaches us before that.
        </p>
      </PolicySection>

      <PolicySection heading="After work has begun">
        <p>
          A report is produced by people searching government records, and in some cases attending an
          office in person to retrieve a document. That work is done and paid for whether or not the
          result is what you hoped, so once it has started the fee is not refundable.
        </p>
        <p className="mt-3">
          A report that finds a problem with the land is not a failed report. It is the outcome the
          service exists to produce, and it is not a ground for refund.
        </p>
      </PolicySection>

      <PolicySection heading="When we will refund in full">
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>We do not deliver a report at all.</li>
          <li>
            We deliver a report for the wrong parcel, and the survey number and district you supplied
            were correct.
          </li>
          <li>
            A finding is materially wrong because we misread or missed a record we said we had
            checked. We will correct the report first if you would rather have that; the choice is
            yours.
          </li>
          <li>
            You were charged more than once for the same order, or charged for an order that was
            never created. Duplicate charges are refunded whether or not you ask.
          </li>
        </ul>
        <p className="mt-3">
          Raise any of these within 7 days of delivery by emailing{' '}
          <a href={`mailto:${COMPANY.email}`} className="text-accent-blue underline">
            {COMPANY.email}
          </a>{' '}
          with your request number and what you believe is wrong.
        </p>
      </PolicySection>

      <PolicySection heading="What we cannot refund for">
        <p>
          We report what the government records held at the time we read them. We are not able to
          refund because a record was itself inaccurate or out of date at source, because a
          department was unreachable and we told you so in the report, or because you disagree with
          the conclusion your advocate drew from our findings.
        </p>
        <p className="mt-3">
          Delivery beyond {REPORT_TURNAROUND_HOURS} hours is not on its own a ground for refund where
          the delay is caused by a government office or by a record that has to be retrieved in
          person, provided we told you about the delay. See our{' '}
          <a href="/shipping" className="text-accent-blue underline">
            delivery policy
          </a>
          .
        </p>
      </PolicySection>

      <PolicySection heading="How a refund is paid">
        <p>
          Refunds are returned to the original payment method through Razorpay. We do not refund to a
          different account, in cash, or as credit.
        </p>
        <p className="mt-3">
          We initiate an approved refund within 2 working days of approving it. Your bank or card
          issuer then takes its own time to post it, usually 5 to 7 working days. We have no control
          over that second period.
        </p>
      </PolicySection>

      <PolicySection heading="Contact">
        <p>For anything on this page:</p>
        <CompanyAddress />
      </PolicySection>
    </PolicyPage>
  )
}
