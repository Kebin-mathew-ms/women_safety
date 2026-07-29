import React, { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../theme';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: 'AI-Powered Safe Routes',
      description: 'Receive real-time walking and driving routes evaluated continuously for lighting, history, and active safety alerts.',
      icon: '🗺️',
    },
    {
      title: 'One-Tap SOS Dispatch',
      description: 'Trigger instant emergency alarms. Broadcast your location, stream live ambient audio, and contact emergency dispatches.',
      icon: '🚨',
    },
    {
      title: '24/7 Live Guardian Guard',
      description: 'Stay securely linked with specialized local operators and designated personal contacts throughout your journey.',
      icon: '🛡️',
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <SafeAreaView style={styles.container}>
      <BoxHeader handleSkip={handleSkip} showSkip={currentSlide < slides.length - 1} />
      
      <View style={styles.slideContainer}>
        <Text style={styles.slideIcon}>{slides[currentSlide].icon}</Text>
        <Text style={styles.slideTitle}>{slides[currentSlide].title}</Text>
        <Text style={styles.slideDescription}>{slides[currentSlide].description}</Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.indicatorContainer}>
          {slides.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.indicator,
                currentSlide === idx ? styles.indicatorActive : null,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity style={styles.button} onPress={handleNext}>
          <Text style={styles.buttonText}>
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

interface BoxHeaderProps {
  handleSkip: () => void;
  showSkip: boolean;
}

const BoxHeader: React.FC<BoxHeaderProps> = ({ handleSkip, showSkip }) => (
  <View style={styles.header}>
    <Text style={styles.appName}>🛡️ Safe Travel</Text>
    {showSkip ? (
      <TouchableOpacity onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
    ) : (
      <View style={{ width: 30 }} />
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
  },
  appName: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    fontSize: 16,
  },
  skipText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: SPACING.xxl,
  },
  slideIcon: {
    fontSize: 100,
    marginBottom: SPACING.xxl,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  slideDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xxl,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: SPACING.xl,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    marginHorizontal: 4,
  },
  indicatorActive: {
    width: 24,
    backgroundColor: COLORS.primary,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OnboardingScreen;
