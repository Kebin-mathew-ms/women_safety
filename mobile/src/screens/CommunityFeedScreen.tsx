import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import { useNavigation } from '@react-navigation/native';

export const CommunityFeedScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (activeCategory !== 'all') {
        params.category = activeCategory;
      }
      const response = await apiClient.get('/community/posts', { params });
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load community feed:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, [activeCategory]);

  const handleLikeToggle = async (postId: string, liked: boolean) => {
    try {
      if (liked) {
        await apiClient.delete(`/community/likes/${postId}`);
      } else {
        await apiClient.post('/community/likes', { postId });
      }
      fetchFeed();
    } catch (err: any) {
      console.debug('Failed to toggle post like:', err.message);
    }
  };

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'safety_alert': return '🚨 Safety Alert';
      case 'travel_experience': return '🗺️ Experience';
      case 'safe_hotel': return '🏨 Safe Hotel';
      case 'unsafe_area': return '⚠️ Unsafe Area';
      case 'emergency_help': return '🆘 Emergency';
      case 'travel_partner': return '👤 Partner Request';
      default: return '💬 Discussion';
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={styles.headerTextCol}>
          <Text style={styles.author}>{item.user?.fullName}</Text>
          <Text style={styles.date}>{new Date(item.createdAt).toLocaleDateString()}</Text>
        </View>
        <Chip label={item.category.toUpperCase().replace('_', ' ')} color="#6366f1" />
      </View>

      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc} numberOfLines={3}>{item.description}</Text>

      {item.address && (
        <Text style={styles.locationText}>📍 Loc: {item.address}</Text>
      )}

      <View style={styles.footerRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLikeToggle(item.postId, item.likes > 0)}>
          <Text style={styles.actionIcon}>{item.likes > 0 ? '❤️' : '🤍'}</Text>
          <Text style={styles.actionLabel}>{item.likes} Likes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('PostDetails', { postId: item.postId })}>
          <Text style={styles.actionIcon}>💬</Text>
          <Text style={styles.actionLabel}>{item.comments} Comments</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const categories = [
    { label: 'All', value: 'all' },
    { label: 'Alerts', value: 'safety_alert' },
    { label: 'Hotels', value: 'safe_hotel' },
    { label: 'Unsafe Areas', value: 'unsafe_area' },
    { label: 'Partners', value: 'travel_partner' },
    { label: 'General', value: 'general' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Category Pills Header */}
      <View style={styles.categoryRow}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item.value}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryPill,
                activeCategory === item.value ? styles.activePill : null,
              ]}
              onPress={() => setActiveCategory(item.value)}
            >
              <Text style={[styles.pillText, activeCategory === item.value ? styles.activePillText : null]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primaryLight} />
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyText}>No posts found in feed.</Text>
            </View>
          }
        />
      )}

      {/* Floating Create button */}
      <TouchableOpacity style={styles.floatingBtn} onPress={() => navigation.navigate('CreatePost')}>
        <Text style={styles.floatingBtnText}>＋ Create Post</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const Chip: React.FC<{ label: string; color: string }> = ({ label, color }) => (
  <View style={[styles.chip, { backgroundColor: color + '22', borderColor: color }]}>
    <Text style={[styles.chipText, { color }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  categoryRow: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  categoryPill: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    marginRight: 8,
  },
  activePill: {
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderColor: COLORS.primaryLight,
  },
  pillText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  activePillText: {
    color: COLORS.primaryLight,
  },
  list: {
    padding: SPACING.xl,
    paddingBottom: 80,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 18,
  },
  headerTextCol: {
    flex: 1,
    marginLeft: 10,
  },
  author: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 20,
  },
  locationText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  actionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 50,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
  },
  floatingBtn: {
    position: 'absolute',
    bottom: SPACING.xl,
    right: SPACING.xl,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 25,
    ...SHADOWS.medium,
  },
  floatingBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default CommunityFeedScreen;
