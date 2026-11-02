'use client'

import { useEffect, useRef } from 'react'

import { registerEntryDistrict, trackEvent } from '@/lib/analytics'

/**
 * Fires district_page_viewed and pins entry_district as a super property.
 *
 * Exists as its own client component because /tamil-nadu/[district] is a
 * statically generated server component — it has no mount to hook into.
 *
 * entry_district is the whole point. It sticks to this browser, so a purchase
 * weeks later still reports which district page brought the buyer in. That is
 * the only way "do the district pages that rank actually convert, or do they
 * just draw traffic?" can be answered, and the district pages are the channel
 * the site is currently betting on.
 */
export function TrackDistrictView({ district }: { district: string }) {
  const fired = useRef(false)

  useEffect(() => {
    /* Once per mount. React 19 double-invokes effects in dev. */
    if (fired.current) return
    fired.current = true

    registerEntryDistrict(district)
    trackEvent('district_page_viewed', { district }, 'district-page')
  }, [district])

  return null
}
