import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, TextInput, Alert, Modal, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import MapService from '../services/map';

export const SavedPlacesScreen: React.FC = () => {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [placeName, setPlaceName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<any | null>(null);
  const [category, setCategory] = useState<'home' | 'office' | 'custom'>('custom');
  const [saving, setSaving] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/places');
      if (response.data.success) {
        setPlaces(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load saved places:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  // Search Address suggestions
  const handleAddressSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length >= 3) {
      const results = await MapService.autocomplete(text);
      setSuggestions(results);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (item: any) => {
    setSelectedLocation(item);
    setSearchQuery(item.display_name);
    setSuggestions([]);
  };

  const handleSavePlace = async () => {
    if (!placeName.trim() || !selectedLocation) {
      Alert.alert('Validation Error', 'Please specify a name and select a valid address from the search results.');
      return;
    }

    setSaving(true);
    try {
      await apiClient.post('/places', {
        placeName,
        address: selectedLocation.display_name,
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        category,
      });

      Alert.alert('Success', 'Address saved to favourites successfully!');
      setModalVisible(false);
      setPlaceName('');
      setSearchQuery('');
      setSelectedLocation(null);
      fetchPlaces();
    } catch (err: any) {
      Alert.alert('Save Error', err.response?.data?.message || 'Failed to save address');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (placeId: string) => {
    Alert.alert(
      'Remove Saved Place',
      'Are you sure you want to remove this address from your favourites?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/places/${placeId}`);
              fetchPlaces();
            } catch (err: any) {
              Alert.alert('Error', 'Failed to remove saved place.');
            }
          },
        },
      ]
    );
  };

  const renderPlaceItem = ({ item }: { item: any }) => {
    const categoryIcons: Record<string, string> = {
      home: '🏠',
      office: '💼',
      custom: '🚩',
    };

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.icon}>{categoryIcons[item.category] || '🚩'}</Text>
          <View style={styles.textBlock}>
            <Text style={styles.placeName}>{item.placeName}</Text>
            <Text style={styles.address}>{item.address}</Text>
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.placeId)}>
            <Text style={styles.deleteBtnText}>🗑️</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.placeId}
          renderItem={renderPlaceItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🚩</Text>
              <Text style={styles.emptyText}>You haven't saved any favourite places yet.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.floatingBtn} onPress={() => setModalVisible(true)}>
        <Text style={styles.floatingBtnText}>+ Save New Place</Text>
      </TouchableOpacity>

      {/* Save Place Dialog Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Save Place to Favourites</Text>
            
            <Text style={styles.label}>Custom Name</Text>
            <TextInput style={styles.modalInput} value={placeName} onChangeText={setPlaceName} placeholder="e.g. Grandma's House, Gym" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Search Address (OSM search)</Text>
            <TextInput style={styles.modalInput} value={searchQuery} onChangeText={handleAddressSearch} placeholder="Start typing address..." placeholderTextColor={COLORS.textMuted} />

            {/* Address Autocomplete Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <View style={styles.suggestionsContainer}>
                {suggestions.map((item, idx) => (
                  <TouchableOpacity key={idx} style={styles.suggestionItem} onPress={() => handleSelectSuggestion(item)}>
                    <Text style={styles.suggestionText} numberOfLines={2}>
                      📍 {item.display_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={styles.label}>Category</Text>
            <View style={styles.categoryRow}>
              {['home', 'office', 'custom'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryBtn,
                    category === cat ? styles.categoryBtnActive : null,
                  ]}
                  onPress={() => setCategory(cat as any)}
                >
                  <Text style={[styles.categoryBtnText, category === cat ? styles.categoryBtnTextActive : null]}>
                    {cat.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleSavePlace} disabled={saving}>
                {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalBtnText}>Save Place</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  list: {
    padding: SPACING.xl,
    paddingBottom: 100,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  textBlock: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  deleteBtn: {
    padding: 8,
  },
  deleteBtnText: {
    fontSize: 18,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: SPACING.xxl,
    left: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    borderRadius: 12,
    alignItems: 'center',
    ...SHADOWS.medium,
  },
  floatingBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: SPACING.md,
  },
  emptyText: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: SPACING.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.md,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 16,
  },
  suggestionsContainer: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderTopWidth: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
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
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  categoryBtn: {
    width: '30%',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  categoryBtnActive: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  categoryBtnText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryBtnTextActive: {
    color: COLORS.primaryLight,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalBtn: {
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    width: '48%',
  },
  modalBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: 'bold',
  },
  modalBtnSave: {
    backgroundColor: COLORS.primary,
  },
  modalBtnCancel: {
    backgroundColor: COLORS.border,
  },
});

export default SavedPlacesScreen;
