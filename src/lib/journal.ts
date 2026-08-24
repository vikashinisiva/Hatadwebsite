import { SOURCE_CLAIM } from './departments'

/**
 * The journal.
 *
 * Content lives here as typed blocks rather than MDX. Three reasons: no new
 * build dependency for what is currently a handful of posts, the section
 * headings can be walked to build the on-page contents rail without parsing
 * anything, and the prose stays plain text so the Article and FAQPage schema
 * can be generated from the same source the page renders. A second,
 * hand-maintained copy of the body for structured data is exactly how markup
 * comes to describe a page that no longer exists.
 *
 * Inline links use `[label](href)` and are parsed at render. Anything richer
 * than that is a signal it is time to move to MDX.
 */

export type Block =
  | { t: 'h2'; id: string; text: string }
  | { t: 'p'; text: string }
  | { t: 'ul'; items: string[] }
  /** Small-print source line, set apart from the prose. */
  | { t: 'cite'; text: string }
  /**
   * An image. `credit` is not optional: every picture in the journal is
   * someone else's work under a licence, and the licence is only honoured if
   * the attribution actually ships with the page.
   */
  | { t: 'figure'; src: string; alt: string; caption: string; credit: string }

export type Post = {
  slug: string
  /** The headline on the page. Written to be read, not searched. */
  title: string
  /**
   * The <title> tag, which does a different job: it is what someone scans in a
   * result list, so it carries the query the page answers. The layout appends
   * "| HataD", so this must not spend its words on the brand.
   */
  seoTitle: string
  description: string
  /** Shown under the headline. */
  standfirst: string
  /**
   * The named writer, where there is one.
   *
   * Optional, and absent means the piece is the company's rather than a
   * person's — which is what the first post is. Land purchase is a subject
   * search engines hold to a higher bar, so a named author is worth stating
   * when one exists; inventing one when it does not is worse than neither.
   */
  author?: string
  published: string
  /** ISO, for the Article schema and the <time> element. */
  publishedISO: string
  readingMinutes: number
  body: Block[]
  /** Rendered as an FAQ block and emitted as FAQPage schema. */
  faq: { q: string; a: string }[]
}

export const POSTS: Post[] = [
  {
    slug: 'when-land-records-contradict-tamil-nadu',
    title: 'When the Documents Disagree',
    seoTitle: 'Why Patta and EC Records Contradict Each Other',
    description:
      'A patta names an owner. That is a claim, not proof. What happens when the patta, the EC, the survey record and the courts disagree about the same Tamil Nadu parcel.',
    standfirst:
      'A patta names an owner and states an extent. Most buyers treat that as settled. It is one department’s record of what it was told, at some point, by someone.',
    published: '19 August 2026',
    publishedISO: '2026-08-19',
    readingMinutes: 6,
    body: [
      {
        t: 'p',
        text: 'The encumbrance certificate is a second account, kept by a different office, of transactions that were registered. The survey records are a third, describing the land itself rather than the person. Court records are a fourth, and they answer to nobody. Each is maintained separately, by a different authority, under a different set of rules, and none of them is obliged to reconcile itself against the others.',
      },
      {
        t: 'p',
        text: 'This is the part of Indian land ownership that catches people. The risk is rarely a document that is missing. It is two documents that exist, are genuine, and cannot both be true.',
      },

      {
        t: 'figure',
        src: '/journal/survey-office-madras-1894.jpg',
        alt: 'A survey map of the Arcot, Vellore and Chittoor country printed by the Survey Office, Madras, in 1894, showing taluk boundaries, railway lines and village names.',
        caption:
          'Survey Office, Madras, 1894. The survey department has been describing this land, in its own terms and for its own purposes, for a very long time. None of it was drawn to agree with the registration record.',
        credit: 'Madras District Manuals, The British Library. No known copyright restrictions.',
      },

      { t: 'h2', id: 'does-patta-prove-ownership', text: 'Does a patta prove ownership?' },
      {
        t: 'p',
        text: 'No. Patta is a revenue record of who pays tax on a parcel. It establishes that the revenue department has, at some point, been told that a person holds the land. It is evidence of possession and of a tax relationship. It is not a title document, and it does not survive a contradiction from the registration record or a court.',
      },
      {
        t: 'p',
        text: 'That distinction is the whole subject of this piece, because a buyer who treats the patta as settled has stopped reading at the first of at least four accounts.',
      },

      { t: 'h2', id: 'what-a-contradiction-looks-like', text: 'What a contradiction looks like' },
      {
        t: 'p',
        text: 'Consider a parcel where the chain of sale deeds is unbroken. Every transfer is registered. The seller’s name appears where it should, the extent is consistent, the stamp duty was paid. On the face of it, there is nothing to find.',
      },
      {
        t: 'p',
        text: 'Now look at what the state records do not carry. Charges created in favour of banks and financial institutions are registered centrally with CERSAI, the Central Registry of Securitisation Asset Reconstruction and Security Interest of India, and not in the district registry. We have seen parcels where that central register showed institutional mortgages running past a hundred crore rupees against land that appeared entirely unencumbered in every state record a buyer would think to check. Nothing in the deed chain was forged. The information simply lived somewhere the buyer had no reason to look.',
      },
      {
        t: 'p',
        text: 'Or consider inheritance. A family settlement divides land among several heirs on paper. But if what each heir holds is an undivided fractional interest in the whole, and not a demarcated piece of ground, then no single heir can convey a specific parcel, regardless of what the sale deed in front of you says, and regardless of the seller’s good faith. The document is real. The transfer it describes cannot happen.',
      },
      {
        t: 'p',
        text: 'Or consider a decree. A civil court passes a final decree on a survey number. The revenue department does not automatically know this. The registration department does not automatically know this. A buyer reading a patta and an encumbrance certificate sees nothing. The decree is nonetheless binding, and it was there the whole time.',
      },
      {
        t: 'p',
        text: 'None of these are exotic. Each one came out of ordinary work on ordinary parcels in Tamil Nadu.',
      },

      { t: 'h2', id: 'what-the-portal-cannot-show-you', text: 'What the portal cannot show you' },
      {
        t: 'p',
        text: 'There is a second gap, underneath the first. The online encumbrance record begins wherever each Sub-Registrar Office was digitised. Everything before that date exists as bound volumes at the office itself, indexed by hand, and no portal will ever show it to you.',
      },
      {
        t: 'p',
        text: 'A title chain that stops at the digitisation year is not a chain. It is the visible half of one. A link quietly left out below that line is invisible to every online check ever run on the parcel, which is precisely what makes it worth leaving out. Where a parcel’s history runs back past that date, the register has to be read in person, at the office that holds it.',
      },

      {
        t: 'figure',
        src: '/journal/south-india-1759.jpg',
        alt: 'A 1759 French map of the Coromandel Coast showing Madras, Kanjevaram, Tanjaor, Tiru Chira-Palli and Madure, engraved by Le Rouge in Paris.',
        caption:
          'The Coromandel Coast, mapped in Paris in 1759. Land in Tamil Nadu has been recorded, transferred and disputed for far longer than any register has been searchable, and a chain that matters can begin well before the earliest page a portal will return.',
        credit: 'Le Rouge, Paris, 1759, via Gallica. Public domain.',
      },

      { t: 'h2', id: 'reading-records-against-each-other', text: 'How the records are read against each other' },
      {
        t: 'p',
        text: `The method follows from the problem. Retrieving a document tells you what one department believes. It is the comparison across departments that produces a finding.`,
      },
      {
        t: 'p',
        text: `For each investigation we draw on ${SOURCE_CLAIM} government departments and courts. Revenue, registration, survey, the tahsildar’s office, the local body and land records are among them. We read them against one another rather than in sequence. Which of them apply is decided by the parcel: a coastal plot and an inland one are not checked against the same list. Where the accounts diverge, that divergence is the finding. It is written up with the specific record that establishes it, so that the buyer, and the buyer’s advocate, can go and verify it independently.`,
      },
      {
        t: 'p',
        text: 'Every investigation ends in a verdict. Sometimes that verdict is that the parcel is sound. Sometimes it is that the transaction should not proceed, and why, and on which grounds. You can read [more about who we are and how we work](/about).',
      },

      { t: 'h2', id: 'on-being-written-about', text: 'On being written about' },
      {
        t: 'p',
        text: 'The August 2026 issue of IITM Shaastra, the science and technology magazine published by IIT Madras, carried a feature on the emerging market for land intelligence in India, and the various ways in which records scattered across separate government offices are being brought together to answer questions about a piece of land. Our work in Tamil Nadu was included in it.',
      },
      {
        t: 'p',
        text: 'We are glad to have been covered, and grateful to the magazine. But the reason to mention it here is narrower than the coverage itself. The feature described a market that is genuinely forming, and it is worth being clear about where within that market this work sits. A good deal of what is being built answers the question of what is here: what the land looks like, what is around it, what it might be worth. That is useful. It is a different question from whether this can be sold to you, by this person, today, which is the only question a buyer at the point of purchase actually needs answered.',
      },
      {
        t: 'cite',
        text: 'Akundi, S. “No more la-la land.” IITM Shaastra, August 2026, pp. 38–39.',
      },

      { t: 'h2', id: 'what-counts-as-a-good-outcome', text: 'What counts as a good outcome' },
      {
        t: 'p',
        text: 'There is a version of this business that measures itself by transactions closed. That is the wrong measure, and it produces the wrong incentives.',
      },
      {
        t: 'p',
        text: 'The most valuable report we can write is the one that stops a purchase. A buyer who walks away from a compromised parcel has not lost a deal. They have avoided a decade in civil court, the legal costs that come with it, and the near-total illiquidity of land nobody else will touch either. That is money kept, not money spent.',
      },
      { t: 'p', text: 'We count those as our best work.' },
    ],
    faq: [
      {
        q: 'Does a patta prove ownership of land in Tamil Nadu?',
        a: 'No. A patta is a revenue record showing who pays tax on a parcel. It is evidence of possession, not proof of title, and it does not override the registration record or a court decree that says otherwise.',
      },
      {
        q: 'Can an encumbrance certificate show every charge on a property?',
        a: 'No. An EC lists transactions registered at the Sub-Registrar Office for the period requested. Charges created in favour of banks and financial institutions are registered centrally with CERSAI and do not appear in it, and the online record only reaches back to the date that office was digitised.',
      },
      {
        q: 'Why do land records contradict each other?',
        a: 'Because they are maintained by separate authorities under separate rules, and none is obliged to reconcile itself against the others. The revenue department is not told when a civil court passes a decree, and the registration department is not told either.',
      },
    ],
  },

  {
    slug: 'chennai-homebuyer-due-diligence',
    title: 'Navigating the Chennai Real Estate Market: A First-Time Homebuyer’s Due Diligence Guide',
    seoTitle: 'Chennai Property Due Diligence Checklist for First-Time Buyers',
    description:
      'What to verify before buying an apartment in Chennai: the title chain and encumbrance certificate, CMDA or DTCP sanction, TNRERA registration, land classification, undivided share, completion certificate and the promoter’s record.',
    standfirst:
      'A brochure is written to be believed. The records are written to be checked. This is what to check, and which office keeps it.',
    author: 'Swedha Anadhakrishan',
    published: '24 August 2026',
    publishedISO: '2026-08-24',
    /* 1,225 words at the 200 wpm the first post is calibrated to. Counted, not
       estimated — a stated reading time that is twice the real one is a small
       lie on a page whose argument is that figures should be checked. */
    readingMinutes: 6,
    body: [
      {
        t: 'p',
        text: 'For a first-time homebuyer, the market is a maze of legal jargon, zoning rules and regulatory risk that is not visible from the site. A life-changing financial commitment requires looking well past the brochure, to establish that what is being sold is legally sound, structurally durable and actually approved.',
      },

      { t: 'h2', id: 'title', text: 'Title and ownership chain' },
      {
        t: 'ul',
        items: [
          'Parent documents (thai pathiram) — trace the unbroken chain of ownership for at least 30 to 40 years, so that transfers, partitions, release deeds and legal heir settlements are all accounted for.',
          'Encumbrance certificate — pull a 30-to-40-year digital EC from the [TNREGINET portal](https://tnreginet.gov.in). For transactions before 1975 or 1987, depending on when that Sub-Registrar Office was digitised, a physical ledger search (villangam) at the office itself is the only way to see unrecorded mortgages or court attachments.',
          'Patta and revenue records — check the Town Survey Land Record for urban municipal areas, or the patta and chitta for revenue villages, through the [Tamil Nadu e-Services portal](https://eservices.tn.gov.in). The survey number, subdivision and current owner or promoter must match the title deeds exactly.',
          'Joint development agreement and power of attorney — for joint developments, inspect the registered JDA and the registered general power of attorney. Confirm the PoA has not been revoked, and that it explicitly authorises the promoter to convey undivided land shares to buyers.',
        ],
      },

      { t: 'h2', id: 'approvals', text: 'Statutory and planning approvals' },
      {
        t: 'ul',
        items: [
          'CMDA and DTCP sanctioned plans — planning permission comes from the Chennai Metropolitan Development Authority within CMA limits, and from the Directorate of Town and Country Planning outside them, under the Tamil Nadu Combined Development and Building Rules, 2019. Cross-check the sanctioned number of floors, height, floor space index and setbacks against what has actually been built.',
          'TNRERA registration — verify the project on [tnrera.in](https://tnrera.in). Registration is mandatory for projects over 500 square metres or more than eight apartments. Cross-reference the declared completion deadline, the sanctioned layout and the quarterly financial and construction disclosures.',
          'Statutory clearances — Tamil Nadu Fire and Rescue Services, Airports Authority of India height clearance, and environmental clearance from SEIAA or TNPCB for built-up areas over 20,000 square metres.',
        ],
      },

      { t: 'h2', id: 'classification', text: 'Land classification and zoning risk' },
      {
        t: 'ul',
        items: [
          'Revenue classification — the A-register and chitta show whether the land is grama natham, or punjai converted with layout regularisation. Sub-registrars are barred from registering properties on poramboke, on eri, kulam or kuttai (water bodies), or on vaikkal (drainage channels).',
          'HR&CE and Wakf — cross-check the survey numbers against records of the Hindu Religious and Charitable Endowments department, temple inam trusts, and the Tamil Nadu Wakf Board, where alienation may be barred.',
          'Wetlands and coastal buffers — confirm the parcel is outside the buffer zones of the Pallikaranai marshland, designated flood basins, and the Coastal Regulation Zones along the ECR and OMR corridors.',
        ],
      },

      { t: 'h2', id: 'completion', text: 'Physical clearances and handover' },
      {
        t: 'ul',
        items: [
          'Completion certificate — in Chennai a CC from the CMDA or the Greater Chennai Corporation is mandatory for multi-unit developments, excluding non-high-rise residential buildings up to 12 metres with no more than three dwelling units or 750 square metres. Permanent TANGEDCO electricity and CMWSSB water and sewerage connections legally require a valid CC.',
          'Deviation audit — check that the promoter has not encroached on the mandatory open space reservation, exceeded the sanctioned FSI, converted stilt parking into commercial units, or added unapproved floors.',
        ],
      },

      { t: 'h2', id: 'uds', text: 'Undivided share, parking and utilities' },
      {
        t: 'ul',
        items: [
          'Undivided share of land — verify the exact UDS percentage allocated to your apartment in the registered sale and construction agreements. The shares distributed across all buyers must total the whole site, and no more.',
          'Car parking — parking cannot be sold under an independent title deed. Your stilt or covered bay should be designated and numbered in an allotment letter and a layout annexure.',
          'Utilities — CMWSSB water and drainage connectivity, groundwater potability, working rainwater harvesting, and the operating capacity of the sewage and water treatment plants.',
        ],
      },

      { t: 'h2', id: 'site-visit', text: 'What the promoter’s older projects show' },
      {
        t: 'p',
        text: 'The most useful thing a buyer can do costs nothing but a morning. Visit what this builder finished two to five years ago, because a completed building answers questions a brochure cannot.',
      },
      {
        t: 'ul',
        items: [
          'Monsoon behaviour — see the older projects in the flood-prone corridors, Velachery, Perumbakkam, Mogappair and OMR, during the monsoon rather than after it. Look at basement drainage, lift pits and how ground-level runoff actually moves.',
          'Ageing and seepage — inspect facades, expansion joints and terrace waterproofing. Efflorescence, spalling concrete or recurring bathroom leaks this early indicate the materials, not the maintenance.',
          'Promised against delivered — compare the marketing brochure with what is operating. Clubhouses, piped gas, generators and lifts are the items most often specified and then quietly reduced.',
        ],
      },

      { t: 'h2', id: 'handover', text: 'Handover and the residents’ association' },
      {
        t: 'ul',
        items: [
          'Corpus fund and maintenance — ask the residents’ association of an earlier project whether the builder transferred the corpus fund, the maintenance deposits, and the complete as-built architectural and services drawings.',
          'Defect liability — promoters are obliged to rectify structural defects and workmanship flaws notified within five years of possession, at no cost, within thirty days. Ask an earlier association whether that obligation was honoured in practice.',
          'Meters — confirm earlier buyers received permanent individual domestic TANGEDCO connections, rather than being left on commercial or temporary bulk meters.',
        ],
      },

      { t: 'h2', id: 'record', text: 'The promoter’s legal and financial record' },
      {
        t: 'ul',
        items: [
          'TNRERA orders — search the promoter and its associated companies under the orders and judgments tab on tnrera.in, for recurring disputes over handover delays, layout alterations or refunds.',
          'Litigation — search the e-Courts portal and the Madras High Court records for pending civil suits, acquisition challenges, and consumer complaints before the NCDRC.',
          'Insolvency — check the National Company Law Tribunal cause lists and registry for insolvency proceedings initiated against the firm by financial or operational creditors.',
          'Delivery record — compare the committed possession dates in the RERA filings against the architect’s handover certificates actually filed. Repeated extensions usually indicate a capital problem rather than a construction one.',
        ],
      },

      {
        t: 'p',
        text: 'If the land classifications, the historical title chain, the municipal sanctions and the statutory filings are more than you want to take on alone, this is the work we do. What you get back is an account of what each record says, with the office and the document named for every finding, and a plain statement of anything we could not reach and what it would take to reach it.',
      },
    ],
    faq: [
      {
        q: 'Is a completion certificate mandatory for apartments in Chennai?',
        a: 'For multi-unit developments, yes. A completion certificate from the CMDA or the Greater Chennai Corporation is required, excluding non-high-rise residential buildings up to 12 metres with no more than three dwelling units or 750 square metres. Permanent TANGEDCO electricity and CMWSSB water and sewerage connections legally require one.',
      },
      {
        q: 'Which projects must be registered with TNRERA?',
        a: 'Projects on more than 500 square metres, or with more than eight apartments. Registration on tnrera.in carries the sanctioned layout, the declared completion deadline, and quarterly financial and construction disclosures, all of which can be compared against what the promoter is telling you.',
      },
      {
        q: 'Why is an online encumbrance certificate not enough in Chennai?',
        a: 'An online EC reaches back only as far as that Sub-Registrar Office was digitised. Anything earlier exists only in the bound ledgers at the office itself, which is where an unrecorded mortgage or a court attachment from before digitisation would still be sitting.',
      },
    ],
  },
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug)
}

/** Section headings, for the contents rail. Derived, never hand-listed. */
export function tableOfContents(post: Post) {
  return post.body.filter((b): b is Extract<Block, { t: 'h2' }> => b.t === 'h2')
}
