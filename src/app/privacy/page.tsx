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
          <h1 className="text-white text-2xl font-bold tracking-tight">Privacy Notice</h1>
          <p className="text-white/40 text-xs mt-1">Last updated: April 06, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">

          <p>
            This Privacy Notice for Hypse Aero Private Limited (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) describes how and why we
            might access, collect, store, use, and/or share (&ldquo;process&rdquo;) your personal information when you use our services (&ldquo;Services&rdquo;),
            including when you visit our website at <a href="https://www.hatad.in" className="text-accent-blue underline">https://www.hatad.in</a>,
            upload land documents for verification, or contact us.
          </p>
          <p>
            Questions or concerns? Reading this Privacy Notice will help you understand your privacy rights and choices. We are responsible for
            making decisions about how your personal information is processed. If you do not agree with our policies and practices, please do not
            use our Services. If you still have questions, please contact us at{' '}
            <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>.
          </p>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Summary of Key Points</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>What personal information do we process?</strong> We may process personal information depending on how you interact with us and the Services, the choices you make, and the products and features you use.</li>
              <li><strong>Do we process sensitive personal information?</strong> We do not process sensitive personal information such as race, sexual orientation, or religious beliefs.</li>
              <li><strong>Do we collect information from third parties?</strong> We may collect information from public databases (e.g., Tamil Nadu GIS, SRO records) strictly to deliver your clearance report.</li>
              <li><strong>How do we process your information?</strong> To provide, improve, and administer our Services, communicate with you, for security and fraud prevention, and to comply with law.</li>
              <li><strong>With whom do we share information?</strong> Only with service providers (payment, hosting, email) and as required by law.</li>
              <li><strong>Your rights.</strong> Depending on where you live, you may have rights to access, correct, or delete your data.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. What Information Do We Collect?</h2>
            <h3 className="text-sm font-semibold text-text-primary mt-3 mb-1">Personal information you disclose to us</h3>
            <p>
              We collect personal information that you voluntarily provide when you register on the Services, request a clearance report, upload
              land documents, make a payment, or contact us. This may include your name, phone number, email address, property details, survey numbers,
              and uploaded documents (Encumbrance Certificates, Patta, FMB, Sale Deeds, etc.).
            </p>
            <p className="mt-3">
              <strong>Sensitive information.</strong> We do not process sensitive information (race, religion, health, biometrics, etc.).
            </p>
            <p className="mt-3">
              <strong>Payment data.</strong> We use Razorpay to process payments. We do not store your card or bank details &mdash; these are
              handled directly by Razorpay. You can review their privacy policy at{' '}
              <a href="https://razorpay.com/privacy/" className="text-accent-blue underline" target="_blank" rel="noopener noreferrer">razorpay.com/privacy</a>.
            </p>
            <p className="mt-3">
              All personal information that you provide to us must be true, complete, and accurate, and you must notify us of any changes.
            </p>
            <h3 className="text-sm font-semibold text-text-primary mt-4 mb-1">Information automatically collected</h3>
            <p>
              Some information &mdash; such as your IP address, browser and device characteristics, operating system, language preferences, referring
              URLs, country, and usage patterns &mdash; is collected automatically when you visit our Services. This does not reveal your specific
              identity and is primarily used for security, analytics, and improving the Services. We also collect information through cookies and
              similar technologies (see our <a href="/cookies" className="text-accent-blue underline">Cookie Policy</a>).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. How Do We Process Your Information?</h2>
            <p>We process your personal information for the following reasons:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>To deliver the clearance report you requested and fulfill your order;</li>
              <li>To verify your identity and process payments;</li>
              <li>To communicate with you about your report, updates, and support queries;</li>
              <li>To improve, troubleshoot, and secure our Services;</li>
              <li>To prevent fraud and comply with legal obligations;</li>
              <li>For internal analytics, reporting, and business operations;</li>
              <li>For any other purpose with your consent.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. When and With Whom Do We Share Your Information?</h2>
            <p>We may share your information in the following situations:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Service providers.</strong> With trusted third parties who perform services on our behalf &mdash; including payment processing (Razorpay), hosting (Vercel, Supabase, GCP), email delivery, and analytics (Google Analytics).</li>
              <li><strong>Legal obligations.</strong> Where required by law, regulation, legal process, or governmental request.</li>
              <li><strong>Business transfers.</strong> In connection with any merger, sale of company assets, financing, or acquisition.</li>
              <li><strong>With your consent.</strong> For any other purpose disclosed to you at the time of collection.</li>
            </ul>
            <p className="mt-3">We do not sell your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. Do We Use Cookies and Other Tracking Technologies?</h2>
            <p>
              Yes. We use cookies and similar tracking technologies (like web beacons and pixels) to maintain the security of our Services, save your
              preferences, and analyze usage. Specific information about how we use cookies and how you can refuse them is set out in our{' '}
              <a href="/cookies" className="text-accent-blue underline">Cookie Policy</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. Is Your Information Transferred Internationally?</h2>
            <p>
              Our primary servers are located in India (Mumbai region). Some service providers (such as Vercel and Google Analytics) may process data
              in other countries. Regardless of location, we take reasonable steps to protect your information in accordance with this Privacy Notice
              and applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. How Long Do We Keep Your Information?</h2>
            <p>
              We keep your personal information only for as long as necessary to fulfill the purposes outlined in this Privacy Notice, unless a longer
              retention period is required by law (such as tax, accounting, or legal requirements). Uploaded documents and completed reports are
              retained for up to 12 months, after which they are securely deleted unless you request earlier deletion.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">7. Do We Collect Information from Minors?</h2>
            <p>
              We do not knowingly collect data from or market to children under 18 years of age. By using the Services, you represent that you are
              at least 18. If we learn that personal information from users less than 18 has been collected, we will deactivate the account and
              promptly delete such data. If you become aware of any such data, please contact us at{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">8. What Are Your Privacy Rights?</h2>
            <p>
              Depending on where you are located, you may have the right to: access your personal information, correct inaccuracies, request deletion,
              restrict or object to processing, data portability, and withdraw consent at any time.
            </p>
            <p className="mt-3">
              To exercise any of these rights, contact us at{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>. We will respond in accordance with
              applicable data protection laws.
            </p>
            <p className="mt-3">
              <strong>Withdrawing consent.</strong> You may withdraw your consent at any time. This will not affect the lawfulness of processing before
              its withdrawal. Upon request to terminate your account, we will deactivate or delete your account and information from our active databases,
              subject to any retention required for fraud prevention, legal compliance, or dispute resolution.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">9. Controls for Do-Not-Track Features</h2>
            <p>
              Most web browsers include a Do-Not-Track (&ldquo;DNT&rdquo;) feature. As no uniform technology standard has been finalized, we do not
              currently respond to DNT browser signals. If a standard is adopted in the future, we will update this Notice accordingly.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">10. Updates to This Notice</h2>
            <p>
              We may update this Privacy Notice from time to time. The updated version will be indicated by an updated &ldquo;Last updated&rdquo; date
              at the top. If we make material changes, we may notify you by email or by prominently posting a notice on our Services. Please review
              this Notice periodically.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">11. How Can You Contact Us?</h2>
            <p>If you have questions or comments about this Notice, contact us by post or email:</p>
            <p className="mt-3">
              Hypse Aero Private Limited<br />
              77/C, Vittal Nagar, Ganeshapuram<br />
              Coimbatore, Tamil Nadu 641023<br />
              India<br />
              Phone: +91 81226 42341<br />
              Email: <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">12. How Can You Review, Update, or Delete Your Data?</h2>
            <p>
              You may have the right to request access to the personal information we hold about you, correct inaccuracies, or request deletion.
              To make such a request, please email us at{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a> with your request and we will respond
              as required by applicable law.
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
