// IMPORTANT: react-native-gesture-handler MUST be the very first import
import 'react-native-gesture-handler';

import React, { useState, useEffect } from 'react';
import { StyleSheet, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import { AuthNavigator, AppNavigator } from './src/navigation';
import SecureStorageService from './src/services/secureStore';
import { COLORS } from './src/theme';

export default function App() {
  const [isAppLoading, setIsAppLoading] = useState(true);
  const [isOnboardingDone, setIsOnboardingDone] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // 1. Core boot checking sequence
    const checkState = async () => {
      try {
        const token = await SecureStorageService.getAuthToken();
        const onboardingState = await SecureStorageService.getItem('onboarding_completed');

        if (token) {
          setIsAuthenticated(true);
        }

        if (onboardingState === 'true') {
          setIsOnboardingDone(true);
        }
      } catch (err) {
        console.warn('Boot check error in App.tsx:', err);
      }
    };
    checkState();
  }, []);

  const handleSplashReady = () => {
    setIsAppLoading(false);
  };

  const handleOnboardingComplete = async () => {
    await SecureStorageService.setItem('onboarding_completed', 'true');
    setIsOnboardingDone(true);
  };

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // 2. Render App Screens based on session states
  const renderScreen = () => {
    if (isAppLoading) {
      return <SplashScreen onReady={handleSplashReady} />;
    }

    if (!isOnboardingDone) {
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    }

    if (!isAuthenticated) {
      return (
        <NavigationContainer>
          <AuthNavigator onLoginSuccess={handleLoginSuccess} />
        </NavigationContainer>
      );
    }

    return (
      <NavigationContainer>
        <AppNavigator onLogout={handleLogout} />
      </NavigationContainer>
    );
  };

  return (
    <GestureHandlerRootView style={styles.rootContainer}>
      <SafeAreaProvider style={styles.rootContainer}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
        {renderScreen()}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
