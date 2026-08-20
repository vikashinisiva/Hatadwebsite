import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { SiteFooter } from '@/components/layout/PolicyPage'
import { POSTS, getPost, tableOfContents, type Block } from '@/lib/journal'
import { COMPANY } from '@/lib/constants'

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const post = getPost((await params).slug)
  if (!post) return {}
  return {
    /* The headline and the title tag do different jobs. The headline is written
       to be read; this is written to be scanned in a result list, so it carries
       the query the piece answers. */
    title: post.seoTitle,
    description: post.description,
    alternates: { canonical: `/journal/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.publishedISO,
      locale: 'en_IN',
      siteName: 'HataD',
      url: `https://www.hatad.in/journal/${post.slug}`,
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.description,
      images: ['/og-image.png'],
    },
  }
}

/**
 * Renders `[label](href)` inside a paragraph. Deliberately the only inline
 * syntax supported: anything richer is the signal to move the journal to MDX
 * rather than to grow a parser here.
 */
function Prose({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g)
  return (
    <>
      {parts.map((part, i) => {
        const m = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part)
        if (!m) return part
        return (
          <Link key={i} href={m[2]} className="text-accent-blue underline underline-offset-2">
            {m[1]}
          </Link>
        )
      })}
    </>
  )
}

function BlockView({ block }: { block: Block }) {
  switch (block.t) {
    case 'h2':
      return (
        <h2
          id={block.id}
          className="text-[1.35rem] md:text-2xl font-semibold text-text-primary tracking-tight mt-12 mb-3 scroll-mt-24"
        >
          {block.text}
        </h2>
      )
    case 'p':
      return (
        <p className="text-[15px] leading-[1.75] text-text-secondary mb-4">
          <Prose text={block.text} />
        </p>
      )
    case 'ul':
      return (
        <ul className="list-disc pl-5 space-y-1.5 mb-4 text-[15px] leading-[1.75] text-text-secondary">
          {block.items.map((it) => (
            <li key={it}>
              <Prose text={it} />
            </li>
          ))}
        </ul>
      )
    case 'figure':
      return (
        <figure className="my-9">
          {/* Both source images are tall plates. Cropped to a band with
              object-cover rather than shown whole, which at this column width
              would be several screens of map. */}
          <div className="relative aspect-[3/2] w-full overflow-hidden rounded-sm border border-border bg-white">
            <Image
              src={block.src}
              alt={block.alt}
              fill
              sizes="(min-width: 1024px) 36rem, 100vw"
              className="object-cover object-center"
            />
          </div>
          <figcaption className="mt-3 text-[13px] leading-relaxed text-text-muted">
            {block.caption}
            <span className="block mt-1 text-[11.5px]">{block.credit}</span>
          </figcaption>
        </figure>
      )
    case 'cite':
      return (
        <p className="text-[13px] leading-relaxed text-text-muted border-l-2 border-border pl-4 my-6">
          {block.text}
        </p>
      )
  }
}

export default async function JournalPost({ params }: { params: Promise<{ slug: string }> }) {
  const post = getPost((await params).slug)
  if (!post) notFound()

  const toc = tableOfContents(post)
  const url = `https://www.hatad.in/journal/${post.slug}`

  /*
   * Article + FAQPage, both generated from the same content the page renders.
   *
   * Land purchase is a "Your Money or Your Life" subject, which Google holds to
   * a higher bar than ordinary content, so authorship and publisher are stated
   * explicitly rather than left for a crawler to infer.
   */
  const schema = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: post.title,
      description: post.description,
      inLanguage: 'en-IN',
      datePublished: post.publishedISO,
      dateModified: post.publishedISO,
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      author: { '@type': 'Organization', name: 'HataD', url: 'https://www.hatad.in' },
      publisher: {
        '@type': 'Organization',
        name: 'HataD',
        legalName: COMPANY.legalName,
        url: 'https://www.hatad.in',
        logo: { '@type': 'ImageObject', url: 'https://www.hatad.in/icon.png' },
      },
      image: 'https://www.hatad.in/og-image.png',
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      inLanguage: 'en-IN',
      mainEntity: post.faq.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Journal', item: 'https://www.hatad.in/journal' },
        { '@type': 'ListItem', position: 2, name: post.title, item: url },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      {/* masthead */}
      <div className="border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-mono text-sm tracking-[0.14em] text-text-primary">
            HATAD
          </Link>
          <Link
            href="/"
            className="text-xs font-medium text-accent-blue border border-border rounded-sm px-3 py-1.5 bg-white"
          >
            Join the waitlist
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 pt-10 pb-20">
        <nav className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-5">
          <Link href="/journal" className="hover:text-accent-blue">
            Journal
          </Link>
          <span className="mx-2">/</span>
          <span>{post.title}</span>
        </nav>

        <header className="max-w-[36rem]">
          <h1 className="text-[2rem] md:text-[2.6rem] font-bold tracking-[-0.02em] leading-[1.1] text-text-primary text-balance">
            {post.title}
          </h1>
          <p className="mt-4 text-base md:text-lg leading-relaxed text-text-secondary max-w-[52ch]">
            {post.standfirst}
          </p>
        </header>

        {/* article + rail */}
        <div className="mt-12 grid lg:grid-cols-[minmax(0,1fr)_13rem] gap-10 lg:gap-12 items-start">
          <article className="max-w-[36rem] min-w-0">
            {post.body.map((b, i) => (
              <BlockView key={i} block={b} />
            ))}

            <section className="mt-14 pt-8 border-t border-border">
              <h2 className="text-[1.35rem] md:text-2xl font-semibold text-text-primary tracking-tight mb-5">
                Questions this raises
              </h2>
              <div className="space-y-5">
                {post.faq.map((f) => (
                  <div key={f.q}>
                    <p className="text-[15px] font-semibold text-text-primary mb-1">{f.q}</p>
                    <p className="text-[15px] leading-[1.75] text-text-secondary">{f.a}</p>
                  </div>
                ))}
              </div>
            </section>

            <aside className="mt-12 bg-[#0C1525] text-white p-7 rounded-sm">
              <p className="text-lg font-semibold mb-1.5">Check a survey number before you pay</p>
              <p className="text-sm text-[#B8C5DA] max-w-[46ch]">
                One report, with the source named for every finding, so your advocate can verify it
                independently.
              </p>
              <Link
                href="/"
                className="inline-block mt-5 bg-[#C9A84C] text-[#0C1525] font-bold text-sm px-5 py-2.5 rounded-sm"
              >
                Join the waitlist
              </Link>
            </aside>

            <p className="mt-10 text-[13px] leading-relaxed text-text-muted">
              HataD conducts land clearance investigations across Tamil Nadu. Reports are issued with
              the underlying records cited, so that any finding can be independently verified by your
              advocate.
            </p>
          </article>

          {/* Sticky on desktop, plain flow on phones where there is no room to
              pin it and a fixed rail would eat the reading area. */}
          <aside className="lg:sticky lg:top-10 order-first lg:order-none w-full">
            <p className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-3">
              On this page
            </p>
            <ul className="space-y-2.5 mb-8">
              {toc.map((h) => (
                <li key={h.id}>
                  <a
                    href={`#${h.id}`}
                    className="text-[13px] leading-snug text-text-secondary hover:text-accent-blue block"
                  >
                    {h.text}
                  </a>
                </li>
              ))}
            </ul>

            <div className="border-t border-border pt-5 space-y-4">
              <div>
                <p className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-1">
                  Published
                </p>
                <time dateTime={post.publishedISO} className="text-[13px] text-text-secondary">
                  {post.published}
                </time>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-1">
                  Reading time
                </p>
                <p className="text-[13px] text-text-secondary">{post.readingMinutes} minutes</p>
              </div>
              <div>
                <p className="text-[11px] tracking-[0.09em] uppercase text-text-muted mb-1">
                  Written by
                </p>
                <p className="text-[13px] text-text-secondary">Team HataD</p>
              </div>
            </div>
          </aside>
        </div>
        <SiteFooter />
      </div>
    </div>
  )
}
