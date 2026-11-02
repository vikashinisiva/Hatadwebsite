'use client'

import { memo, useEffect, useRef } from 'react'
import { LAUNCH_DISTRICTS } from '@/lib/constants'
import { SOURCE_CLAIM, SOURCE_CLUSTERS } from '@/lib/departments'

/*
 * What we're building: the app, the API and the enterprise system.
 *
 * The words render here, with the page, so they read before any script runs. The three live
 * stages are driven by /figures/products/live.js, loaded only as the section nears the screen,
 * which keeps about 25 KB of animation out of the bundle. Its styles are
 * /figures/products/products.css; every class there is prefixed (pd-, pa-, pi-, px-), and the
 * class names and data attributes below are the contract live.js reads.
 *
 * live.js writes into several elements here (the response console, the review queue, the
 * activity feed, the district map). React renders no children into those and this component
 * never re-renders (memo, no props), so it never reconciles what the script has drawn.
 *
 * Numbers are counted, never typed: districts from LAUNCH_DISTRICTS, sources and kinds of record
 * from SOURCE_CLUSTERS. The sample parcel (55/1A, Perunkudi) and every value shown for it come
 * from the app's own sample screens. Neither the price nor the turnaround appears here.
 */

const ASSETS = '/figures/products'
const DISTRICTS = LAUNCH_DISTRICTS.length
const KINDS = SOURCE_CLUSTERS.length

type Mount = (root: HTMLElement) => () => void

const PRODUCTS = [
  { id: 'pd-app', name: 'The app', for: 'For people buying land', status: 'Launching soon', dev: false },
  { id: 'pd-api', name: 'The API', for: 'For lenders and platforms', status: 'Private preview', dev: true },
  { id: 'pd-ent', name: 'Enterprise', for: 'For institutions at scale', status: 'Private preview', dev: true },
] as const

const nn = (i: number) => String(i + 1).padStart(2, '0')
const cssVar = (v: Record<string, string | number>) => v as React.CSSProperties

function Status({ label, dev }: { label: string; dev?: boolean }) {
  return (
    <span className={dev ? 'pd-st dev' : 'pd-st'}>
      <i />
      {label}
    </span>
  )
}

export const Products = memo(function Products() {
  const rootRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    let cancelled = false
    let cleanup: (() => void) | undefined
    const start = async () => {
      try {
        const url = `${ASSETS}/live.js`
        const mod: { mount: Mount } = await import(/* webpackIgnore: true */ /* turbopackIgnore: true */ url)
        if (!cancelled) cleanup = mod.mount(root)
      } catch (err) {
        // The words and the static stages are already on the page; only the motion is missing.
        console.error('[Products] the live stages did not load', err)
      }
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          io.disconnect()
          void start()
        }
      },
      { rootMargin: '100% 0px' },
    )
    io.observe(root)
    return () => {
      cancelled = true
      io.disconnect()
      cleanup?.()
    }
  }, [])

  return (
    <section ref={rootRef} className="pd" aria-labelledby="pd-title">
      <link rel="stylesheet" href={`${ASSETS}/products.css`} precedence="default" />
      <div className="pd-wrap">
        {/* The page's third chapter, after the hero (01) and how HataD works (02) */}
        <p className="pd-kick">
          <b>03</b>
          <i aria-hidden />
          {/* the count drops on a phone, where it wrapped the kicker onto two lines; the list of three
              products follows directly under it anyway */}
          <span>
            What we’re building<span className="pd-kick-n"> · {PRODUCTS.length} products</span>
          </span>
        </p>
        <h2 id="pd-title" className="pd-h">
          One reading of the land. <em>Three ways to use it.</em>
        </h2>
        <p className="pd-lede">
          An app for the people buying land, an API for the platforms that serve them, and a system
          for the institutions that hold land at scale. All three are being built now.
        </p>
        <ol className="pd-trio">
          {PRODUCTS.map((p, i) => (
            <li key={p.id}>
              <a href={`#${p.id}`}>
                <b>{nn(i)}</b>
                <span className="nm">{p.name}</span>
                <span className="for">{p.for}</span>
                <Status label={p.status} dev={p.dev} />
              </a>
            </li>
          ))}
        </ol>
      </div>

      {/* ══ 01 · the app ══ */}
      <article className="pd-prod" id="pd-app">
        <div className="pd-wrap pd-head">
          <div>
            <p className="pd-idx">
              <b>01</b>
              <i />
              The HataD app
              <Status label="Launching soon" />
            </p>
            <h3 className="pd-t">
              <span>Find it.</span> <span>Read it.</span> <em>Watch it.</em>
            </h3>
            <p className="pd-p pd-p-l">
              Look up any survey number in Tamil Nadu, see what the State’s records say about it on
              one page, have it checked, and hear the day something changes.
            </p>
          </div>
          <div>
            <ul className="pd-feats">
              <li>
                <span>Find</span>By village, survey number, a rough drawing or a photo of a document
              </li>
              <li>
                <span>Read</span>Patta, A-Register, FMB, EC and guideline value on one page, each with
                its source
              </li>
              <li>
                <span>Check</span>A check you can follow live, with findings in plain words
              </li>
              <li>
                <span>Watch</span>
                <div>
                  New deeds, patta changes and new buildings, sent to your phone<em>Next</em>
                </div>
              </li>
            </ul>
            <a className="pd-cta" href="#join" data-join>
              Join the waitlist <span aria-hidden>→</span>
            </a>
          </div>
        </div>
        <div className="pd-wrap">
          <div className="pd-stage pa" data-step="0" aria-hidden>
            <div className="pa-map">
              <img className="pa-tn" src={`${ASSETS}/pd-tn.webp`} alt="" width={900} height={1328} decoding="async" loading="lazy" />
              <img className="pa-sv" src={`${ASSETS}/pd-survey.webp`} alt="" width={740} height={825} decoding="async" loading="lazy" />
              <img className="pa-sat" src={`${ASSETS}/pd-sat.webp`} alt="" width={760} height={760} decoding="async" loading="lazy" />
              <div className="pa-search">
                <svg viewBox="0 0 24 24">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m20 20-4-4" />
                </svg>
                <span className="pa-q" />
                <span className="pa-caret" />
              </div>
              <div className="pa-sugg">
                <div>
                  <i>P</i>
                  <span>
                    Perunkudi<small>Sholinganallur · Chennai · village</small>
                  </span>
                </div>
                <div>
                  <i>#</i>
                  <span>
                    Survey 55/1A<small>Perunkudi · 1 parcel</small>
                  </span>
                </div>
              </div>
              <div className="pa-ping" />
              <div className="pa-toggle">
                <b />
                <span>Map</span>
                <span>Satellite</span>
              </div>
            </div>

            <div className="pa-card pa-sheet">
              <div className="pa-grab" />
              <h4>Survey 55/1A</h4>
              <p className="pa-sub">Perunkudi · Sholinganallur · Chennai</p>
              <div className="pa-big">
                90 cents<small>on the survey map</small>
              </div>
              <div className="pa-row">
                <span className="pa-chip">
                  <svg viewBox="0 0 24 24">
                    <path d="M5 19c8 0 14-6 14-14C11 5 5 11 5 19Zm0 0 7-7" />
                  </svg>
                  Private dry land
                </span>
                <span className="pa-chip">
                  <svg viewBox="0 0 24 24">
                    <path d="M7 3h7l5 5v13H7z" />
                    <path d="M10 13h6M10 17h6" />
                  </svg>
                  5 deeds on survey 55
                </span>
              </div>
              <p className="pa-lab" style={{ margin: '14px 0 0' }}>
                Things to know
              </p>
              <div className="pa-row" style={{ marginTop: 8 }}>
                <span className="pa-chip">Sold Mar 2019</span>
                <span className="pa-chip">Power of attorney May 2025</span>
              </div>
              <div className="pa-tabs">
                <b />
                <span>Who owns it</span>
                <span>The land</span>
                <span>Its history</span>
              </div>
              <div className="pa-panes">
                <div className="pa-pane">
                  <strong>Murugan and Selvi</strong>
                  <p>Joint holders under patta 1234</p>
                </div>
                <div className="pa-pane">
                  <strong>Last sold in March 2019</strong>
                  <div className="pa-line">
                    {[0, 46, 80, 86, 96].map((x) => (
                      <i key={x} style={{ left: `${x}%` }} />
                    ))}
                  </div>
                  <div className="pa-years">
                    <span>1975</span>
                    <span>2001</span>
                    <span>2026</span>
                  </div>
                  <div className="pa-deeds">
                    <div>
                      <span>May 2025</span>Power of attorney
                    </div>
                    <div>
                      <span>Mar 2019</span>Sale deed
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pa-card pa-case">
              <header>
                <h5>Survey 55/1A</h5>
                <small>On track</small>
              </header>
              <div className="pa-inv">
                <i />
                <div>
                  Your investigator<small>Checking now</small>
                </div>
              </div>
              <ol className="pa-steps">
                {[
                  ['Records fetched', 'Patta, A-Register, FMB, EC'],
                  ['EC checked', 'Every year since 1975'],
                  ['Title chain review', 'Each deed traced to the next'],
                  ['Geospatial check', 'Against the satellite record'],
                  ['Final report', 'In plain words'],
                ].map(([t, s]) => (
                  <li key={t}>
                    <b />
                    <div>
                      {t}
                      <small>{s}</small>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pa-card pa-find">
              <p className="pa-lab">
                <svg viewBox="0 0 24 24">
                  <path d="M12 3 2 20h20L12 3Z" />
                  <path d="M12 10v4M12 17v.5" />
                </svg>
                Review first
              </p>
              <strong>The patta holder is not the seller named in the draft sale agreement</strong>
              <p>A records check, not an opinion on the title</p>
            </div>

            <div className="pa-card pa-toast">
              <i>H</i>
              <div>
                <strong>
                  New deed on survey 55, Perunkudi<small>now</small>
                </strong>
                <p>A sale agreement was registered on 27 Oct. See whether it names your land, 55/1A.</p>
                <em>Watch · next</em>
              </div>
            </div>
          </div>
          <div className="pa-rail" role="group" aria-label="What the app does">
            {[
              [0, 'Find'],
              [2, 'Read'],
              [4, 'Check'],
              [5, 'Report'],
              [6, 'Watch'],
            ].map(([go, label], i) => (
              <button key={label} type="button" data-go={go}>
                <i />
                {nn(i)} {label}
              </button>
            ))}
          </div>
          <p className="pd-note">
            Sample parcel · the app’s own interface, in development · map © Mapbox © OpenStreetMap
          </p>
        </div>
      </article>

      {/* ══ 02 · the API ══ */}
      <article className="pd-prod" id="pd-api">
        <div className="pd-wrap pd-head">
          <div>
            <p className="pd-idx">
              <b>02</b>
              <i />
              The HataD API
              <Status label="Private preview" dev />
            </p>
            <h3 className="pd-t">
              <span>Every document.</span> <span>Every layer.</span> <em>One API.</em>
            </h3>
          </div>
          <div>
            <p className="pd-p">
              The records behind a parcel and the ground it sits on, as structured data, for lenders,
              insurers, developers and the platforms that serve buyers.
            </p>
            <form className="px-form pi-ask" data-source="products-api" noValidate>
              <input type="email" name="email" placeholder="Work email" aria-label="Work email" autoComplete="email" />
              <select name="use" aria-label="What will you build?" required defaultValue="">
                <option value="" disabled>
                  What will you build?
                </option>
                <option>Lending and credit</option>
                <option>Insurance</option>
                <option>Property platform</option>
                <option>Legal and due diligence</option>
                <option>Something else</option>
              </select>
              <button type="submit">Request API access</button>
            </form>
            <p className="px-help" aria-live="polite">
              By invitation while it’s in private preview. We’ll write back from
              contact@crestintelligence.in.
            </p>
          </div>
        </div>
        <div className="pd-wrap">
          <div className="pd-stage pi">
            <div className="pi-con" role="group" aria-label="A sample call to the HataD API">
              <div className="pi-bar" aria-hidden>
                <i />
                <i />
                <i />
                <span>api.hatad.in</span>
                <b>Private preview</b>
              </div>
              <div className="pi-tabs" role="group" aria-label="Endpoints">
                {['Lookup', 'Documents', 'Layers'].map((t, i) => (
                  <button key={t} type="button" aria-pressed={i === 0}>
                    {t}
                    <i />
                  </button>
                ))}
                <button type="button" aria-pressed={false}>
                  Watch <em>Planned</em>
                  <i />
                </button>
              </div>
              <div className="pi-reqbar">
                <span>Request</span>
                <div className="pi-cl" role="group" aria-label="Client">
                  {['cURL', 'JavaScript', 'Python'].map((c, i) => (
                    <button key={c} type="button" className={i === 0 ? 'on' : undefined} aria-pressed={i === 0}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              {/* filled by live.js */}
              <div className="pi-req" data-req aria-hidden />
              <div className="pi-res" data-res aria-hidden />
            </div>
            <div className="pi-stage" aria-hidden>
              <div className="pi-scene">
                <div className="pi-pl pi-sat" data-layer="sat" style={cssVar({ '--i': 0 })} />
                <div className="pi-pl pi-terr" data-layer="terr" style={cssVar({ '--i': 1 })}>
                  <svg viewBox="0 0 100 100" fill="none" stroke="#7E8C6A" strokeWidth=".5" opacity=".9">
                    <path d="M-5 72c18-9 26 6 44-2s22-26 42-18 18 4 24 2" />
                    <path d="M-5 60c16-8 30 4 44-6s20-24 38-20 22 2 28 0" />
                    <path d="M-5 48c14-6 28 2 40-8s22-20 36-18 24 0 34-2" />
                    <path d="M-5 84c20-8 30 6 48 0s26-20 44-14 14 2 18 0" />
                    <path d="M-5 36c12-4 26-2 36-10s18-14 34-14 26-2 40-4" />
                    <path d="M-5 96c22-6 34 4 52 0s28-12 58-8" />
                    <path d="M38.9-17.4 76.8-10.7 60.2 52.1 50 49.5 33.4 117.4 22.7 96.4Z" stroke="#1B4FD8" strokeWidth=".9" strokeDasharray="2 1.5" />
                  </svg>
                </div>
                <div className="pi-pl pi-near" data-layer="near" style={cssVar({ '--i': 2 })}>
                  <svg viewBox="0 0 100 100" fill="none">
                    <path d="M-2 18c10 4 14 10 22 8s10-10 6-16-14-4-28 8Z" fill="#A9D3F5" />
                    <path d="M14-5 8 105" stroke="#B7C3D6" strokeWidth="5" />
                    <path d="M14-5 8 105" stroke="#fff" strokeWidth=".6" strokeDasharray="3 2" />
                    <path d="M-5 92 105 70" stroke="#E8A74B" strokeWidth="2.4" />
                    <path d="M-5 92 105 70" stroke="#fff" strokeWidth=".5" />
                    <path d="M70-5 96 105" stroke="#7A8FAD" strokeWidth=".6" strokeDasharray="4 2" />
                    <circle cx="76" cy="20" r="1.6" fill="#7A8FAD" />
                    <circle cx="88" cy="72" r="1.6" fill="#7A8FAD" />
                    <path d="M38.9-17.4 76.8-10.7 60.2 52.1 50 49.5 33.4 117.4 22.7 96.4Z" stroke="#1B4FD8" strokeWidth=".9" fill="rgb(27 79 216/.08)" />
                  </svg>
                </div>
                <div className="pi-pl pi-zone" data-layer="zone" style={cssVar({ '--i': 3 })}>
                  <svg viewBox="0 0 100 100" fill="none">
                    <path d="M60 0h40v38L72 46Z" fill="#CFE8C9" stroke="#8DBB84" strokeWidth=".5" />
                    <path d="M0 70h30l8 30H0Z" fill="#F5C9C2" stroke="#D69A90" strokeWidth=".5" />
                    <path d="M38.9-17.4 76.8-10.7 60.2 52.1 50 49.5 33.4 117.4 22.7 96.4Z" stroke="#0C1525" strokeWidth=".9" fill="rgb(255 255 255/.35)" />
                  </svg>
                </div>
                <div className="pi-pl pi-sv" data-layer="sv" style={cssVar({ '--i': 4 })} />
                <div className="pi-pl pi-docs" data-layer="docs" style={cssVar({ '--i': 5 })}>
                  {[
                    [12, 16, -6],
                    [38, 30, 3],
                    [62, 14, 8],
                    [30, 58, -2],
                  ].map(([x, y, r]) => (
                    <span key={x} className="pi-doc" style={{ left: `${x}%`, top: `${y}%`, transform: `rotate(${r}deg)` }} />
                  ))}
                </div>
              </div>
              <div className="pi-labs">
                {[
                  ['docs', 5, 'Documents', 'EC · patta · FMB'],
                  ['sv', 4, 'Survey map', 'geometry'],
                  ['zone', 3, 'Master plan', 'zoning'],
                  ['near', 2, 'Around it', 'roads · water'],
                  ['terr', 1, 'Terrain', 'soil · contours'],
                  ['sat', 0, 'Satellite', '2017 → 2026'],
                ].map(([layer, i, name, detail]) => (
                  <span key={layer} className="pi-lab" data-layer={layer} style={cssVar({ '--i': i })}>
                    <b>{name}</b>
                    <small>{detail}</small>
                  </span>
                ))}
              </div>
              <div className="pi-pin" />
            </div>
          </div>

          <div className="pi-apis">
            {[
              { name: 'Parcel API', call: 'GET /parcels/lookup', what: 'Find any survey number in Tamil Nadu and get the parcel back.', items: ['Village, taluk and district', 'Extent and land type', 'Patta and holders', 'Guideline value'] },
              { name: 'Documents API', call: 'GET /parcels/{id}/documents', what: 'Every record behind the parcel, structured.', items: ['EC and every deed in the chain', 'Patta, chitta and A-Register', 'FMB sketch, court cases, legal heirs', 'RERA, DTCP and CMDA approvals'] },
              { name: 'Layers API', call: 'GET /parcels/{id}/layers', what: 'The ground the parcel sits on.', items: ['Survey-map geometry', 'Satellite imagery, year by year', 'Master plan, soil, water bodies', 'Road, rail and power corridors'] },
              { name: 'Watch API', soon: true, call: 'POST /watch · webhooks', what: 'Hear the day a parcel’s records change.', items: ['New deeds on the survey', 'Patta changes', 'New structures on satellite', 'Temple, Waqf and forest notices'] },
            ].map((api) => (
              <section key={api.name}>
                <h4>
                  {api.name}
                  {api.soon && <em>Soon</em>}
                </h4>
                <code>{api.call}</code>
                <p>{api.what}</p>
                <ul>
                  {api.items.map((it) => (
                    <li key={it}>{it}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="pi-trust">
            <div>
              <strong>{DISTRICTS}</strong>
              <span>districts, all of Tamil Nadu</span>
              <small>on the State’s survey map</small>
            </div>
            <div>
              <strong>{SOURCE_CLAIM}</strong>
              <span>departments and courts read</span>
              <small>{KINDS} kinds of record</small>
            </div>
            <div>
              <strong>Cited</strong>
              <span>every field names the record it came from</span>
              <small>so it can be checked</small>
            </div>
          </div>
          <div className="pi-partner">
            <p className="pi-plab">Design partners</p>
            <div>
              <h4>A direct line</h4>
              <p>Early partners work with the team building the API, not a support queue.</p>
            </div>
            <div>
              <h4>A say in the shape</h4>
              <p>What your systems need decides what the endpoints return.</p>
            </div>
            <div>
              <h4>What we ask</h4>
              <p>A real use case, and honest feedback while it’s in preview.</p>
            </div>
          </div>
          <ol className="px-road pi-road">
            <li className="now">
              <b>Private preview</b>Now · by invitation
            </li>
            <li>
              <b>Public preview</b>Open to request
            </li>
            <li>
              <b>General availability</b>Dates to be announced
            </li>
          </ol>
          <p className="pi-note">
            Expect breaking changes during preview. Endpoint names, fields and the sample responses
            above are illustrative and will change before release.
          </p>
        </div>
      </article>

      {/* ══ 03 · enterprise ══ */}
      <div className="pd-ent">
        <article className="pd-prod" id="pd-ent">
          <div className="pd-wrap pd-head">
            <div>
              <p className="pd-idx">
                <b>03</b>
                <i />
                HataD for enterprise
                <Status label="Private preview" dev />
              </p>
              <h3 className="pd-t">
                <span>Built for portfolios,</span> <em>not parcels.</em>
              </h3>
            </div>
            <div>
              <p className="pd-p">
                We’re building a sophisticated system for enterprises: the banks, developers and
                institutions that work with land at scale. Whole portfolios, read, watched and
                flagged in one place. We’ll share it with the world as soon as it’s ready.
              </p>
              <form className="px-form" data-source="products-enterprise" noValidate>
                <input type="email" name="email" placeholder="Work email" aria-label="Work email" autoComplete="email" />
                <button type="submit">Request early access</button>
              </form>
              <p className="px-help" aria-live="polite">
                For lenders, developers, insurers and legal teams. We’ll write back from
                contact@crestintelligence.in.
              </p>
            </div>
          </div>
          <div className="pd-wrap">
            <div className="px" aria-hidden>
              <div className="px-win">
                <div className="px-bar">
                  <i />
                  <i />
                  <i />
                  <span>
                    HataD Enterprise<sup>*</sup>
                  </span>
                  <b>Preview</b>
                </div>
                <div className="px-app">
                  <aside className="px-side">
                    <div className="px-brand">
                      <i>H</i>HataD
                    </div>
                    {[
                      ['Overview', 'M4 13h6V4H4zM14 20h6v-9h-6zM14 8h6V4h-6zM4 20h6v-3H4z'],
                      ['Portfolio', 'M3 7l9-4 9 4-9 4-9-4zM3 12l9 4 9-4M3 17l9 4 9-4'],
                      ['Review queue', 'M12 3 2 20h20L12 3ZM12 10v4M12 17v.5'],
                      ['Watch', 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z'],
                      ['Reports', 'M7 3h7l5 5v13H7zM10 13h6M10 17h6'],
                      ['API and webhooks', 'm8 8-5 4 5 4M16 8l5 4-5 4'],
                      ['Team and access', 'M12.5 8a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM2 20c0-4 3-6 7-6s7 2 7 6M16 4a3.5 3.5 0 0 1 0 7M18 14c2.5.6 4 2.6 4 6'],
                    ].map(([label, d], i) => (
                      <div key={label} className={i === 0 ? 'px-nav on' : 'px-nav'}>
                        <svg viewBox="0 0 24 24">
                          <path d={d} />
                        </svg>
                        {label}
                        {label === 'Review queue' && <em data-q>18</em>}
                      </div>
                    ))}
                    <div className="px-org">
                      <i />
                      <div>
                        Mortgage book<small>Tamil Nadu · 6 seats</small>
                      </div>
                    </div>
                  </aside>
                  <div className="px-main">
                    <div className="px-top">
                      <h5>Portfolio overview</h5>
                      <div className="px-seg">
                        <span>Week</span>
                        <span className="on">Month</span>
                        <span>Quarter</span>
                      </div>
                      <span className="px-btn">Export</span>
                      <span className="px-btn pri">Run check</span>
                    </div>
                    <div className="px-run">
                      <span>
                        Checking <b data-rn>240 parcels</b> in <b data-rd>Chengalpattu</b>
                      </span>
                      <i>
                        <u />
                      </i>
                      <span data-rc>0 / 240</span>
                    </div>
                    <div className="px-kpis">
                      <div className="px-kpi" data-k="watch">
                        <span>Parcels under watch</span>
                        <strong>2,723</strong>
                        <small>+124 this month</small>
                        <svg viewBox="0 0 100 26" preserveAspectRatio="none" data-spark="1" />
                      </div>
                      <div className="px-kpi" data-k="checked">
                        <span>Checked this month</span>
                        <strong>1,086</strong>
                        <small>Against the State’s records</small>
                        <svg viewBox="0 0 100 26" preserveAspectRatio="none" data-spark="2" />
                      </div>
                      <div className="px-kpi" data-k="flags">
                        <span>Open flags</span>
                        <strong>18</strong>
                        <small className="warn" data-high>
                          6 high
                        </small>
                        <svg viewBox="0 0 100 26" preserveAspectRatio="none" data-spark="3" />
                      </div>
                      <div className="px-kpi" data-k="dist">
                        <span>Districts covered</span>
                        <strong>{DISTRICTS}</strong>
                        <small>All of Tamil Nadu</small>
                        <svg viewBox="0 0 100 26" preserveAspectRatio="none" data-spark="4" />
                      </div>
                    </div>
                    <div className="px-body">
                      <section className="px-card">
                        <header>
                          Review queue<small>Highest first</small>
                        </header>
                        {/* filled by live.js */}
                        <div className="px-tbl" data-rows />
                      </section>
                      <div className="px-side-col">
                        <section className="px-card">
                          <header>
                            By district<small>Parcels</small>
                          </header>
                          <div className="px-map">
                            <svg data-map viewBox="0 0 1000 1358" />
                            <div className="px-leg" data-leg />
                          </div>
                        </section>
                        <section className="px-card">
                          <header>
                            Activity<small>Live</small>
                          </header>
                          <ul className="px-feed" data-feed />
                        </section>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-fade" />
            </div>
            <p className="px-terms">
              * Private preview. Sample data; the product and its design will change before release.
            </p>
            <div className="px-caps">
              <article className="px-cap">
                <div className="px-vig watch" aria-hidden>
                  <div className="row">
                    <span className="dot" />
                    <span>
                      55/1A · Perunkudi<small> · no change</small>
                    </span>
                    <span className="mono">Mon</span>
                  </div>
                  <div className="row">
                    <span className="dot b" />
                    <span>
                      19/3 · Sulur<small> · patta changed</small>
                    </span>
                    <span className="pill h">Review</span>
                  </div>
                  <div className="row">
                    <span className="dot" />
                    <span>
                      703/3 · Pallikaranai<small> · no change</small>
                    </span>
                    <span className="mono">Mon</span>
                  </div>
                </div>
                <h4>Portfolio watch</h4>
                <p>Every parcel in the book, re-read whenever the State’s records change.</p>
              </article>
              <article className="px-cap">
                <div className="px-vig bulk" aria-hidden>
                  <div className="file">
                    <i />
                    <span>
                      mortgage-book.csv<small className="mono"> · 2,723 survey numbers</small>
                    </span>
                  </div>
                  <div className="bar">
                    <b />
                  </div>
                  <div className="meta">
                    <span className="mono">Checking against the State’s records</span>
                    <span className="pill w">Bulk</span>
                  </div>
                </div>
                <h4>Bulk checks</h4>
                <p>Send a list of survey numbers; every finding comes back, sorted by what matters.</p>
              </article>
              <article className="px-cap">
                <div className="px-vig queue" aria-hidden>
                  <div className="row">
                    <span className="pill h">High</span>
                    <span>96/1 · civil suit pending</span>
                    <span className="mono">e-Courts</span>
                  </div>
                  <div className="route">
                    <span className="mono">Routed to</span>
                    <i />
                    <span className="who">
                      <span className="av">AK</span>Legal team
                    </span>
                  </div>
                </div>
                <h4>Review queue</h4>
                <p>Each flag routed to the right person, with the record that raised it.</p>
              </article>
              <article className="px-cap">
                <div className="px-vig audit" aria-hidden>
                  <ol>
                    <li>
                      <span className="mono">10:42</span>
                      <span>EC read, 1975 to 2026</span>
                    </li>
                    <li>
                      <span className="mono">10:43</span>
                      <span>Flag raised · EC gap 1997–2003</span>
                    </li>
                    <li>
                      <span className="mono">11:05</span>
                      <span>Reviewed by AK · note added</span>
                    </li>
                  </ol>
                </div>
                <h4>Audit trail</h4>
                <p>Every check, source and decision kept, ready for the credit file.</p>
              </article>
              <article className="px-cap">
                <div className="px-vig roles" aria-hidden>
                  {[
                    ['RV', 'Analyst', 'view portfolio', 'sw on'],
                    ['AK', 'Legal', 'clear flags', 'sw tg'],
                    ['SP', 'Admin', 'manage seats', 'sw on'],
                  ].map(([who, role, can, sw]) => (
                    <div key={who} className="row">
                      <span className="av">{who}</span>
                      <span>
                        {role}
                        <small> · {can}</small>
                      </span>
                      <span className={sw} />
                    </div>
                  ))}
                </div>
                <h4>Roles and access</h4>
                <p>Teams and permissions for the people who need them.</p>
              </article>
              <article className="px-cap">
                <div className="px-vig hooks" aria-hidden>
                  <div className="stream">
                    {/* twice over, so the stream loops without a seam */}
                    {[0, 1].flatMap((pass) =>
                      [
                        ['parcel.flagged · 96/1', 'now'],
                        ['check.completed · 240', '2s'],
                        ['deed.registered · 55', '9s'],
                        ['patta.changed · 19/3', '14s'],
                      ].map(([ev, t]) => (
                        <div key={`${pass}-${ev}`} className="ev">
                          <b>200</b>
                          <span>{ev}</span>
                          <small>{t}</small>
                        </div>
                      )),
                    )}
                  </div>
                </div>
                <h4>API and webhooks</h4>
                <p>The same records and layers, in the systems you already run.</p>
              </article>
            </div>
            <ol className="px-road">
              <li className="now">
                <b>In development</b>Now
              </li>
              <li>
                <b>Early access</b>By invitation
              </li>
              <li>
                <b>Open to enterprises</b>As soon as it’s ready
              </li>
            </ol>
          </div>
        </article>
      </div>
    </section>
  )
})
