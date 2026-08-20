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
  /**
   * The same point at length, for a page rather than an animation.
   *
   * `why` has to fit a scan card on a moving map, so it is four words. A
   * district page has room for what was actually verified, and that specificity
   * is the difference between a generated page worth having and a template with
   * the name swapped.
   */
  detail?: string
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
    {
      label: 'CMDA',
      why: 'metropolitan planning area',
      detail:
        'Inside the Chennai Metropolitan Area, DTCP has no jurisdiction: CMDA is the planning authority. The CMA runs to 5,904 sq km across Chennai, Tiruvallur, Chengalpattu, Ranipet and Kancheepuram, and was widened again in October 2022 to take in 1,225 more villages. Anything above ground plus three floors is admitted directly by CMDA, so an approval quoting the wrong authority is not an approval.',
    },
    {
      label: 'CRZ / TNCZMA',
      why: 'coastal regulation zone',
      detail:
        'Notified under section 3 of the Environment (Protection) Act, 1986. The zone reaches 500 m inland from the high tide line along the sea, and 100 m from the high tide line along any estuary, creek, river or backwater that the tide reaches, plus everything between the low and high tide lines. A parcel can sit well away from the beach and still be inside it.',
    },
  ],
  COIMBATORE: [
    {
      label: 'DTCP / LPA',
      why: 'Coimbatore planning area',
      detail:
        'The Coimbatore Local Planning Authority, a subcommittee of DTCP, covers 1,531.57 sq km across six taluks: Coimbatore South, Perur, Madukkarai, Sulur, Mettupalayam and Kinathukadavu. Inside that boundary the LPA is the approving body, so a DTCP number alone does not establish that this layout was approved for this parcel.',
    },
    {
      label: 'AAI HEIGHT NOC',
      why: 'airport funnel zone',
      detail:
        'The Avinashi Road corridor runs into the runway approach path, and the most restricted ground sits at Peelamedu, Singanallur, Kalapatti and Hope College. Within three kilometres the general ceiling is 45 m; inside the funnel the permitted height is two per cent of the distance from the runway edge. None of it appears on the patta or the deed.',
    },
  ],
  MADURAI: [
    {
      label: 'HR&CE',
      why: 'temple endowment land',
      detail:
        'Meenakshi Amman is an HR&CE temple and, like most large Tamil Nadu temples, an extensive landholder. The Madras High Court has required the department to account for its properties and encroachments, and roughly 1,200 acres of temple land across the state were recovered from encroachment in a single year. Endowment land is not the occupier’s to sell however long they have held it.',
    },
    {
      label: 'WRD',
      why: 'Vaigai channel poromboke',
      detail:
        'Tank beds, supply channels and river margins are classified poromboke and vest with the Water Resources Department. The classification sits in the revenue record, not the deed, so a parcel can be sold repeatedly without it ever surfacing.',
    },
  ],
  TIRUCHIRAPPALLI: [
    {
      label: 'HR&CE',
      why: 'Srirangam devasthanam land',
      detail:
        'Sri Ranganathaswamy at Srirangam is HR&CE administered and covers 156 acres on the island between the Cauvery and the Coleroon, with endowment holdings well beyond the temple itself. Land carrying a devasthanam interest cannot be conveyed by its occupier.',
    },
    {
      label: 'WRD',
      why: 'Cauvery bank poromboke',
      detail:
        'The Cauvery and Coleroon margins carry poromboke classification vesting in the Water Resources Department. It appears in the revenue classification rather than in any document the seller hands over.',
    },
  ],
  SALEM: [
    {
      label: 'MINES & GEOLOGY',
      why: 'Chalk Hills magnesite belt',
      detail:
        'Salem holds roughly 40.5 million tonnes of magnesite, concentrated in the Chalk Hills and under lease to several operators. Bauxite sits separately in the Shevaroy hills of Yercaud taluk. A mineral lease over a parcel is granted by the state and is not extinguished by the surface being sold.',
    },
    {
      label: 'FOREST',
      why: 'Section 4 notification',
      detail:
        'A section 4 notification under the Tamil Nadu Forest Act, 1882 declares the government’s intention to constitute land as reserved forest and appoints a Forest Settlement Officer to settle claims. It does not extinguish private rights outright, but while it stands no patta can be granted over that land and it cannot be cleared for cultivation without permission. Land you cannot get a patta on is land you cannot finance or resell.',
    },
  ],
  /* ---------------------------------------------------------------------
   * The remaining districts, researched by statutory trigger rather than one
   * district at a time: what fires is geographic, so coastline, mineral belt,
   * protected forest, metropolitan boundary and industrial estate each cover
   * many districts at once.
   *
   * Only what a source actually confirmed is here. Five districts —
   * Kallakurichi, Perambalur, Tenkasi, Theni and Tirupattur — are absent on
   * purpose: nothing district-specific was verified for them, and inventing a
   * local check to fill the section is the one thing these pages must not do.
   * ------------------------------------------------------------------- */

  // --- Chennai Metropolitan Area: CMDA, not DTCP ---
  TIRUVALLUR: [
    { label: 'CMDA', why: 'Chennai Metropolitan Area', detail: 'Part of this district falls inside the Chennai Metropolitan Area, which runs to 5,904 sq km across Chennai, Tiruvallur, Chengalpattu, Ranipet and Kancheepuram. Inside that boundary CMDA is the planning authority and DTCP is not, so an approval quoting the wrong one is not an approval.' },
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'Tiruvallur is one of Tamil Nadu’s coastal districts. The zone reaches 500 m inland from the high tide line along the sea and 100 m along any creek, river or backwater the tide reaches.' },
  ],
  CHENGALPATTU: [
    { label: 'CMDA', why: 'Chennai Metropolitan Area', detail: 'Much of Chengalpattu sits inside the Chennai Metropolitan Area, where CMDA rather than DTCP grants planning permission. The area was widened again in October 2022 to take in 1,225 more villages.' },
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district: 500 m from the high tide line along the sea, 100 m along tidal creeks and backwaters, notified under section 3 of the Environment (Protection) Act, 1986.' },
  ],
  KANCHEEPURAM: [
    { label: 'CMDA', why: 'Chennai Metropolitan Area', detail: 'Kancheepuram is one of the five districts the Chennai Metropolitan Area covers, so planning permission for land inside it comes from CMDA.' },
    { label: 'SIPCOT', why: 'Sriperumbudur industrial belt', detail: 'SIPCOT holds industrial parks and SEZs at Sriperumbudur, Irungattukottai and Oragadam. Land inside an industrial park is allotted rather than sold in the ordinary way, and carries transfer conditions that do not appear in the registration record.' },
  ],
  RANIPET: [
    { label: 'CMDA', why: 'Chennai Metropolitan Area', detail: 'Ranipet is inside the Chennai Metropolitan Area, so CMDA is the planning authority for land within that boundary.' },
    { label: 'SIPCOT', why: 'Ranipet industrial park', detail: 'One of SIPCOT’s principal industrial parks and SEZs. Allotted industrial land carries conditions that do not appear in the registration record.' },
  ],

  // --- coastal: CRZ under the 2011 notification ---
  CUDDALORE: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district under the 2011 CRZ notification: 500 m from the high tide line along the sea, 100 m along tidal water bodies.' },
    { label: 'SIPCOT', why: 'Kudikadu industrial park', detail: 'SIPCOT operates an industrial park at Kudikadu. Allotted land inside it is not transferable on ordinary terms.' },
  ],
  VILLUPURAM: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'Villupuram carries coastline and so falls under the Coastal Regulation Zone: 500 m inland from the high tide line along the sea, 100 m along tidal creeks and rivers.' },
  ],
  THANJAVUR: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district. The zone reaches 500 m from the high tide line along the sea and 100 m along the delta’s tidal channels, which carries it well inland.' },
    { label: 'AAI HEIGHT NOC', why: 'Thanjavur airport', detail: 'Thanjavur has an airport operated jointly by the Airports Authority of India and the Ministry of Defence, which brings both height clearance and defence proximity into play. Neither restriction appears on the patta or the deed.' },
  ],
  PUDUKKOTTAI: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district: 500 m from the high tide line along the sea, 100 m along tidal water bodies.' },
    { label: 'SIPCOT', why: 'Pudukkottai industrial park', detail: 'SIPCOT holds an industrial park here; allotted land carries its own transfer conditions.' },
  ],
  NAGAPATTINAM: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district on the Bay of Bengal, with the zone running 500 m inland from the high tide line and 100 m along the delta channels the tide reaches.' },
    { label: 'MINES & GEOLOGY', why: 'Cauvery basin lignite', detail: 'The Nagapattinam sub-basin of the Cauvery Basin is one of the main lignite repositories in a state holding an estimated 34,764 million tonnes. A mineral lease is granted by the state and is not extinguished by the surface being sold.' },
  ],
  TIRUVARUR: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal delta district: 500 m from the high tide line along the sea, 100 m along the tidal channels that run through it.' },
  ],
  MAYILADUTHURAI: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'Coastal, and cut through by delta channels the tide reaches, which draws the 100 m line inland well away from the shore.' },
  ],
  RAMANATHAPURAM: [
    { label: 'CRZ / TNCZMA', why: 'Gulf of Mannar coast', detail: 'A coastal district facing the Gulf of Mannar. Beyond the ordinary 500 m zone, stretches of this coast carry additional protection as a critically vulnerable coastal area.' },
  ],
  THOOTHUKUDI: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'A coastal district: 500 m from the high tide line along the sea, 100 m along tidal water bodies.' },
    { label: 'AAI HEIGHT NOC', why: 'Thoothukudi airport', detail: 'Thoothukudi airport is operated by the Airports Authority of India, so parcels near the approach path carry a height restriction decided by distance from the runway rather than by anything in the deed.' },
  ],
  KANYAKUMARI: [
    { label: 'CRZ / TNCZMA', why: 'coastal district', detail: 'Coastal on three sides, so the 500 m zone from the high tide line reaches a large share of the district, with 100 m along every tidal creek and river.' },
    { label: 'MINES & GEOLOGY', why: 'crystalline limestone belt', detail: 'Kanyakumari is one of the districts holding crystalline limestone, of which the state has some 200 million tonnes in reserve. A quarry lease over a parcel survives its sale.' },
  ],

  // --- mineral belts ---
  ARIYALUR: [
    { label: 'MINES & GEOLOGY', why: 'Cauvery basin lignite', detail: 'The Ariyalur sub-basin of the Cauvery Basin is a principal lignite repository, part of the largest lignite endowment in India at an estimated 34,764 million tonnes. Mineral rights are granted by the state and are unaffected by a sale of the surface.' },
  ],
  KRISHNAGIRI: [
    { label: 'MINES & GEOLOGY', why: 'granite quarry belt', detail: 'Krishnagiri is one of the principal granite districts in the state. A quarry lease is granted by the Department of Geology and Mining and is not extinguished when the land above it changes hands.' },
    { label: 'SIPCOT', why: 'Bargur industrial park', detail: 'SIPCOT holds land at Bargur. Allotted industrial land carries conditions that do not appear in the registration record.' },
  ],
  DHARMAPURI: [
    { label: 'MINES & GEOLOGY', why: 'granite and magnesite', detail: 'Dharmapuri carries both granite and magnesite. A mineral lease over a parcel is a state grant and survives the surface being sold.' },
  ],
  KARUR: [
    { label: 'MINES & GEOLOGY', why: 'limestone and magnesite', detail: 'Karur holds both crystalline limestone and magnesite. A quarry or mineral lease is granted by the state and is not extinguished by a sale.' },
  ],
  DINDIGUL: [
    { label: 'MINES & GEOLOGY', why: 'limestone, Palani bauxite', detail: 'Crystalline limestone across the district, and lateritic bauxite capping the Palani hills at altitude. Mineral rights are granted separately from the surface and are not affected by its sale.' },
    { label: 'SIPCOT', why: 'Nilakottai industrial park', detail: 'SIPCOT holds land at Nilakottai; allotted industrial land carries its own transfer conditions.' },
  ],
  VIRUDHUNAGAR: [
    { label: 'MINES & GEOLOGY', why: 'crystalline limestone', detail: 'One of the crystalline limestone districts. A quarry lease over the parcel is a state grant and is unaffected by its sale.' },
    { label: 'FOREST', why: 'Srivilliputhur Megamalai', detail: 'The Srivilliputhur Megamalai Tiger Reserve lies in this district. Land notified under section 4 of the Tamil Nadu Forest Act as intended for reservation cannot be granted a patta while that notification stands.' },
  ],
  NAMAKKAL: [
    { label: 'MINES & GEOLOGY', why: 'magnesite, Kollimalai bauxite', detail: 'Magnesite across the district and lateritic bauxite capping the Kolli hills at around 1,250 m. A mineral lease is granted by the state, separately from the surface.' },
  ],
  VELLORE: [
    { label: 'MINES & GEOLOGY', why: 'magnesite belt', detail: 'Vellore is one of the magnesite districts. A lease granted by the Department of Geology and Mining is not extinguished when the land above it is sold.' },
  ],

  // --- protected forest ---
  NILGIRIS: [
    { label: 'FOREST', why: 'Mudumalai, Nilgiri Biosphere', detail: 'Mudumalai Tiger Reserve sits in this district as part of the Nilgiri Biosphere Reserve, linking to Bandipur and Wayanad. Land notified under section 4 of the Tamil Nadu Forest Act cannot be granted a patta while the notification stands, and land you cannot get a patta on is land you cannot finance or resell.' },
    { label: 'MINES & GEOLOGY', why: 'bauxite and magnesite', detail: 'Lateritic bauxite caps the Nilgiri hills between roughly 1,980 and 2,285 m, and the district also carries magnesite. Mineral rights are granted separately from the surface.' },
  ],
  ERODE: [
    { label: 'FOREST', why: 'Sathyamangalam Tiger Reserve', detail: 'Sathyamangalam Tiger Reserve straddles the Western and Eastern Ghats in this district and forms a notified elephant corridor linking the Nilgiri Biosphere to the Eastern Ghats. A section 4 notification blocks the grant of a patta for as long as it stands.' },
    { label: 'SIPCOT', why: 'Perundurai growth centre', detail: 'SIPCOT operates an industrial park and SEZ at Perundurai. Allotted land is not transferable on ordinary terms.' },
  ],
  TIRUNELVELI: [
    { label: 'FOREST', why: 'Kalakad Mundanthurai', detail: 'The Kalakad Mundanthurai Tiger Reserve occupies the district’s Western Ghats flank as part of the Agasthyamalai Biosphere Reserve. Land under a section 4 notification cannot be granted a patta while it stands.' },
    { label: 'SIPCOT', why: 'Gangaikondan growth centre', detail: 'SIPCOT holds an industrial growth centre and SEZ at Gangaikondan; allotted land carries its own conditions.' },
  ],

  // --- industrial estates and planning authorities ---
  TIRUVANNAMALAI: [
    { label: 'SIPCOT', why: 'Cheyyar industrial park', detail: 'SIPCOT operates an industrial park at Cheyyar. Land inside it is allotted rather than sold in the ordinary way and carries transfer conditions that do not appear in the registration record.' },
  ],
  SIVAGANGAI: [
    { label: 'SIPCOT', why: 'Manamadurai industrial park', detail: 'SIPCOT holds land at Manamadurai. Allotted industrial land carries its own transfer conditions.' },
  ],
  TIRUPPUR: [
    { label: 'DTCP / LPA', why: 'composite planning authority', detail: 'Tiruppur has had a composite Local Planning Authority since 1974, taking in municipalities, town panchayats and revenue panchayats. Inside its boundary the LPA is the approving body, so a DTCP number alone does not establish that a layout was approved for a given parcel.' },
  ],
  // --- the last five, researched separately ---
  KALLAKURICHI: [
    { label: 'FOREST', why: 'Kalvarayan Hills', detail: 'Kalvarayan Hills is one of the district’s six taluks, a range of the Eastern Ghats separating the Kaveri basin from the Palar. Hill land carries reserved forest and tribal-area restrictions, and land notified under section 4 of the Tamil Nadu Forest Act cannot be granted a patta while that notification stands.' },
  ],
  PERAMBALUR: [
    { label: 'MINES & GEOLOGY', why: 'fossiliferous limestone', detail: 'Perambalur sits on the fossiliferous limestone belt that also runs through Tiruchirappalli and Ariyalur, and it supports several of the state’s large cement works around Sendurai. A mining lease is granted by the state over the mineral, not by the seller over the surface, and it survives the sale of the land above it.' },
  ],
  TIRUPATTUR: [
    { label: 'FOREST', why: 'Yelagiri, Tirupattur division', detail: 'The Tirupattur Forest Division has existed since 1962 and takes in the Yelagiri hills at about 1,410 m. Land inside a reserve, or under a section 4 notification proposing reservation, cannot be granted a patta for as long as that stands.' },
    { label: 'MINES & GEOLOGY', why: 'granite and quartz', detail: 'The district’s hill terrain carries granite and quartz extraction. A quarry lease is a state grant over the mineral and is not extinguished when the surface changes hands.' },
  ],
  TENKASI: [
    { label: 'FOREST', why: 'Agasthiamalai, Courtallam', detail: 'Tenkasi runs along the Western Ghats on the Agasthiamalai range, with Courtallam in the foothills. Reserved forest and section 4 notifications both block the grant of a patta, and the ghat slopes here are extensively notified.' },
  ],
  THENI: [
    { label: 'FOREST', why: 'Meghamalai, High Wavy', detail: 'Meghamalai, the High Wavy Mountains, rises to about 1,500 m in this district and carries cardamom and tea estates on Western Ghats slopes. Plantation land on a ghat slope frequently sits on or beside reserved forest, and a section 4 notification prevents a patta being granted at all.' },
    { label: 'WRD', why: 'Vaigai headwaters', detail: 'The Vaigai and its tributaries rise in this district. Tank beds, supply channels and river margins are classified poromboke and vest in the Water Resources Department; the classification sits in the revenue record, not in anything the seller hands over.' },
  ],
}

/** Base checks first, then whatever this location adds on top. */
export function scanStepsFor(city: string): ScanStep[] {
  return [...SCAN_STEPS_BASE, ...(LOCAL_SCAN_STEPS[city] ?? [])]
}

/**
 * The things a buyer actually needs to know, and searches for.
 *
 * The statutory checks above are what makes a district page unrepeatable. This
 * is the other half: the practical facts every buyer in Tamil Nadu needs
 * regardless of district, which are also among the most searched property
 * questions in the state and are answered badly almost everywhere.
 *
 * All of it is verified rather than assumed, and it is deliberately stated
 * plainly rather than hedged. Rates change: check them against the Registration
 * Department before a transaction, and update the `verified` date when you do.
 */
export const BUYER_FACTS = {
  verified: 'August 2026',
  items: [
    {
      q: 'What does registering a sale deed actually cost?',
      a: 'Stamp duty is 7 per cent of the property value and the registration fee is 4 per cent, so the statutory cost of a standard sale deed is 11 per cent. That is among the highest in the country, and it is worth budgeting for before agreeing a price rather than after.',
    },
    {
      q: 'Is that calculated on what I pay, or on the government value?',
      a: 'On whichever is higher. If the guideline value the government has fixed for that street exceeds the price you agreed, duty is charged on the guideline value. A price below guideline value does not reduce the duty; it only raises questions.',
    },
    {
      q: 'I registered the sale deed. Am I the owner on record?',
      a: 'Not yet in the revenue record. Registering at the Sub-Registrar Office and transferring the patta are two separate steps at two different offices, and the second one is applied for at the Taluk office afterwards. Until it is done the revenue record still names the seller, which is exactly the kind of disagreement between departments that causes trouble years later.',
    },
    {
      q: 'What should I have before I go to the Sub-Registrar Office?',
      a: 'The executed and stamped sale deed, the previous deeds that establish the chain of ownership, patta, chitta and adangal, an encumbrance certificate, PAN, identity proof for both parties and the witnesses, and a power of attorney if anyone is signing on behalf of someone else.',
    },
    {
      q: 'Is there any concession on the charges?',
      a: 'From April 2025 the state provides a concession on registration charges for women where the property is valued below ten lakh rupees. It applies to the registration fee, not to the stamp duty.',
    },
  ],
} as const
