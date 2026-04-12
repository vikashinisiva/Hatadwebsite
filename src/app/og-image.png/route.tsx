import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET() {
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
