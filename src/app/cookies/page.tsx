import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Cookie Policy',
  description: 'How HataD uses cookies and tracking technologies on hatad.in. Manage your consent preferences.',
  alternates: { canonical: '/cookies' },
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="bg-[#0D1B2A] py-10 px-6">
        <div className="max-w-3xl mx-auto">
          <p className="text-[#C9A84C] text-xs font-medium tracking-[0.15em] uppercase mb-2">HataD &mdash; Land Clearance Intelligence</p>
          <h1 className="text-white text-2xl font-bold tracking-tight">Cookie Policy</h1>
          <p className="text-white/40 text-xs mt-1">Last updated: April 06, 2026</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="space-y-6 text-sm text-text-secondary leading-relaxed">

          <p>
            This Cookie Policy explains how Hypse Aero Private Limited (&ldquo;Company,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; and &ldquo;our&rdquo;) uses cookies
            and similar technologies to recognize you when you visit our website at{' '}
            <a href="https://www.hatad.in" className="text-accent-blue underline">https://www.hatad.in</a> (&ldquo;Website&rdquo;).
            It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          <p>
            In some cases we may use cookies to collect personal information, or that becomes personal information if we
            combine it with other information.
          </p>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">What are cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website.
              Cookies are widely used by website owners in order to make their websites work, or to work more efficiently,
              as well as to provide reporting information.
            </p>
            <p className="mt-3">
              Cookies set by the website owner (in this case, Hypse Aero Private Limited) are called &ldquo;first-party cookies.&rdquo;
              Cookies set by parties other than the website owner are called &ldquo;third-party cookies.&rdquo; Third-party cookies
              enable third-party features or functionality to be provided on or through the website (e.g., advertising,
              interactive content, and analytics).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Why do we use cookies?</h2>
            <p>
              We use first- and third-party cookies for several reasons. Some cookies are required for technical reasons
              in order for our Website to operate, and we refer to these as &ldquo;essential&rdquo; or &ldquo;strictly necessary&rdquo; cookies.
              Other cookies enable us to track and target the interests of our users to enhance the experience on our
              Website. Third parties serve cookies through our Website for advertising, analytics, and other purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">How can I control cookies?</h2>
            <p>
              You have the right to decide whether to accept or reject cookies. You can exercise your cookie rights by
              setting your preferences in the Cookie Preference Center. The Cookie Preference Center allows you to select
              which categories of cookies you accept or reject. Essential cookies cannot be rejected as they are strictly
              necessary to provide you with services.
            </p>
            <p className="mt-3">
              The Cookie Preference Center can be found in the notification banner and on our Website. If you choose to
              reject cookies, you may still use our Website though your access to some functionality and areas of our
              Website may be restricted. You may also set or amend your web browser controls to accept or refuse cookies.
            </p>
            <p className="mt-3">
              <a href="#" className="termly-display-preferences text-accent-blue underline">Open Cookie Preferences</a>
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Analytics and customization cookies</h2>
            <p>
              These cookies collect information that is used either in aggregate form to help us understand how our
              Website is being used or how effective our marketing campaigns are, or to help us customize our Website for you.
            </p>
            <ul className="mt-3 space-y-2 list-disc pl-5">
              <li><strong>_ga</strong> &mdash; Google Analytics. Records an ID used to compile data about website usage. Expires ~2 years.</li>
              <li><strong>_ga_#</strong> &mdash; Google Analytics. Distinguishes individual users for session and visit calculation. Expires ~2 years.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">How can I control cookies on my browser?</h2>
            <p>Visit your browser&rsquo;s help menu for instructions on managing cookies:</p>
            <ul className="mt-3 space-y-1 list-disc pl-5">
              <li><a className="text-accent-blue underline" href="https://support.google.com/chrome/answer/95647" target="_blank" rel="noopener noreferrer">Chrome</a></li>
              <li><a className="text-accent-blue underline" href="https://support.mozilla.org/en-US/kb/enhanced-tracking-protection-firefox-desktop" target="_blank" rel="noopener noreferrer">Firefox</a></li>
              <li><a className="text-accent-blue underline" href="https://support.apple.com/en-ie/guide/safari/sfri11471/mac" target="_blank" rel="noopener noreferrer">Safari</a></li>
              <li><a className="text-accent-blue underline" href="https://support.microsoft.com/en-us/windows/microsoft-edge-browsing-data-and-privacy-bb8174ba-9d73-dcf2-9b4a-c582b4e640dd" target="_blank" rel="noopener noreferrer">Edge</a></li>
              <li><a className="text-accent-blue underline" href="https://help.opera.com/en/latest/web-preferences/" target="_blank" rel="noopener noreferrer">Opera</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Other tracking technologies</h2>
            <p>
              Cookies are not the only way to recognize or track visitors. We may also use web beacons (sometimes called
              &ldquo;tracking pixels&rdquo; or &ldquo;clear gifs&rdquo;) &mdash; tiny graphics files that contain a unique identifier and help us
              understand traffic patterns, measure site performance, and the effectiveness of email campaigns.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Updates to this Cookie Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes to the cookies we use or for other
              operational, legal, or regulatory reasons. Please revisit this Cookie Policy regularly. The date at the top
              indicates when it was last updated.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-text-primary mb-2">Contact</h2>
            <p>If you have questions about our use of cookies, email us at{' '}
              <a className="text-accent-blue underline" href="mailto:info@hypseaero.in">info@hypseaero.in</a> or write to:
            </p>
            <p className="mt-3">
              Hypse Aero Private Limited<br />
              Coimbatore, Tamil Nadu 641023<br />
              India<br />
              Phone: +91 81226 42341
            </p>
          </section>

        </div>
      </div>
    </div>
  )
}
