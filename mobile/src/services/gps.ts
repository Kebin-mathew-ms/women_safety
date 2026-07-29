import * as Location from 'expo-location';
import { Alert } from 'react-native';

export class GpsService {
  /**
   * Request foreground and background location permissions
   * @returns boolean indicating if permissions were granted
   */
  public static async requestPermissions(): Promise<boolean> {
    try {
      // 1. Check/Request Foreground Permission
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'This application requires location access to monitor your travel route safety and dispatch emergency contacts in case of danger.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // 2. Request Background Permission (Highly recommended for continuous tracking)
      // Note: In development simulators background status might be checked softly.
      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      
      return fgStatus === 'granted';
    } catch (error) {
      console.warn('GPS Permission Request error:', error);
      return false;
    }
  }

  /**
   * Check if location services are enabled globally on the device
   */
  public static async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.warn('Location Service check failed:', error);
      return false;
    }
  }

  /**
   * Fetch current high-accuracy coordinates of the user
   */
  public static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const enabled = await this.isLocationEnabled();
      if (!enabled) {
        Alert.alert('GPS Disabled', 'Please enable Location services on your device.');
        return null;
      }

      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
    } catch (error) {
      console.warn('Get current location failed:', error);
      return null;
    }
  }

  /**
   * Start watching user locations continuously
   * @param onLocation Callback triggered on coordinates updates
   * @returns Location.LocationSubscription reference to stop watching
   */
  public static async watchLocation(
    onLocation: (location: Location.LocationObject) => void
  ): Promise<Location.LocationSubscription | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      return await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000, // Update every 5 seconds
          distanceInterval: 5, // Update every 5 meters
        },
        onLocation
      );
    } catch (error) {
      console.warn('Watch location failed:', error);
      return null;
    }
  }
}

export default GpsService;
