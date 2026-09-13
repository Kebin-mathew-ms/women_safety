import { CandidateRoute, RouteSegment } from './routing.service';
import {
  KERALA_SAFETY_FACILITIES,
  KERALA_RISK_SEGMENTS,
  SafetyFacility,
  RiskSegmentData,
} from '../utils/keralaSafetyData';
import logger from '../utils/logger';

export interface DimensionScores {
  roadSafety: number; // 0-100
  nightTimeSafety: number; // 0-100
  trafficIncidentRisk: number; // 0-100
  emergencyAccess: number; // 0-100
  lightingIsolation: number; // 0-100
  weatherRisk: number; // 0-100
  connectivity: number; // 0-100
  facilities: number; // 0-100
}

export interface EvaluatedRouteScore {
  routeId: string;
  totalSafetyScore: number; // 0-100
  suitabilityLabel: 'High' | 'Moderate' | 'Lower';
  dimensionScores: DimensionScores;
  riskySegments: {
    segmentName: string;
    highwayCode: string;
    startTown: string;
    endTown: string;
    riskReason: string;
    isolationLevel: string;
    lighting: string;
    dataFreshness: any;
  }[];
  emergencyFacilities: SafetyFacility[];
  confidence: 'High' | 'Moderate' | 'Low';
  confidenceReason?: string;
}

export interface ScoringWeights {
  roadSafety: number;
  nightTimeSafety: number;
  trafficIncidentRisk: number;
  emergencyAccess: number;
  lightingIsolation: number;
  weatherRisk: number;
  connectivity: number;
  facilities: number;
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  roadSafety: 0.25,
  nightTimeSafety: 0.20,
  trafficIncidentRisk: 0.15,
  emergencyAccess: 0.15,
  lightingIsolation: 0.10,
  weatherRisk: 0.05,
  connectivity: 0.05,
  facilities: 0.05,
};

export class SafetyIntelligenceService {
  /**
   * Layer 2: Safety Intelligence Evaluation
   * Evaluates segment-level risks, time-aware scoring, emergency access, and confidence levels.
   */
  public static evaluateRoute(
    route: CandidateRoute,
    departureTime: Date,
    preferences: string[] = [],
    weights: ScoringWeights = DEFAULT_WEIGHTS
  ): EvaluatedRouteScore {
    const isNight = departureTime.getHours() >= 22 || departureTime.getHours() < 5;

    // 1. Road Safety Score (25%)
    let roadSafetySum = 0;
    route.segments.forEach((seg) => {
      let segScore = 60;
      if (seg.roadType === 'NH') segScore += 30;
      else if (seg.roadType === 'SH') segScore += 20;
      if (seg.divided) segScore += 10;
      roadSafetySum += Math.min(100, segScore);
    });
    const roadSafety = Math.round(roadSafetySum / route.segments.length);

    // 2. Night / Time-Aware Safety Score (20%)
    let nightSum = 0;
    route.segments.forEach((seg) => {
      let score = 90;
      if (isNight) {
        if (seg.lighting === 'poor') score -= 45;
        else if (seg.lighting === 'moderate') score -= 20;

        if (seg.isolation === 'high') score -= 30;
        else if (seg.isolation === 'medium') score -= 15;
      }
      nightSum += Math.max(10, score);
    });
    const nightTimeSafety = Math.round(nightSum / route.segments.length);

    // 3. Traffic / Incident Risk Score (15%)
    let riskSegmentMatches: RiskSegmentData[] = [];
    route.segments.forEach((seg) => {
      const match = KERALA_RISK_SEGMENTS.find(
        (r) =>
          r.fromTown.toLowerCase().includes(seg.startTown.toLowerCase()) ||
          r.toTown.toLowerCase().includes(seg.endTown.toLowerCase())
      );
      if (match) riskSegmentMatches.push(match);
    });

    let trafficIncidentRisk = 85;
    if (riskSegmentMatches.length > 0) {
      const avgAccidentScore =
        riskSegmentMatches.reduce((acc, r) => acc + r.accidentHistoryScore, 0) /
        riskSegmentMatches.length;
      trafficIncidentRisk = Math.max(20, Math.round(100 - avgAccidentScore));
    }

    // 4. Emergency Accessibility (15%)
    const relevantFacilities = KERALA_SAFETY_FACILITIES.filter((f) =>
      route.waypoints.some(
        (wp) =>
          f.district.toLowerCase().includes(wp.toLowerCase()) ||
          f.location.toLowerCase().includes(wp.toLowerCase()) ||
          f.name.toLowerCase().includes(wp.toLowerCase())
      )
    );
    const policeCount = relevantFacilities.filter((f) => f.type === 'police_station').length;
    const hospitalCount = relevantFacilities.filter((f) => f.type === 'hospital').length;
    const emergencyAccess = Math.min(100, 40 + policeCount * 20 + hospitalCount * 15);

    // 5. Lighting & Isolation Score (10%)
    let lightSum = 0;
    route.segments.forEach((seg) => {
      let score = 70;
      if (seg.lighting === 'high') score += 25;
      if (seg.isolation === 'low') score += 15;
      if (seg.isolation === 'high') score -= 30;
      lightSum += Math.max(10, Math.min(100, score));
    });
    const lightingIsolation = Math.round(lightSum / route.segments.length);

    // 6. Weather Risk (5%)
    const weatherRisk = isNight ? 75 : 90; // Default clear/mild rating

    // 7. Network Connectivity (5%)
    let connSum = 0;
    route.segments.forEach((seg) => {
      if (seg.mobileCoverage === 'full_5g') connSum += 100;
      else if (seg.mobileCoverage === '4g_stable') connSum += 80;
      else if (seg.mobileCoverage === 'spotty') connSum += 50;
      else connSum += 20;
    });
    const connectivity = Math.round(connSum / route.segments.length);

    // 8. Facilities Availability (5%)
    const fuelCount = relevantFacilities.filter((f) => f.type === 'fuel_station').length;
    const facilities = Math.min(100, 30 + fuelCount * 25);

    // Weighted Score Calculation
    let rawScore =
      roadSafety * weights.roadSafety +
      nightTimeSafety * weights.nightTimeSafety +
      trafficIncidentRisk * weights.trafficIncidentRisk +
      emergencyAccess * weights.emergencyAccess +
      lightingIsolation * weights.lightingIsolation +
      weatherRisk * weights.weatherRisk +
      connectivity * weights.connectivity +
      facilities * weights.facilities;

    // Apply User Preferences Modifiers
    if (preferences.includes('prefer_highways') && route.isHighwayPreferred) rawScore += 3;
    if (preferences.includes('avoid_isolated_roads') && riskSegmentMatches.length > 0) rawScore -= 5;
    if (preferences.includes('avoid_toll_roads') && route.hasTolls) rawScore -= 2;

    const totalSafetyScore = Math.min(98, Math.max(30, Math.round(rawScore)));

    // Suitability Label Mapping
    let suitabilityLabel: 'High' | 'Moderate' | 'Lower' = 'High';
    if (totalSafetyScore < 70) suitabilityLabel = 'Lower';
    else if (totalSafetyScore < 82) suitabilityLabel = 'Moderate';

    // Format Risky Segments with Data Freshness
    const riskySegments = riskSegmentMatches.map((r) => ({
      segmentName: r.segmentName,
      highwayCode: r.highwayCode,
      startTown: r.fromTown,
      endTown: r.toTown,
      riskReason: r.primaryRiskReason,
      isolationLevel: r.isolationLevel,
      lighting: r.lightingCoverage,
      dataFreshness: r.dataFreshness,
    }));

    // Confidence Level Determination
    let confidence: 'High' | 'Moderate' | 'Low' = 'High';
    let confidenceReason = 'Comprehensive segment safety & facility coverage available.';
    if (relevantFacilities.length < 2) {
      confidence = 'Moderate';
      confidenceReason = 'Limited real-time infrastructure data for some rural waypoints.';
    }

    return {
      routeId: route.routeId,
      totalSafetyScore,
      suitabilityLabel,
      dimensionScores: {
        roadSafety,
        nightTimeSafety,
        trafficIncidentRisk,
        emergencyAccess,
        lightingIsolation,
        weatherRisk,
        connectivity,
        facilities,
      },
      riskySegments,
      emergencyFacilities: relevantFacilities.length > 0 ? relevantFacilities : KERALA_SAFETY_FACILITIES.slice(0, 3),
      confidence,
      confidenceReason,
    };
  }
}

export default SafetyIntelligenceService;
