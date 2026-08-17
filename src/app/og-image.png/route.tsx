import { ImageResponse } from 'next/og'
import { COMING_SOON } from '@/lib/constants'

export const runtime = 'edge'

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
          hatad.in · Hypse Aero Private Limited
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  )
}

export async function GET() {
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
          hatad.in · ₹3,599 · Report in 3 hours
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
