import axios from 'axios';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const OSRM_BASE = 'https://router.project-osrm.org';

export interface RouteInfo {
  distance: number;
  duration: number;
  coordinates: { latitude: number; longitude: number }[];
}

export class MapService {
  /**
   * Autocomplete address searches using Nominatim
   */
  public static async autocomplete(query: string): Promise<any[]> {
    try {
      if (!query || query.trim().length < 3) return [];
      
      const response = await axios.get(`${NOMINATIM_BASE}/search`, {
        params: {
          q: query,
          format: 'json',
          limit: 6,
          addressdetails: 1,
        },
        headers: {
          'User-Agent': 'SafeTravelMobileApp/1.0.0',
        },
      });

      return response.data.map((item: any) => ({
        display_name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
      }));
    } catch (error) {
      console.warn('MapService search autocomplete failed:', error);
      return [];
    }
  }

  /**
   * Reverse geocode coordinates to display name address
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
          'User-Agent': 'SafeTravelMobileApp/1.0.0',
        },
      });
      return response.data?.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (error) {
      console.warn('MapService reverse geocoding failed:', error);
      return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    }
  }

  /**
   * Calculate routing path and distance coordinates from OSRM
   */
  public static async getRoute(
    srcLat: number,
    srcLon: number,
    destLat: number,
    destLon: number
  ): Promise<RouteInfo | null> {
    try {
      const coords = `${srcLon},${srcLat};${destLon},${destLat}`;
      const response = await axios.get(`${OSRM_BASE}/route/v1/driving/${coords}`, {
        params: {
          overview: 'full',
          geometries: 'geojson',
        },
      });

      const route = response.data?.routes?.[0];
      if (!route) return null;

      const distance = route.distance / 1000; // in km
      const duration = route.duration / 60;   // in minutes

      // OSRM coordinates are [lon, lat], map to react-native-maps {latitude, longitude} format
      const coordinates = route.geometry.coordinates.map((coord: [number, number]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      return {
        distance,
        duration,
        coordinates,
      };
    } catch (error) {
      console.warn('MapService getRoute failed:', error);
      return null;
    }
  }
}

export default MapService;
