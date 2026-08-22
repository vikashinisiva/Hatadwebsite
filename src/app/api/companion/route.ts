import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { clientKey, rateLimit } from '@/lib/rate-limit'
import { SEARCH_DOMAINS, SYSTEM_PROMPT, modelFor, plain, scrub } from '@/lib/companion-brief'

/**
 * The companion's mouth.
 *
 * Server-only, and it has to be: an Anthropic key in a NEXT_PUBLIC_ variable
 * ships inside the client bundle and anyone can lift it and spend against it.
 * Nothing here reaches the browser except released sentences.
 *
 * The brief and the output filter live in `companion-brief.ts` — read that
 * first; this file is plumbing around it.
 */

/** An unauthenticated endpoint that costs money per call, so: a hard ceiling. */
const TURNS_PER_HOUR = 30
/** Long enough for a real question, short enough that nobody pastes a document. */
const MAX_CHARS = 600
/** Enough to answer in context, short enough to bound cost and prompt injection. */
const MAX_TURNS = 12

type Turn = { role: 'user' | 'assistant'; content: string }

function isTurn(v: unknown): v is Turn {
  if (!v || typeof v !== 'object') return false
  const t = v as Record<string, unknown>
  return (
    (t.role === 'user' || t.role === 'assistant') &&
    typeof t.content === 'string' &&
    t.content.length > 0 &&
    t.content.length <= MAX_CHARS
  )
}

export async function POST(request: NextRequest) {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) {
    /* Deliberately not a 500 with a stack. The page treats this as "he has
       nothing to say" and removes the ask field, which is the right behaviour
       on a launch page with no key configured. */
    return NextResponse.json({ reply: null, reason: 'unconfigured' }, { status: 503 })
  }

  const limited = rateLimit(`companion:${clientKey(request)}`, TURNS_PER_HOUR, 60 * 60 * 1000)
  if (!limited.allowed) {
    return NextResponse.json(
      { error: 'Too many questions for now. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSec) } },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const raw = (body as { messages?: unknown })?.messages
  if (!Array.isArray(raw) || raw.length === 0 || !raw.every(isTurn)) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
  /* Trailing window only. A long history is both a cost and an injection
     surface — the further back a planted instruction sits, the more turns it
     gets to be re-read. */
  const messages = (raw as Turn[]).slice(-MAX_TURNS)
  if (messages[messages.length - 1].role !== 'user') {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  const client = new Anthropic({ apiKey: key })

  /* Chosen from the question just asked, not the whole thread: a reader who
     switches to Tamil mid-conversation should be answered in Tamil by the model
     that is good at it, from that turn on. */
  const pick = modelFor(messages[messages.length - 1].content)

  const stream = client.messages.stream({
    model: pick.model,
    max_tokens: 1024,
    system: SYSTEM_PROMPT,
    ...(pick.effort ? { output_config: { effort: pick.effort } } : {}),
    /*
     * The variant comes from `pick`, because it has to match the model: the
     * dynamic-filtering tool exists only on Opus 4.6+ / Sonnet 4.6+, and the
     * basic one is what Haiku takes. `modelFor` decides both together so they
     * cannot be paired wrongly from here.
     *
     * allowed_domains is the substantive control. Open search on this subject
     * returns SEO farms and law-firm lead magnets — precisely the register this
     * product exists to be the opposite of — so he may only read primary
     * sources, which means anything he cites is something the reader could have
     * checked themselves.
     */
    tools: [
      {
        type: pick.searchTool,
        name: 'web_search',
        max_uses: 3,
        allowed_domains: SEARCH_DOMAINS,
      },
    ],
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  })

  /*
   * NDJSON, one object per line. Three kinds:
   *
   *   {"t":"…"}       a released fragment, safe to show
   *   {"reset":true}  discard everything shown so far
   *   {"replace":"…"} stop, and show this instead
   *
   * `reset` exists because of the server tool. The model narrates before and
   * between searches — "I'll check TNREGINET…" — and only the text after the
   * final tool result is the answer. Which block is final cannot be known until
   * the stream ends, so anything already released when a new tool starts was
   * throat-clearing and has to be taken back. With max_uses 3 that is at most a
   * couple of resets, and only on questions that search at all.
   *
   * `replace` is the guardrail. Nothing is released until it is a whole
   * sentence AND that sentence has passed `scrub` — so a price can never sit on
   * screen for the moment before the filter catches it, which is exactly the
   * hole a naive token-by-token stream would open in the one guarantee this
   * thing has to keep.
   */
  const encoder = new TextEncoder()
  const ndjson = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false
      const send = (o: unknown) => controller.enqueue(encoder.encode(JSON.stringify(o) + '\n'))
      const stop = () => {
        if (closed) return
        closed = true
        controller.close()
      }

      /** Text since the last tool block: the answer so far, not yet released. */
      let pending = ''
      /** What the client has been shown, for the one-paragraph rule. */
      let released = ''

      /**
       * Release whole sentences only.
       *
       * A fragment cannot be checked meaningfully — "the price is" is harmless
       * right up until its number arrives one token later. Waiting for a
       * terminator costs a little smoothness and buys the guarantee that
       * nothing unchecked is ever on screen.
       */
      const flush = (all: boolean) => {
        if (closed || !pending) return
        let take = pending
        if (!all) {
          const m = pending.match(/^[\s\S]*[.!?…](?=\s)/)
          if (!m) return
          take = m[0]
        }
        if (!take.trim()) return
        /* Marks off before the guardrail sees it, so a bolded number is still a
           number as far as the filter is concerned. */
        const { text: safe, tripped } = scrub(plain(take))
        if (tripped) {
          /* The brief was not enough on its own, and this filter is the only
             reason a price or a turnaround did not reach a reader. */
          console.warn(`[companion] guardrail tripped: ${tripped}`)
          send({ replace: safe })
          stop()
          return
        }
        pending = pending.slice(take.length)
        released += take
        send({ t: take })
      }

      try {
        for await (const event of stream) {
          if (closed) break

          if (event.type === 'content_block_start') {
            if (event.content_block.type !== 'text') {
              pending = ''
              released = ''
              send({ reset: true })
            }
            continue
          }

          if (event.type !== 'content_block_delta') continue
          if (event.delta.type !== 'text_delta') continue
          pending += event.delta.text

          /* One paragraph, enforced here rather than trimmed afterwards, so
             nothing past the blank line is ever sent at all. */
          const brk = pending.indexOf('\n\n')
          if (brk >= 0) {
            pending = pending.slice(0, brk)
            flush(true)
            stop()
            break
          }
          flush(false)
        }
        flush(true)
      } catch (err) {
        console.error('[companion] stream', err)
        if (!closed) send({ replace: 'Could not answer that just now.' })
      }
      stop()
    },
  })

  return new Response(ndjson, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
