import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Your Land Clearance Report',
  description:
    'Submit your Tamil Nadu property details and receive a cross-verified land clearance report in under 3 hours. 10+ government records checked. ₹3,599.',
  alternates: { canonical: '/clearance' },
}

export default function ClearanceLayout({ children }: { children: React.ReactNode }) {
  return children
}
