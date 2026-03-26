// TNGIS API response types

export interface LandDetailsData {
  district_code: string
  district_name: string
  district_tamil_name?: string
  taluk_code: string
  taluk_name: string
  taluk_tamil_name?: string
  village_code: string
  village_name: string
  village_tamil_name?: string
  survey_number: string
  sub_division: string
  is_fmb: number
  ulpin?: string
  rural_urban: 'rural' | 'urban'
  revenue_town_code?: string
  firka_ward_number?: string
  urban_block_number?: string
  lgd_district_code?: number
  lgd_taluk_code?: number
  lgd_village_code?: number
  centroid?: string
  geojson_geom?: string
}

export interface LandDetailsResponse {
  success: number
  message?: string
  data?: LandDetailsData | LandDetailsData[]
}

export interface GuidelineValueEntry {
  district_code: string
  taluk_code: string
  village_code: string
  kide: string
  metric_rate: string
  unit_id: string
  price_per_hect: string
  igr_price_ranking?: string
  land_name: string
  land_name_type: string
  land_type_grouping: string
}

export interface GuidelineValueResponse {
  success: number
  message?: string
  data?: GuidelineValueEntry[]
}

export interface ThematicEntry {
  [key: string]: string | number | null
}

export interface ThematicResponse {
  success: number
  message?: string
  data?: ThematicEntry[]
}

export interface MasterPlanResponse {
  success: number
  message?: string
  data?: {
    lpa_boundary?: { lpa_name: string; source?: string }
    proposed_landuse?: { landuse?: string } | null
    existing_landuse?: { landuse?: string } | null
  }
}

export interface ElevationResponse {
  features?: Array<{
    properties?: {
      GRAY_INDEX?: number
    }
  }>
}

export interface NearbyFacility {
  object_id?: number
  latitude: number
  longitude: number
  distance: number
  distance_unit: string
  label: string
  rating?: number
}

export interface TngisPreviewResult {
  coordinates: { latitude: number; longitude: number }
  land_details: LandDetailsResponse
  guideline_value?: GuidelineValueResponse
  master_plan?: MasterPlanResponse
  natural_resources?: {
    geology?: ThematicEntry[]
    geomorphology?: ThematicEntry[]
    soil?: ThematicEntry[]
    land_use?: ThematicEntry[]
    elevation?: number | null
  }
  ec_available?: boolean
  fmb_available?: boolean
  nearby_facilities?: {
    hospitals?: NearbyFacility[]
    schools?: NearbyFacility[]
    police_stations?: NearbyFacility[]
  }
  _meta: {
    fetch_time_ms: number
    apis_succeeded: number
    apis_failed: number
    facilities_status: 'live' | 'unavailable'
  }
}
