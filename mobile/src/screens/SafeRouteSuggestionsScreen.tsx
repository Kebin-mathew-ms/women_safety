import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import GpsService from '../services/gps';

export const SafeRouteSuggestionsScreen: React.FC = () => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const loc = await GpsService.getCurrentLocation();
      const payload = {
        latitude: loc?.coords.latitude || 40.7128,
        longitude: loc?.coords.longitude || -74.0060,
      };

      const response = await apiClient.post('/ai/safe-place-recommendation', payload);
      if (response.data.success) {
        setRecommendations(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load safety recommendations:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const renderRouteCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.badge}>🛡️ {item.category.toUpperCase().replace('_', ' ')}</Text>
        <Text style={styles.score}>Safety: {item.lightingScore.toFixed(0)}/10 Pts</Text>
      </View>
      <Text style={styles.name}>{item.name}</Text>
      <Text style={styles.address}>{item.address}</Text>

      <View style={styles.metaRow}>
        <Text style={styles.meta}>Est. Time: 12 min</Text>
        <Text style={styles.meta}>Distance: 2.1 km</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Safest Route Suggestions</Text>
        <Text style={styles.sub}>Find routes mapped near police precincts, hospital networks, and verified lit path corridors.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={recommendations}
          keyExtractor={(item) => item.placeId}
          renderItem={renderRouteCard}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🗺️</Text>
              <Text style={styles.emptyText}>No nearby safety zone routes computed.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
  },
  score: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.success,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  address: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
  },
  meta: {
    fontSize: 11,
    color: COLORS.textMuted,
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

export default SafeRouteSuggestionsScreen;
