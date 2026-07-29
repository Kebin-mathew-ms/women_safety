import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, Alert, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import GpsService from '../services/gps';
import { useNavigation } from '@react-navigation/native';

export const AIHotelRecommendationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [hotels, setHotels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHotels = async () => {
    setLoading(true);
    try {
      const loc = await GpsService.getCurrentLocation();
      const payload = {
        latitude: loc?.coords.latitude || 40.7128,
        longitude: loc?.coords.longitude || -74.0060,
      };

      const response = await apiClient.post('/ai/hotel-recommendation', payload);
      if (response.data.success) {
        setHotels(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load hotel recommendations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHotels();
  }, []);

  const renderHotelItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleCol}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.address}>{item.address}</Text>
        </View>
        <View style={styles.scoreBadge}>
          <Text style={styles.scoreVal}>{item.safetyScore.toFixed(0)}</Text>
          <Text style={styles.scoreSub}>Safety Pts</Text>
        </View>
      </View>

      {/* Badges */}
      <View style={styles.badgeRow}>
        {item.womenOnly && <Chip label="👩 Women Only" color="#6366f1" />}
        {item.verified && <Chip label="✅ Verified" color="#10b981" />}
        {item.securityGuard && <Chip label="🛡️ Guard" color="#f59e0b" />}
      </View>

      <Text style={styles.explanation}>{item.explanation}</Text>

      <TouchableOpacity
        style={styles.reviewBtn}
        onPress={() => navigation.navigate('ReviewSummary', { placeId: item.placeId, placeName: item.name })}
      >
        <Text style={styles.reviewBtnText}>Read AI reviews summary</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.introHeader}>
        <Text style={styles.title}>AI Recommended Lodging</Text>
        <Text style={styles.sub}>Safety rankings based on verification stars, CCTV surveillance, and community audits.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={hotels}
          keyExtractor={(item) => item.placeId}
          renderItem={renderHotelItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏨</Text>
              <Text style={styles.emptyText}>No verified hotels nearby.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[styles.chip, { backgroundColor: color + '15', borderColor: color }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  introHeader: {
    padding: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
  },
  list: {
    padding: SPACING.xl,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleCol: {
    flex: 1,
    marginRight: 10,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  scoreBadge: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    minWidth: 54,
  },
  scoreVal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  scoreSub: {
    fontSize: 8,
    color: COLORS.textMuted,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: SPACING.md,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  explanation: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  reviewBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 6,
    borderColor: COLORS.border,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  reviewBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
  },
});

export default AIHotelRecommendationScreen;
