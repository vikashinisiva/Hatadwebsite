/**
 * Government departments and record sources HataD cross-verifies.
 *
 * Counts shown in the UI are DERIVED from this array — never typed into copy.
 * Add a source here and every number on the site updates with it.
 *
 * `isDepartment: false` marks a record source that is not a government
 * department, so headline claims can say "departments" accurately.
 */

export type RecordSource = {
  name: string
  short: string
  records: string
  /** False for sources that are not government departments (e.g. the courts). */
  isDepartment?: boolean
}

export type SourceCluster = {
  id: string
  label: string
  sources: RecordSource[]
}

export const SOURCE_CLUSTERS: SourceCluster[] = [
  {
    id: 'title',
    label: 'Title & encumbrance',
    sources: [
      {
        /* "Sale deed, parent deed" named two links and implied the chain was
           those two. It is every instrument that ever moved the parcel —
           settlement, partition, gift, release, mortgage — and a chain is only
           as good as the weakest link in it, which is rarely the sale deed. */
        name: 'Registration Department (IGR / TNREGINET)',
        short: 'IGR',
        records: 'EC, every deed in the chain, certified copies, SRO jurisdiction',
      },
      {
        name: 'Legal heir & civil registration (Taluk, Municipal)',
        short: 'LHC',
        records: 'Legal heir certificates, death records for succession chains',
      },
      {
        name: 'Judiciary (District Courts, Madras HC, e-Courts / NJDG)',
        short: 'e-Courts',
        records: 'Pending suits, decrees, execution petitions, appeals',
        isDepartment: false,
      },
      {
        /* House-building co-operatives allotted a great deal of urban Tamil
           Nadu, and a society plot carries its own chain and its own transfer
           restrictions — neither of which appear in the registration record. */
        name: 'Registrar of Co-operative Societies',
        short: 'Co-op',
        records: 'House-building society allotments, share transfer, society lien',
      },
    ],
  },
  {
    id: 'revenue',
    label: 'Ownership & revenue record',
    sources: [
      {
        name: 'Revenue Department (Taluk / Tahsildar / RDO)',
        short: 'Revenue',
        records:
          'Patta, chitta, adangal, A-register, mutation, classification, assigned-land status',
      },
      {
        name: 'Survey & Land Records / Settlement',
        short: 'Survey',
        records: 'FMB, subdivision, natham, TSLR',
      },
      {
        name: 'District Collectorate',
        short: 'Collectorate',
        records: 'Land acquisition, conversion, ceiling (TN Land Reforms Authorised Officer)',
      },
      {
        name: 'Adi Dravidar Welfare + Revenue',
        short: 'ADW',
        records: 'SC/ST assigned-land transfer prohibition (TN Act 31 of 1978)',
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & development control',
    sources: [
      {
        name: 'DTCP and Local Planning Authorities',
        short: 'DTCP',
        records: 'Master plan, layout approval, land use',
      },
      { name: 'CMDA', short: 'CMDA', records: 'Chennai metropolitan area planning' },
      {
        name: 'Local body (RD&PR panchayats / MAWS municipalities & corporations)',
        short: 'Local body',
        records: 'Property tax, house tax, layout and building approval trail',
      },
      { name: 'TNRERA', short: 'TNRERA', records: 'Project registration' },
      { name: 'TNHB / TNUHDB', short: 'TNHB', records: 'Housing board parcels' },
      {
        name: 'SIPCOT / SIDCO / TIDCO',
        short: 'SIPCOT',
        records: 'Industrial parcels',
      },
    ],
  },
  {
    id: 'custodial',
    label: 'Custodial & trust land',
    sources: [
      {
        name: 'TN Waqf Board (Minority Welfare Dept)',
        short: 'Waqf',
        records: 'Waqf property registers',
      },
      { name: 'HR&CE', short: 'HR&CE', records: 'Temple and endowment land' },
      {
        /* Land inside a declared slum area is restricted whoever holds the
           patta, and land vested in the board is not the seller's to sell.
           Renamed from the Slum Clearance Board — the old name is kept in
           brackets because that is what the notifications themselves say. */
        name: 'TN Urban Habitat Development Board (formerly Slum Clearance Board)',
        short: 'TNUHDB',
        records: 'Slum-area notifications, vested land, board allotments',
      },
      {
        name: 'Forest Department',
        short: 'Forest',
        records: 'Reserve forest, Section 4 land',
      },
    ],
  },
  {
    id: 'environment',
    label: 'Environment & water',
    sources: [
      {
        name: 'MoEF&CC / SEIAA / TNCZMA',
        short: 'MoEF&CC',
        records: 'Eco-sensitive zones, CRZ',
      },
      {
        name: 'Water Resources Department / PWD',
        short: 'WRD',
        records: 'Tanks, channels, water body poromboke',
      },
      { name: 'TNPCB', short: 'TNPCB', records: 'Pollution control clearance' },
      { name: 'Mines & Geology', short: 'Mines', records: 'Quarry and mineral rights' },
    ],
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure & statutory NOC',
    sources: [
      {
        name: 'Highways Department / NHAI',
        short: 'Highways',
        records: 'Road widening alignment, 3A / 3D notifications',
      },
      { name: 'Railways', short: 'Railways', records: 'Railway land boundaries' },
      { name: 'TANGEDCO', short: 'TANGEDCO', records: 'Transmission corridors' },
      { name: 'TWAD / Metro Water', short: 'TWAD', records: 'Water infrastructure' },
      { name: 'Fire & Rescue', short: 'Fire', records: 'Fire safety NOC' },
      {
        name: 'AAI height NOC + Defence Estates',
        short: 'AAI',
        records: 'Height restrictions, defence land proximity',
      },
      {
        name: 'ASI / State Archaeology',
        short: 'ASI',
        records: 'Protected monument buffer zones',
      },
      { name: 'Labour (BOCW)', short: 'BOCW', records: 'Construction welfare cess' },
    ],
  },
]

export const ALL_SOURCES = SOURCE_CLUSTERS.flatMap((c) => c.sources)

/** Total record sources, including the courts. */
export const SOURCE_COUNT = ALL_SOURCES.length

/** Government departments only — excludes the judiciary. */
export const DEPARTMENT_COUNT = ALL_SOURCES.filter((s) => s.isDepartment !== false).length

/**
 * The figure used in public copy. Counted, never typed.
 *
 * This was the string '30+', asserted on the operator's authority while the
 * array below it enumerated only 28 — so the hero promised "30+" while the
 * descent listed 28 and the closing line said "28 offices". A page whose whole
 * argument is that we check what is actually on record cannot be caught
 * inventing its own headline number.
 *
 * Now derived, so it cannot drift again: add a source above and every figure on
 * the site follows.
 *
 * Note the noun in the copy. Of these 30, twenty-nine are government
 * departments and one is the judiciary, so the sentence says "departments and
 * courts" rather than calling all thirty departments.
 */
export const SOURCE_CLAIM = String(SOURCE_COUNT)

export type ScanStep = {
  /** Department or record, as it appears on the map readout. */
  label: string
  /** Why this one applies *here*. Present only on location-triggered checks. */
  why?: string
}

/**
 * What the launch-page map appears to read while it holds over a parcel.
 *
 * Deliberately mirrors the hero sub-line, so the copy and the animation are
 * saying the same thing.
 *
 * These four run on every parcel in the state, whatever it is and wherever it
 * sits — they are the floor, not the pitch.
 */
export const SCAN_STEPS_BASE: ScanStep[] = [
  { label: 'REGISTRATION' },
  { label: 'REVENUE & PATTA' },
  { label: 'SURVEY / FMB' },
  { label: 'COURTS' },
]

/**
 * Checks that only fire because of where the parcel is.
 *
 * This is the part worth showing. Anyone can list departments; knowing that a
 * Chennai parcel needs CMDA and a CRZ read while a Salem parcel needs the
 * mining lease belt and a forest Section 4 check is the actual work — and it is
 * far more convincing demonstrated on a moving map than claimed in a sentence.
 *
 * Keyed by the `name` in LAUNCH_MAP_CITIES. Every city there must have an entry;
 * `scanStepsFor` falls back to the base list alone if one is missing.
 */
export const LOCAL_SCAN_STEPS: Record<string, ScanStep[]> = {
  CHENNAI: [
    { label: 'CMDA', why: 'metropolitan planning area' },
    { label: 'CRZ / TNCZMA', why: 'coastal regulation zone' },
  ],
  COIMBATORE: [
    { label: 'DTCP / LPA', why: 'Coimbatore planning area' },
    { label: 'AAI HEIGHT NOC', why: 'airport funnel zone' },
  ],
  MADURAI: [
    { label: 'HR&CE', why: 'temple endowment land' },
    { label: 'WRD', why: 'Vaigai channel poromboke' },
  ],
  TIRUCHIRAPPALLI: [
    { label: 'HR&CE', why: 'Srirangam devasthanam land' },
    { label: 'WRD', why: 'Cauvery bank poromboke' },
  ],
  SALEM: [
    { label: 'MINES & GEOLOGY', why: 'magnesite lease belt' },
    { label: 'FOREST', why: 'Shevaroy slope, Section 4' },
  ],
}

/** Base checks first, then whatever this location adds on top. */
export function scanStepsFor(city: string): ScanStep[] {
  return [...SCAN_STEPS_BASE, ...(LOCAL_SCAN_STEPS[city] ?? [])]
}
