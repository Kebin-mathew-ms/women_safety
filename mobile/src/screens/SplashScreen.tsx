import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme';

interface SplashScreenProps {
  onReady: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onReady }) => {
  useEffect(() => {
    // Simulate loading essential app assets/configuration
    const timer = setTimeout(() => {
      onReady();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onReady]);

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logoIcon}>🛡️</Text>
        <Text style={styles.title}>Safe Travel</Text>
        <Text style={styles.subtitle}>Your AI Safe Guardian</Text>
      </View>
      <ActivityIndicator size="large" color={COLORS.primaryLight} style={styles.loader} />
      <Text style={styles.footer}>Production Quality Foundation</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 150,
  },
  logoIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  loader: {
    marginBottom: 50,
  },
  footer: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default SplashScreen;
