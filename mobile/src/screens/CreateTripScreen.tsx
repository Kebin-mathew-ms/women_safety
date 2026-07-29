import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../theme';
import apiClient from '../services/api';
import MapService from '../services/map';
import GpsService from '../services/gps';

export const CreateTripScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [tripName, setTripName] = useState('');
  
  // Source inputs
  const [sourceQuery, setSourceQuery] = useState('');
  const [sourceLoc, setSourceLoc] = useState<any>(null);
  const [sourceSuggestions, setSourceSuggestions] = useState<any[]>([]);
  
  // Destination inputs
  const [destQuery, setDestQuery] = useState('');
  const [destLoc, setDestLoc] = useState<any>(null);
  const [destSuggestions, setDestSuggestions] = useState<any[]>([]);

  // OSRM calculated route preview
  const [routePreview, setRoutePreview] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Initialize source to current device location on mount
  useEffect(() => {
    const initSource = async () => {
      setLoading(true);
      const loc = await GpsService.getCurrentLocation();
      setLoading(false);
      
      if (loc) {
        const lat = loc.coords.latitude;
        const lon = loc.coords.longitude;
        const address = await MapService.reverseGeocode(lat, lon);
        
        setSourceLoc({ display_name: address, latitude: lat, longitude: lon });
        setSourceQuery(address);
      }
    };
    initSource();
  }, []);

  // Recalculate route summary when both locations change
  useEffect(() => {
    const updateRoutePreview = async () => {
      if (sourceLoc && destLoc) {
        setCalculating(true);
        const route = await MapService.getRoute(
          sourceLoc.latitude,
          sourceLoc.longitude,
          destLoc.latitude,
          destLoc.longitude
        );
        setCalculating(false);
        if (route) setRoutePreview(route);
      }
    };
    updateRoutePreview();
  }, [sourceLoc, destLoc]);

  // Autocomplete searches
  const handleSourceSearch = async (text: string) => {
    setSourceQuery(text);
    if (text.length >= 3) {
      const res = await MapService.autocomplete(text);
      setSourceSuggestions(res);
    } else {
      setSourceSuggestions([]);
    }
  };

  const handleDestSearch = async (text: string) => {
    setDestQuery(text);
    if (text.length >= 3) {
      const res = await MapService.autocomplete(text);
      setDestSuggestions(res);
    } else {
      setDestSuggestions([]);
    }
  };

  const handleSelectSource = (item: any) => {
    setSourceLoc(item);
    setSourceQuery(item.display_name);
    setSourceSuggestions([]);
  };

  const handleSelectDest = (item: any) => {
    setDestLoc(item);
    setDestQuery(item.display_name);
    setDestSuggestions([]);
  };

  const handleStartTrip = async () => {
    if (!sourceLoc || !destLoc) {
      Alert.alert('Validation Error', 'Please select both source and destination from recommendations.');
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/trips', {
        tripName: tripName.trim() || 'Journey to ' + destLoc.display_name.split(',')[0],
        sourceAddress: sourceLoc.display_name,
        destinationAddress: destLoc.display_name,
        sourceLatitude: sourceLoc.latitude,
        sourceLongitude: sourceLoc.longitude,
        destinationLatitude: destLoc.latitude,
        destinationLongitude: destLoc.longitude,
        travelMode: 'driving',
      });

      setLoading(false);
      if (response.data.success) {
        const trip = response.data.data.trip;
        
        // Navigate directly to the Live Tracking Screen
        navigation.replace('LiveTracking', {
          tripId: trip.tripId,
          tripName: trip.tripName,
          source: trip.sourceAddress,
          destination: trip.destinationAddress,
          srcLat: trip.sourceLatitude,
          srcLon: trip.sourceLongitude,
          destLat: trip.destinationLatitude,
          destLon: trip.destinationLongitude,
        });
      }
    } catch (err: any) {
      setLoading(false);
      Alert.alert('Trip Creation Error', err.response?.data?.message || 'Failed to initialize safe travel path.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollWrapper} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Plan Safe Journey</Text>
        
        <View style={styles.form}>
          {/* Trip Name */}
          <Text style={styles.label}>Trip Name (Optional)</Text>
          <TextInput style={styles.input} value={tripName} onChangeText={setTripName} placeholder="e.g. Walking home from metro" placeholderTextColor={COLORS.textMuted} />

          {/* Source Address */}
          <Text style={styles.label}>Starting Point</Text>
          <TextInput style={styles.input} value={sourceQuery} onChangeText={handleSourceSearch} placeholder="Search start location..." placeholderTextColor={COLORS.textMuted} />

          {sourceSuggestions.length > 0 && (
            <View style={styles.suggestions}>
              {sourceSuggestions.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSelectSource(item)}>
                  <Text style={styles.suggestionText} numberOfLines={2}>📍 {item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Destination Address */}
          <Text style={styles.label}>Destination Point</Text>
          <TextInput style={styles.input} value={destQuery} onChangeText={handleDestSearch} placeholder="Search destination address..." placeholderTextColor={COLORS.textMuted} />

          {destSuggestions.length > 0 && (
            <View style={styles.suggestions}>
              {destSuggestions.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSelectDest(item)}>
                  <Text style={styles.suggestionText} numberOfLines={2}>📍 {item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* OSRM Route Estimation details */}
          {(calculating || routePreview) && (
            <View style={styles.previewCard}>
              <Text style={styles.previewTitle}>Route Calculations (OSM/OSRM)</Text>
              {calculating ? (
                <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 10 }} />
              ) : (
                <View style={styles.previewStats}>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Distance</Text>
                    <Text style={styles.statValue}>{routePreview.distance.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statLabel}>Est. Duration</Text>
                    <Text style={styles.statValue}>{Math.ceil(routePreview.duration)} mins</Text>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleStartTrip} disabled={loading || calculating}>
            {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Confirm & Start Tracking</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollWrapper: {
    padding: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  form: {
    marginTop: SPACING.lg,
    marginBottom: SPACING.xxl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  suggestions: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderTopWidth: 0,
    maxHeight: 150,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
  },
  suggestionItem: {
    padding: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.5,
  },
  suggestionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  previewCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginTop: SPACING.xl,
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  previewStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.md,
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginTop: 2,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateTripScreen;
