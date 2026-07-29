import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import MapService from '../services/map';
import GpsService from '../services/gps';

export const CrimeReportScreen: React.FC = () => {
  const [addressQuery, setAddressQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  
  const [category, setCategory] = useState('poor_lighting');
  const [severity, setSeverity] = useState<'low' | 'medium' | 'high'>('medium');
  const [description, setDescription] = useState('');
  const [anonymous, setAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize to current coordinates address
  useEffect(() => {
    const initAddress = async () => {
      const loc = await GpsService.getCurrentLocation();
      if (loc) {
        const address = await MapService.reverseGeocode(loc.coords.latitude, loc.coords.longitude);
        setSelectedLocation({
          display_name: address,
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        setAddressQuery(address);
      }
    };
    initAddress();
  }, []);

  const handleAddressSearch = async (text: string) => {
    setAddressQuery(text);
    if (text.length >= 3) {
      const res = await MapService.autocomplete(text);
      setSuggestions(res);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    setSelectedLocation(item);
    setAddressQuery(item.display_name);
    setSuggestions([]);
  };

  const handleSubmitReport = async () => {
    if (!selectedLocation) {
      Alert.alert('Validation Error', 'Please select a valid hazard location address from suggestions.');
      return;
    }

    setSubmitting(true);
    try {
      await apiClient.post('/crime-reports', {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        address: selectedLocation.display_name,
        category,
        severity,
        description: description.trim(),
        anonymous,
      });

      Alert.alert('Report Logged', 'Thank you! Your community warning has been registered.');
      setDescription('');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit community report.');
    } finally {
      setSubmitting(false);
    }
  };

  const categories = [
    { label: '💡 Poor/Broken Street Lights', value: 'poor_lighting' },
    { label: '🗣️ Harassment / Catcalling', value: 'harassment' },
    { label: '👤 Suspicious Activity', value: 'suspicious_activity' },
    { label: '🚧 Road Block / Dark Alley', value: 'road_block' },
    { label: '🏚️ Abandoned Area', value: 'abandoned_area' },
    { label: '🚌 Unsafe Transport / Taxi', value: 'unsafe_transport' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Report Safety Hazard</Text>
        <Text style={styles.sub}>Share local street alerts to warn nearby community travelers.</Text>

        <View style={styles.form}>
          
          {/* Location Search */}
          <Text style={styles.label}>Hazard Location Address</Text>
          <TextInput
            style={styles.input}
            value={addressQuery}
            onChangeText={handleAddressSearch}
            placeholder="Type address..."
            placeholderTextColor={COLORS.textMuted}
          />

          {suggestions.length > 0 && (
            <View style={styles.suggestions}>
              {suggestions.map((item, idx) => (
                <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                  <Text style={styles.suggestionText} numberOfLines={2}>📍 {item.display_name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Category Dropdown Simulator */}
          <Text style={styles.label}>Select Category</Text>
          <View style={styles.categoriesRow}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.value}
                style={[
                  styles.catBtn,
                  category === cat.value ? styles.catBtnActive : null,
                ]}
                onPress={() => setCategory(cat.value)}
              >
                <Text style={[styles.catBtnText, category === cat.value ? styles.catBtnTextActive : null]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Severity Selector */}
          <Text style={styles.label}>Threat Severity Level</Text>
          <View style={styles.severityRow}>
            {['low', 'medium', 'high'].map((sev) => (
              <TouchableOpacity
                key={sev}
                style={[
                  styles.sevBtn,
                  severity === sev ? styles.sevBtnActive : null,
                  severity === sev && sev === 'high' ? styles.sevBtnHigh : null,
                ]}
                onPress={() => setSeverity(sev as any)}
              >
                <Text style={[styles.sevBtnText, severity === sev ? styles.sevBtnTextActive : null]}>
                  {sev.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Description */}
          <Text style={styles.label}>Additional Details</Text>
          <TextInput
            style={[styles.input, styles.areaInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Describe what makes this area unsafe (e.g. broken street lights near subway)..."
            placeholderTextColor={COLORS.textMuted}
            multiline
            numberOfLines={4}
          />

          {/* Anonymous Switch */}
          <View style={styles.switchRow}>
            <View style={styles.textBlock}>
              <Text style={styles.switchTitle}>Report Anonymously</Text>
              <Text style={styles.switchSub}>Hides your profile name from community listings.</Text>
            </View>
            <Switch value={anonymous} onValueChange={setAnonymous} trackColor={{ false: COLORS.border, true: COLORS.primaryLight }} />
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmitReport} disabled={submitting}>
            {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Submit Community Warning</Text>}
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
  sub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  form: {
    marginTop: SPACING.xl,
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
    height: 80,
    textAlignVertical: 'top',
  },
  suggestions: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderTopWidth: 0,
    maxHeight: 150,
  },
  suggestionItem: {
    padding: SPACING.md,
    borderBottomColor: COLORS.border,
    borderBottomWidth: 0.5,
  },
  suggestionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
  },
  catBtn: {
    width: '48%',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
  },
  catBtnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  catBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  catBtnTextActive: {
    color: COLORS.primaryLight,
  },
  severityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  sevBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
  },
  sevBtnActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  sevBtnHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: COLORS.emergencyLight,
  },
  sevBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  sevBtnTextActive: {
    color: COLORS.primaryLight,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
    paddingTop: SPACING.lg,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  textBlock: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  switchSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: COLORS.emergency,
    paddingVertical: SPACING.lg,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: SPACING.xl,
    ...SHADOWS.small,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default CrimeReportScreen;
