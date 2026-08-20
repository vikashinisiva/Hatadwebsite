export const SITE_NAME = 'HataD'
export const SITE_TAGLINE = 'Crest Intelligence Private Limited'
export const SITE_LOCATION = 'Tamil Nadu, India'

export const STORAGE_KEYS = {
  OAUTH_NEXT: 'hatad_oauth_next',
  PENDING_CLEARANCE: 'hatad_pending_clearance',
  AUTO_PAY: 'hatad_auto_pay',
  PAID_PENDING_SUBMIT: 'hatad_paid_pending_submit',
} as const

export const TN_DISTRICTS = [
  'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore',
  'Dharmapuri', 'Dindigul', 'Erode', 'Kallakurichi', 'Kancheepuram',
  'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai', 'Mayiladuthurai',
  'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
  'Ramanathapuram', 'Ranipet', 'Salem', 'Sivagangai', 'Tenkasi',
  'Thanjavur', 'Theni', 'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli',
  'Tirupattur', 'Tiruppur', 'Tiruvallur', 'Tiruvannamalai', 'Tiruvarur',
  'Vellore', 'Villupuram', 'Virudhunagar',
]

export const EMAIL_REGEX = /^\S+@\S+\.\S+$/
export const PHONE_REGEX = /^\d{10}$/

export const CLEARANCE_PRICE_PAISE = 359900


/**
 * Standard turnaround for a report, in hours.
 *
 * Applies to the record set that can be read remotely. Anything that has to be
 * fetched in person from an office — a pre-digitisation deed or EC held only as
 * a bound volume at the Sub-Registrar Office — cannot be done on this clock,
 * and the delivery policy says so rather than quietly implying otherwise.
 */
export const REPORT_TURNAROUND_HOURS = 3

/**
 * Pre-launch wall. Set COMING_SOON=1 in the environment to replace the product
 * with the waitlist page and hard-disable the payment routes.
 *
 * Server-side only — reads as `false` in client bundles, which is correct:
 * the wall is enforced in middleware and route handlers, never in the browser.
 */
export const COMING_SOON = process.env.COMING_SOON === '1'

/** Target the launch page counts down to. IST. Change here, nowhere else. */
export const LAUNCH_DATE = '2026-08-31T10:00:00+05:30'

/** Cities the launch-page map flies between, in order. */
export const LAUNCH_MAP_CITIES = [
  { name: 'COIMBATORE', c: [76.9558, 11.0168] },
  { name: 'CHENNAI', c: [80.2707, 13.0827] },
  { name: 'MADURAI', c: [78.1198, 9.9252] },
  { name: 'TIRUCHIRAPPALLI', c: [78.7047, 10.7905] },
  { name: 'SALEM', c: [78.146, 11.6643] },
] as const

/**
 * Who the visitor is trusting. Shown beside the waitlist form — a signup page
 * with no named company behind it is the weakest point on a high-value product.
 * Single source; never retype these into JSX.
 */
export const COMPANY = {
  legalName: 'Crest Intelligence Private Limited',
  city: 'Coimbatore',
  region: 'Tamil Nadu',
  email: 'contact@crestintelligence.in',
  phone: '+91 81226 42341',
  phoneHref: '+918122642341',
  country: 'India',
  /*
   * Registered street address. Deliberately empty.
   *
   * The address that used to appear in the JSON-LD and still appears on
   * /terms — 77/C, Vittal Nagar, Ganeshapuram, Coimbatore 641023 — was entered
   * alongside the Hypse Aero name and belongs to that entity, not to Crest
   * Intelligence. It has never been reconfirmed for this company, so it is not
   * carried over.
   *
   * The policy pages render the locality line alone while this is empty, which
   * is true, and fill in the street the moment it is set here. Razorpay expects
   * a registered address on the contact and refund pages, so this wants filling
   * before the payment routes reopen at launch.
   */
  registeredAddress: '',
} as const

/**
 * Dial codes offered on the waitlist. Not a world list — Tamil Nadu land is
 * bought heavily by the diaspora, so this is India plus the countries that
 * diaspora actually lives in. India is the default and the fallback.
 */
export const DIAL_CODES = [
  { iso: 'IN', dial: '+91' },
  { iso: 'AE', dial: '+971' },
  { iso: 'SG', dial: '+65' },
  { iso: 'MY', dial: '+60' },
  { iso: 'US', dial: '+1' },
  { iso: 'GB', dial: '+44' },
  { iso: 'AU', dial: '+61' },
  { iso: 'CA', dial: '+1' },
  { iso: 'QA', dial: '+974' },
  { iso: 'SA', dial: '+966' },
  { iso: 'KW', dial: '+965' },
  { iso: 'OM', dial: '+968' },
  { iso: 'LK', dial: '+94' },
  { iso: 'NZ', dial: '+64' },
] as const

export const DEFAULT_DIAL = '+91'

/** Timezone → dial code. Cheaper and more reliable than a geo-IP lookup. */
export const TIMEZONE_DIAL: Record<string, string> = {
  'Asia/Kolkata': '+91',
  'Asia/Calcutta': '+91',
  'Asia/Dubai': '+971',
  'Asia/Singapore': '+65',
  'Asia/Kuala_Lumpur': '+60',
  'Asia/Qatar': '+974',
  'Asia/Riyadh': '+966',
  'Asia/Kuwait': '+965',
  'Asia/Muscat': '+968',
  'Asia/Colombo': '+94',
  'Europe/London': '+44',
  'Pacific/Auckland': '+64',
}

/**
 * Public profiles. Also fed to the Organization schema's `sameAs`, which is the
 * field search engines use to tie a brand to its social accounts.
 *
 * The Facebook URL is the canonical `profile.php?id=…` form — the `ref=` and
 * `#` fragment that come off Facebook's own profile-edit screen are an internal
 * referrer for that session, not part of the public address.
 */
export const SOCIALS = [
  { label: 'Instagram', href: 'https://www.instagram.com/hatad.in/' },
  { label: 'Facebook', href: 'https://www.facebook.com/profile.php?id=61592828447718' },
] as const

/**
 * Districts covered at launch. Defaults to all of Tamil Nadu, matching what the
 * rest of the site claims. If the first batch covers less, narrow THIS — never
 * the copy, which counts from it.
 */
export const LAUNCH_DISTRICTS = TN_DISTRICTS

/**
 * Paths that stay reachable while the wall is up.
 *
 * The policy pages are non-negotiable: Razorpay's automated check fetches them
 * on the registered website, and a 404 there puts live keys at risk. Several do
 * not exist yet — they are listed so they work the moment they are built.
 */
export const PRELAUNCH_PUBLIC_PATHS = [
  '/coming-soon',
  /* The Tamil launch page. Without this the wall redirects it to '/', which
     would serve English and quietly undo the whole point of the second URL. */
  '/ta',
  // Razorpay-required policy pages
  '/terms',
  '/privacy',
  '/cookies',
  '/about',
  '/contact',
  /* Not a page. /pricing is a route handler that answers 410 Gone, so a
     crawler holding the old indexed entry is told the resource is gone rather
     than being redirected, which would keep it in the index. Allowlisted so
     the wall does not 307 it before that handler runs. */
  '/pricing',
  '/refunds',
  '/shipping',
  /* District pages. All 38 routes resolve; only the finished ones are put in
     the sitemap. Prefix match covers every district. */
  '/tamil-nadu',
  '/guides',
  /* The journal. Reachable before launch on purpose: search discovery is the
     slowest thing on the roadmap, so the clock should start now rather than on
     31 August. Prefix match covers every post. */
  '/journal',
  // Ops console keeps working through the pre-launch period
  '/hq-panel',
  '/api/admin',
  // Waitlist capture, analytics, and the Vercel cron
  '/api/waitlist',
  '/api/track',
  '/api/cron',
  /*
   * Deliberately still reachable. New payments are stopped at order creation
   * (see /api/razorpay/order), but a payment that was already authorised must
   * still be able to verify and create its request row — otherwise the money is
   * taken and no record exists, which is the exact failure the
   * create_clearance_with_payment RPC exists to prevent.
   */
  '/api/razorpay/verify',
  '/api/clearance',
]

export const NAV_LINKS = [
  { label: 'Product', href: '#product' },
  { label: "Who It's For", href: '#who' },
  { label: 'The Report', href: '#report' },
  { label: 'Contact', href: '#contact' },
]

export const VERIFY_CARDS = [
  {
    number: '01',
    title: 'Title & Ownership Chain',
    body: 'Traced from origin to present. Every transfer. Every gap. Every name that shouldn\'t be there — or is missing entirely.',
    icon: 'FileText',
  },
  {
    number: '02',
    title: 'Liabilities & Hidden Charges',
    body: 'Active mortgages. Undischarged loans. Charges that travel with the land, not the seller.',
    icon: 'Lock',
  },
  {
    number: '03',
    title: 'Government Records',
    body: 'The second layer most buyers never check — the first layer where problems hide.',
    icon: 'Layers',
  },
  {
    number: '04',
    title: 'Regulatory & Zone Status',
    body: 'Is this land what it claims to be? Zoning. CRZ. Eco-sensitive. Government acquisition. Temple trust. Waqf. Flood risk. All checked.',
    icon: 'ShieldCheck',
  },
  {
    number: '05',
    title: 'Cross-Document Contradictions',
    body: 'The check no one else runs. If your documents contradict each other — we find it.',
    icon: 'GitCompare',
    featured: true,
  },
]

export const PERSONA_CARDS = [
  {
    title: 'Investors & Developers',
    body: 'Capital committed to flawed land is capital lost. Know before you move.',
    icon: 'TrendingUp',
  },
  {
    title: 'Legal Advisors & Law Firms',
    body: 'Your legal opinion is only as strong as the verification behind it. Make it stronger.',
    icon: 'Scale',
  },
  {
    title: 'Banks & NBFCs',
    body: 'Property-backed lending demands verified collateral. Not assumed. Verified.',
    icon: 'Building2',
  },
  {
    title: 'Builders & Land Aggregators',
    body: 'Screening multiple parcels? Get depth and speed — without choosing between them.',
    icon: 'LayoutGrid',
  },
]

export const REPORT_ITEMS = [
  { label: 'Complete Risk Verdict', badge: null },
  { label: 'Ownership Chain Analysis', badge: null },
  { label: 'Liability Summary', badge: null },
  { label: 'Government Record Assessment', badge: null },
  { label: 'Regulatory Compliance Status', badge: null },
  { label: 'Contradiction Log', badge: 'HIGH' },
  { label: 'Recommended Actions', badge: null },
]

export const LIFECYCLE_STAGES = [
  { label: 'Land Discovery', status: 'coming-soon', sublabel: null },
  { label: 'Land Acquisition', status: 'coming-soon', sublabel: 'Land Clearance', live: true },
  { label: 'Design Phase', status: 'coming-soon', sublabel: null },
  { label: 'Pre-Construction', status: 'coming-soon', sublabel: null },
  { label: 'Construction', status: 'coming-soon', sublabel: null },
  { label: 'Handover', status: 'coming-soon', sublabel: null },
]
