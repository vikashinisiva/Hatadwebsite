import { NextResponse } from 'next/server'
import { lookupSRO } from '@/lib/sro'
import { districtProfile } from '@/lib/districts'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const village = searchParams.get('village')
  const district = searchParams.get('district')

  // Village lookup
  if (village) {
    const result = lookupSRO(village, district || undefined)
    if (!result) {
      return NextResponse.json({ error: 'Village not found' }, { status: 404 })
    }
    return NextResponse.json(result)
  }

  /*
   * District lookup.
   *
   * Goes through districtProfile rather than matching the raw district string:
   * the cache is keyed on registration districts, so an exact match returned an
   * empty list for Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli and
   * Tiruppur — an empty 200, which reads as "no villages here" rather than as a
   * bug. Wards are reported apart from villages because they are not villages.
   */
  if (district) {
    const profile = districtProfile(district)
    if (!profile) {
      return NextResponse.json({ error: `Unknown district: ${district}` }, { status: 404 })
    }
    const villages = profile.activeSROs.flatMap((o) => o.villages)
    const wards = profile.activeSROs.flatMap((o) => o.wards)
    return NextResponse.json({
      district: profile.district,
      registrationDistricts: profile.registrationDistricts,
      villages,
      wards,
      sros: profile.activeSROs.map((o) => o.name),
      count: villages.length,
    })
  }

  return NextResponse.json({ error: 'Provide ?village= or ?district= parameter' }, { status: 400 })
}
