import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, UrlTile } from 'react-native-maps';
import { COLORS, SPACING, SHADOWS } from '../theme';
import GpsService from '../services/gps';
import MapService from '../services/map';
import socketService from '../services/socket';
import apiClient from '../services/api';
import * as Location from 'expo-location';

export const LiveTrackingScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { tripId, tripName, source, destination, srcLat, srcLon, destLat, destLon } = route.params;

  const [currentCoords, setCurrentCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [speed, setSpeed] = useState(0); // in m/s -> convert to km/h
  const [heading, setHeading] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopping, setStopping] = useState(false);

  const mapRef = useRef<MapView>(null);
  const locationSubscription = useRef<Location.LocationSubscription | null>(null);

  // Setup Socket Connection and join trip room
  const initializeSockets = async () => {
    try {
      const socket = await socketService.connect();
      socketService.emit('trip-start', { tripId });
    } catch (err) {
      console.warn('LiveTracking Socket initialization warning:', err);
    }
  };

  // Setup GPS Location Watching
  const startGpsTracking = async () => {
    // 1. Calculate OSRM initial polyline coordinates
    const routeInfo = await MapService.getRoute(srcLat, srcLon, destLat, destLon);
    if (routeInfo) {
      setRouteCoordinates(routeInfo.coordinates);
    }

    // 2. Start watching position
    const subscription = await GpsService.watchLocation((loc) => {
      const lat = loc.coords.latitude;
      const lon = loc.coords.longitude;
      const speedKmh = (loc.coords.speed || 0) * 3.6; // convert m/s to km/h

      setCurrentCoords({ latitude: lat, longitude: lon });
      setSpeed(speedKmh);
      setHeading(loc.coords.heading || 0);
      setAccuracy(loc.coords.accuracy || 0);

      // Emit real-time telemetry over sockets
      socketService.emit('location-update', {
        tripId,
        latitude: lat,
        longitude: lon,
        speed: speedKmh,
        heading: loc.coords.heading || 0,
        accuracy: loc.coords.accuracy || 0,
      });

      // Periodically back up location via REST API (fail-safety fallback)
      apiClient.post('/trips/location', {
        tripId,
        latitude: lat,
        longitude: lon,
        speed: speedKmh,
        heading: loc.coords.heading || 0,
        accuracy: loc.coords.accuracy || 0,
      }).catch((err) => {
        console.debug('REST Location backup silent fail:', err.message);
      });
    });

    if (subscription) {
      locationSubscription.current = subscription;
    }
    setLoading(false);
  };

  useEffect(() => {
    initializeSockets();
    startGpsTracking();
    
    // Cleanup GPS and Socket connections
    return () => {
      if (locationSubscription.current) {
        locationSubscription.current.remove();
      }
      socketService.emit('trip-end', { tripId });
      socketService.disconnect();
    };
  }, []);

  const handleStopTrip = async (complete: boolean) => {
    setStopping(true);
    try {
      const endpoint = `/trips/${tripId}/${complete ? 'complete' : 'cancel'}`;
      await apiClient.post(endpoint);

      socketService.emit('trip-end', { tripId });
      
      if (locationSubscription.current) {
        locationSubscription.current.remove();
        locationSubscription.current = null;
      }

      Alert.alert(
        complete ? 'Journey Completed' : 'Journey Cancelled',
        complete ? 'You have reached your destination safely!' : 'Your safety monitoring has ended.',
        [{ text: 'OK', onPress: () => navigation.replace('MainTabs') }]
      );
    } catch (err: any) {
      Alert.alert('Error', 'Failed to end trip monitoring.');
    } finally {
      setStopping(false);
    }
  };

  const centerOnUser = () => {
    if (currentCoords) {
      mapRef.current?.animateToRegion({
        ...currentCoords,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      }, 800);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
        <Text style={styles.loadingText}>Initializing Safe GPS Monitoring...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Real-time Map layering OSM tiles */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: srcLat,
          longitude: srcLon,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} flipY={false} />
        
        {/* Source and Destination markers */}
        <Marker coordinate={{ latitude: srcLat, longitude: srcLon }} title="Start" pinColor="green" />
        <Marker coordinate={{ latitude: destLat, longitude: destLon }} title="Destination" pinColor="red" />

        {/* User Current coordinate pin */}
        {currentCoords && (
          <Marker coordinate={currentCoords} title="My Location" pinColor="blue" />
        )}

        {/* Route Polyline path */}
        {routeCoordinates.length > 0 && (
          <Polyline coordinates={routeCoordinates} strokeWidth={4} strokeColor={COLORS.primary} />
        )}
      </MapView>

      {/* Telemetry HUD Panel Overlay */}
      <View style={styles.hudCard}>
        <Text style={styles.tripName} numberOfLines={1}>{tripName}</Text>
        <Text style={styles.destText} numberOfLines={1}>To: {destination}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Speed</Text>
            <Text style={styles.statValue}>{speed.toFixed(0)} km/h</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Heading</Text>
            <Text style={styles.statValue}>{heading.toFixed(0)}°</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Accuracy</Text>
            <Text style={styles.statValue}>{accuracy.toFixed(0)}m</Text>
          </View>
        </View>

        {/* Controls */}
        <View style={styles.actionRow}>
          <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => handleStopTrip(false)} disabled={stopping}>
            <Text style={styles.btnText}>Cancel Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnComplete]} onPress={() => handleStopTrip(true)} disabled={stopping}>
            {stopping ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>I Am Safe</Text>}
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.locateBtn} onPress={centerOnUser}>
          <Text style={styles.locateText}>🎯 Center on Me</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  map: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 15,
    marginTop: 15,
  },
  hudCard: {
    position: 'absolute',
    bottom: SPACING.xl,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.lg,
    ...SHADOWS.medium,
  },
  tripName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  destText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderColor: COLORS.border,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.md,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  btn: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '48%',
  },
  btnComplete: {
    backgroundColor: COLORS.success,
  },
  btnCancel: {
    backgroundColor: COLORS.emergency,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  locateBtn: {
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  locateText: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    fontSize: 13,
  },
});

export default LiveTrackingScreen;
