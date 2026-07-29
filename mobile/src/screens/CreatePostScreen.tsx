import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, Switch, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import GpsService from '../services/gps';
import MapService from '../services/map';
import { useNavigation } from '@react-navigation/native';

export const CreatePostScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [anonymous, setAnonymous] = useState(false);
  
  // Location
  const [attachLocation, setAttachLocation] = useState(false);
  const [locationData, setLocationData] = useState<any | null>(null);
  const [loadingLoc, setLoadingLoc] = useState(false);

  const handleLocationSwitch = async (value: boolean) => {
    setAttachLocation(value);
    if (value) {
      setLoadingLoc(true);
      const loc = await GpsService.getCurrentLocation();
      if (loc) {
        const address = await MapService.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        setLocationData({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          address,
        });
      }
      setLoadingLoc(false);
    } else {
      setLocationData(null);
    }
  };

  const handleCreatePost = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert('Validation Error', 'Please fill in a title and description.');
      return;
    }

    try {
      const payload: any = {
        title,
        description,
        category,
        anonymous,
      };

      if (attachLocation && locationData) {
        payload.latitude = locationData.latitude;
        payload.longitude = locationData.longitude;
        payload.address = locationData.address;
      }

      const response = await apiClient.post('/community/posts', payload);
      if (response.data.success) {
        Alert.alert('Success', 'Community post published successfully!');
        navigation.goBack();
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit post');
    }
  };

  const categories = [
    { label: '💡 Safety Alert', value: 'safety_alert' },
    { label: '🗺️ Travel Experience', value: 'travel_experience' },
    { label: '🏨 Safe Hotel Option', value: 'safe_hotel' },
    { label: '⚠️ Unsafe Zone Warning', value: 'unsafe_area' },
    { label: '🆘 Emergency Help Request', value: 'emergency_help' },
    { label: '👤 Travel Companion Invite', value: 'travel_partner' },
    { label: '💬 General Conversation', value: 'general' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Publish Community Post</Text>
        
        <View style={styles.form}>
          <Text style={styles.label}>Post Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Summarize your alert/question..."
            placeholderTextColor={COLORS.textMuted}
          />

          <Text style={styles.label}>Select Category</Text>
          <View style={styles.catGrid}>
            {categories.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.catBtn,
                  category === item.value ? styles.catBtnActive : null,
                ]}
                onPress={() => setCategory(item.value)}
              >
                <Text style={[styles.catText, category === item.value ? styles.catTextActive : null]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Description Details</Text>
          <TextInput
            style={[styles.input, styles.areaInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Share details (location hazards, timings, hotel verified checks)..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={5}
          />

          {/* Toggle Location Attachment */}
          <View style={styles.switchRow}>
            <View style={styles.textCol}>
              <Text style={styles.switchLabel}>Attach My Current Coordinates</Text>
              {locationData && (
                <Text style={styles.locationVal} numberOfLines={1}>📍 {locationData.address}</Text>
              )}
            </View>
            {loadingLoc ? <ActivityIndicator size="small" color={COLORS.primaryLight} /> : (
              <Switch value={attachLocation} onValueChange={handleLocationSwitch} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} />
            )}
          </View>

          {/* Toggle Anonymous */}
          <View style={[styles.switchRow, { borderTopWidth: 0, marginTop: 10 }]}>
            <View style={styles.textCol}>
              <Text style={styles.switchLabel}>Publish Anonymously</Text>
              <Text style={styles.switchSub}>Masks your username from feed listings.</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleCreatePost}>
            <Text style={styles.submitBtnText}>Publish Post</Text>
          </TouchableOpacity>
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
  scroll: {
    padding: SPACING.xl,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  form: {
    marginTop: SPACING.lg,
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
    fontSize: 15,
  },
  areaInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: SPACING.md,
  },
  catBtn: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    width: '48%',
    alignItems: 'center',
  },
  catBtnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  catText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  catTextActive: {
    color: COLORS.primaryLight,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.xl,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  textCol: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  locationVal: {
    fontSize: 11,
    color: COLORS.primaryLight,
    marginTop: 4,
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  submitBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CreatePostScreen;
