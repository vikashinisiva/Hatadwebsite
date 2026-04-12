import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using HataD land clearance intelligence services by Hypse Aero Private Limited, Coimbatore, Tamil Nadu.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0D1B2A] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.15em] uppercase mb-2">HataD &mdash; Land Clearance Intelligence</p>
          <h1 className="text-white text-2xl font-bold tracking-tight">Terms &amp; Conditions</h1>
          <p className="text-white/40 text-xs mt-1">Last updated: April 06, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Agreement to Our Legal Terms</h2>
            <p>
              We are Hypse Aero Private Limited, doing business as HataD (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; &ldquo;our&rdquo;),
              a company registered in India at 77/C, Vittal Nagar, Ganeshapuram, Coimbatore, Tamil Nadu 641023.
            </p>
            <p className="mt-3">
              We operate the website <a href="https://www.hatad.in" className="text-accent-blue underline">https://www.hatad.in</a> (the &ldquo;Site&rdquo;),
              as well as any other related products and services that refer or link to these legal terms (the &ldquo;Legal Terms&rdquo;) (collectively, the &ldquo;Services&rdquo;).
            </p>
            <p className="mt-3">
              HataD is a land intelligence platform that verifies property documents for buyers, lawyers, and financial institutions in Tamil Nadu.
              Users upload land records &mdash; including Encumbrance Certificates, Patta, FMB, Sale Deeds, and related documents &mdash; and receive
              a detailed clearance report identifying contradictions, ownership gaps, encumbrances, and legal risks across the full document set.
              Reports are delivered within 3 hours and are accessible via our website at hatad.in.
            </p>
            <p className="mt-3">
              You can contact us by phone at +91 81226 42341, email at{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>, or by mail to
              77/C, Vittal Nagar, Ganeshapuram, Coimbatore, Tamil Nadu 641023, India.
            </p>
            <p className="mt-3">
              These Legal Terms constitute a legally binding agreement made between you, whether personally or on behalf of an entity (&ldquo;you&rdquo;),
              and Hypse Aero Private Limited, concerning your access to and use of the Services. You agree that by accessing the Services, you have read,
              understood, and agreed to be bound by all of these Legal Terms.{' '}
              <strong>IF YOU DO NOT AGREE WITH ALL OF THESE LEGAL TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.</strong>
            </p>
            <p className="mt-3">
              We will provide you with prior notice of any scheduled changes to the Services you are using. The modified Legal Terms will become effective
              upon posting or notifying you at info@hypseaero.in. By continuing to use the Services after the effective date of any changes, you agree to be
              bound by the modified terms.
            </p>
            <p className="mt-3">
              The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">1. Our Services</h2>
            <p>
              The information provided when using the Services is not intended for distribution to or use by any person or entity in any jurisdiction or country
              where such distribution or use would be contrary to law or regulation. Those who access the Services from other locations do so on their own
              initiative and are solely responsible for compliance with local laws.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">2. Intellectual Property Rights</h2>
            <p>
              We are the owner or licensee of all intellectual property rights in our Services, including source code, databases, software, website designs,
              text, photographs, and graphics (the &ldquo;Content&rdquo;), as well as the trademarks, service marks, and logos (the &ldquo;Marks&rdquo;).
              These are protected by copyright and trademark laws worldwide.
            </p>
            <p className="mt-3">
              Subject to your compliance with these Legal Terms, we grant you a non-exclusive, non-transferable, revocable licence to access the Services and
              download or print a copy of any portion of the Content to which you have properly gained access, solely for your personal, non-commercial use or
              internal business purpose.
            </p>
            <p className="mt-3">
              Except as expressly set out, no part of the Services, Content, or Marks may be copied, reproduced, republished, sold, licensed, or otherwise
              exploited for any commercial purpose without our prior written permission. For permissions, contact{' '}
              <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>.
            </p>
            <p className="mt-3">
              <strong>Your submissions:</strong> Any questions, comments, suggestions, feedback, or other information you send us (&ldquo;Submissions&rdquo;)
              become our property, and we may use them for any lawful purpose without acknowledgment or compensation to you.
            </p>
            <p className="mt-3">
              <strong>Your contributions:</strong> Any documents or content you upload through the Services remain yours, but you grant us a worldwide,
              royalty-free licence to use, store, and process them solely for the purpose of delivering the Services (i.e., generating your clearance report).
              You are solely responsible for the legality and accuracy of what you upload.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">3. User Representations</h2>
            <p>By using the Services, you represent and warrant that:</p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>all registration and upload information is true, accurate, current, and complete;</li>
              <li>you will maintain the accuracy of such information;</li>
              <li>you have the legal capacity and agree to comply with these Legal Terms;</li>
              <li>you are not a minor in the jurisdiction in which you reside;</li>
              <li>you will not access the Services through automated or non-human means;</li>
              <li>you will not use the Services for any illegal or unauthorised purpose;</li>
              <li>your use will not violate any applicable law or regulation.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">4. User Registration</h2>
            <p>
              You may be required to register to use the Services. You agree to keep your password confidential and will be responsible for all use of your
              account and password. We reserve the right to remove or change a username you select if we determine it is inappropriate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">5. Purchases and Payment</h2>
            <p>
              We accept payments through Razorpay. All payments are in Indian Rupees (INR) and are inclusive of applicable taxes. You agree to provide current,
              complete, and accurate purchase and account information. Sales tax and GST will be added to the price of purchases as deemed required by us.
            </p>
            <p className="mt-3">
              We reserve the right to refuse any order placed through the Services. We may, in our sole discretion, limit or cancel quantities purchased per
              person, per household, or per order.
            </p>
            <p className="mt-3">
              <strong>Refunds:</strong> Due to the nature of the service (manual verification and report generation), payments are generally non-refundable
              once work has commenced. If you believe a refund is warranted, contact us at info@hypseaero.in within 7 days of payment.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">6. Prohibited Activities</h2>
            <p>
              You may not access or use the Services for any purpose other than that for which we make them available. As a user, you agree not to:
            </p>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>systematically retrieve data or content to create a database without our written permission;</li>
              <li>trick, defraud, or mislead us or other users;</li>
              <li>circumvent or interfere with security-related features of the Services;</li>
              <li>disparage or harm, in our opinion, us and/or the Services;</li>
              <li>use any information obtained from the Services to harass or harm another person;</li>
              <li>use the Services in a manner inconsistent with applicable laws or regulations;</li>
              <li>upload documents you do not have the legal right to share;</li>
              <li>upload or transmit viruses, malware, or any other disruptive code;</li>
              <li>engage in automated use of the system, such as scraping, data mining, or bots;</li>
              <li>attempt to impersonate another user or person;</li>
              <li>use the Services as part of any effort to compete with us.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">7. Services Management</h2>
            <p>
              We reserve the right, but not the obligation, to monitor the Services for violations of these Legal Terms, take appropriate legal action,
              refuse, restrict access to, or disable any of your Contributions, and otherwise manage the Services to protect our rights and facilitate proper functioning.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">8. Privacy Policy</h2>
            <p>
              We care about data privacy and security. Please review our{' '}
              <a href="/privacy" className="text-accent-blue underline">Privacy Policy</a>. By using the Services, you agree to be bound by our Privacy Policy,
              which is incorporated into these Legal Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">9. Term and Termination</h2>
            <p>
              These Legal Terms shall remain in full force and effect while you use the Services. We may, in our sole discretion and without notice or liability,
              deny access to and use of the Services to any person for any reason, including for breach of these Legal Terms or applicable law.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">10. Modifications and Interruptions</h2>
            <p>
              We reserve the right to change, modify, or remove the contents of the Services at any time or for any reason at our sole discretion without notice.
              We cannot guarantee the Services will be available at all times. We may experience hardware, software, or other problems, requiring maintenance
              resulting in interruptions, delays, or errors.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">11. Governing Law</h2>
            <p>
              These Legal Terms are governed by and construed in accordance with the laws of India. Hypse Aero Private Limited and yourself irrevocably consent
              that the courts of Coimbatore, Tamil Nadu, shall have exclusive jurisdiction to resolve any dispute arising in connection with these Legal Terms.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">12. Dispute Resolution</h2>
            <p>
              Any dispute arising out of or relating to these Legal Terms shall first be attempted to be resolved through informal negotiation. If unresolved,
              the dispute shall be finally settled by the competent courts in Coimbatore, Tamil Nadu, India.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">13. Corrections</h2>
            <p>
              There may be information on the Services that contains typographical errors, inaccuracies, or omissions that may relate to pricing, availability,
              or descriptions. We reserve the right to correct any errors and to change or update information at any time without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">14. Disclaimer</h2>
            <p>
              THE SERVICES ARE PROVIDED ON AN AS-IS AND AS-AVAILABLE BASIS. YOU AGREE THAT YOUR USE OF THE SERVICES WILL BE AT YOUR SOLE RISK. TO THE FULLEST
              EXTENT PERMITTED BY LAW, WE DISCLAIM ALL WARRANTIES, EXPRESS OR IMPLIED, IN CONNECTION WITH THE SERVICES AND YOUR USE THEREOF.
            </p>
            <p className="mt-3">
              HataD reports are analytical opinions based on documents supplied by you and publicly available records. They do not constitute legal advice,
              a title guarantee, or insurance. For binding legal decisions, consult a licensed advocate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">15. Limitations of Liability</h2>
            <p>
              IN NO EVENT WILL WE OR OUR DIRECTORS, EMPLOYEES, OR AGENTS BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY DIRECT, INDIRECT, CONSEQUENTIAL, EXEMPLARY,
              INCIDENTAL, SPECIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICES. Our aggregate liability shall not exceed the amount paid by you
              to us for the Services in the three (3) months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">16. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold us harmless from any loss, damage, liability, claim, or demand made by any third party due to or arising
              out of your use of the Services, breach of these Legal Terms, or violation of the rights of a third party.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">17. User Data</h2>
            <p>
              We will maintain certain data that you transmit to the Services for the purpose of managing the performance of the Services, as well as data
              relating to your use of the Services. You are solely responsible for all data that you transmit. You agree that we shall have no liability to
              you for any loss or corruption of such data.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">18. Electronic Communications, Transactions, and Signatures</h2>
            <p>
              Visiting the Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic
              communications, and you agree that all agreements, notices, disclosures, and other communications we provide to you electronically satisfy any
              legal requirement that such communication be in writing.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">19. Miscellaneous</h2>
            <p>
              These Legal Terms and any policies or operating rules posted by us constitute the entire agreement between you and us. Our failure to exercise
              or enforce any right or provision of these Legal Terms shall not operate as a waiver of such right or provision. If any provision of these Legal
              Terms is determined to be unlawful, void, or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">20. Contact Us</h2>
            <p>
              To resolve a complaint regarding the Services or to receive further information, please contact us at:
            </p>
            <p className="mt-3">
              Hypse Aero Private Limited<br />
              77/C, Vittal Nagar, Ganeshapuram<br />
              Coimbatore, Tamil Nadu 641023<br />
              India<br />
              Phone: +91 81226 42341<br />
              Email: <a href="mailto:info@hypseaero.in" className="text-accent-blue underline">info@hypseaero.in</a>
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
