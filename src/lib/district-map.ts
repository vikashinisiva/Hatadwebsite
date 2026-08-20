/**
 * Registration districts to revenue districts.
 *
 * A leaf module on purpose: `sro.ts` and `districts.ts` both need this mapping,
 * and putting it in either of them makes the other import in a cycle. It
 * depends on nothing.
 *
 * Tamil Nadu has 38 revenue districts. The Registration Department divides the
 * same ground into 56 of its own, and `sro_cache.json` is keyed on those. They
 * disagree in three ways, and every one has to be handled or the join silently
 * drops a district:
 *
 *   1. Cities the Registration Dept splits and Revenue does not. Chennai is
 *      North, South and Central; Coimbatore is North and South; Salem is East
 *      and West; Madurai is North and South.
 *   2. Transliteration variants. Trichy, Tuticorin, Ooty, Dindugul, Sivagengai,
 *      Thiruvalur and a dozen more.
 *   3. Towns that are their own registration district but sit inside a larger
 *      revenue district. Karaikudi is in Sivagangai, Palani in Dindigul,
 *      Tambaram in Chengalpattu, Kumbakonam in Thanjavur.
 *
 * Only 20 of the 38 names matched exactly before this existed, and the misses
 * were Chennai, Coimbatore, Madurai, Salem, Tiruchirappalli and Tiruppur, every
 * large market in the state. Each town-to-district pair below was checked
 * against an independent source rather than asserted.
 */
export const REGISTRATION_TO_REVENUE: Record<string, string> = {
  // 1. split cities
  'Chennai North': 'Chennai',
  'Chennai South': 'Chennai',
  'Chennai Central': 'Chennai',
  'Coimbatore North': 'Coimbatore',
  'Coimbatore South': 'Coimbatore',
  'Salem East': 'Salem',
  'Salem West': 'Salem',
  'Madurai North': 'Madurai',
  'Madurai South': 'Madurai',

  // 2. transliteration variants
  Dindugul: 'Dindigul',
  Kaniyakumari: 'Kanyakumari',
  Maiyaladuthurai: 'Mayiladuthurai',
  Pudukottai: 'Pudukkottai',
  Sivagengai: 'Sivagangai',
  Thiruppur: 'Tiruppur',
  Thiruvalur: 'Tiruvallur',
  Thiruvannamalai: 'Tiruvannamalai',
  Thiruvarur: 'Tiruvarur',
  Tirupathur: 'Tirupattur',
  Trichy: 'Tiruchirappalli',
  Tuticorin: 'Thoothukudi',
  Ooty: 'Nilgiris',

  // 3. towns registered as their own district
  Karaikudi: 'Sivagangai',
  Cheranmahadevi: 'Tirunelveli',
  Cheyyar: 'Tiruvannamalai',
  Chidambaram: 'Cuddalore',
  Gobichettipalayam: 'Erode',
  Kumbakonam: 'Thanjavur',
  Marthandam: 'Kanyakumari',
  Palani: 'Dindigul',
  Palayankottai: 'Tirunelveli',
  Pattukkottai: 'Thanjavur',
  Periyakulam: 'Theni',
  Tambaram: 'Chengalpattu',
  Tindivanam: 'Villupuram',
  Viruthachalam: 'Cuddalore',
}

/** A registration district name as it appears in the data → a revenue district. */
export function toRevenueDistrict(registrationDistrict: string): string {
  return REGISTRATION_TO_REVENUE[registrationDistrict] ?? registrationDistrict
}

/**
 * Whether a data row's district is the one the caller meant.
 *
 * Accepts either form on either side, so "Chennai", "Chennai North" and
 * "chennai south" all agree. Without this a caller passing a revenue district
 * matches nothing, which is a silent wrong answer rather than an error.
 */
export function sameDistrict(rowDistrict: string, wanted: string): boolean {
  const a = toRevenueDistrict(rowDistrict).toLowerCase()
  const b = toRevenueDistrict(wanted.trim()).toLowerCase()
  return a === b || a.startsWith(b) || b.startsWith(a)
}
