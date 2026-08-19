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

      { t: 'h2', id: 'reading-records-against-each-other', text: 'How the records are read against each other' },
      {
        t: 'p',
        text: `The method follows from the problem. Retrieving a document tells you what one department believes. It is the comparison across departments that produces a finding.`,
      },
      {
        t: 'p',
        text: `For each investigation we draw on ${SOURCE_CLAIM} government departments and courts — revenue, registration, survey, the tahsildar’s office, the local body and land records among them — and read them against one another rather than in sequence. Which of them apply is decided by the parcel: a coastal plot and an inland one are not checked against the same list. Where the accounts diverge, that divergence is the finding. It is written up with the specific record that establishes it, so that the buyer, and the buyer’s advocate, can go and verify it independently.`,
      },
      {
        t: 'p',
        text: 'Every investigation ends in a verdict. Sometimes that verdict is that the parcel is sound. Sometimes it is that the transaction should not proceed, and why, and on which grounds. You can read [what a report covers and what it costs](/pricing), or [more about who we are](/about).',
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
]

export function getPost(slug: string): Post | undefined {
  return POSTS.find((p) => p.slug === slug)
}

/** Section headings, for the contents rail. Derived, never hand-listed. */
export function tableOfContents(post: Post) {
  return post.body.filter((b): b is Extract<Block, { t: 'h2' }> => b.t === 'h2')
}
