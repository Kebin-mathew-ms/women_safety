import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const PostDetailsScreen: React.FC<{ route: any }> = ({ route }) => {
  const { postId } = route.params;
  const [post, setPost] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  // Comment state
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchPostDetails = async () => {
    try {
      const response = await apiClient.get(`/community/posts/${postId}`);
      if (response.data.success) {
        setPost(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load post details:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, []);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const response = await apiClient.post('/community/comments', {
        postId,
        comment: commentText.trim(),
      });
      if (response.data.success) {
        setCommentText('');
        fetchPostDetails(); // Reload comment threads
      }
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to submit comment');
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

  if (!post) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Community post could not be found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Scrollable details */}
      <ScrollView contentContainerStyle={styles.scroll}>
        
        {/* Post Card */}
        <View style={styles.postCard}>
          <View style={styles.headerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            <View style={styles.headerText}>
              <Text style={styles.author}>{post.user?.fullName}</Text>
              <Text style={styles.date}>{new Date(post.createdAt).toLocaleDateString()}</Text>
            </View>
            <Chip label={post.category.toUpperCase().replace('_', ' ')} color="#6366f1" />
          </View>

          <Text style={styles.title}>{post.title}</Text>
          <Text style={styles.desc}>{post.description}</Text>

          {post.address && (
            <Text style={styles.locationText}>📍 Attached Location: {post.address}</Text>
          )}
        </View>

        {/* Comment count */}
        <Text style={styles.commentHeader}>Comments ({post.postComments?.length || 0})</Text>

        {/* Comment listings */}
        {post.postComments && post.postComments.length === 0 ? (
          <Text style={styles.emptyComments}>No comments posted yet. Start the conversation below!</Text>
        ) : (
          post.postComments.map((item: any) => (
            <View key={item.commentId} style={styles.commentCard}>
              <View style={styles.commentUserRow}>
                <Text style={styles.commentAuthor}>{item.user?.fullName}</Text>
                <Text style={styles.commentDate}>{new Date(item.createdAt).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.commentBody}>{item.comment}</Text>
            </View>
          ))
        )}

      </ScrollView>

      {/* Reply input tray */}
      <View style={styles.inputTray}>
        <TextInput
          style={styles.commentInput}
          placeholder="Write comment feedback..."
          placeholderTextColor={COLORS.textMuted}
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleAddComment} disabled={submitting || !commentText.trim()}>
          {submitting ? <ActivityIndicator size="small" color={COLORS.white} /> : <Text style={styles.sendBtnText}>Send</Text>}
        </TouchableOpacity>
      </View>
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
  scroll: {
    padding: SPACING.xl,
    paddingBottom: 40,
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
  postCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatarText: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
    marginLeft: 10,
  },
  author: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  date: {
    fontSize: 11,
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
    fontSize: 17,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  desc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 22,
  },
  locationText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    marginTop: SPACING.md,
  },
  commentHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
    marginTop: SPACING.md,
  },
  emptyComments: {
    fontSize: 13,
    color: COLORS.textMuted,
    fontStyle: 'italic',
  },
  commentCard: {
    backgroundColor: COLORS.cardBackground,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  commentUserRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  commentAuthor: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
  },
  commentDate: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
  commentBody: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  inputTray: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  commentInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    color: COLORS.textPrimary,
    fontSize: 14,
    marginRight: 10,
  },
  sendBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  sendBtnText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default PostDetailsScreen;
