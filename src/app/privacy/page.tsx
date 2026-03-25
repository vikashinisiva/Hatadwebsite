import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | HataD by Hypse Aero',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0D1B2A] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.15em] uppercase mb-2">HataD &mdash; Land Clearance Intelligence</p>
          <h1 className="text-white text-2xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 text-xs mt-1">Effective Date: 25 March 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-8 text-sm text-text-secondary leading-relaxed">

          <p>
            This Privacy Policy describes how Hypse Aero Private Limited (&ldquo;Company&rdquo;, &ldquo;we&rdquo;,
            &ldquo;us&rdquo;, &ldquo;our&rdquo;) collects, uses, stores, and protects your personal information
            when you use the HataD Land Clearance Intelligence platform (&ldquo;Service&rdquo;) at hypseaero.in.
          </p>
          <p>By using the Service, you consent to the practices described in this Policy.</p>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">1. Information We Collect</h2>

            <h3 className="text-sm font-medium text-text-primary mt-4 mb-2">1.1 Information You Provide</h3>
            <p className="mb-2">When you submit a clearance report request, we collect:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Full name (if provided)</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Property details: district, taluk, village, survey number, patta number</li>
              <li>Documents uploaded by you (if using the Upload Documents flow)</li>
            </ul>

            <h3 className="text-sm font-medium text-text-primary mt-4 mb-2">1.2 Information We Retrieve on Your Behalf</h3>
            <p className="mb-2">To generate your report, we retrieve the following from government databases:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Encumbrance Certificate (EC) from TNREGINET</li>
              <li>Patta and A-Register from the Revenue Department</li>
              <li>Field Measurement Book (FMB) from the Taluk Office</li>
              <li>Sale Deed and registration records from the Sub-Registrar Office</li>
              <li>Court records from the District Court database</li>
              <li>Planning and land use records from DTCP / CMDA where applicable</li>
            </ul>

            <h3 className="text-sm font-medium text-text-primary mt-4 mb-2">1.3 Automatically Collected Information</h3>
            <p>
              We collect standard web analytics data including IP address, browser type, device type,
              and pages visited. This data is used for service improvement and security monitoring only.
            </p>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">2. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Process your clearance report request</li>
              <li>Retrieve relevant government records for your property</li>
              <li>Generate and deliver your Land Clearance Report</li>
              <li>Send transactional emails (request confirmation, report delivery)</li>
              <li>Issue GST invoices for your payment</li>
              <li>Communicate with you about your request status</li>
              <li>Improve the accuracy and quality of our Service</li>
            </ul>
            <p className="mt-3">We do not use your personal information for marketing without your explicit consent.</p>
          </section>

          {/* 3. Data Storage and Security */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">3. Data Storage and Security</h2>
            <p className="mb-2">Your data is stored on secured cloud infrastructure with the following protections:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Row-level security (RLS) ensuring each user can only access their own data</li>
              <li>Encrypted storage for all uploaded and retrieved documents</li>
              <li>Signed URLs with 7-day expiry for report downloads &mdash; links cannot be accessed by others</li>
              <li>Access to the admin panel is restricted to authorised Company personnel only</li>
            </ul>
            <p className="mt-3">
              Uploaded and retrieved documents are permanently deleted after report delivery.
              Account information (email, phone, request history) is retained for 2 years from
              the date of your last request, after which it is permanently deleted unless required by law.
            </p>
          </section>

          {/* 4. Data Sharing */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">4. Data Sharing</h2>
            <p className="mb-2">
              We do not sell, rent, or trade your personal information. We share data only in the
              following limited circumstances:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>
                <strong>Payment processing:</strong> Your payment details are processed by Razorpay.
                We do not store card or bank details.
              </li>
              <li>
                <strong>Email delivery:</strong> Transactional emails are sent via a third-party email
                service provider. Only your email address and report reference are shared for this purpose.
              </li>
              <li>
                <strong>Legal requirement:</strong> If required by a court order, government authority,
                or applicable law, we may disclose your information. We will notify you of such requests
                where legally permitted.
              </li>
            </ul>
          </section>

          {/* 5. Your Rights */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">5. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data (subject to legal retention requirements)</li>
              <li>Withdraw consent for any optional data processing</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue hover:underline">info@hypseaero.in</a>{' '}
              with your email address and Reference ID.
            </p>
          </section>

          {/* 6. Cookies */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">6. Cookies</h2>
            <p>
              We use essential cookies only &mdash; to maintain your session and authentication state.
              We do not use advertising or tracking cookies. You may disable cookies in your browser
              settings, but this may affect your ability to use the Service.
            </p>
          </section>

          {/* 7. Third-Party Links */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">7. Third-Party Links</h2>
            <p>
              Our emails and platform may contain links to government websites (TNREGINET, etc.)
              and third-party services. We are not responsible for the privacy practices of these external sites.
            </p>
          </section>

          {/* 8. Children's Privacy */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">8. Children&rsquo;s Privacy</h2>
            <p>
              The Service is not directed at individuals under 18 years of age.
              We do not knowingly collect personal information from minors.
            </p>
          </section>

          {/* 9. Changes to This Policy */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. The updated policy will be posted
              at hypseaero.in/privacy with a revised effective date. We will notify you of material
              changes via email if you have an active account.
            </p>
          </section>

          {/* 10. Contact */}
          <section>
            <h2 className="text-base font-semibold text-text-primary mb-3">10. Contact</h2>
            <p>
              For any privacy-related questions or requests, contact:<br />
              <strong>Hypse Aero Private Limited</strong><br />
              Email: <a href="mailto:info@hypseaero.in" className="text-accent-blue hover:underline">info@hypseaero.in</a><br />
              Coimbatore, Tamil Nadu, India
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
