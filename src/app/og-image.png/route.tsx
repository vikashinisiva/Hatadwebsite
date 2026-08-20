import { ImageResponse } from 'next/og'
import { COMING_SOON } from '@/lib/constants'
import { districtFromSlug, districtProfile, districtSlug, shapeName } from '@/lib/districts'
import { TN_DISTRICT_PATHS, TN_MAP_VIEWBOX } from '@/data/tn-districts-map'

/*
 * Node, not edge.
 *
 * The district card needs the SRO dataset and the outline geometry, and
 * sro_cache.json alone is 3.4 MB — far past what belongs in an edge bundle.
 * These images are fetched by crawlers and link unfurlers rather than by
 * people waiting on a page, so the extra cold start costs nothing that
 * matters.
 */
export const runtime = 'nodejs'

/**
 * The district's own outline, lit inside the state, as a data URI.
 *
 * Satori renders a subset of SVG unreliably but handles an <img> with a data
 * URI, so the map is built as a standalone document rather than as elements in
 * the card tree. Same geometry the district page uses.
 */
function outlineDataUri(district: string): string {
  const target = shapeName(district)
  const subject = TN_DISTRICT_PATHS.find((d) => d.name === target)
  const rest = TN_DISTRICT_PATHS.map(
    (d) => `<path d="${d.d}" fill="#1B2739" stroke="#243149" stroke-width="1.5"/>`,
  ).join('')
  const lit = subject
    ? `<path d="${subject.d}" fill="#C9A84C" stroke="#E4CB84" stroke-width="3"/>`
    : ''
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${TN_MAP_VIEWBOX}">${rest}${lit}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function districtCard(name: string) {
  const p = districtProfile(name)!
  /* Satori requires an explicit display on any element with more than one
     child, and every interpolation counts as one. Composing the strings first
     keeps each node single-child and avoids decorating the tree with flex
     containers that exist only to satisfy the renderer. */
  const stats = `${p.activeSROs.length} Sub-Registrar ${
    p.activeSROs.length === 1 ? 'Office' : 'Offices'
  } · ${p.villageCount.toLocaleString('en-IN')} villages`

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          backgroundColor: '#0C1525',
          fontFamily: 'system-ui, sans-serif',
          padding: '0 72px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div
            style={{
              fontSize: 15,
              letterSpacing: '0.22em',
              color: '#C9A84C',
              textTransform: 'uppercase',
            }}
          >
            Tamil Nadu
          </div>
          <div style={{ fontSize: 88, fontWeight: 700, color: '#FFFFFF', marginTop: 10 }}>
            {name}
          </div>
          <div style={{ marginTop: 18, width: 48, height: 2, backgroundColor: '#C9A84C' }} />
          <div style={{ marginTop: 22, fontSize: 26, color: 'rgba(255,255,255,0.72)' }}>
            {stats}
          </div>
          <div
            style={{
              marginTop: 44,
              fontSize: 14,
              color: 'rgba(255,255,255,0.38)',
              letterSpacing: '0.1em',
            }}
          >
            hatad.in · Land record verification
          </div>
        </div>
        <img src={outlineDataUri(name)} width={330} height={448} alt="" />
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

/* Pre-launch share card. The live variant advertises a price and a turnaround
   we are not currently honouring — a WhatsApp share of hatad.in must not quote
   either while the wall is up. */
function comingSoonCard() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0C1525',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, letterSpacing: '0.3em', color: '#FFFFFF' }}>
          HATAD
        </div>
        <div style={{ marginTop: 16, width: 40, height: 1, backgroundColor: '#C9A84C' }} />
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: '#C9A84C',
            textTransform: 'uppercase',
          }}
        >
          Launching soon
        </div>
        <div style={{ marginTop: 20, fontSize: 20, color: 'rgba(255,255,255,0.62)' }}>
          Land record verification for Tamil Nadu.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 13,
            color: 'rgba(255,255,255,0.38)',
            letterSpacing: '0.1em',
          }}
        >
          hatad.in · Crest Intelligence Private Limited
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

export async function GET(request: Request) {
  /* A district card when asked for one, in either launch state: it quotes
     office and village counts, never a price or a turnaround. */
  const slug = new URL(request.url).searchParams.get('district')
  if (slug) {
    const name = districtFromSlug(slug) ?? districtFromSlug(districtSlug(slug))
    if (name) return districtCard(name)
  }

  if (COMING_SOON) return comingSoonCard()

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F4F7FC',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 700,
            letterSpacing: '0.3em',
            color: '#0C1525',
          }}
        >
          HATAD
        </div>
        <div
          style={{
            marginTop: 16,
            width: 40,
            height: 1,
            backgroundColor: 'rgba(12,21,37,0.15)',
          }}
        />
        <div
          style={{
            marginTop: 24,
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: '0.2em',
            color: 'rgba(12,21,37,0.5)',
            textTransform: 'uppercase',
          }}
        >
          Land Clearance Intelligence
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 14,
            color: 'rgba(12,21,37,0.4)',
          }}
        >
          1 in 3 land deals in Tamil Nadu has a legal defect. Verify before you buy.
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 13,
            color: 'rgba(12,21,37,0.3)',
            letterSpacing: '0.1em',
          }}
        >
          hatad.in · Land record verification for Tamil Nadu
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
