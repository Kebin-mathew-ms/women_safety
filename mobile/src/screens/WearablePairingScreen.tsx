import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Alert, FlatList, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const WearablePairingScreen: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pairing, setPairing] = useState(false);

  // Form states
  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');

  const fetchDevices = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/wearable');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load wearables:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  const handlePairDevice = async () => {
    if (!deviceName.trim() || !macAddress.trim()) {
      Alert.alert('Validation Error', 'Please enter a device name and bluetooth MAC address.');
      return;
    }

    // Verify MAC Address regex
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) {
      Alert.alert('Validation Error', 'Please enter a valid MAC address (e.g. AB:CD:EF:12:34:56).');
      return;
    }

    setPairing(true);
    try {
      const response = await apiClient.post('/wearable', {
        deviceName,
        deviceType: 'WearOS',
        macAddress,
      });

      if (response.data.success) {
        Alert.alert('Success', 'Smartwatch paired successfully!');
        setDeviceName('');
        setMacAddress('');
        fetchDevices();
      }
    } catch (err: any) {
      Alert.alert('Pairing Error', err.response?.data?.message || 'Failed to pair device.');
    } finally {
      setPairing(false);
    }
  };

  const handleUnpair = (deviceId: string) => {
    Alert.alert(
      'Unpair Smartwatch',
      'Are you sure you want to disconnect and unpair this wearable accessory?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unpair',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/wearable/${deviceId}`);
              fetchDevices();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to unpair device.');
            }
          },
        },
      ]
    );
  };

  const renderDeviceItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.watchIcon}>⌚</Text>
        <View style={styles.textBlock}>
          <Text style={styles.name}>{item.deviceName}</Text>
          <Text style={styles.mac}>MAC: {item.macAddress}</Text>
        </View>
        <TouchableOpacity style={styles.unpairBtn} onPress={() => handleUnpair(item.deviceId)}>
          <Text style={styles.unpairText}>Unpair</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusRow}>
        <Text style={styles.statusLabel}>Connection: </Text>
        <Text style={[styles.statusVal, item.connected ? styles.greenText : styles.redText]}>
          {item.connected ? 'CONNECTED' : 'DISCONNECTED'}
        </Text>
        <Text style={[styles.statusLabel, { marginLeft: 20 }]}>Battery: </Text>
        <Text style={styles.statusVal}>{item.batteryLevel.toFixed(0)}%</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        {/* Intro */}
        <View style={styles.introHeader}>
          <Text style={styles.title}>Pair Wearable Device</Text>
          <Text style={styles.desc}>
            Connect your Wear OS smartwatch to trigger SOS alerts directly via double taps or fall detection events.
          </Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add Bluetooth Device</Text>
          
          <TextInput
            style={styles.input}
            value={deviceName}
            onChangeText={setDeviceName}
            placeholder="e.g. My Apple Watch, Fossil Gen 6"
            placeholderTextColor={COLORS.textMuted}
          />
          
          <TextInput
            style={[styles.input, { marginTop: 10 }]}
            value={macAddress}
            onChangeText={setMacAddress}
            placeholder="Bluetooth MAC (e.g. AB:CD:EF:12:34:56)"
            placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters"
          />

          <TouchableOpacity style={styles.button} onPress={handlePairDevice} disabled={pairing}>
            {pairing ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Pair Watch</Text>}
          </TouchableOpacity>
        </View>

        {/* Devices list */}
        <Text style={styles.listTitle}>Paired Devices</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.deviceId}
            renderItem={renderDeviceItem}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>⌚</Text>
                <Text style={styles.emptyText}>No wearable devices currently paired.</Text>
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
  introHeader: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 15,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 15,
  },
  listTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  watchIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  textBlock: {
    flex: 1,
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
  unpairBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  unpairText: {
    color: COLORS.emergencyLight,
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusRow: {
    flexDirection: 'row',
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  statusLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statusVal: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  greenText: {
    color: COLORS.success,
  },
  redText: {
    color: COLORS.emergencyLight,
  },
  empty: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    fontSize: 48,
    color: COLORS.textMuted,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

export default WearablePairingScreen;
