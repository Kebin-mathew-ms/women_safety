import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, SafeAreaView, ScrollView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const ReviewSummaryScreen: React.FC<{ route: any }> = ({ route }) => {
  const { placeId, placeName } = route.params;
  const [summary, setSummary] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      const response = await apiClient.get(`/ai/review-summary/${placeId}`);
      if (response.data.success) {
        setSummary(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to retrieve AI review summaries.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{placeName}</Text>
        <Text style={styles.sub}>Cached AI review summarization analytics.</Text>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📋 Review Summary</Text>
          <Text style={styles.bodyText}>{summary?.summary || 'No review comments logged.'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>👍 Positive Highlights</Text>
          <Text style={styles.bodyText}>{summary?.positiveHighlights || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>👎 Negative Concerns</Text>
          <Text style={styles.bodyText}>{summary?.negativeHighlights || 'N/A'}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🛡️ Safety Opinion</Text>
          <Text style={styles.bodyText}>{summary?.overallSafety || 'N/A'}</Text>
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  sub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  section: {
    marginTop: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    ...SHADOWS.small,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
    paddingBottom: 6,
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});

export default ReviewSummaryScreen;
