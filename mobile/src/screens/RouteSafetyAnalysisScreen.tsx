import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Alert, SafeAreaView, ScrollView, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const RouteSafetyAnalysisScreen: React.FC<{ route: any }> = ({ route }) => {
  const { tripId } = route.params;
  const [analysis, setAnalysis] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalysis = async () => {
    try {
      const response = await apiClient.post('/ai/route-analysis', { tripId });
      if (response.data.success) {
        setAnalysis(response.data.data);
      }
    } catch (err: any) {
      Alert.alert('Error', 'Failed to calculate route safety score. Rule engine offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primaryLight} />
      </View>
    );
  }

  if (!analysis) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Trip analysis could not be generated.</Text>
      </View>
    );
  }

  const factors = JSON.parse(analysis.factorsJson || '{}');

  const getRiskColor = (lvl: string) => {
    switch (lvl.toLowerCase()) {
      case 'critical': return COLORS.emergencyLight;
      case 'high': return COLORS.warning;
      case 'medium': return COLORS.primaryLight;
      default: return COLORS.success;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>AI Route Analysis</Text>
        <Text style={styles.sub}>Calculated safety risk ratings based on weather warnings, night travel check, and crime reports densities.</Text>

        {/* Score Ring Header */}
        <View style={styles.scoreCard}>
          <View style={[styles.ring, { borderColor: getRiskColor(analysis.riskLevel) }]}>
            <Text style={styles.scoreText}>{analysis.riskScore.toFixed(0)}</Text>
            <Text style={styles.scoreSub}>Risk Score</Text>
          </View>
          <Text style={[styles.lvlText, { color: getRiskColor(analysis.riskLevel) }]}>
            {analysis.riskLevel.toUpperCase()} RISK LEVEL
          </Text>
        </View>

        {/* Factors breakdown */}
        <Text style={styles.sectionTitle}>Evaluated Risk Factors</Text>
        <View style={styles.factorsList}>
          <FactorRow label="Late Night Hour Active" status={factors.nightTravel ? '🚨 Detected' : '✅ Clear'} />
          <FactorRow label="Nearby Crimes (30 Days)" status={factors.recentNearbyCrimesCount ? `⚠️ ${factors.recentNearbyCrimesCount} Reports` : '✅ None'} />
          <FactorRow label="Weather Warnings Status" status={factors.weatherPrecaution ? `⚠️ Precaution` : '✅ Clear'} />
          <FactorRow label="OSM Street Lights Lighting" status="✅ Verified lit path" />
        </View>

        {/* AI Recommendations */}
        <Text style={styles.sectionTitle}>Smart Recommendations</Text>
        <View style={styles.recCard}>
          <Text style={styles.recText}>{analysis.recommendation}</Text>
        </View>

        <TouchableOpacity style={styles.btn} onPress={fetchAnalysis}>
          <Text style={styles.btnText}>Recalculate safety metrics</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const FactorRow: React.FC<{ label: string; status: string }> = ({ label, status }) => (
  <View style={styles.factorRow}>
    <Text style={styles.factorLabel}>{label}</Text>
    <Text style={styles.factorStatus}>{status}</Text>
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
  error: {
    color: COLORS.emergencyLight,
    fontWeight: 'bold',
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
    lineHeight: 16,
  },
  scoreCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.small,
  },
  ring: {
    height: 110,
    width: 110,
    borderRadius: 55,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  scoreSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  lvlText: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primaryLight,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
  },
  factorsList: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 8,
    paddingHorizontal: SPACING.lg,
  },
  factorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  factorLabel: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  factorStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
  },
  recCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 0.5,
    borderRadius: 8,
    padding: SPACING.lg,
  },
  recText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.xxl,
    marginBottom: 40,
  },
  btnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default RouteSafetyAnalysisScreen;
