import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Text } from 'react-native';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import ProfileScreen from '../screens/ProfileScreen';
import EmergencyContactsScreen from '../screens/EmergencyContactsScreen';
import SavedPlacesScreen from '../screens/SavedPlacesScreen';
import MapScreen from '../screens/MapScreen';
import CreateTripScreen from '../screens/CreateTripScreen';
import LiveTrackingScreen from '../screens/LiveTrackingScreen';
import SOSScreen from '../screens/SOSScreen';
import WearablePairingScreen from '../screens/WearablePairingScreen';
import SOSHistoryScreen from '../screens/SOSHistoryScreen';
import SafePlacesScreen from '../screens/SafePlacesScreen';
import SafePlaceDetailsScreen from '../screens/SafePlaceDetailsScreen';
import CrimeReportScreen from '../screens/CrimeReportScreen';
import CommunityFeedScreen from '../screens/CommunityFeedScreen';
import CreatePostScreen from '../screens/CreatePostScreen';
import PostDetailsScreen from '../screens/PostDetailsScreen';
import SavedPostsScreen from '../screens/SavedPostsScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import NotificationCenterScreen from '../screens/NotificationCenterScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import VoiceAssistantScreen from '../screens/VoiceAssistantScreen';
import WearableLogsScreen from '../screens/WearableLogsScreen';
import AIAssistantScreen from '../screens/AIAssistantScreen';
import RouteSafetyAnalysisScreen from '../screens/RouteSafetyAnalysisScreen';
import AIHotelRecommendationScreen from '../screens/AIHotelRecommendationScreen';
import SafeRouteSuggestionsScreen from '../screens/SafeRouteSuggestionsScreen';
import ReviewSummaryScreen from '../screens/ReviewSummaryScreen';
import { COLORS } from '../theme';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

export type AppStackParamList = {
  MainTabs: undefined;
  CreateTrip: undefined;
  LiveTracking: { tripId: string; tripName: string; source: string; destination: string; srcLat: number; srcLon: number; destLat: number; destLon: number };
  Places: undefined;
  Wearable: undefined;
  SOSHistory: undefined;
  SafePlaces: undefined;
  SafePlaceDetails: { placeId: string };
  CrimeReport: undefined;
  CommunityFeed: undefined;
  CreatePost: undefined;
  PostDetails: { postId: string };
  SavedPosts: undefined;
  ChatList: undefined;
  Chat: { roomId: string; roomName: string };
  Notifications: undefined;
  NotificationSettings: undefined;
  VoiceAssistant: undefined;
  WearableLogs: undefined;
  AIAssistant: undefined;
  RouteSafetyAnalysis: { tripId: string };
  AIHotelRecommendation: undefined;
  SafeRouteSuggestions: undefined;
  ReviewSummary: { placeId: string; placeName: string };
};

// Auth Stack Navigation
export const AuthNavigator: React.FC<{ onLoginSuccess: () => void }> = ({ onLoginSuccess }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: 'bold' },
        headerTintColor: COLORS.primaryLight,
      }}
    >
      <Stack.Screen name="Login" options={{ headerShown: false }}>
        {(props) => <LoginScreen {...props} onLoginSuccess={onLoginSuccess} />}
      </Stack.Screen>
      <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Create Account' }} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recover Password' }} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} options={{ title: 'Reset Password' }} />
    </Stack.Navigator>
  );
};

// Bottom Tab bar for primary dashboard views
const MainTabNavigator: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: 'bold' },
        tabBarStyle: { backgroundColor: COLORS.cardBackground, borderTopColor: COLORS.border, borderTopWidth: 1, height: 60, paddingBottom: 6 },
        tabBarActiveTintColor: COLORS.primaryLight,
        tabBarInactiveTintColor: COLORS.textMuted,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        options={{ title: 'Safe Dashboard', tabBarLabel: 'Home', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🏠</Text> }}
      >
        {() => <HomeScreen onLogout={onLogout} />}
      </Tab.Screen>
      <Tab.Screen
        name="SOS"
        component={SOSScreen}
        options={{ title: 'SOS Panic', tabBarLabel: 'SOS', tabBarIcon: () => <Text style={{ color: COLORS.emergencyLight, fontSize: 22, fontWeight: 'bold' }}>🚨</Text> }}
      />
      <Tab.Screen
        name="Map"
        component={MapScreen}
        options={{ title: 'Safe Map', tabBarLabel: 'Map', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>🗺️</Text> }}
      />
      <Tab.Screen
        name="Contacts"
        component={EmergencyContactsScreen}
        options={{ title: 'Emergency Contacts', tabBarLabel: 'Contacts', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>📞</Text> }}
      />
      <Tab.Screen
        name="Profile"
        options={{ title: 'User Profile', tabBarLabel: 'Profile', tabBarIcon: ({ color }) => <Text style={{ color, fontSize: 20 }}>👤</Text> }}
      >
        {() => <ProfileScreen onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
};

// Main Stack Navigator
export const AppNavigator: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border },
        headerTitleStyle: { color: COLORS.textPrimary, fontWeight: 'bold' },
        headerTintColor: COLORS.primaryLight,
      }}
    >
      <Stack.Screen name="MainTabs" options={{ headerShown: false }}>
        {() => <MainTabNavigator onLogout={onLogout} />}
      </Stack.Screen>
      <Stack.Screen name="CreateTrip" component={CreateTripScreen} options={{ title: 'Plan Safe Journey' }} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} options={{ title: 'Live Trip Monitoring', headerShown: false }} />
      <Stack.Screen name="Places" component={SavedPlacesScreen} options={{ title: 'Saved Favourites' }} />
      <Stack.Screen name="Wearable" component={WearablePairingScreen} options={{ title: 'Wearable Smartwatch' }} />
      <Stack.Screen name="SOSHistory" component={SOSHistoryScreen} options={{ title: 'Emergency Logs' }} />
      <Stack.Screen name="SafePlaces" component={SafePlacesScreen} options={{ title: 'Nearby Safe Places' }} />
      <Stack.Screen name="SafePlaceDetails" component={SafePlaceDetailsScreen} options={{ title: 'Place Details' }} />
      <Stack.Screen name="CrimeReport" component={CrimeReportScreen} options={{ title: 'Report Safety Hazard' }} />
      <Stack.Screen name="CommunityFeed" component={CommunityFeedScreen} options={{ title: 'Community Feed' }} />
      <Stack.Screen name="CreatePost" component={CreatePostScreen} options={{ title: 'Create Post' }} />
      <Stack.Screen name="PostDetails" component={PostDetailsScreen} options={{ title: 'Post Conversation' }} />
      <Stack.Screen name="SavedPosts" component={SavedPostsScreen} options={{ title: 'Bookmarked Posts' }} />
      <Stack.Screen name="ChatList" component={ChatListScreen} options={{ title: 'Safety Chats' }} />
      <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat Messenger' }} />
      <Stack.Screen name="Notifications" component={NotificationCenterScreen} options={{ title: 'Notification Alerts' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Alert Preferences' }} />
      <Stack.Screen name="VoiceAssistant" component={VoiceAssistantScreen} options={{ title: 'Speech Assistant' }} />
      <Stack.Screen name="WearableLogs" component={WearableLogsScreen} options={{ title: 'Wearable Logs' }} />
      {/* Prompt 8 - AI Module Screens */}
      <Stack.Screen name="AIAssistant" component={AIAssistantScreen} options={{ title: 'AI Safety Companion' }} />
      <Stack.Screen name="RouteSafetyAnalysis" component={RouteSafetyAnalysisScreen} options={{ title: 'Route Risk Analysis' }} />
      <Stack.Screen name="AIHotelRecommendation" component={AIHotelRecommendationScreen} options={{ title: 'Safe Hotels' }} />
      <Stack.Screen name="SafeRouteSuggestions" component={SafeRouteSuggestionsScreen} options={{ title: 'Safest Routes' }} />
      <Stack.Screen name="ReviewSummary" component={ReviewSummaryScreen} options={{ title: 'AI Review Summary' }} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
