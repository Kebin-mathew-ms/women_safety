import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const WearableLogsScreen: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/wearable/status');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load wearables status:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSimulateTelemetry = async (macAddress: string, action: string) => {
    try {
      await apiClient.post('/wearable/telemetry', {
        macAddress,
        action,
        batteryLevel: Math.max(0, Math.floor(Math.random() * 20) + 70), // Random battery between 70% and 90%
      });
      fetchStatus(); // Reload logs
    } catch (err: any) {
      Alert.alert('Simulation Error', 'Failed to log telemetry simulation.');
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'fall_detected': return COLORS.emergencyLight;
      case 'double_tap': return COLORS.warning;
      case 'connect': return COLORS.success;
      default: return COLORS.textSecondary;
    }
  };

  const renderDeviceCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.icon}>⌚</Text>
        <View style={styles.textCol}>
          <Text style={styles.name}>{item.deviceName}</Text>
          <Text style={styles.mac}>MAC: {item.macAddress}</Text>
        </View>
        <View style={styles.statusCol}>
          <Text style={[styles.statusVal, item.connected ? styles.greenText : styles.redText]}>
            {item.connected ? 'CONNECTED' : 'DISCONNECTED'}
          </Text>
          <Text style={styles.battery}>Battery: {item.batteryLevel.toFixed(0)}%</Text>
        </View>
      </View>

      {/* Simulator buttons */}
      <View style={styles.simRow}>
        <Text style={styles.simLabel}>🧪 Sim Telemetry:</Text>
        <TouchableOpacity style={styles.simBtn} onPress={() => handleSimulateTelemetry(item.macAddress, 'double_tap')}>
          <Text style={styles.simBtnText}>Double Tap</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.simBtn, styles.simBtnRed]} onPress={() => handleSimulateTelemetry(item.macAddress, 'fall_detected')}>
          <Text style={styles.simBtnText}>Fall</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.simBtn} onPress={() => handleSimulateTelemetry(item.macAddress, 'disconnect')}>
          <Text style={styles.simBtnText}>Disconnect</Text>
        </TouchableOpacity>
      </View>

      {/* Diagnostic Logs History */}
      <Text style={styles.logTitle}>Recent Telemetry Logs</Text>
      {item.logs && item.logs.length === 0 ? (
        <Text style={styles.emptyLogs}>No telemetry events logged for this smartwatch.</Text>
      ) : (
        item.logs.map((log: any) => (
          <View key={log.logId} style={styles.logRow}>
            <Text style={[styles.logAction, { color: getActionColor(log.action) }]}>
              {log.action.toUpperCase().replace('_', ' ')}
            </Text>
            <Text style={styles.logBattery}>Battery: {log.batteryLevel}%</Text>
            <Text style={styles.logTime}>{new Date(log.triggeredAt).toLocaleTimeString()}</Text>
          </View>
        ))
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wearable Diagnostics</Text>
        <Text style={styles.sub}>Audit real-time heartbeat logs, pairing telemetries, and smart trigger events.</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={devices}
          keyExtractor={(item) => item.deviceId}
          renderItem={renderDeviceCard}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>⌚</Text>
              <Text style={styles.emptyText}>No paired wearable smartwatch accessories found.</Text>
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
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  textCol: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  mac: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statusCol: {
    alignItems: 'flex-end',
  },
  statusVal: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  greenText: {
    color: COLORS.success,
  },
  redText: {
    color: COLORS.emergencyLight,
  },
  battery: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  simRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopColor: COLORS.border,
    borderTopWidth: 0.5,
  },
  simLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  simBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  simBtnRed: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  simBtnText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  logTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptyLogs: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  logAction: {
    fontSize: 11,
    fontWeight: 'bold',
    width: '40%',
  },
  logBattery: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  logTime: {
    fontSize: 10,
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

export default WearableLogsScreen;
