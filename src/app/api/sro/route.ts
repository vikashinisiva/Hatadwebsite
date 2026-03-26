import { NextResponse } from 'next/server'
import { lookupSRO, getVillagesForDistrict, getSROsForDistrict } from '@/lib/sro'

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

  // District lookup — list villages and SROs
  if (district) {
    const villages = getVillagesForDistrict(district)
    const sros = getSROsForDistrict(district)
    return NextResponse.json({ district, villages, sros, count: villages.length })
  }

  return NextResponse.json({ error: 'Provide ?village= or ?district= parameter' }, { status: 400 })
}
