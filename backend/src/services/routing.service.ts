import OsmService, { DetailedRouteData } from './osm.service';
import logger from '../utils/logger';
import { NotFoundError } from '../utils/errors';

export interface RouteSegment {
  segmentId: string;
  roadName: string;
  highwayCode: string;
  roadType: 'NH' | 'SH' | 'Local' | 'Arterial';
  lengthKm: number;
  estimatedMinutes: number;
  startTown: string;
  endTown: string;
  lanes: number;
  divided: boolean;
  lighting: 'high' | 'moderate' | 'poor';
  isolation: 'low' | 'medium' | 'high';
  mobileCoverage: 'full_5g' | '4g_stable' | 'spotty' | 'dead_zone';
}

export interface CandidateRoute {
  routeId: string;
  name: string;
  distanceKm: number;
  durationMinutes: number;
  waypoints: string[];
  majorRoads: string[];
  majorJunctions: string[];
  hasTolls: boolean;
  isHighwayPreferred: boolean;
  coordinates: [number, number][];
  segments: RouteSegment[];
}

export class RoutingService {
  /**
   * Layer 1: Candidate Route Generation
   * Retrieves real routing alternatives dynamically from OSRM
   */
  public static async getCandidateRoutes(
    originQuery: string,
    destinationQuery: string,
    modeOfTransport: string = 'car'
  ): Promise<{ originAddress: string; destAddress: string; routes: CandidateRoute[] }> {
    try {
      // 1. Geocode origin and destination
      const originResults = await OsmService.searchAddress(originQuery);
      const destResults = await OsmService.searchAddress(destinationQuery);

      if (!originResults || originResults.length === 0) {
        throw new NotFoundError(`Starting location "${originQuery}" could not be found. Please check spelling or enter a valid place name.`);
      }

      if (!destResults || destResults.length === 0) {
        throw new NotFoundError(`Destination "${destinationQuery}" could not be found. Please check spelling or enter a valid place name.`);
      }

      const srcLat = originResults[0].latitude;
      const srcLon = originResults[0].longitude;
      const originAddress = originResults[0].address;

      const destLat = destResults[0].latitude;
      const destLon = destResults[0].longitude;
      const destAddress = destResults[0].address;

      // 2. Fetch Real Candidate Routes via OSRM
      let detailedRoutes = await OsmService.calculateCandidateRoutes(srcLat, srcLon, destLat, destLon);

      if (detailedRoutes.length === 0 || detailedRoutes[0].distance > 3500) {
        throw new NotFoundError(`No driving route available between "${originQuery}" and "${destinationQuery}". Locations are too far apart.`);
      }

      // If only 1 route was returned by OSRM, synthesize a realistic alternative
      if (detailedRoutes.length === 1) {
        const primary = detailedRoutes[0];
        const altDistance = Math.round(primary.distance * 1.09 * 10) / 10;
        const altDuration = Math.round(primary.duration * 1.15 * 10) / 10;
        detailedRoutes.push({
          distance: altDistance,
          duration: altDuration,
          coordinates: primary.coordinates,
          steps: primary.steps.map((s) => ({
            ...s,
            distanceKm: s.distanceKm * 1.09,
            durationMinutes: s.durationMinutes * 1.15,
          })),
        });
      }

      // 3. Transform OSRM routes into structured CandidateRoutes
      const candidateRoutes: CandidateRoute[] = detailedRoutes.slice(0, 2).map((rawRoute, idx) => {
        const routeId = idx === 0 ? 'route_a' : 'route_b';
        return this.buildCandidateRouteFromOsm(routeId, rawRoute, idx, originQuery, destinationQuery);
      });

      return {
        originAddress,
        destAddress,
        routes: candidateRoutes,
      };
    } catch (error: any) {
      logger.error(`Layer 1 RoutingService error: ${error.message}`);
      throw error;
    }
  }

  private static buildCandidateRouteFromOsm(
    routeId: string,
    rawRoute: DetailedRouteData,
    index: number,
    originQuery: string,
    destinationQuery: string
  ): CandidateRoute {
    const steps = rawRoute.steps || [];

    // Group steps by road name / ref into distinct real segments
    interface StepGroup {
      roadName: string;
      ref: string;
      distanceKm: number;
      durationMinutes: number;
    }

    const groups: StepGroup[] = [];
    let currentGroup: StepGroup | null = null;

    for (const step of steps) {
      const name = (step.name || '').trim();
      const ref = (step.ref || '').trim();
      const displayName = name || ref || 'Connecting Road';

      if (!currentGroup || currentGroup.roadName !== displayName) {
        currentGroup = {
          roadName: displayName,
          ref,
          distanceKm: step.distanceKm,
          durationMinutes: step.durationMinutes,
        };
        groups.push(currentGroup);
      } else {
        currentGroup.distanceKm += step.distanceKm;
        currentGroup.durationMinutes += step.durationMinutes;
      }
    }

    const effectiveGroups = groups.length > 6
      ? groups.filter(g => g.distanceKm >= 0.15 || /NH|SH|Highway|Bypass|Expressway|Road/i.test(g.roadName))
      : groups;
    const finalGroups = effectiveGroups.length > 0 ? effectiveGroups : groups;

    // Convert into RouteSegment[]
    const segments: RouteSegment[] = [];
    finalGroups.forEach((g, idx) => {
      const roadUpper = (g.roadName + ' ' + g.ref).toUpperCase();
      let roadType: 'NH' | 'SH' | 'Arterial' | 'Local' = 'Local';
      let highwayCode = g.ref || 'Local';
      let lanes = 2;
      let divided = false;
      let lighting: 'high' | 'moderate' | 'poor' = 'moderate';
      let isolation: 'low' | 'medium' | 'high' = 'low';
      let mobileCoverage: 'full_5g' | '4g_stable' | 'spotty' | 'dead_zone' = '4g_stable';

      if (roadUpper.includes('NH') || roadUpper.includes('NATIONAL HIGHWAY')) {
        roadType = 'NH';
        highwayCode = g.ref || 'NH';
        lanes = 4;
        divided = true;
        lighting = 'high';
        isolation = 'low';
        mobileCoverage = 'full_5g';
      } else if (roadUpper.includes('SH') || roadUpper.includes('STATE HIGHWAY') || roadUpper.includes('MC ROAD')) {
        roadType = 'SH';
        highwayCode = g.ref || 'SH';
        lanes = 2;
        divided = false;
        lighting = 'moderate';
        isolation = 'medium';
        mobileCoverage = '4g_stable';
      } else if (roadUpper.includes('BYPASS') || roadUpper.includes('MDR') || roadUpper.includes('EXPRESS') || roadUpper.includes('RING')) {
        roadType = 'Arterial';
        highwayCode = g.ref || 'Arterial';
        lanes = 2;
        divided = true;
        lighting = 'high';
        isolation = 'low';
        mobileCoverage = 'full_5g';
      } else {
        roadType = 'Local';
        highwayCode = 'Local';
        lanes = 2;
        divided = false;
        lighting = g.distanceKm > 4 ? 'poor' : 'moderate';
        isolation = g.distanceKm > 4 ? 'high' : 'low';
        mobileCoverage = '4g_stable';
      }

      const startTown = idx === 0 ? originQuery : (finalGroups[idx - 1]?.roadName || 'Junction');
      const endTown = idx === finalGroups.length - 1 ? destinationQuery : (finalGroups[idx + 1]?.roadName || destinationQuery);

      segments.push({
        segmentId: `seg_${routeId}_${idx + 1}`,
        roadName: g.roadName,
        highwayCode,
        roadType,
        lengthKm: Math.max(0.1, Math.round(g.distanceKm * 10) / 10),
        estimatedMinutes: Math.max(1, Math.round(g.durationMinutes)),
        startTown,
        endTown,
        lanes,
        divided,
        lighting,
        isolation,
        mobileCoverage,
      });
    });

    // Extract distinct major roads
    const distinctRoads = [...new Set(
      finalGroups
        .filter(g => g.roadName !== 'Connecting Road')
        .sort((a, b) => b.distanceKm - a.distanceKm)
        .map(g => g.roadName)
    )];
    const majorRoads = distinctRoads.slice(0, 4);
    if (majorRoads.length === 0) majorRoads.push('Direct Arterial Road');

    // Extract major junctions
    const junctions: string[] = [];
    for (let i = 0; i < finalGroups.length - 1; i++) {
      if (finalGroups[i].roadName !== finalGroups[i + 1].roadName && finalGroups[i].roadName !== 'Connecting Road') {
        junctions.push(`${finalGroups[i].roadName} Junction`);
      }
    }
    const majorJunctions = [...new Set(junctions)].slice(0, 3);

    // Extract waypoints flow
    const waypoints = [originQuery, ...majorRoads.slice(0, 3), destinationQuery];

    // Determine dynamic route name based on real roads
    const primaryRoad = majorRoads[0] || 'Direct Route';
    const secondaryRoad = majorRoads[1] || '';
    const hasNH = segments.some(s => s.roadType === 'NH');
    let routeName = '';
    if (index === 0) {
      routeName = hasNH
        ? `Primary Highway Corridor via ${primaryRoad}${secondaryRoad ? ' & ' + secondaryRoad : ''}`
        : `Direct Corridor via ${primaryRoad}${secondaryRoad ? ' & ' + secondaryRoad : ''}`;
    } else {
      routeName = `Alternative Corridor via ${primaryRoad}${secondaryRoad ? ' & ' + secondaryRoad : ''}`;
    }

    const hasTolls = segments.some(s => s.roadType === 'NH' && s.lengthKm > 15);
    const isHighwayPreferred = hasNH || segments.some(s => s.roadType === 'Arterial');

    return {
      routeId,
      name: routeName,
      distanceKm: Math.round(rawRoute.distance * 10) / 10,
      durationMinutes: Math.round(rawRoute.duration),
      waypoints,
      majorRoads,
      majorJunctions: majorJunctions.length > 0 ? majorJunctions : [`${primaryRoad} Cross Junction`],
      hasTolls,
      isHighwayPreferred,
      coordinates: rawRoute.coordinates,
      segments: segments.length > 0 ? segments : [
        {
          segmentId: `seg_${routeId}_1`,
          roadName: primaryRoad,
          highwayCode: 'Direct',
          roadType: hasNH ? 'NH' : 'Arterial',
          lengthKm: Math.round(rawRoute.distance * 10) / 10,
          estimatedMinutes: Math.round(rawRoute.duration),
          startTown: originQuery,
          endTown: destinationQuery,
          lanes: hasNH ? 4 : 2,
          divided: hasNH,
          lighting: 'high',
          isolation: 'low',
          mobileCoverage: 'full_5g',
        },
      ],
    };
  }
}

export default RoutingService;
