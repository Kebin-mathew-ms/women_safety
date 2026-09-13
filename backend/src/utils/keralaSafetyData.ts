export interface SafetyFacility {
  name: string;
  type: 'police_station' | 'hospital' | 'fuel_station' | 'rest_stop';
  district: string;
  location: string;
  latitude: number;
  longitude: number;
  isOpen24Hours: boolean;
  phone?: string;
}

export interface HighwayCorridor {
  name: string;
  code: string;
  type: 'NH' | 'SH' | 'Arterial';
  averageLanes: number;
  divided: boolean;
  lightingCoverage: 'high' | 'moderate' | 'low';
  nightPatrolFrequency: 'high' | 'moderate' | 'low';
  mobileCoverage: 'full_5g' | '4g_stable' | 'spotty';
}

export interface RiskSegmentData {
  segmentName: string;
  fromTown: string;
  toTown: string;
  highwayCode: string;
  lengthKm: number;
  nightRiskLevel: 'high' | 'medium' | 'low';
  isolationLevel: 'high' | 'medium' | 'low';
  lightingCoverage: 'poor' | 'moderate' | 'good';
  primaryRiskReason: string;
  accidentHistoryScore: number; // 0-100 (higher means more accident prone)
  dataFreshness: {
    source: string;
    lastUpdated: string;
    confidence: number; // 0.0 - 1.0
  };
}

export const KERALA_HIGHWAY_CORRIDORS: Record<string, HighwayCorridor> = {
  'MC_ROAD': {
    name: 'Main Central Road (SH 1)',
    code: 'SH 1',
    type: 'SH',
    averageLanes: 2,
    divided: false,
    lightingCoverage: 'high',
    nightPatrolFrequency: 'high',
    mobileCoverage: 'full_5g',
  },
  'NH_66': {
    name: 'National Highway 66 (Kochi - Alappuzha Corridor)',
    code: 'NH 66',
    type: 'NH',
    averageLanes: 4,
    divided: true,
    lightingCoverage: 'high',
    nightPatrolFrequency: 'high',
    mobileCoverage: 'full_5g',
  },
  'SH_15': {
    name: 'Kochi - Ettumanoor - Kottayam Road',
    code: 'SH 15',
    type: 'SH',
    averageLanes: 2,
    divided: false,
    lightingCoverage: 'moderate',
    nightPatrolFrequency: 'moderate',
    mobileCoverage: '4g_stable',
  },
  'AC_ROAD': {
    name: 'Alappuzha - Changanassery Road',
    code: 'AC Road',
    type: 'Arterial',
    averageLanes: 2,
    divided: false,
    lightingCoverage: 'moderate',
    nightPatrolFrequency: 'moderate',
    mobileCoverage: '4g_stable',
  },
};

export const KERALA_SAFETY_FACILITIES: SafetyFacility[] = [
  // Police Stations
  {
    name: 'Ernakulam Central Police Station',
    type: 'police_station',
    district: 'Ernakulam',
    location: 'Kochi City Center',
    latitude: 9.9723,
    longitude: 76.2784,
    isOpen24Hours: true,
    phone: '0484-2390100',
  },
  {
    name: 'Aluva East Police Station',
    type: 'police_station',
    district: 'Ernakulam',
    location: 'Aluva Town',
    latitude: 10.1076,
    longitude: 76.3516,
    isOpen24Hours: true,
    phone: '0484-2624024',
  },
  {
    name: 'Muvattupuzha Police Station',
    type: 'police_station',
    district: 'Ernakulam',
    location: 'Muvattupuzha Bypass Junction',
    latitude: 9.9882,
    longitude: 76.5786,
    isOpen24Hours: true,
    phone: '0485-2832304',
  },
  {
    name: 'Kottayam West Police Station',
    type: 'police_station',
    district: 'Kottayam',
    location: 'Kottayam Town Center',
    latitude: 9.5916,
    longitude: 76.5222,
    isOpen24Hours: true,
    phone: '0481-2567204',
  },
  {
    name: 'Changanassery Police Station',
    type: 'police_station',
    district: 'Kottayam',
    location: 'Changanassery Bypass',
    latitude: 9.4452,
    longitude: 76.5392,
    isOpen24Hours: true,
    phone: '0481-2420224',
  },
  {
    name: 'Ettumanoor Police Station',
    type: 'police_station',
    district: 'Kottayam',
    location: 'Ettumanoor Temple Junction',
    latitude: 9.6704,
    longitude: 76.5621,
    isOpen24Hours: true,
    phone: '0481-2535534',
  },

  // Emergency Hospitals
  {
    name: 'Medical Trust Hospital',
    type: 'hospital',
    district: 'Ernakulam',
    location: 'MG Road, Kochi',
    latitude: 9.9671,
    longitude: 76.2862,
    isOpen24Hours: true,
    phone: '0484-2358001',
  },
  {
    name: 'Rajagiri Hospital',
    type: 'hospital',
    district: 'Ernakulam',
    location: 'Chunangamvely, Aluva',
    latitude: 10.1012,
    longitude: 76.3721,
    isOpen24Hours: true,
    phone: '0484-2910000',
  },
  {
    name: 'Caritas Hospital',
    type: 'hospital',
    district: 'Kottayam',
    location: 'Thellakom, Ettumanoor Road',
    latitude: 9.6385,
    longitude: 76.5412,
    isOpen24Hours: true,
    phone: '0481-2790001',
  },
  {
    name: 'Government Medical College Hospital Kottayam',
    type: 'hospital',
    district: 'Kottayam',
    location: 'Gandhinagar, Kottayam',
    latitude: 9.6276,
    longitude: 76.5298,
    isOpen24Hours: true,
    phone: '0481-2597311',
  },

  // 24-Hr Fuel Stations
  {
    name: 'Indian Oil 24x7 Express Station',
    type: 'fuel_station',
    district: 'Ernakulam',
    location: 'Vyttila Mobility Hub Junction',
    latitude: 9.9658,
    longitude: 76.3211,
    isOpen24Hours: true,
  },
  {
    name: 'BPCL Auto Care Center',
    type: 'fuel_station',
    district: 'Ernakulam',
    location: 'Muvattupuzha MC Road Junction',
    latitude: 9.9821,
    longitude: 76.5742,
    isOpen24Hours: true,
  },
  {
    name: 'HP Fuel Care 24/7',
    type: 'fuel_station',
    district: 'Kottayam',
    location: 'Ettumanoor Bypass Junction',
    latitude: 9.6681,
    longitude: 76.5604,
    isOpen24Hours: true,
  },
  {
    name: 'IOC COCO Fuel Station',
    type: 'fuel_station',
    district: 'Kottayam',
    location: 'Kottayam Nagampadam',
    latitude: 9.5989,
    longitude: 76.5271,
    isOpen24Hours: true,
  },
];

export const KERALA_RISK_SEGMENTS: RiskSegmentData[] = [
  {
    segmentName: 'Muvattupuzha → Monippally Stretch',
    fromTown: 'Muvattupuzha',
    toTown: 'Monippally',
    highwayCode: 'SH 1',
    lengthKm: 18.5,
    nightRiskLevel: 'high',
    isolationLevel: 'high',
    lightingCoverage: 'poor',
    primaryRiskReason: 'Unlit rubber plantation belt with steep curves and limited late-night open commercial facilities.',
    accidentHistoryScore: 68,
    dataFreshness: {
      source: 'Kerala Highway Safety Audit 2026',
      lastUpdated: '2026-09-01T00:00:00Z',
      confidence: 0.95,
    },
  },
  {
    segmentName: 'Kanakkary Curve → Ettumanoor Inner Road',
    fromTown: 'Kanakkary',
    toTown: 'Ettumanoor',
    highwayCode: 'SH 15',
    lengthKm: 11.2,
    nightRiskLevel: 'medium',
    isolationLevel: 'medium',
    lightingCoverage: 'moderate',
    primaryRiskReason: 'Narrow non-divided road with sharp turns and heavy local bus traffic during early morning hours.',
    accidentHistoryScore: 54,
    dataFreshness: {
      source: 'District Traffic Advisory Board',
      lastUpdated: '2026-09-10T12:00:00Z',
      confidence: 0.90,
    },
  },
  {
    segmentName: 'Kidangoor Bypass Rural Stretch',
    fromTown: 'Manarcad',
    toTown: 'Kidangoor',
    highwayCode: 'SH 8',
    lengthKm: 14.0,
    nightRiskLevel: 'high',
    isolationLevel: 'high',
    lightingCoverage: 'poor',
    primaryRiskReason: 'Deserted rural stretch between 11 PM and 5 AM with spotty 4G coverage and high wildlife cross-movement.',
    accidentHistoryScore: 72,
    dataFreshness: {
      source: 'SafeTravel Infrastructure Scan',
      lastUpdated: '2026-09-12T00:00:00Z',
      confidence: 0.92,
    },
  },
];
