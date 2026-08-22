'use client'

/**
 * The companion, on the launch page.
 *
 * He is an instrument with a face, not a mascot: his posture is resolved from a
 * row, never chosen here. On this page the row describes *the page's* progress —
 * which sources it has revealed, whether the join field is waiting on you — and
 * never a parcel, because no parcel has been examined. That distinction is the
 * whole reason he is safe to put on marketing at all:
 *
 *   "The full emotional range is available ... So he can be as expressive as you
 *    like on marketing and in the workbench, while a feeling can never land
 *    beside a finding."  — companion README, on O-18 / O-21
 *
 * So only three rows appear below, and all three are literally true of the page:
 *
 *   { reached: false }                     -> queued    nothing open yet
 *   { reached: true, retrieved: false }    -> reading   a section is being read
 *   { awaitingClient: true }               -> awaiting  we are waiting on you
 *
 * The six OUTCOME postures — clear, shouldKnow, mustClear, notEstablished,
 * notEstablishable, ready — are deliberately unreachable from this file. Each
 * asserts something about land, and there is no land here. The prototype page
 * reaches for them (`if (lit % 7 === 0) pose('notEstablished', ...)`) and says
 * outright it does so "so the abstaining posture appears on the page rather
 * than only in the study". Fine in a study. Against a real named department on
 * hatad.in it is a false statement, so it is not carried over.
 *
 * ── Placement ──────────────────────────────────────────────────────────────
 *
 * One position: the bottom-right corner, throughout.
 *
 * He used to have two — an offset over the map while the hero owned the screen,
 * then the corner — with the map offset measured at runtime. That handoff
 * depended on an IntersectionObserver flipping at the right moment AND on a
 * measurement taken at the right moment, and when either missed he sat
 * stranded between the two, well above the corner, with his caption
 * suppressed. Two positions bought a small entrance and cost a reliable
 * resting place.
 *
 * The hero-visibility flag survives because the beats still need to know
 * whether the hero owns the screen; it no longer decides where he is.
 */

import { useEffect, useRef, useState } from 'react'
import { Companion } from '@/companion/react/Companion'
import { postureFor, FAMILY_DOMAIN, type LedgerRow, type Domain } from '@/companion/hatad'
import { SOURCE_CLUSTERS } from '@/lib/departments'

/** What he is doing while a given section holds the screen. */
type Beat = {
  /** Section that triggers it. Later entries win when several are on screen. */
  sel: string
  row: LedgerRow
  caption: string
  /**
   * Something he volunteers, unprompted, once you have stayed a while.
   *
   * This is the line between a chatbot and a companion: a chatbot waits to be
   * asked, a companion has something to say. His brief permits speaking first
   * but is strict about the trigger — it must fire "on something the visitor
   * did or the page found", never on a clock. Dwelling in a section is
   * something you did; a timer running from page load is not, and a character
   * that pops facts on a countdown is the nag the brief rules out.
   *
   * These are HIS observations, not the page's copy moved nearer your cursor.
   * That distinction is the whole difference between a character and a label:
   * the page states its argument, and he notices something about it. Each line
   * still has to survive the same check as any client-facing sentence — no
   * price, no turnaround, no legal characterisation, nothing that is not true
   * of every parcel.
   */
  line?: string
}

/*
 * Ordered by position on the page, and resolved last-match-wins, so a scroll
 * that leaves one section part-way into the next always reads as the later of
 * the two. Written as data rather than as a chain of conditionals because the
 * next person to add a section should add a line here, not an `else if`.
 */
const BEATS: Beat[] = [
  {
    sel: '.dd',
    row: { reached: true, retrieved: false },
    caption: 'Reading',
    /* His subject, stated plainly: the gap is assumption, not fraud. Nobody
       reading this list expects to be lied to, which is exactly why it needs
       saying. */
    line: 'Nobody is lied to. They are just allowed to believe one document settles it.',
  },
  {
    sel: '.lt-cover',
    row: { reached: true, retrieved: false },
    caption: 'Reading · 38 districts',
    /* Dates first — his habit. Coverage is not a map of where we go, it is a
       map of when each office started keeping records you can see. */
    line: 'Every office was digitised on a different date. That date is the edge of what is online.',
  },
  /* He rests while you read the questions. `awaiting` resolves to `sleep`,
     which sets baseFace:false, baseBody:false and eyeAlpha:0 — a small bouncing
     circle with no face. That is right here and nowhere else on the page: it is
     a long section, nothing is happening, and a character who pretends to be
     busy through it is lying about a lull. */
  {
    sel: '.lt-block',
    row: { awaitingClient: true },
    caption: 'Listening',
    /* The one thing he is blunt about. "Nothing found" and "nothing there"
       are different sentences and the difference is somebody's money. */
    line: 'A clean-looking file usually means nobody has looked in the awkward place yet.',
  },
  /*
   * The register nudge — and NOT `awaiting`, despite its ledger condition
   * ("the case is stalled on the client, not on us") describing a closing call
   * to action exactly. It renders asleep and eyeless, so the one moment the
   * page is asking you for something is the one moment he has no face to ask
   * with. `queued` is the honest alternative and not a fudge: "not reached
   * yet" is the literal state of a case nobody has opened, which is every
   * visitor standing at this form.
   */
  {
    sel: '.lt-close',
    row: { reached: false },
    caption: 'Your turn',
    /* Not a sales line. The date habit again, turned on the reader's own
       timing: the record you rely on is only ever as current as its date. */
    line: 'Whatever you were shown has a date on it. It knows nothing after that.',
  },
]

const IDLE: Beat = { sel: '', row: { reached: false }, caption: 'Not opened yet' }

/*
 * How long each reaction holds before the grammar takes the face back.
 *
 * Good news gets the longest hold — it is the only one the reader is likely to
 * be looking straight at him for. A poke is the shortest: acknowledge, return.
 */
const REACT_MS: Record<string, number> = { pleased: 1900, confus: 1400, surpris: 1100, curieux: 900 }

/*
 * Held until something happens, rather than timed out.
 *
 * Boredom is not a reaction, it is the absence of one — a timer that put him
 * back to `reading` after a second and a half would be claiming work nobody is
 * doing. He stays sleepy until you move.
 */
const UNTIMED = new Set(['somnolent'])

/**
 * The entrance: how long the burst runs and his line stays up.
 *
 * Paced off the line rather than picked: roughly 400ms a word, which is what a
 * caption nobody is looking directly at costs to read. It was 3200 for eight
 * words; the name added four more and the window had to follow, or the last
 * sentence is gone before it is read.
 */
const INTRO_MS = 4800

/** What he says about himself, once, on arrival. */
const INTRO_LINE = "Hi, I'm Pip. I read what the records leave out. Ask me."

/**
 * How long you have to stay in a section before he volunteers its line.
 *
 * Long enough that scrolling through triggers nothing, short enough that
 * someone actually reading gets it while still in the section it is about.
 */
const DWELL_MS = 6000

/**
 * How long a volunteered line stays up before he goes quiet again.
 *
 * It used to stay until the section changed, which on a 3,000px section is
 * minutes — and a sentence pinned beside the reader for minutes is the status
 * label all over again, just with better words. He says it, then stops.
 */
const SAY_MS = 7500

/**
 * No scroll and no pointer for this long and he stops pretending to be busy.
 *
 * 35s, not 22s. Twenty-two seconds of neither is still inside normal reading —
 * a dense paragraph can take that — and a character who dozes off while you are
 * mid-sentence is commenting on your reading speed. This is a genuine lull.
 */
const IDLE_MS = 35000

/*
 * Three ways in.
 *
 * The panel used to open onto a table of contents — the six families and their
 * source counts — which answers "what is this" for someone who never asked.
 * A surface whose entire purpose is conversation should open with the
 * conversation, so it opens with questions instead.
 *
 * Chosen to land on the three things his brief makes him best at: the gap
 * between what a record says and what people assume it says, the date that
 * bounds every record, and the part of the job that never went online. Each
 * one puts him on ground he already has an answer for, rather than asking a
 * stranger to invent a good question about land records unprompted.
 *
 * They are questions a buyer would actually type, not feature names.
 */
const OPENERS = [
  'What does a patta actually prove?',
  'My EC is from 2022 — is that enough?',
  "What isn't online?",
]

/**
 * How long the panel takes to leave.
 *
 * Must outlast the slowest property in the exit transition, or it unmounts
 * mid-flight and the exit becomes the hard cut it was before.
 */
const PANEL_OUT_MS = 260

/** Survives a reload on purpose — being dismissed once should mean once. */
const HIDDEN_KEY = 'hatad_companion_hidden'

/**
 * Whether he has ever been opened. Teaches the tap hint, once, on touch.
 *
 * Separate from MET_KEY: meeting him is something that happens TO the reader,
 * opening him is something the reader does, and only the second one proves the
 * hint has done its job.
 */
const TAPPED_KEY = 'hatad_companion_tapped'

/**
 * Whether this reader has met him before.
 *
 * An introduction is a first meeting. Replaying it every visit turns the one
 * sentence that explains him into a banner that keeps coming back — the same
 * thing as an app replaying its tour on every launch, and the reason people
 * learn to scroll past things. Someone returning already knows what he is; he
 * arrives and gets on with it.
 */
const MET_KEY = 'hatad_companion_met'

/*
 * While the hero owns the screen, watching the plot it is scanning.
 *
 * Named IN_HERO and not ON_MAP: he used to be positioned over the map panel and
 * the name described where he sat. He now sits in the corner throughout, so the
 * only thing this still selects is which beat is true while the hero is up.
 *
 * `reading` and not `queued`: the map has landed, the readout is stepping
 * through its checks, and something is genuinely being looked at. It is the one
 * beat on the page where the posture describes an actual act rather than the
 * reader's position in a document.
 */
const IN_HERO: Beat = { sel: '', row: { reached: true, retrieved: false }, caption: 'Reading' }

/*
 * A thin band across the middle of the viewport, used as the reading line.
 *
 * NOT a visibility threshold. `threshold: 0.35` was the obvious first guess and
 * it is silently broken here: `.dd` is 3,155px tall against an 812px viewport,
 * so at most 26% of it can ever be on screen and the callback never fires at
 * all. Any rule phrased as a fraction of the TARGET breaks on a target taller
 * than the screen, which is most sections on this page.
 *
 * Collapsing the root to a 10%-tall band and asking for any intersection makes
 * the question height-independent: "is this thing crossing the middle of the
 * screen right now". A 500px section and a 5,000px section answer it the same
 * way, and exactly one section is ever the deepest match.
 */
const BAND = '-45% 0px -45% 0px'

/**
 * The thirty sources, flattened, each with the body he wears while on it.
 *
 * The domain is a property of the SOURCE rather than of the posture, so it
 * comes from the grammar's own family table — the six clusters here and the six
 * entries of FAMILY_DOMAIN are the same six families, in the same order.
 *
 * Built from the data rather than read out of the DOM. `.dd-name` carries the
 * full legal name — forty-four characters for the first one — which is a
 * paragraph in a corner chip; `short` is what that field is for. Reading the
 * array also means this keeps working on the Tamil layer, where the rendered
 * text changes and the index does not.
 */
const SOURCES: { short: string; domain: Domain }[] = SOURCE_CLUSTERS.flatMap((c, family) =>
  c.sources.map((s) => ({ short: s.short, domain: FAMILY_DOMAIN[family] ?? 'paper' })),
)

/**
 * Below this he is not mounted at all. There is a width at which an 84px
 * figure plus a panel is simply taking the screen away from the argument.
 */
const MIN_WIDTH = 340
/** At or above this he gets the full treatment: spoken captions and a card. */
const WIDE_WIDTH = 900

export function LaunchCompanion({
  joined = false,
  errored = false,
}: {
  joined?: boolean
  /** The join field is showing a validation message. */
  errored?: boolean
}) {
  /*
   * Three sizes, gated in JS rather than hidden in CSS.
   *
   * `display: none` would still mount the engine, still run its gaze clock and
   * still cost the work on the device least able to afford it, so the smallest
   * screens return null and build nothing at all.
   *
   * He used to be desktop-only, on the reasoning that the phone hero has the
   * map across the top and the join button across the bottom with no corner
   * left over. That was true when he stood in the hero. He does not any more —
   * he is hidden until the hero has gone — and past it the corner is free:
   * the countdown scrolls away with the hero, and nothing else on this page is
   * fixed to the bottom of the screen.
   *
   * What is left of the objection is real but narrower, and is handled below:
   * there is no room beside him for a sentence, and the closing call to action
   * has a join button he must not sit on top of.
   */
  const [size, setSize] = useState<'none' | 'narrow' | 'wide'>('none')
  useEffect(() => {
    const fits = window.matchMedia(`(min-width: ${MIN_WIDTH}px)`)
    const wide = window.matchMedia(`(min-width: ${WIDE_WIDTH}px)`)
    const sync = () => setSize(!fits.matches ? 'none' : wide.matches ? 'wide' : 'narrow')
    sync()
    fits.addEventListener('change', sync)
    wide.addEventListener('change', sync)
    return () => {
      fits.removeEventListener('change', sync)
      wide.removeEventListener('change', sync)
    }
  }, [])

  if (size === 'none') return null
  return <Mounted joined={joined} errored={errored} narrow={size === 'narrow'} />
}

/* Split so every observer below is created only on a screen that shows him,
   and torn down the moment the window narrows past the breakpoint. */
function Mounted({
  joined,
  errored,
  narrow,
}: {
  joined: boolean
  errored: boolean
  /** Phone-width. Changes what he may say and where his panel stands. */
  narrow: boolean
}) {
  const [heroGone, setHeroGone] = useState(false)
  const [beat, setBeat] = useState<Beat>(IDLE)
  const [source, setSource] = useState<{ short: string; domain: Domain } | null>(null)
  const [field, setField] = useState<'idle' | 'focus' | 'typing'>('idle')
  const [look, setLook] = useState<{ x: number; y: number } | null>(null)
  /** The source row he is currently naming, so his gaze can agree with his caption. */
  const rowEl = useRef<HTMLElement | null>(null)

  /* Declared here, not with the panel: the look poller below needs to know
     whether his own panel is open, and that outranks whatever is behind it. */
  /** What the reader has asked for. The intent, and what aria reports. */
  const [open, setOpen] = useState(false)
  /** Still in the DOM. Trails `open` by the exit transition so it can play. */
  const [mounted, setMounted] = useState(false)
  /** At its resting position. Leads `mounted` by a frame so the entry runs. */
  const [settled, setSettled] = useState(false)

  /*
   * Whether he has ever been opened, on this device.
   *
   * Only matters on touch. The one thing that tells a desktop reader he is a
   * control is that he reacts to a hover — the file says so where that handler
   * is bound — and a phone has no hover to react to. Without something in its
   * place he is decoration that happens to be tappable, which is the same as
   * not being tappable.
   *
   * Read once, on mount, rather than watched: it can only change by way of the
   * tap it is there to invite.
   */
  const [tapped, setTapped] = useState(true)
  useEffect(() => {
    try {
      setTapped(localStorage.getItem(TAPPED_KEY) === '1')
    } catch {
      /* Storage blocked. Defaults to taught, so a reader who cannot be
         remembered is never shown the same hint on every single visit. */
      setTapped(true)
    }
  }, [])

  /*
   * Whether the hero still owns the screen.
   *
   * An IntersectionObserver rather than a scroll listener, deliberately: the
   * page already runs a per-frame map overlay and a GSAP reveal, and a fifth
   * thing reading layout on every scroll event is how a page like this ends up
   * at four seconds of blocking time. The rootMargin cuts the viewport down to
   * its top third, so "hero still on screen" means genuinely on screen rather
   * than a sliver of it clinging to the top edge.
   */
  useEffect(() => {
    const hero = document.querySelector('.lt-hero')
    if (!hero) return
    const io = new IntersectionObserver(([e]) => setHeroGone(!e.isIntersecting), {
      rootMargin: '0px 0px -65% 0px',
    })
    io.observe(hero)
    return () => io.disconnect()
  }, [])

  /* Which section holds the screen. Last match in document order wins. */
  useEffect(() => {
    const live = new Set<number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = BEATS.findIndex((b) => e.target.matches(b.sel))
          if (i < 0) continue
          if (e.isIntersecting) live.add(i)
          else live.delete(i)
        }
        const top = live.size ? Math.max(...live) : -1
        setBeat(top < 0 ? IDLE : BEATS[top])
      },
      { rootMargin: BAND, threshold: 0 },
    )
    for (const b of BEATS) {
      const el = document.querySelector(b.sel)
      if (el) io.observe(el)
    }
    return () => io.disconnect()
  }, [])

  /*
   * Which source he is on, for the caption and the body.
   *
   * Observed here rather than lifted out of DepartmentDescent: that component
   * owns its own reveal and has no reason to know a character exists. The rows
   * already carry `data-i`, and that index is the only thing taken from the
   * DOM — the name and the body come from SOURCES, so the two cannot disagree.
   */
  useEffect(() => {
    const rows = document.querySelectorAll<HTMLElement>('.dd-row[data-i]')
    if (!rows.length) return
    const live = new Set<number>()
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = Number((e.target as HTMLElement).dataset.i)
          if (Number.isNaN(i)) continue
          if (e.isIntersecting) live.add(i)
          else live.delete(i)
        }
        if (!live.size) return
        const i = Math.max(...live)
        const hit = SOURCES[i]
        if (hit) setSource(hit)
        /* Keep the element too — he should be looking at the row he is
           naming, not past it at your cursor. See the look poller. */
        rowEl.current = rows[i] ?? null
      },
      /* Same reading line as the sections, so the source he names is the one
         level with the section he is reading. */
      { rootMargin: BAND, threshold: 0 },
    )
    rows.forEach((r) => io.observe(r))
    return () => io.disconnect()
  }, [])

  /*
   * The join field, both instances of it.
   *
   * Delegated on the document rather than bound per input: the form renders
   * twice, in the hero and at the close, and the hero copy sits in a subtree
   * that re-keys on every map arrival. A listener attached to the node would
   * quietly stop firing; this cannot.
   */
  useEffect(() => {
    const isEntry = (t: EventTarget | null) =>
      t instanceof HTMLElement && t.classList.contains('lt-input')

    const onFocus = (e: FocusEvent) => {
      if (isEntry(e.target)) setField('focus')
    }
    const onBlur = (e: FocusEvent) => {
      if (isEntry(e.target)) setField('idle')
    }
    const onInput = (e: Event) => {
      if (!isEntry(e.target)) return
      setField((e.target as HTMLInputElement).value.length ? 'typing' : 'focus')
    }

    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onBlur)
    document.addEventListener('input', onInput)
    return () => {
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onBlur)
      document.removeEventListener('input', onInput)
    }
  }, [])

  /*
   * Dismissible, because his own brief says so: "A character you cannot get rid
   * of is a nag." Persisted, because being dismissed once should mean once.
   *
   * Read in an effect rather than during render — localStorage does not exist
   * on the server, and reading it inline would make the first client render
   * disagree with the markup that was sent.
   */
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem(HIDDEN_KEY) === '1') setHidden(true)
    } catch {
      /* private mode, blocked storage — he simply stays. */
    }
  }, [])

  /*
   * He arrives with section 02, not with the page.
   *
   * The hero is not his. It already has a map flying between cities, a readout
   * naming coordinates, a countdown and a join form — a character in the corner
   * of that is a fifth thing competing for the same glance, and his own brief
   * is explicit that he belongs where something is happening rather than
   * everywhere. Section 02 is where the page starts making its argument, and it
   * is the first place he has anything to add.
   *
   * Latched: once he has arrived he stays, so scrolling back up does not
   * replay an entrance.
   */
  const [built, setBuilt] = useState(false)
  useEffect(() => {
    if (built) return
    const dd = document.querySelector('.dd')
    if (!dd) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setBuilt(true)
      },
      /* A little before it lands, so he is already there as the section
         settles rather than appearing on top of it. */
      { rootMargin: '0px 0px -12% 0px' },
    )
    io.observe(dd)
    return () => io.disconnect()
  }, [built])

  /*
   * The entrance, and the one line he says about himself.
   *
   * `burst` is a state, not an expression — the whole silhouette scatters and
   * reforms — which is why it needed its own axis on the binding. It is the
   * only thing in his range that reads as arriving rather than as reacting,
   * so it is the right thing to arrive with, and it is used nowhere else.
   *
   * The line does a second job: he is the only element on this page that
   * responds to a hover or a click, and nothing else says so. One sentence at
   * the moment he appears is cheaper than a tooltip nobody reads.
   */
  const [intro, setIntro] = useState(false)

  /*
   * Marks the moment the caption text changes, so CSS can fade the new one in.
   *
   * Text content cannot be transitioned, and the span belongs to the binding so
   * it cannot be re-keyed from here. Toggling an attribute re-applies the
   * animation, which restarts it — the same trick the launch page already uses
   * to replay the scan card's draw-in on each arrival.
   */
  const [fresh, setFresh] = useState(0)
  useEffect(() => {
    if (!built) return
    let met = false
    try {
      met = localStorage.getItem(MET_KEY) === '1'
    } catch {
      /* Blocked storage: introduce him. Repeating an introduction to someone
         who has already met him is a smaller failure than never making one. */
    }
    if (met) return
    setIntro(true)
    try {
      localStorage.setItem(MET_KEY, '1')
    } catch {}
    const id = setTimeout(() => setIntro(false), INTRO_MS)
    return () => clearTimeout(id)
  }, [built])

  /*
   * What he watches.
   *
   * The focused field first — if you are typing at him, that is the thing that
   * is happening, and him turning to look is the whole register nudge. Failing
   * that, the plot the map is scanning, while he is over the map. Everywhere
   * else he is left to the pointer, which is his default.
   *
   * `.lt-scan` is already reprojected onto the parcel every frame by the map's
   * own overlay pass, so its position answers "where is the land" without this
   * file knowing anything about Mapbox, projections or the flight. Polled on a
   * slow interval rather than per frame: his eyes morph over 240ms and turn at
   * most 16 degrees, so four samples a second is finer than anything visible.
   */
  useEffect(() => {
    /* Nothing to look at on behalf of a companion who is not there. This used
       to poll a bounding box four times a second for the whole life of the
       page, including after "Hide him". */
    if (!built || hidden) return
    const read = () => {
      /* While his own panel is open that is where the conversation is, so it
         is what he should be looking at — not the row behind it. */
      if (open) {
        const panel = document.querySelector('.lc-panel')
        if (panel) {
          const r = panel.getBoundingClientRect()
          return setLook({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
        }
      }
      const focused = document.activeElement
      if (focused instanceof HTMLElement && focused.classList.contains('lt-input')) {
        const r = focused.getBoundingClientRect()
        return setLook({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }
      /*
       * Looking at the thing he is talking about.
       *
       * He used to say "Reading - SIPCOT" while staring at your cursor, which
       * is the single most lifeless thing he did: the caption and the gaze
       * disagreed, so neither was believable. Pointing him at the row costs
       * one rect and makes the two agree.
       */
      if (heroGone) {
        const row = rowEl.current
        if (!row) return setLook(null)
        const r = row.getBoundingClientRect()
        if (r.bottom < 0 || r.top > window.innerHeight) return setLook(null)
        return setLook({ x: r.left + r.width / 2, y: r.top + r.height / 2 })
      }
      const el = document.querySelector<HTMLElement>('.lt-scan')
      /* `data-shown` is the map's own statement that a plot has been acquired
         and the annotation is live. Before that there is nothing to look at. */
      if (!el || el.dataset.shown !== 'true') return setLook(null)
      /*
       * Its ORIGIN, not its centre, and no width check.
       *
       * The element measures 0x0 — the card, the leader and the tether inside
       * it are all absolutely positioned, so it carries no box of its own. It
       * is a bare anchor: the map translates it to `project(parcelCentre)` on
       * every frame, which makes its top-left corner the projected plot
       * exactly. A width check rejects it outright, and asking for its centre
       * would only average a point with itself.
       */
      const r = el.getBoundingClientRect()
      if (!Number.isFinite(r.x) || (r.x === 0 && r.y === 0)) return setLook(null)
      setLook({ x: r.x, y: r.y })
    }
    read()
    const id = setInterval(read, 250)
    return () => clearInterval(id)
  }, [heroGone, field, built, hidden, open])

  /*
   * Reactions to the reader, which are not ledger conditions.
   *
   * Everything else he does is resolved by `postureFor` from a row, and that is
   * the point of him. But "you joined", "that entry was not valid" and "you
   * clicked me" are facts about YOU, not about a record — the prototype names
   * this seam exactly: "poke a state directly - 'you clicked me' is not a
   * ledger condition". It is also the only place the eleven `brand` expressions
   * are reachable, and the README is explicit that they are for marketing
   * surfaces like this one.
   *
   * Time-boxed on purpose. A reaction that persists stops being a reaction and
   * becomes a state, and a state on this page has to come from the grammar.
   */
  const [react, setReact] = useState<string | null>(null)

  /*
   * Asking him things.
   *
   * `available` is tri-state: null until the first attempt, false when the
   * route answers 503 because no key is configured. On false the ask field is
   * removed entirely rather than shown broken — a deploy without a key gets a
   * companion who shows coverage and says nothing, which is a coherent thing
   * to be, unlike an input that swallows questions.
   */
  const [chat, setChat] = useState<{ role: 'user' | 'assistant'; content: string }[]>([])
  const [draft, setDraft] = useState('')
  const [pending, setPending] = useState(false)
  const [available, setAvailable] = useState<boolean | null>(null)
  const askRef = useRef<HTMLInputElement>(null)
  /*
   * How many words of the streaming answer were already on screen.
   *
   * The guardrail releases whole sentences, never fragments, so text arrives in
   * two or three lumps rather than token by token. Without this every word of a
   * lump animates at the same instant and it reads as a paste, not as speech.
   * Knowing where the new tail begins lets the reveal cascade across only the
   * words that just arrived.
   *
   * A ref, not state: it is read during the render that the paint triggers, and
   * making it state would mean a second render to use a value we already have.
   */
  const revealedRef = useRef(0)
  const threadRef = useRef<HTMLDivElement>(null)

  /* Opening the panel is a request to ask something, so the caret goes where
     the asking happens. Without this it is open-then-click-again, every time. */
  useEffect(() => {
    if (open && available !== false) askRef.current?.focus()
  }, [open, available])

  /* Newest turn in view. A thread that grows past its box and does not follow
     leaves his answer below the fold of a panel four lines tall. */
  useEffect(() => {
    const el = threadRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [chat, pending])

  function ask(e: React.FormEvent) {
    e.preventDefault()
    void send(draft)
  }

  /*
   * Split from the form handler so an opener can send its own text.
   *
   * A chip cannot set `draft` and then submit — setState is not synchronous,
   * so the submit would read the previous value and send the empty string.
   * Taking the question as an argument removes the round trip entirely.
   */
  async function send(raw: string) {
    const q = raw.trim()
    if (!q || pending) return
    const next = [...chat, { role: 'user' as const, content: q }]
    setChat(next)
    setDraft('')
    setPending(true)
    /* Comparing sources is what a web search actually is, so this is the honest
       face for the wait rather than a spinner with a personality. */
    setReact('crosschecking')

    /*
     * Reads the NDJSON stream and grows the last message in place.
     *
     * `reset` clears what has been shown — the model was narrating before a
     * search and that narration is not the answer. `replace` ends the turn with
     * a fixed line, which is how a tripped guardrail arrives.
     */
    let shown = ''
    /*
     * The ref must hold the count from BEFORE this paint, because the render it
     * schedules is what reads it. Assigning the new count first would tell that
     * render every word is old, and nothing would cascade.
     */
    let counted = 0
    revealedRef.current = 0
    const paint = (text: string) => {
      revealedRef.current = counted
      counted = text.split(/\s+/).filter(Boolean).length
      setChat([...next, { role: 'assistant' as const, content: text }])
    }

    try {
      const res = await fetch('/api/companion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next }),
      })
      if (res.status === 503) {
        setAvailable(false)
        setChat(chat)
        return
      }
      setAvailable(true)

      if (!res.body || !res.headers.get('content-type')?.includes('ndjson')) {
        const data = (await res.json().catch(() => ({}))) as { error?: string }
        paint(data.error || 'Could not answer that just now.')
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buf = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buf += decoder.decode(value, { stream: true })
        const lines = buf.split('\n')
        /* The tail may be half a line; keep it for the next chunk. */
        buf = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          let msg: { t?: string; reset?: boolean; replace?: string }
          try {
            msg = JSON.parse(line)
          } catch {
            continue
          }
          if (msg.reset) shown = ''
          else if (msg.replace !== undefined) shown = msg.replace
          else if (msg.t) shown += msg.t
          paint(shown)
        }
      }
      if (!shown.trim()) paint('I have nothing useful on that.')
    } catch {
      paint('That did not go through. Try again.')
    } finally {
      setPending(false)
      setReact(null)
    }
  }
  const btnRef = useRef<HTMLButtonElement>(null)

  /*
   * Mount, then settle. Unsettle, then unmount.
   *
   * The panel animates on a CSS *transition*, not a keyframe, and this is the
   * reason: a keyframe always replays from its own first frame, so a panel
   * caught halfway out jumps back to fully-open before closing again. A
   * transition interpolates from whatever is on screen right now, so grabbing
   * one mid-close reverses it from exactly where it had got to.
   *
   * That also makes this effect self-cancelling. Re-opening during the exit
   * runs the cleanup, which clears the pending unmount, and the same
   * transition simply re-targets.
   */
  useEffect(() => {
    if (open) {
      setMounted(true)
      /* A frame late on purpose: the element has to be painted in its closed
         state before the open state can be transitioned to. Setting both in
         one pass gives the browser nothing to interpolate from. */
      const id = requestAnimationFrame(() => setSettled(true))
      return () => cancelAnimationFrame(id)
    }
    setSettled(false)
    const id = setTimeout(() => setMounted(false), PANEL_OUT_MS)
    return () => clearTimeout(id)
  }, [open])

  const dismiss = () => {
    setOpen(false)
    setHidden(true)
    try {
      localStorage.setItem(HIDDEN_KEY, '1')
    } catch {}
  }

  /*
   * Escape closes and focus goes back to the control that opened it; a click
   * anywhere else closes without stealing focus.
   *
   * Escape alone is not enough for a disclosure — clicking away is what people
   * actually do, and a panel that ignores it has to be dismissed by the same
   * small target that opened it. Focus is only moved on the Escape path,
   * because that is the one where the reader is on the keyboard and would
   * otherwise be stranded on a removed element.
   */
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setOpen(false)
      btnRef.current?.focus()
    }
    const onDown = (e: PointerEvent) => {
      const t = e.target
      /* The button toggles on its own click; letting this fire too would close
         and reopen in the same gesture. */
      if (t instanceof Node && document.querySelector('.lc')?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onDown)
    }
  }, [open])
  useEffect(() => {
    if (!react || UNTIMED.has(react)) return
    const id = setTimeout(() => setReact(null), REACT_MS[react] ?? 1200)
    return () => clearTimeout(id)
  }, [react])

  /*
   * He gets bored, and it is the honest face for it.
   *
   * `somnolent` is client-tagged, so this is not a mascot doing a bit — it is
   * the same admission his `awaiting` beat already makes at the FAQ: nothing is
   * happening here. A character who looks busy through a stretch where the
   * reader has stopped reading is performing, and performance is the thing his
   * brief rules out ("his state IS that thing, not a performance of it").
   *
   * Any scroll or pointer movement wakes him. Passive listeners because this
   * page cannot afford another handler that blocks the scroller.
   */
  useEffect(() => {
    if (!built || hidden) return
    let timer: ReturnType<typeof setTimeout>
    const wake = () => {
      setReact((r) => (r === 'somnolent' ? null : r))
      clearTimeout(timer)
      timer = setTimeout(() => setReact('somnolent'), IDLE_MS)
    }
    wake()
    window.addEventListener('scroll', wake, { passive: true })
    window.addEventListener('pointermove', wake, { passive: true })
    return () => {
      clearTimeout(timer)
      window.removeEventListener('scroll', wake)
      window.removeEventListener('pointermove', wake)
    }
  }, [built, hidden])

  /* The page's one moment of good news, which he used to sit blank through. */
  useEffect(() => {
    if (joined) setReact('pleased')
  }, [joined])

  /* Not `unsettled`, which is a finding face. Nothing is wrong with the land;
     something is wrong with what was typed, and `confus` says only that. */
  useEffect(() => {
    if (errored) setReact('confus')
  }, [errored])

  /*
   * Volunteering.
   *
   * Reset on every change of beat, so the clock measures time spent HERE
   * rather than time on the page — scrolling straight past a section must
   * never trigger the line belonging to it. Latched once said, so it is said
   * once per visit to a section rather than cycling.
   */
  const [volunteered, setVolunteered] = useState(false)
  useEffect(() => {
    setVolunteered(false)
    if (!beat.line) return
    const say = setTimeout(() => setVolunteered(true), DWELL_MS)
    const hush = setTimeout(() => setVolunteered(false), DWELL_MS + SAY_MS)
    return () => {
      clearTimeout(say)
      clearTimeout(hush)
    }
  }, [beat])

  /** True for exactly as long as the hero still owns the screen. */
  const inHero = !heroGone


  /**
   * Built, not dismissed, and past the hero. Gates the visible fade, the
   * accessibility tree and the control together, so those three can never
   * disagree — which is exactly how the focusable-but-hidden button happened.
   *
   * The hero term is why he leaves when you scroll back up. `built` stays
   * latched underneath it: arriving is a thing that happens once, and being on
   * screen is a thing that comes and goes. Keeping them as separate facts is
   * what stops a scroll back to the top from re-running his entrance — and
   * `heroGone` is already tracked live rather than latched, so it flips back
   * on its own the moment the hero owns the screen again.
   */
  /*
   * On a phone he steps aside for the ask.
   *
   * `.lt-close` carries the second join form, and he stands exactly where its
   * button ends up as it scrolls through the lower half of the screen. On a
   * desktop he is far to the side of it; at 390px wide there is no "to the
   * side". Nothing floats over the one control this page exists to get pressed.
   *
   * Read off the beat observer that is already running rather than a third
   * observer of its own — it is the same question, asked once.
   */
  const overTheAsk = narrow && beat.sel === '.lt-close'

  const live = built && !hidden && !inHero && !overTheAsk

  /*
   * He cannot still be holding a conversation from behind the hero.
   *
   * Closing it, rather than letting the render gate drop it, is what lets the
   * panel collapse back into him on the way out instead of being cut mid-air —
   * and it means the reader who scrolls back down finds him closed and quiet
   * rather than mid-sentence in a panel they had already left.
   */
  useEffect(() => {
    if (!live) setOpen(false)
  }, [live])

  /*
   * What wins. Narrowest thing first: what you are doing beats what you are
   * looking at, and having joined beats both.
   */
  const active: Beat & { domain?: Domain } = joined
    ? /* `queued` reads as odd until you check what it means — "not reached yet"
         — which is the literal truth of a waitlist entry before 31 August. He
         is not celebrating; he is telling you where you now sit. */
      { sel: '', row: { reached: false }, caption: 'On the list' }
    : field === 'typing'
      ? { sel: '', row: { reached: true, retrieved: false }, caption: 'Reading', domain: 'paper' }
      : field === 'focus'
        ? /* Same reasoning as the closing beat: he must have a face while you
             are looking at him with a cursor in the box. */
          { sel: '', row: { reached: false }, caption: 'Listening' }
        : beat.sel === '.dd' && source
          ? { ...beat, caption: `Reading · ${source.short}`, domain: source.domain }
          : beat

  /*
   * Whether he has anything to SAY, as opposed to a state to report.
   *
   * He used to caption every section he passed — "Reading", "Reading · IGR",
   * "Reading · 38 districts" — which is a status ticker relabelling itself
   * every few hundred pixels, in a box narrow enough to truncate half of them.
   * Nobody wants a readout following them down a page, and a character who
   * narrates continuously is not saying anything; he is just present and
   * noisy.
   *
   * So the captions are now the exception. He speaks when he has volunteered
   * something, when you are typing at him, and when you have just joined —
   * all three of which are a reason to speak. Everywhere else he is quiet, and
   * still visibly changes body and face as the sections change, which is the
   * part that reads as alive without asking to be read.
   *
   * The text still reaches assistive tech either way: `captionHidden` moves it
   * to a visually-hidden live region rather than dropping it.
   */
  const captionText = intro
    ? INTRO_LINE
    : (volunteered && active.line) || (inHero ? IN_HERO.caption : active.caption)

  /*
   * The panel outranks the caption, because they are the same act.
   *
   * With both up he was talking in two places at once, and they stacked into a
   * column of two boxes in the corner — a volunteered sentence arguing for
   * attention directly underneath the surface the reader had just opened to
   * hear him. Opening the panel is a decision to have the conversation there,
   * so the caption gets out of the way and comes back when it closes.
   */
  /*
   * He does not caption on a phone, at all.
   *
   * The caption is a sentence set beside him: at 32ch of monospace that is
   * about 220px, and he is another 84px, which is most of a 360px screen
   * covered by something nobody asked to read. Truncating it would be worse —
   * these lines are his whole character and half of one is just noise.
   *
   * So on narrow screens the panel carries everything he has to say, and its
   * opening line is where you meet him. He is still expressive: posture, body
   * and face all still change with the section. He simply does not talk over
   * the page to do it.
   */
  const speaking =
    !narrow &&
    !open &&
    (intro ||
      (react !== 'somnolent' && (!!(volunteered && active.line) || field !== 'idle' || joined)))

  useEffect(() => {
    setFresh((f) => f + 1)
  }, [captionText])

  return (
    <div
      className="lc"
      data-shown={live}
      /* Observable on purpose. Whether he has volunteered is the one piece of
         his behaviour with no visible trace until the moment it fires, which
         makes it the one piece that cannot be checked from a screenshot. */
      data-said={volunteered}
      /* Drives the panel's phone geometry from the same matchMedia that drives
         his behaviour, so the two can never disagree the way a duplicated CSS
         breakpoint eventually would. */
      data-narrow={narrow}
      aria-hidden={!live}
    >
      {/*
        * A real button over him, not a click handler on the wrapper.
        *
        * His brief is specific: he tracks your cursor and reacts to what you
        * do, so he reads as interactive — "and a control that looks
        * interactive and ignores a click is a small broken promise". It also
        * requires the control to be operable by keyboard, to report its state,
        * and for the SVG to stay demoted so a screen reader announces one
        * thing and not two.
        *
        * Transparent and laid over the silhouette rather than wrapped around
        * it, so the binding keeps ownership of its own subtree.
        */}
      {/*
        * Rendered only while he actually is one.
        *
        * It used to render unconditionally, which put an invisible, focusable,
        * clickable 84x84 button in the corner for the 1.5s before he is built
        * — and left one there permanently after "Hide him", inside a subtree
        * marked aria-hidden. A focusable descendant of aria-hidden is a
        * straight ARIA violation: the control is gone from the accessibility
        * tree but a keyboard can still land on it, so tabbing reaches a thing
        * that is not there and opens a panel about a companion nobody can see.
        */}
      {live && (
      <button
        ref={btnRef}
        type="button"
        className="lc-hit"
        aria-expanded={open}
        /* Only while the panel exists — pointing at an absent id is a dangling
           reference for anything that follows it. */
        aria-controls={mounted ? 'lc-panel' : undefined}
        aria-label={open ? 'Close Pip' : 'Ask Pip about what HataD opens'}
        /* Noticing you before you commit to a click, and it makes the control
           discoverable — he is the only thing on the page that responds to a
           hover, which is the hint that he responds to anything. */
        onPointerEnter={() => setReact((r) => (r === 'somnolent' || !r ? 'curieux' : r))}
        onClick={() => {
          setReact('surpris')
          setOpen((v) => !v)
          /* The hint has done its job the moment he is opened, so it retires
             here rather than on a timer — a timer would take it away from
             someone still deciding, and leave it up for someone who never
             looks. */
          if (!tapped) {
            setTapped(true)
            try {
              localStorage.setItem(TAPPED_KEY, '1')
            } catch {}
          }
        }}
      />
      )}

      {/* Gated on `mounted` alone, not on `live`. The effect above already
          closes it when he leaves, and going through `open` is what gives the
          exit its 260ms; re-adding `live` here would cut that short and put
          back the hard unmount it replaced. It stays inside `.lc`, which is
          `aria-hidden` and at zero opacity the whole time he is gone. */}
      {mounted && (
        <div
          className="lc-panel"
          id="lc-panel"
          /* The transition target. Every animated property has a closed value
             on the base rule and an open value here, so both directions are
             the same interpolation run backwards. */
          data-settled={settled}
          role="group"
          aria-label="Pip"
        >
          {/* Decorative and hidden: the search is already announced in words by
              the live region below, and a screen reader has no use for a light
              going round the edge. */}
          {pending && <span className="lc-beam" aria-hidden="true" />}
          {chat.length === 0 ? (
            <div className="lc-open">
              <p className="lc-open-h">Pip</p>
              <p className="lc-open-l">Ask me what a record can and cannot tell you.</p>
              {/*
                * Buttons, not decoration: each one sends its own text, so the
                * first thing a reader does here can be a single click.
                *
                * `--i` staggers them in behind the panel rather than with it.
                * The surface arrives first and its contents follow, which is
                * the order things arrive in the physical world and the reason
                * the panel reads as opening rather than as being pasted on.
                */}
              <ul className="lc-chips">
                {OPENERS.map((q, i) => (
                  <li key={q}>
                    <button
                      type="button"
                      className="lc-chip"
                      style={{ '--i': i } as React.CSSProperties}
                      onClick={() => void send(q)}
                      disabled={pending}
                    >
                      <span className="lc-chip-t">{q}</span>
                      <span className="lc-chip-go" aria-hidden="true">
                        →
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="lc-thread" ref={threadRef} aria-live="polite">
              {chat.map((m, i) => (
                <p key={i} className="lc-msg" data-from={m.role}>
                  {m.role === 'assistant'
                    ? /*
                       * One span per word, so a word that has just arrived
                       * animates on mount and the ones already there do not.
                       * React only inserts the new spans — that is the whole
                       * mechanism. No per-frame work, no animation library.
                       *
                       * Keyed by index, not by content: two identical words in
                       * a sentence are different words, and a content key would
                       * make the second reuse the first element and skip its
                       * reveal.
                       */
                      (() => {
                        /*
                         * `wi` counts words only; `j` counts the whitespace
                         * pieces too, and the stagger has to be per word or the
                         * gaps get delays of their own.
                         *
                         * The delay is measured from where the new tail begins,
                         * so a sentence that has just arrived cascades while the
                         * ones already read stay put at zero.
                         */
                        let wi = -1
                        return m.content.split(/(\s+)/).map((w, j) => {
                          if (!w.trim()) return w
                          wi += 1
                          const step = Math.max(0, wi - revealedRef.current)
                          return (
                            <span
                              key={j}
                              className="lc-w"
                              style={{ '--d': `${Math.min(step, 24) * 26}ms` } as React.CSSProperties}
                            >
                              {w}
                            </span>
                          )
                        })
                      })()
                    : m.content}
                </p>
              ))}
              {/* A sweep across the word rather than three dots after it. The
                  dots said "a timer is running"; a light moving over the word
                  says something is being read, which is the true statement and
                  the one worth making while he is actually searching. */}
              {pending && (
                <p className="lc-msg" data-from="assistant">
                  <span className="lc-think">Reading</span>
                </p>
              )}
            </div>
          )}

          {available !== false && (
            <form className="lc-ask" onSubmit={ask}>
              <input
                ref={askRef}
                className="lc-ask-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Ask Pip"
                aria-label="Ask Pip a question"
                maxLength={600}
                disabled={pending}
              />
              <button type="submit" className="lc-ask-go" disabled={pending || !draft.trim()}>
                →
              </button>
            </form>
          )}

          <button type="button" className="lc-dismiss" onClick={dismiss}>
            Hide Pip
          </button>
        </div>
      )}
      {built && (
        <Companion
          className="lc-bot"
          /* postureFor is the only thing that decides. There is deliberately no
             way to name a posture from this file. */
          posture={postureFor(inHero ? IN_HERO.row : active.row)}
          /* `land` while he is over the map, and not as decoration: the domain
             is a property of what is being read, and what is being read there
             is a parcel rather than a document. */
          domain={inHero ? 'land' : (active.domain ?? 'neutral')}
          /*
           * A volunteered line outranks every status label, including the
           * hero's.
           *
           * This read `inHero ? IN_HERO.caption : ...`, so the line could only
           * ever appear once the hero had scrolled away — and it hid the bug
           * beautifully, because IN_HERO.caption and the sources beat's caption
           * are both the string "Reading". The flag said it had spoken, the CSS
           * had widened to fit a sentence, and the visible text never changed.
           *
           * Having something to say is a stronger claim than reporting a state,
           * so it goes first. Nothing is lost in the hero: its beat carries no
           * line, so there is nothing to outrank there.
           */
          caption={captionText}
          playState={intro ? 'burst' : null}
          /*
           * Quiet while he dozes.
           *
           * The caption is resolved from the beat and the reaction only
           * overrides the FACE, so a sleeping companion was still captioned
           * "Reading - SIPCOT". That is the same caption-and-gaze disagreement
           * fixed just above, wearing a different hat: asleep and claiming to
           * read is worse than either alone. It stays available to assistive
           * tech; it just stops being asserted on screen.
           */
          /*
           * Always hidden here — hidden, not silenced.
           *
           * The vendored span keeps role=status and aria-live, so a screen
           * reader hears every caption exactly as it did before, including the
           * ones that are not drawn. It is now the assistive copy only. The
           * visible one is rendered below, because that span holds a plain
           * string owned by the engine, and a string cannot be revealed a word
           * at a time.
           */
          captionHidden
          lookAt={look}
          react={react}
        />
      )}
      {/*
        * What he says, spoken rather than posted.
        *
        * The same reveal the chat uses — a word at a time, blurred in on a
        * 26ms stagger — because it is the same act. A volunteered line used to
        * arrive whole, which reads as a label being placed next to him rather
        * than as him talking, and that difference matters most precisely here:
        * this is the one line nobody asked for, so it has to earn the
        * interruption by sounding like someone saying it.
        *
        * Keyed on `fresh`, so every new sentence is a new subtree and the
        * animation restarts by construction. The old code alternated between
        * two identically-shaped keyframes to fake that, because it did not own
        * the span and so had no way to re-key it.
        */}
      {/*
        * The tap hint, on touch only, until he has been opened once.
        *
        * It sits in the same row the caption uses, which is empty on a phone —
        * so it costs no new layout, and it occupies the space a sentence would
        * have taken if there had been room for one.
        *
        * `aria-hidden` because it is a hint about a gesture, and the control
        * beside it already announces itself as "Ask Pip" to a screen reader.
        * Repeating it would be two labels for one thing.
        */}
      {live && narrow && !tapped && !open && (
        <span className="lc-tap" aria-hidden="true">
          Ask
        </span>
      )}
      {built && speaking && (
        <p className="lc-cap" aria-hidden="true" key={fresh}>
          {(() => {
            /* Split keeps the separators so spacing survives, but only real
               words are counted for the delay — otherwise the gaps take
               turns of their own and the cascade doubles in length. */
            let wi = -1
            return captionText.split(/(\s+)/).map((w, j) => {
              if (!w.trim()) return w
              wi += 1
              return (
                <span
                  key={j}
                  className="lc-w"
                  style={{ '--d': `${Math.min(wi, 24) * 26}ms` } as React.CSSProperties}
                >
                  {w}
                </span>
              )
            })
          })()}
        </p>
      )}
    </div>
  )
}

export default LaunchCompanion
