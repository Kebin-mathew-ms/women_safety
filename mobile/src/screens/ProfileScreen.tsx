import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, ScrollView, SafeAreaView, Image } from 'react-native';
import { COLORS, SPACING } from '../theme';
import apiClient from '../services/api';
import SecureStorageService from '../services/secureStore';
import { useNavigation } from '@react-navigation/native';

export const ProfileScreen: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const navigation = useNavigation<any>();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [country, setCountry] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/profile');
      if (response.data.success) {
        const u = response.data.data;
        setProfile(u);
        setFullName(u.fullName || '');
        setPhone(u.phone || '');
        setBloodGroup(u.bloodGroup || '');
        setAddress(u.address || '');
        setCity(u.city || '');
        setState(u.state || '');
        setCountry(u.country || '');
      }
    } catch (err: any) {
      console.warn('Failed to load profile details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      const response = await apiClient.put('/profile', {
        fullName,
        phone,
        bloodGroup,
        address,
        city,
        state,
        country,
      });

      if (response.data.success) {
        setProfile(response.data.data);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully!');
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdating(false);
    }
  };

  const handleMockImageUpload = async () => {
    setUpdating(true);
    try {
      // Simulate file upload by assembling a standard FormData object
      // with a mock image file buffer structure
      const formData = new FormData();
      formData.append('image', {
        uri: 'file:///mock-profile-image.png',
        name: 'profile.png',
        type: 'image/png',
      } as any);

      const response = await apiClient.post('/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setProfile((prev: any) => ({
          ...prev,
          profileImage: response.data.data.profileImage,
        }));
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err.response?.data?.message || 'Image upload failed. (Multer configuration is verified on backend).');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Delete Account',
      'Are you absolutely sure you want to delete your account? This is a soft delete and will immediately log you out.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiClient.delete('/profile');
              if (response.data.success) {
                Alert.alert('Account Deleted', 'Your profile has been deactivated.');
                await SecureStorageService.clearAll();
                onLogout();
              }
            } catch (err: any) {
              Alert.alert('Error', 'Deactivation failed.');
            }
          },
        },
      ]
    );
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
      <ScrollView contentContainerStyle={styles.scrollWrapper}>
        
        {/* Avatar Display */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={handleMockImageUpload}>
            <View style={styles.avatarWrapper}>
              {profile?.profileImage ? (
                <Image
                  source={{ uri: `http://10.0.2.2:5000${profile.profileImage}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <Text style={styles.avatarPlaceholder}>👤</Text>
              )}
            </View>
            <Text style={styles.changePicLabel}>Tap to upload photo</Text>
          </TouchableOpacity>
        </View>

        {/* Profile info fields */}
        <View style={styles.form}>
          <Text style={styles.label}>Email Address (Read-only)</Text>
          <TextInput
            style={[styles.input, styles.readOnlyInput]}
            value={profile?.email || ''}
            editable={false}
          />

          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={fullName}
            onChangeText={setFullName}
            editable={isEditing}
          />

          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={phone}
            onChangeText={setPhone}
            editable={isEditing}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>Blood Group</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={bloodGroup}
            onChangeText={setBloodGroup}
            editable={isEditing}
            placeholder="e.g. A+, O-"
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>City</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={city}
            onChangeText={setCity}
            editable={isEditing}
          />

          <Text style={styles.label}>Country</Text>
          <TextInput
            style={[styles.input, !isEditing && styles.readOnlyInput]}
            value={country}
            onChangeText={setCountry}
            editable={isEditing}
          />

          {isEditing ? (
            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.btn, styles.btnCancel]} onPress={() => setIsEditing(false)}>
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.btn, styles.btnSave]} onPress={handleUpdate} disabled={updating}>
                {updating ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.btnStack}>
              <TouchableOpacity style={[styles.btn, styles.btnEdit]} onPress={() => setIsEditing(true)}>
                <Text style={styles.btnText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary, marginTop: 10 }]} onPress={() => navigation.navigate('Wearable')}>
                <Text style={styles.btnText}>⌚ Pair Smartwatch Accessory</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.btn, { backgroundColor: COLORS.primary, marginTop: 10 }]} onPress={() => navigation.navigate('SOSHistory')}>
                <Text style={styles.btnText}>📯 View Emergency SOS History</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.btn, styles.btnDelete, { marginTop: 20 }]} onPress={handleDeleteAccount}>
                <Text style={styles.btnText}>Delete Account (Soft Delete)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollWrapper: {
    padding: SPACING.xl,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: COLORS.border,
    borderWidth: 2,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    fontSize: 50,
  },
  changePicLabel: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  form: {
    marginBottom: SPACING.xxl,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
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
  readOnlyInput: {
    opacity: 0.65,
    backgroundColor: 'rgba(31, 41, 55, 0.3)',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xxl,
  },
  btnStack: {
    marginTop: SPACING.xxl,
    gap: SPACING.md,
  },
  btn: {
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  btnEdit: {
    backgroundColor: COLORS.primary,
  },
  btnSave: {
    backgroundColor: COLORS.success,
    width: '48%',
  },
  btnCancel: {
    backgroundColor: COLORS.border,
    width: '48%',
  },
  btnDelete: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: COLORS.emergency,
    borderWidth: 1.5,
  },
});

export default ProfileScreen;
