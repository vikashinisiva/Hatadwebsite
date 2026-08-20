import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Get Your Land Clearance Report',
  description:
    'Submit your Tamil Nadu property details and receive a cross-verified land clearance report in under 3 hours, with every finding cited to the record it came from.',
  alternates: { canonical: '/clearance' },
}

export default function ClearanceLayout({ children }: { children: React.ReactNode }) {
  return children
}
