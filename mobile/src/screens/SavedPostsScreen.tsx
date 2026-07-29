import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';
import { useNavigation } from '@react-navigation/native';

export const SavedPostsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchSaved = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/community/saved');
      if (response.data.success) {
        setPosts(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load saved posts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, []);

  const handleUnsave = async (postId: string) => {
    try {
      await apiClient.delete(`/community/save/${postId}`);
      fetchSaved();
    } catch (err: any) {
      console.debug('Failed to unsave post:', err.message);
    }
  };

  const renderPostItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.author}>By: {item.user?.fullName}</Text>
        <TouchableOpacity style={styles.unsaveBtn} onPress={() => handleUnsave(item.postId)}>
          <Text style={styles.unsaveText}>Unbookmark</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity onPress={() => navigation.navigate('PostDetails', { postId: item.postId })}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.postId}
          renderItem={renderPostItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔖</Text>
              <Text style={styles.emptyText}>No saved bookmarks found.</Text>
            </View>
          }
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  author: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textMuted,
  },
  unsaveBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  unsaveText: {
    color: COLORS.emergencyLight,
    fontSize: 10,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  desc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
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
});

export default SavedPostsScreen;
