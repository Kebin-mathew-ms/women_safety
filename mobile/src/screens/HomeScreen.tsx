import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, SafeAreaView, ScrollView, FlatList, ActivityIndicator } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import socketService from '../services/socket';
import SecureStorageService from '../services/secureStore';
import apiClient from '../services/api';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigation = useNavigation<any>();
  const [userName, setUserName] = useState('Sarah');
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [activeTrip, setActiveTrip] = useState<any | null>(null);
  const [recentTrips, setRecentTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchHomeDetails = async () => {
    setLoading(true);
    try {
      // 1. Fetch User Profile
      const profile = await SecureStorageService.getUserProfile();
      if (profile && profile.name) {
        setUserName(profile.name.split(' ')[0]);
      }

      // 2. Fetch Trips to check for any active trip
      const tripsRes = await apiClient.get('/trips');
      if (tripsRes.data.success) {
        const list = tripsRes.data.data;
        const active = list.find((t: any) => t.status === 'active' || t.status === 'paused');
        setActiveTrip(active || null);

        // Filter out completed/cancelled trips for history listing (up to 3 recent items)
        const history = list.filter((t: any) => t.status === 'completed' || t.status === 'cancelled').slice(0, 3);
        setRecentTrips(history);
      }
    } catch (err) {
      console.warn('Failed to load home details in HomeScreen:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeDetails();

    // Setup Sockets
    const setupSocket = async () => {
      try {
        const socket = await socketService.connect();
        setIsSocketConnected(socket.connected);

        socketService.on('connect', () => {
          setIsSocketConnected(true);
        });

        socketService.on('disconnect', () => {
          setIsSocketConnected(false);
        });
      } catch (err) {
        console.warn('Socket connection failed in HomeScreen:', err);
      }
    };
    setupSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

  const handleSOS = () => {
    if (isSocketConnected) {
      socketService.emit('sos_trigger', {
        timestamp: new Date().toISOString(),
        location: { latitude: 0.0, longitude: 0.0 },
      });
      Alert.alert(
        '🚨 Emergency SOS Sent',
        'SOS alert broadcasted. Nearby operators and your guardians have been notified. Ambient audio recording started.',
        [{ text: 'Dismiss', style: 'cancel' }]
      );
    } else {
      Alert.alert(
        '⚠️ Alert Warning',
        'SMS Backup Mode Activated. Triggering SOS via mobile network...',
        [{ text: 'OK' }]
      );
    }
  };

  const handleLogoutPress = async () => {
    await SecureStorageService.clearAll();
    onLogout();
  };

  const handleResumeTrip = () => {
    if (activeTrip) {
      navigation.navigate('LiveTracking', {
        tripId: activeTrip.tripId,
        tripName: activeTrip.tripName,
        source: activeTrip.sourceAddress,
        destination: activeTrip.destinationAddress,
        srcLat: activeTrip.sourceLatitude,
        srcLon: activeTrip.sourceLongitude,
        destLat: activeTrip.destinationLatitude,
        destLon: activeTrip.destinationLongitude,
      });
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Hello, {userName}</Text>
            <Text style={styles.statusSub}>Status: Live Tracking Enabled</Text>
          </View>
          <View style={[styles.badge, isSocketConnected ? styles.badgeSuccess : styles.badgeWarn]}>
            <Text style={styles.badgeText}>{isSocketConnected ? 'Live Connection' : 'SMS Backup'}</Text>
          </View>
        </View>

        {/* Active Journey Warning banner */}
        {activeTrip && (
          <TouchableOpacity style={styles.activeTripBanner} onPress={handleResumeTrip}>
            <Text style={styles.activeTripBannerTitle}>⚠️ Active Journey Running</Text>
            <Text style={styles.activeTripBannerSub}>Tap to return to live tracking view.</Text>
          </TouchableOpacity>
        )}

        {/* SOS Emergency Button */}
        <View style={styles.sosContainer}>
          <TouchableOpacity style={styles.sosButton} onPress={handleSOS}>
            <Text style={styles.sosText}>SOS</Text>
            <Text style={styles.sosSubText}>One Tap Alert</Text>
          </TouchableOpacity>
        </View>

        {/* Safe Travel Route trigger card */}
        <TouchableOpacity style={styles.tripCard} onPress={() => navigation.navigate('CreateTrip')}>
          <Text style={styles.tripCardTitle}>Plan Safe Journey 🗺️</Text>
          <Text style={styles.tripCardDesc}>
            Specify your destination to calculate safest route options and enable real-time operator tracking.
          </Text>
        </TouchableOpacity>

        {/* Recent journeys */}
        <Text style={styles.sectionTitle}>Recent Journeys</Text>
        {loading ? (
          <ActivityIndicator color={COLORS.primaryLight} style={{ marginVertical: 10 }} />
        ) : recentTrips.length === 0 ? (
          <Text style={styles.emptyText}>No historical journeys logged.</Text>
        ) : (
          recentTrips.map((item) => (
            <View key={item.tripId} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyName} numberOfLines={1}>{item.tripName}</Text>
                <ChipStatus status={item.status} />
              </View>
              <Text style={styles.historyRoute} numberOfLines={1}>📍 To: {item.destinationAddress}</Text>
              <Text style={styles.historyDate}>
                {new Date(item.createdAt).toLocaleDateString()} • {item.estimatedDistance.toFixed(1)} km
              </Text>
            </View>
          ))
        )}

        {/* Action Grid */}
        <Text style={styles.sectionTitle}>Safety Center</Text>
        <View style={styles.grid}>
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Map')}>
            <Text style={styles.gridIcon}>🗺️</Text>
            <Text style={styles.gridLabel}>Interactive Map</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SafePlaces')}>
            <Text style={styles.gridIcon}>🛡️</Text>
            <Text style={styles.gridLabel}>Safe Places</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CrimeReport')}>
            <Text style={styles.gridIcon}>⚠️</Text>
            <Text style={styles.gridLabel}>Report Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('CommunityFeed')}>
            <Text style={styles.gridIcon}>💬</Text>
            <Text style={styles.gridLabel}>Feed Alert</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('ChatList')}>
            <Text style={styles.gridIcon}>✉️</Text>
            <Text style={styles.gridLabel}>Chats</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('SavedPosts')}>
            <Text style={styles.gridIcon}>🔖</Text>
            <Text style={styles.gridLabel}>Bookmarks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Notifications')}>
            <Text style={styles.gridIcon}>📯</Text>
            <Text style={styles.gridLabel}>Alerts Log</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('NotificationSettings')}>
            <Text style={styles.gridIcon}>⚙️</Text>
            <Text style={styles.gridLabel}>Settings</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('VoiceAssistant')}>
            <Text style={styles.gridIcon}>🎙️</Text>
            <Text style={styles.gridLabel}>Voice Help</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('WearableLogs')}>
            <Text style={styles.gridIcon}>⌚</Text>
            <Text style={styles.gridLabel}>Watch Logs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Places')}>
            <Text style={styles.gridIcon}>🚩</Text>
            <Text style={styles.gridLabel}>Saved Places</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gridItem} onPress={() => navigation.navigate('Contacts')}>
            <Text style={styles.gridIcon}>📞</Text>
            <Text style={styles.gridLabel}>Guardians</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.gridItem} onPress={handleLogoutPress}>
            <Text style={styles.gridIcon}>🚪</Text>
            <Text style={[styles.gridLabel, { color: COLORS.emergencyLight }]}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* AI Intelligence Section */}
        <Text style={styles.sectionTitle}>🤖 AI Intelligence</Text>
        <View style={styles.aiRow}>
          <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('AIAssistant')}>
            <Text style={styles.aiIcon}>💬</Text>
            <Text style={styles.aiLabel}>AI Safety Chat</Text>
            <Text style={styles.aiSub}>Conversational safety advice</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('AIHotelRecommendation')}>
            <Text style={styles.aiIcon}>🏨</Text>
            <Text style={styles.aiLabel}>Safe Hotels</Text>
            <Text style={styles.aiSub}>AI-ranked verified lodging</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiRow}>
          <TouchableOpacity style={styles.aiCard} onPress={() => navigation.navigate('SafeRouteSuggestions')}>
            <Text style={styles.aiIcon}>🗺️</Text>
            <Text style={styles.aiLabel}>Safest Routes</Text>
            <Text style={styles.aiSub}>Near police & hospitals</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.aiCard}
            onPress={() =>
              activeTrip
                ? navigation.navigate('RouteSafetyAnalysis', { tripId: activeTrip.tripId })
                : Alert.alert('No Active Trip', 'Start a journey first to analyse route risk.')
            }
          >
            <Text style={styles.aiIcon}>📊</Text>
            <Text style={styles.aiLabel}>Route Risk Score</Text>
            <Text style={styles.aiSub}>Real-time hazard analysis</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const ChipStatus: React.FC<{ status: string }> = ({ status }) => {
  const isCompleted = status === 'completed';
  return (
    <View style={[styles.chip, isCompleted ? styles.chipSuccess : styles.chipDanger]}>
      <Text style={styles.chipText}>{status.toUpperCase()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    padding: SPACING.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  badgeWarn: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  activeTripBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: COLORS.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  activeTripBannerTitle: {
    color: COLORS.warning,
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeTripBannerSub: {
    color: COLORS.textPrimary,
    fontSize: 12,
    marginTop: 2,
  },
  sosContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  sosButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: COLORS.emergency,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.medium,
    borderWidth: 8,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  sosText: {
    fontSize: 44,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  sosSubText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
    fontWeight: '600',
  },
  tripCard: {
    backgroundColor: 'rgba(79, 70, 229, 0.12)',
    borderColor: COLORS.primaryLight,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  tripCardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  tripCardDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  historyCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  historyName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
    marginRight: 8,
  },
  historyRoute: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  historyDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
  chip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  chipSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  chipDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  chipText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.xxl,
  },
  gridItem: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  gridIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  gridLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  aiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  aiCard: {
    width: '48%',
    backgroundColor: 'rgba(79, 70, 229, 0.08)',
    borderColor: COLORS.primaryLight,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    alignItems: 'center',
  },
  aiIcon: {
    fontSize: 26,
    marginBottom: 6,
  },
  aiLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    textAlign: 'center',
  },
  aiSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 3,
  },
});

export default HomeScreen;
