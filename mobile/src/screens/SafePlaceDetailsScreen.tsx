import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal, SafeAreaView, FlatList } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const SafePlaceDetailsScreen: React.FC<{ route: any; navigation: any }> = ({ route, navigation }) => {
  const { placeId } = route.params;
  const [place, setPlace] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Review modal
  const [modalVisible, setModalVisible] = useState(false);
  const [rating, setRating] = useState('5');
  const [lighting, setLighting] = useState('5');
  const [crowd, setCrowd] = useState('3');
  const [cleanliness, setCleanliness] = useState('5');
  const [security, setSecurity] = useState('5');
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchDetails = async () => {
    try {
      const response = await apiClient.get(`/safe-places/${placeId}`);
      if (response.data.success) {
        setPlace(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to fetch place details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, []);

  const handleAddReview = async () => {
    setSubmitting(true);
    try {
      await apiClient.post('/reviews', {
        placeId,
        rating: parseInt(rating),
        lighting: parseInt(lighting),
        crowd: parseInt(crowd),
        cleanliness: parseInt(cleanliness),
        security: parseInt(security),
        comment: comment.trim(),
      });

      Alert.alert('Review Added', 'Thank you for contributing to community safety!');
      setModalVisible(false);
      setComment('');
      fetchDetails(); // Reload average ratings
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  if (!place) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Safe place details could not be retrieved.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Header summary */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.name}>{place.name}</Text>
            {place.verified && <Text style={styles.verifiedTag}>🛡️ VERIFIED</Text>}
          </View>
          <Text style={styles.category}>{place.category.toUpperCase().replace('_', ' ')}</Text>
          <Text style={styles.address}>📍 {place.address}</Text>

          <View style={styles.ratingBox}>
            <Text style={styles.averageStars}>⭐ {place.averageRating.toFixed(1)} / 5.0</Text>
            <Text style={styles.lightingScore}>Lighting Index: {place.lightingScore.toFixed(1)} / 10</Text>
          </View>
        </View>

        {/* Description */}
        <Text style={styles.sectionTitle}>About Place</Text>
        <Text style={styles.description}>
          {place.description || 'No description provided for this place. Verified safe point compiled by travelers and community checkers.'}
        </Text>

        {/* Amenities grid */}
        <Text style={styles.sectionTitle}>Safety Amenities</Text>
        <View style={styles.amenitiesGrid}>
          <AmenityItem label="CCTV Camera" active={place.cctv} />
          <AmenityItem label="Security Guard" active={place.securityGuard} />
          <AmenityItem label="24/7 Reception" active={place.reception24x7} />
          <AmenityItem label="Parking Area" active={place.parking} />
          <AmenityItem label="Women PG/PG Only" active={place.womenOnly} />
        </View>

        {/* Reviews */}
        <View style={styles.reviewHeader}>
          <Text style={styles.sectionTitle}>Community Reviews ({place.reviews?.length || 0})</Text>
          <TouchableOpacity style={styles.addReviewBtn} onPress={() => setModalVisible(true)}>
            <Text style={styles.addReviewText}>+ Rate Place</Text>
          </TouchableOpacity>
        </View>

        {place.reviews && place.reviews.length === 0 ? (
          <Text style={styles.emptyReviews}>No community reviews posted yet. Be the first to share safety rates!</Text>
        ) : (
          place.reviews.map((item: any) => (
            <View key={item.reviewId} style={styles.reviewCard}>
              <View style={styles.reviewUserRow}>
                <Text style={styles.reviewerName}>{item.user?.fullName}</Text>
                <Text style={styles.reviewRating}>⭐ {item.rating}</Text>
              </View>
              <Text style={styles.reviewComment}>{item.comment || 'Safe travel node approved.'}</Text>
              
              <View style={styles.reviewStats}>
                <Text style={styles.statLabel}>Security: {item.security}/5</Text>
                <Text style={styles.statLabel}>Lighting: {item.lighting}/5</Text>
                <Text style={styles.statLabel}>Cleanliness: {item.cleanliness}/5</Text>
              </View>
            </View>
          ))
        )}

      </ScrollView>

      {/* Review Modal Dialog */}
      <Modal animationType="slide" transparent={true} visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            <Text style={styles.modalTitle}>Write Safety Review</Text>

            <Text style={styles.label}>Safety Rating (1-5 Stars)</Text>
            <TextInput style={styles.modalInput} value={rating} onChangeText={setRating} keyboardType="numeric" placeholder="5" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Lighting Rate (1-5 Stars)</Text>
            <TextInput style={styles.modalInput} value={lighting} onChangeText={setLighting} keyboardType="numeric" placeholder="5" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Security Rate (1-5 Stars)</Text>
            <TextInput style={styles.modalInput} value={security} onChangeText={setSecurity} keyboardType="numeric" placeholder="5" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Cleanliness Rate (1-5 Stars)</Text>
            <TextInput style={styles.modalInput} value={cleanliness} onChangeText={setCleanliness} keyboardType="numeric" placeholder="5" placeholderTextColor={COLORS.textMuted} />

            <Text style={styles.label}>Comment / Safe Notes</Text>
            <TextInput
              style={[styles.modalInput, styles.areaInput]}
              value={comment}
              onChangeText={setComment}
              placeholder="e.g. Well lit street, guard active at reception..."
              placeholderTextColor={COLORS.textMuted}
              multiline
              numberOfLines={4}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnCancel]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalBtnSave]} onPress={handleAddReview} disabled={submitting}>
                {submitting ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.modalBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const AmenityItem: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <View style={[styles.amenityRow, !active && styles.amenityDisabled]}>
    <Text style={styles.amenityIcon}>{active ? '✔️' : '❌'}</Text>
    <Text style={[styles.amenityLabel, !active && styles.textDisabled]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scroll: {
    padding: SPACING.xl,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  errorText: {
    color: COLORS.emergencyLight,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    flex: 1,
  },
  verifiedTag: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  category: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: 'bold',
  },
  address: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  ratingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  averageStars: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  lightingScore: {
    fontSize: 13,
    color: COLORS.primaryLight,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  amenityRow: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 6,
    backgroundColor: COLORS.cardBackground,
  },
  amenityDisabled: {
    opacity: 0.5,
  },
  amenityIcon: {
    fontSize: 12,
    marginRight: 6,
  },
  amenityLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  textDisabled: {
    textDecorationLine: 'line-through',
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  addReviewBtn: {
    backgroundColor: 'rgba(79, 70, 229, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  addReviewText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyReviews: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  reviewCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  reviewUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  reviewRating: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#f59e0b',
  },
  reviewComment: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  reviewStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
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
    fontSize: 15,
  },
  areaInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xl,
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

export default SafePlaceDetailsScreen;
