import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions | HataD by Hypse Aero',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0D1B2A] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-white text-2xl font-bold tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-white/40 text-xs mt-1">Last updated: 25 March 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10 prose-sm">
        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">1. Overview</h2>
            <p>
              These Terms &amp; Conditions (&ldquo;Terms&rdquo;) govern your use of the HataD land clearance
              intelligence service (&ldquo;Service&rdquo;) operated by Hypse Aero Pvt Ltd
              (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us&rdquo;), a company registered in Tamil Nadu, India.
              By submitting a clearance request or using any part of this website, you agree to be bound by these Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">2. Service Description</h2>
            <p>
              HataD provides land clearance reports by retrieving and cross-referencing publicly available
              government records including Encumbrance Certificates (EC), Patta records, Field Measurement
              Book (FMB) data, mutation registers, sale deeds, and litigation records for properties in Tamil Nadu.
            </p>
            <p className="mt-2">
              Reports are compiled based on information available at the time of analysis.
              The Service does not constitute legal advice, title insurance, or a guarantee of property ownership.
              We recommend consulting a qualified advocate before making high-value property transactions.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">3. Eligibility</h2>
            <p>
              You must be at least 18 years of age to use this Service. By placing a request, you represent
              that you have a lawful interest in the property being investigated or are authorised by the
              property owner to request the report.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">4. Pricing &amp; Payment</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Clearance report (property details): ₹3,599 per report, inclusive of GST. Document retrieval is included.</li>
              <li>Clearance report (document upload): ₹1,500 per report, inclusive of applicable taxes.</li>
              <li>All payments are processed securely through our payment partner. We do not store card details.</li>
              <li>Prices are subject to change. The price displayed at the time of submission is the price you pay.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">5. Delivery</h2>
            <p>
              Reports are typically delivered within 2–3 hours of submission. Delivery timelines are
              estimates, not guarantees. Complex cases, high-volume periods, or delays in accessing
              government records may extend the delivery window. You will be notified by email if
              your report is delayed.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">6. Accuracy &amp; Limitations</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Reports reflect the state of publicly available records at the time of analysis.</li>
              <li>We do not guarantee the completeness or accuracy of underlying government records.</li>
              <li>The Company is not liable for decisions made based on the report&rsquo;s findings.</li>
              <li>Reports should be used alongside independent legal counsel for transactions above ₹50 lakh or involving disputed titles.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">7. Refund Policy</h2>
            <p>
              Once a request is submitted and payment confirmed, refunds are not available as document
              retrieval begins immediately. If we are unable to retrieve sufficient records to compile
              a report, a full refund will be issued automatically. If we process the wrong property
              due to an error on our part, we will reprocess at no charge within 24 hours.
            </p>
            <p className="mt-2">
              Contact <a href="mailto:info@hypseaero.in" className="text-accent-blue hover:underline">info@hypseaero.in</a> for
              any billing queries.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">8. Intellectual Property</h2>
            <p>
              The report delivered to you is for your personal or professional use. You may share
              it with your legal advisor, bank, or relevant parties involved in the transaction.
              You may not resell, redistribute, or publish the report commercially without written consent.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">9. User Obligations</h2>
            <ul className="list-disc pl-5 space-y-1.5 mt-2">
              <li>Provide accurate property details and contact information.</li>
              <li>Do not submit requests for fraudulent, illegal, or unauthorised purposes.</li>
              <li>Do not attempt to access other users&rsquo; data or reports.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">10. Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, the Company&rsquo;s total liability for any claim
              arising from the Service is limited to the amount you paid for the specific report in question.
              We are not liable for indirect, incidental, or consequential damages.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of India. Any disputes shall be subject to the
              exclusive jurisdiction of the courts in Coimbatore, Tamil Nadu.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">12. Changes to Terms</h2>
            <p>
              We may update these Terms from time to time. Continued use of the Service after changes
              are posted constitutes acceptance of the revised Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">13. Contact</h2>
            <p>
              For questions about these Terms, contact us at:<br />
              <a href="mailto:info@hypseaero.in" className="text-accent-blue hover:underline">info@hypseaero.in</a><br />
              Hypse Aero Pvt Ltd, Coimbatore, Tamil Nadu, India
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
