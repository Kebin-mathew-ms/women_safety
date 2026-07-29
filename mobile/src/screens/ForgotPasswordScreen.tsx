import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING } from '../theme';
import apiClient from '../services/api';

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResetRequest = async () => {
    setError(null);
    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.post('/auth/forgot-password', { email });
      setLoading(false);
      
      if (response.data.success) {
        const resetToken = response.data.data?.resetToken;
        Alert.alert(
          'Recovery Token Generated',
          `In production, an email is sent. For direct verification, copy this reset token:\n\n${resetToken}`,
          [
            {
              text: 'Reset Password',
              onPress: () => navigation.navigate('ResetPassword', { token: resetToken }),
            },
          ]
        );
      }
    } catch (err: any) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to submit reset request');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.wrapper}>
        <Text style={styles.title}>Password Recovery</Text>
        <Text style={styles.subtitle}>Enter your email address below. We will generate a recovery token to reset your password.</Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TextInput
          style={styles.input}
          placeholder="Enter email address"
          placeholderTextColor={COLORS.textMuted}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity style={styles.button} onPress={handleResetRequest} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.buttonText}>Generate Reset Token</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  wrapper: {
    padding: SPACING.xl,
    justifyContent: 'center',
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.xl,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
    marginBottom: SPACING.lg,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.emergencyLight,
    fontSize: 14,
    marginBottom: SPACING.md,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
