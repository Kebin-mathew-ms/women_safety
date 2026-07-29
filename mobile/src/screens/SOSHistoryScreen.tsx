import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const SOSHistoryScreen: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSOSHistory = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/sos/history');
      if (response.data.success) {
        setHistory(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load SOS history:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOSHistory();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return COLORS.emergencyLight;
      case 'resolved': return COLORS.success;
      case 'cancelled': return COLORS.textMuted;
      default: return COLORS.textSecondary;
    }
  };

  const renderHistoryItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.type}>🚨 Alert Type: {item.emergencyType.toUpperCase()}</Text>
        <Text style={[styles.status, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </View>

      <Text style={styles.detail}>Triggered by: {item.triggeredBy.toUpperCase()}</Text>
      <Text style={styles.date}>Date: {new Date(item.createdAt).toLocaleString()}</Text>

      {item.status === 'cancelled' && item.cancelledReason && (
        <View style={styles.resolutionBox}>
          <Text style={styles.resLabel}>Cancelled Reason:</Text>
          <Text style={styles.resVal}>"{item.cancelledReason}"</Text>
        </View>
      )}

      {item.status === 'resolved' && item.resolvedBy && (
        <View style={styles.resolutionBox}>
          <Text style={styles.resLabel}>Resolved by:</Text>
          <Text style={styles.resVal}>{item.resolvedBy}</Text>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <Text style={styles.title}>SOS Emergency Logs</Text>
        
        {loading ? (
          <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={history}
            keyExtractor={(item) => item.sosId}
            renderItem={renderHistoryItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📯</Text>
                <Text style={styles.emptyText}>No emergency logs found for your account.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  inner: {
    flex: 1,
    padding: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  list: {
    paddingBottom: 40,
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
    marginBottom: 6,
  },
  type: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  status: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  detail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  date: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  resolutionBox: {
    backgroundColor: COLORS.background,
    borderRadius: 6,
    padding: 8,
    marginTop: SPACING.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primaryLight,
  },
  resLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  resVal: {
    fontSize: 12,
    color: COLORS.textPrimary,
    marginTop: 2,
    fontStyle: 'italic',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

export default SOSHistoryScreen;
