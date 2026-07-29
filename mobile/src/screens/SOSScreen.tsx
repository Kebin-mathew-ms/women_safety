import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, Animated, Easing, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import GpsService from '../services/gps';
import socketService from '../services/socket';

export const SOSScreen: React.FC = () => {
  const [activeAlert, setActiveAlert] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Countdown states
  const [countdown, setCountdown] = useState<number | null>(null);
  const [sosCategory, setSosCategory] = useState<string>('general');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech activation simulation
  const [speechActive, setSpeechActive] = useState(false);

  // Pulse animation reference
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse loop
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.25,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Fetch active SOS status on mount
    const checkActiveSOS = async () => {
      try {
        const res = await apiClient.get('/sos/history');
        if (res.data.success) {
          const active = res.data.data.find((item: any) => item.status === 'active');
          if (active) setActiveAlert(active);
        }
      } catch (err) {
        console.debug('Failed to get SOS status on mount:', err);
      }
    };
    checkActiveSOS();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStartSOSCountdown = (category: string = 'general') => {
    setSosCategory(category);
    setCountdown(5);
    
    if (timerRef.current) clearInterval(timerRef.current);
    
    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          triggerRealSOS(category);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleCancelCountdown = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setCountdown(null);
    Alert.alert('Accident Averted', 'SOS trigger countdown cancelled.');
  };

  const triggerRealSOS = async (category: string) => {
    setLoading(true);
    try {
      const loc = await GpsService.getCurrentLocation();
      const lat = loc ? loc.coords.latitude : 40.7128;
      const lon = loc ? loc.coords.longitude : -74.0060;

      const response = await apiClient.post('/sos', {
        latitude: lat,
        longitude: lon,
        address: 'Current Tracker Pin',
        emergencyType: category,
        triggeredBy: 'user',
      });

      if (response.data.success) {
        setActiveAlert(response.data.data);
        
        // Start 3s background updates loop using sockets
        socketService.emit('trip-start', { tripId: response.data.data.sosId });
      }
    } catch (err: any) {
      Alert.alert('SOS Error', err.response?.data?.message || 'Failed to trigger SOS alert. Ensure you have registered emergency contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateSOS = () => {
    Alert.prompt(
      'Deactivate SOS',
      'Please state the reason for deactivating this alarm to notify your guardians:',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm Resolution',
          onPress: async (reason) => {
            if (!reason || reason.trim() === '') {
              Alert.alert('Error', 'Deactivation reason is required.');
              return;
            }
            setLoading(true);
            try {
              await apiClient.post('/sos/cancel', {
                sosId: activeAlert.sosId,
                cancelledReason: reason,
              });
              setActiveAlert(null);
              Alert.alert('SOS Deactivated', 'Your guardians have been notified that you are safe.');
            } catch (err) {
              Alert.alert('Error', 'Failed to cancel emergency session.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Simulate Speech Activation Toggle
  const toggleSpeechRecognition = () => {
    const nextState = !speechActive;
    setSpeechActive(nextState);
    if (nextState) {
      Alert.alert(
        'Voice SOS Activated',
        'Background microphone listening for trigger words ("Help Me", "Emergency", "SOS", "I Need Help") enabled. Simulated trigger active.',
        [
          { text: 'Close' },
          {
            text: '⚡ Simulate Trigger Word',
            onPress: () => {
              Alert.alert('🎙️ Speech Match', 'Recognized "Help Me"! Triggering SOS in 5 seconds...');
              handleStartSOSCountdown('voice_alert');
            },
          },
        ]
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        
        {/* Active Alert banner */}
        {activeAlert ? (
          <View style={styles.emergencyBanner}>
            <Text style={styles.bannerText}>🚨 EMERGENCY LIVE BROADCAST ACTIVE</Text>
            <Text style={styles.bannerSub}>GPS Tracking interval: 3 seconds. Sockets broadcasting location details.</Text>
          </View>
        ) : (
          <View style={styles.safeHeader}>
            <Text style={styles.safeTitle}>Emergency Safety Center</Text>
            <Text style={styles.safeSub}>One-tap broadcast to all your guardians immediately.</Text>
          </View>
        )}

        {/* SOS Button display */}
        <View style={styles.buttonContainer}>
          {countdown !== null ? (
            <TouchableOpacity style={[styles.sosButton, styles.sosButtonCountdown]} onPress={handleCancelCountdown}>
              <Text style={styles.countdownValue}>{countdown}</Text>
              <Text style={styles.countdownCancelLabel}>CANCEL</Text>
            </TouchableOpacity>
          ) : activeAlert ? (
            <TouchableOpacity style={[styles.sosButton, styles.sosButtonActive]} onPress={handleDeactivateSOS}>
              <Text style={styles.sosButtonText}>SAFE</Text>
              <Text style={styles.sosButtonSub}>Deactivate SOS</Text>
            </TouchableOpacity>
          ) : (
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity style={styles.sosButton} onPress={() => handleStartSOSCountdown('general')}>
                {loading ? <ActivityIndicator size="large" color={COLORS.white} /> : (
                  <>
                    <Text style={styles.sosButtonText}>SOS</Text>
                    <Text style={styles.sosButtonSub}>Tap to Alert</Text>
                  </>
                )}
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* SOS Categories buttons */}
        {!activeAlert && countdown === null && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>Select Alarm Category</Text>
            <View style={styles.categoryGrid}>
              <TouchableOpacity style={styles.catBtn} onPress={() => handleStartSOSCountdown('harassment')}>
                <Text style={styles.catIcon}>🗣️</Text>
                <Text style={styles.catLabel}>Harassment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.catBtn} onPress={() => handleStartSOSCountdown('threat')}>
                <Text style={styles.catIcon}>🔪</Text>
                <Text style={styles.catLabel}>Threat/Stalking</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.catBtn} onPress={() => handleStartSOSCountdown('medical')}>
                <Text style={styles.catIcon}>🚑</Text>
                <Text style={styles.catLabel}>Medical Alert</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.catBtn} onPress={() => handleStartSOSCountdown('accident')}>
                <Text style={styles.catIcon}>💥</Text>
                <Text style={styles.catLabel}>Accident</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Voice Trigger Settings */}
        {!activeAlert && countdown === null && (
          <View style={styles.voiceSection}>
            <View style={styles.voiceRow}>
              <View style={styles.textBlock}>
                <Text style={styles.voiceTitle}>🎙️ Voice Activated SOS</Text>
                <Text style={styles.voiceSub}>Triggers alert immediately when trigger words are spoken.</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggleBtn, speechActive ? styles.toggleBtnActive : null]}
                onPress={toggleSpeechRecognition}
              >
                <Text style={styles.toggleText}>{speechActive ? 'ENABLED' : 'DISABLED'}</Text>
              </TouchableOpacity>
            </View>
          </View>
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
    justifyContent: 'space-between',
  },
  safeHeader: {
    alignItems: 'center',
    marginTop: SPACING.lg,
  },
  safeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  safeSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
  },
  emergencyBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.emergency,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
  },
  bannerText: {
    color: COLORS.emergencyLight,
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  bannerSub: {
    color: COLORS.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: COLORS.emergency,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 8,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  sosButtonCountdown: {
    backgroundColor: COLORS.warning,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  sosButtonActive: {
    backgroundColor: COLORS.success,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  sosButtonText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  sosButtonSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    fontWeight: 'bold',
  },
  countdownValue: {
    fontSize: 60,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  countdownCancelLabel: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: 'bold',
    marginTop: 2,
  },
  categoriesSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  catBtn: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  catIcon: {
    fontSize: 20,
    marginRight: 10,
  },
  catLabel: {
    color: COLORS.textSecondary,
    fontWeight: 'bold',
    fontSize: 13,
  },
  voiceSection: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  voiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textBlock: {
    flex: 1,
    marginRight: 10,
  },
  voiceTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  voiceSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  toggleBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  toggleBtnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  toggleText: {
    color: COLORS.textSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default SOSScreen;
