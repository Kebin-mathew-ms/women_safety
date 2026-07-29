import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Switch, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const NotificationSettingsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Preference states
  const [tripAlerts, setTripAlerts] = useState(true);
  const [sosAlerts, setSosAlerts] = useState(true);
  const [weatherAlerts, setWeatherAlerts] = useState(true);
  const [nearbySafetyAlerts, setNearbySafetyAlerts] = useState(true);
  const [nightTravelWarnings, setNightTravelWarnings] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);

  const fetchPreferences = async () => {
    try {
      const response = await apiClient.get('/notifications/preferences');
      if (response.data.success) {
        const data = response.data.data;
        setTripAlerts(data.tripAlerts);
        setSosAlerts(data.sosAlerts);
        setWeatherAlerts(data.weatherAlerts);
        setNearbySafetyAlerts(data.nearbySafetyAlerts);
        setNightTravelWarnings(data.nightTravelWarnings);
        setSoundEnabled(data.soundEnabled);
        setVibrationEnabled(data.vibrationEnabled);
      }
    } catch (err: any) {
      console.warn('Failed to load preferences:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiClient.put('/notifications/preferences', {
        tripAlerts,
        sosAlerts,
        weatherAlerts,
        nearbySafetyAlerts,
        nightTravelWarnings,
        soundEnabled,
        vibrationEnabled,
      });
      Alert.alert('Saved', 'Notification configurations updated successfully.');
    } catch (err: any) {
      Alert.alert('Error', 'Failed to update preferences.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Safety Alert Preferences</Text>
        <Text style={styles.sub}>Configure which safety triggers and alerts push notification alerts to your phone.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Journey Alerts</Text>
          <SwitchRow label="Active Trip Tracking Warnings" val={tripAlerts} setVal={setTripAlerts} desc="Notify when trip deviates from plan or stops unexpectedly." />
          <SwitchRow label="SOS Alert Notifications" val={sosAlerts} setVal={setSosAlerts} desc="Push alarms when SOS emergency beacon triggers." />
          <SwitchRow label="Night Travel Warnings" val={nightTravelWarnings} setVal={setNightTravelWarnings} desc="Push cautions when traveling late between 10 PM - 5 AM." />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Environmental Alerts</Text>
          <SwitchRow label="Weather Alerts & Warnings" val={weatherAlerts} setVal={setWeatherAlerts} desc="Notify during severe storms, heavy rains or fog." />
          <SwitchRow label="Unsafe Area Proximity Alerts" val={nearbySafetyAlerts} setVal={setNearbySafetyAlerts} desc="Notify when walking near community-reported hazard zones." />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Tone Preferences</Text>
          <SwitchRow label="Audible Sounds Alerts" val={soundEnabled} setVal={setSoundEnabled} />
          <SwitchRow label="Haptic Vibration Alerts" val={vibrationEnabled} setVal={setVibrationEnabled} />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.saveText}>Save Preferences</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const SwitchRow: React.FC<{ label: string; val: boolean; setVal: (v: boolean) => void; desc?: string }> = ({ label, val, setVal, desc }) => (
  <View style={styles.switchRow}>
    <View style={styles.textCol}>
      <Text style={styles.label}>{label}</Text>
      {desc && <Text style={styles.desc}>{desc}</Text>}
    </View>
    <Switch value={val} onValueChange={setVal} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
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
  section: {
    marginTop: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginBottom: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  desc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xxl,
    ...SHADOWS.small,
  },
  saveText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default NotificationSettingsScreen;
