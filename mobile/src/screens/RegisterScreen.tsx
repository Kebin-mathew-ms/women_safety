import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, SPACING } from '../theme';
import apiClient from '../services/api';

export const RegisterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const tempErrors: Record<string, string> = {};
    const emailRegex = /\S+@\S+\.\S+/;
    const phoneRegex = /^\+?[0-9\s-]{10,20}$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!fullName.trim()) tempErrors.fullName = 'Full name is required';
    if (!email.trim()) tempErrors.email = 'Email address is required';
    else if (!emailRegex.test(email)) tempErrors.email = 'Enter a valid email address';
    
    if (!phone.trim()) tempErrors.phone = 'Phone number is required';
    else if (!phoneRegex.test(phone)) tempErrors.phone = 'Enter a valid phone number (min 10 digits)';

    if (!password) tempErrors.password = 'Password is required';
    else if (!passwordRegex.test(password)) {
      tempErrors.password = 'Password must be at least 8 characters, include an uppercase, lowercase, and a number';
    }

    if (password !== confirmPassword) {
      tempErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const response = await apiClient.post('/auth/register', {
        fullName,
        email,
        phone,
        password,
      });

      setLoading(false);
      if (response.data.success) {
        Alert.alert('Success', 'Account registered successfully! Please log in.', [
          { text: 'OK', onPress: () => navigation.navigate('Login') },
        ]);
      }
    } catch (error: any) {
      setLoading(false);
      const serverMessage = error.response?.data?.message || 'Registration failed. Please try again.';
      let validationErrors = error.response?.data?.errors;
      
      // Handle potential legacy nested errors structure gracefully
      if (validationErrors && validationErrors.errors) {
        validationErrors = validationErrors.errors;
      }

      if (validationErrors && typeof validationErrors === 'object') {
        const mapped: Record<string, string> = {};
        Object.keys(validationErrors).forEach((key) => {
          const val = validationErrors[key];
          if (Array.isArray(val)) {
            mapped[key] = val.join(', ');
          } else if (typeof val === 'string') {
            mapped[key] = val;
          }
        });
        if (Object.keys(mapped).length > 0) {
          setErrors(mapped);
          return;
        }
      }
      
      Alert.alert('Registration Error', serverMessage);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <Text style={styles.headerTitle}>Create Your Safety Profile</Text>
        <Text style={styles.subtitle}>Enter details to initialize your travel protection suite</Text>

        <View style={styles.form}>
          {/* Full Name */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter full name"
            placeholderTextColor={COLORS.textMuted}
          />
          {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}

          {/* Email Address */}
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

          {/* Phone Number */}
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +15551234567"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="phone-pad"
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* Password */}
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter secure password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

          {/* Confirm Password */}
          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm secure password"
            placeholderTextColor={COLORS.textMuted}
            secureTextEntry
            autoCapitalize="none"
          />
          {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <Text style={styles.buttonText}>Register Account</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContainer: {
    padding: SPACING.xl,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    marginBottom: SPACING.xl,
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  input: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    color: COLORS.emergencyLight,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default RegisterScreen;
