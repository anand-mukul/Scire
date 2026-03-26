import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Scire - Autonomous AI Viva Assessments'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(to bottom right, #09090b, #18181b)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            color: '#3b82f6',
          }}
        >
          <span style={{ fontSize: 100, fontWeight: 900, letterSpacing: '-0.05em' }}>Scire</span>
        </div>
        <div
          style={{
            fontSize: 48,
            fontWeight: 600,
            color: '#e4e4e7',
            textAlign: 'center',
            padding: '0 120px',
            lineHeight: 1.4,
          }}
        >
          Autonomous AI Viva Assessments
        </div>
        <div
          style={{
            marginTop: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            fontSize: 24,
            color: '#a1a1aa',
          }}
        >
          scire.in
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
