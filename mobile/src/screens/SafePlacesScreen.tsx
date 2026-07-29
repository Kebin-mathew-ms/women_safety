import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import GpsService from '../services/gps';
import { useNavigation } from '@react-navigation/native';

export const SafePlacesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  
  // Filters
  const [womenOnly, setWomenOnly] = useState(false);
  const [verified, setVerified] = useState(false);
  const [cctv, setCctv] = useState(false);

  const fetchSafePlaces = async () => {
    setLoading(true);
    try {
      const loc = await GpsService.getCurrentLocation();
      const params: any = {};
      
      if (loc) {
        params.latitude = loc.coords.latitude;
        params.longitude = loc.coords.longitude;
        params.radius = 10; // 10km radius
      }

      if (search) params.search = search;
      if (womenOnly) params.womenOnly = true;
      if (verified) params.verified = true;
      if (cctv) params.cctv = true;

      const response = await apiClient.get('/safe-places', { params });
      if (response.data.success) {
        setPlaces(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load safe places:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafePlaces();
  }, [search, womenOnly, verified, cctv]);

  const renderPlaceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('SafePlaceDetails', { placeId: item.placeId })}
    >
      <View style={styles.cardHeader}>
        <View style={styles.titleCol}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.category}>{item.category.toUpperCase().replace('_', ' ')}</Text>
        </View>
        <View style={styles.ratingBadge}>
          <Text style={styles.ratingText}>⭐ {item.averageRating.toFixed(1)}</Text>
        </View>
      </View>

      <Text style={styles.address} numberOfLines={1}>📍 {item.address}</Text>

      {/* Amenities badges */}
      <View style={styles.badgesRow}>
        {item.womenOnly && <Chip label="Women Only" color="#ec4899" />}
        {item.verified && <Chip label="Verified" color="#10b981" />}
        {item.cctv && <Chip label="CCTV" color="#6366f1" />}
        {item.securityGuard && <Chip label="Guards" color="#f59e0b" />}
      </View>

      {item.distance !== undefined && (
        <Text style={styles.distanceText}>Distance: {item.distance.toFixed(1)} km away</Text>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search hostels, PGs, hotels..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Filter Chips Toolbar */}
      <View style={styles.filterRow}>
        <FilterChip label="Verified" active={verified} onPress={() => setVerified(!verified)} />
        <FilterChip label="Women Only" active={womenOnly} onPress={() => setWomenOnly(!womenOnly)} />
        <FilterChip label="CCTV" active={cctv} onPress={() => setCctv(!cctv)} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.placeId}
          renderItem={renderPlaceItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚩</Text>
              <Text style={styles.emptyText}>No safe places matching filters found.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

const FilterChip: React.FC<{ label: string; active: boolean; onPress: () => void }> = ({ label, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterChip, active ? styles.filterChipActive : null]}
    onPress={onPress}
  >
    <Text style={[styles.filterChipText, active ? styles.filterChipTextActive : null]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    padding: SPACING.xl,
    paddingBottom: 0,
  },
  searchInput: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
  },
  filterChipActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  filterChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.primaryLight,
  },
  list: {
    padding: SPACING.xl,
    paddingBottom: 60,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCol: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  category: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  distanceText: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: SPACING.md,
  },
  empty: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
  },
});

export default SafePlacesScreen;
