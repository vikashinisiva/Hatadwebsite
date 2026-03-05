import { SITE_NAME, SITE_TAGLINE, SITE_LOCATION } from '@/lib/constants'
import { Phone, Mail } from 'lucide-react'

export function Footer() {
  return (
    <footer className="border-t border-border py-10 px-6 md:px-12 lg:px-20 xl:px-28 2xl:px-40">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <p className="text-sm font-semibold text-text-primary mb-1">{SITE_NAME}</p>
          <p className="text-xs text-text-muted">{SITE_TAGLINE} · {SITE_LOCATION}</p>
        </div>

        {/* Phone */}
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-text-muted mb-2">Phone</p>
          <div className="flex flex-col gap-1">
            <a href="tel:+918122642341" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-blue transition-colors">
              <Phone size={13} strokeWidth={1.5} /> +91 81226 42341
            </a>
            <a href="tel:+917418301656" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-blue transition-colors">
              <Phone size={13} strokeWidth={1.5} /> +91 74183 01656
            </a>
          </div>
        </div>

        {/* Email */}
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-text-muted mb-2">Email</p>
          <div className="flex flex-col gap-1">
            <a href="mailto:hypseaero@gmail.com" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-blue transition-colors">
              <Mail size={13} strokeWidth={1.5} /> hypseaero@gmail.com
            </a>
            <a href="mailto:hatad@hypseaero.in" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-blue transition-colors">
              <Mail size={13} strokeWidth={1.5} /> hatad@hypseaero.in
            </a>
          </div>
        </div>
      </div>

      <div className="h-px bg-border mb-6" />
      <p className="text-xs text-text-muted text-center">
        © {new Date().getFullYear()} Hypse Aero Pvt Ltd. All rights reserved.
      </p>
    </footer>
  )
}
