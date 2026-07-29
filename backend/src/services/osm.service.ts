import axios from 'axios';
import logger from '../utils/logger';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

export interface RouteData {
  distance: number; // in kilometers
  duration: number; // in minutes
  coordinates: [number, number][]; // array of [latitude, longitude]
}

export interface GeocodedAddress {
  address: string;
  latitude: number;
  longitude: number;
}

export class OsmService {
  /**
   * Search addresses matching a search query (Nominatim)
   */
  public static async searchAddress(query: string): Promise<GeocodedAddress[]> {
    try {
      if (!query || query.trim().length < 3) return [];

      const response = await axios.get(`${NOMINATIM_BASE}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 5,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'SafeTravelCompanionApp/1.0.0 (contact@safetravel.com)',
        },
      });

      return response.data.map((item: any) => ({
        address: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
    } catch (error: any) {
      logger.error(`Nominatim Search Address error: ${error.message}`);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to an address string (Nominatim)
   */
  public static async reverseGeocode(lat: number, lon: number): Promise<string> {
    try {
      const response = await axios.get(`${NOMINATIM_BASE}/reverse`, {
        params: {
          lat,
          lon,
          format: 'json',
        },
        headers: {
          'User-Agent': 'SafeTravelCompanionApp/1.0.0 (contact@safetravel.com)',
        },
      });

      return response.data?.display_name || `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    } catch (error: any) {
      logger.error(`Nominatim Reverse Geocode error: ${error.message}`);
      return `${lat.toFixed(5)}, ${lon.toFixed(5)}`;
    }
  }

  /**
   * Get routing path, distance, and duration between two points (OSRM)
   */
  public static async calculateRoute(
    srcLat: number,
    srcLon: number,
    destLat: number,
    destLon: number
  ): Promise<RouteData> {
    try {
      // OSRM expects coordinates in format: {longitude},{latitude};{longitude},{latitude}
      const coords = `${srcLon},${srcLat};${destLon},${destLat}`;
      const response = await axios.get(`${OSRM_BASE}/route/v1/driving/${coords}`, {
        params: {
          overview: 'full',
          geometries: 'geojson',
        },
      });

      const route = response.data?.routes?.[0];
      if (!route) {
        throw new Error('No routing path found between points');
      }

      // Convert distance (meters to kilometers)
      const distance = route.distance / 1000;
      
      // Convert duration (seconds to minutes)
      const duration = route.duration / 60;

      // Extract geojson coordinates and swap order from [lon, lat] to [lat, lon] for maps
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => [
        coord[1],
        coord[0],
      ]) as [number, number][];

      return {
        distance,
        duration,
        coordinates,
      };
    } catch (error: any) {
      logger.error(`OSRM Calculate Route error: ${error.message}`);
      // Fallback distance formula (straight line distance) if routing server fails
      const distance = this.getHaversineDistance(srcLat, srcLon, destLat, destLon);
      const duration = (distance / 40) * 60; // 40 km/h avg speed fallback in minutes
      return {
        distance,
        duration,
        coordinates: [
          [srcLat, srcLon],
          [destLat, destLon],
        ],
      };
    }
  }

  /**
   * Helper Haversine formula for straight-line distance calculation
   */
  private static getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}

export default OsmService;
