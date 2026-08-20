/**
 * /pricing answers 410 Gone.
 *
 * The page was live for three days, long enough for Google to crawl it and
 * cache a snippet quoting a price that is no longer ours to state. Removing the
 * page does not remove the index entry, and the temporary redirect that
 * replaced it made things worse: a 307 tells a crawler the URL still exists and
 * to come back, so the entry stays indexed and the cached snippet keeps
 * showing.
 *
 * 410 is the unambiguous signal that the resource is gone, and it is the
 * fastest de-indexing response short of the Search Console removal tool. It
 * does not poison the URL: publishing a page here again re-indexes it normally
 * once the price is settled.
 *
 * `x-robots-tag: noindex` is belt and braces for any crawler that renders the
 * body before reading the status.
 */
export function GET() {
  return new Response(
    'This page has been removed. Pricing is not currently published.',
    {
      status: 410,
      headers: {
        'content-type': 'text/plain; charset=utf-8',
        'x-robots-tag': 'noindex, nofollow',
        'cache-control': 'public, max-age=0, must-revalidate',
      },
    },
  )
}
