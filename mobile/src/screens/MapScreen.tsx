import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import MapView, { Marker, UrlTile, Circle } from 'react-native-maps';
import { COLORS, SPACING, SHADOWS } from '../theme';
import GpsService from '../services/gps';
import MapService from '../services/map';
import apiClient from '../services/api';

export const MapScreen: React.FC = () => {
  const [region, setRegion] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentMarker, setCurrentMarker] = useState<any>(null);
  const mapRef = useRef<MapView>(null);

  // Heatmap states
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [heatmapPoints, setHeatmapPoints] = useState<any[]>([]);

  // Fetch heatmap points from backend
  const fetchHeatmap = async () => {
    try {
      const response = await apiClient.get('/crime-reports/heatmap');
      if (response.data.success) {
        setHeatmapPoints(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load safety heatmap points:', err.message);
    }
  };

  // Locate user on boot
  const handleLocateMe = async () => {
    setLoading(true);
    const loc = await GpsService.getCurrentLocation();
    setLoading(false);

    if (loc) {
      const newRegion = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.015,
        longitudeDelta: 0.015,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      setCurrentMarker({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        title: 'My Position',
      });
    }
  };

  useEffect(() => {
    handleLocateMe();
    fetchHeatmap();
  }, []);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    
    const results = await MapService.autocomplete(searchQuery);
    setLoading(false);

    if (results.length > 0) {
      const bestMatch = results[0];
      const newRegion = {
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      setCurrentMarker({
        latitude: bestMatch.latitude,
        longitude: bestMatch.longitude,
        title: bestMatch.display_name,
      });
    } else {
      Alert.alert('No matches', 'Could not locate address on OpenStreetMap.');
    }
  };

  const handleZoom = (zoomIn: boolean) => {
    const factor = zoomIn ? 0.5 : 2.0;
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 400);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Header Overlay */}
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search address or landmark..."
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.searchBtnText}>🔍</Text>}
        </TouchableOpacity>
      </View>

      {/* Map View layering OpenStreetMap tiles */}
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
      >
        {/* Layer OSM Tiles to replace Google maps */}
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
          flipY={false}
        />

        {/* Heatmap Circle Overlays */}
        {showHeatmap && heatmapPoints.map((point: any) => (
          <Circle
            key={point.id}
            center={{ latitude: point.latitude, longitude: point.longitude }}
            radius={point.radius}
            strokeWidth={1.5}
            strokeColor={point.color}
            fillColor={point.color + '22'} // 13% opacity
          />
        ))}

        {currentMarker && (
          <Marker
            coordinate={{ latitude: currentMarker.latitude, longitude: currentMarker.longitude }}
            title={currentMarker.title}
          />
        )}
      </MapView>

      {/* Floating Controls */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity style={[styles.controlBtn, showHeatmap ? styles.activeHeatmapBtn : null]} onPress={() => setShowHeatmap(!showHeatmap)}>
          <Text style={styles.controlText}>🔥</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom(true)}>
          <Text style={styles.controlText}>＋</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.controlBtn} onPress={() => handleZoom(false)}>
          <Text style={styles.controlText}>－</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.controlBtn, styles.locateBtn]} onPress={handleLocateMe}>
          <Text style={styles.controlText}>🎯</Text>
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
  searchBarContainer: {
    position: 'absolute',
    top: SPACING.xl,
    left: SPACING.xl,
    right: SPACING.xl,
    zIndex: 10,
    flexDirection: 'row',
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    borderColor: COLORS.border,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  searchInput: {
    flex: 1,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  searchBtn: {
    paddingHorizontal: SPACING.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  searchBtnText: {
    fontSize: 18,
  },
  controlsContainer: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    gap: SPACING.sm,
  },
  controlBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.small,
  },
  activeHeatmapBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.emergencyLight,
  },
  locateBtn: {
    backgroundColor: COLORS.primary,
  },
  controlText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
});

export default MapScreen;
