import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Alert } from 'react-native';
import { COLORS, SPACING, SHADOWS } from '../theme';
import apiClient from '../services/api';

export const NotificationCenterScreen: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/notifications');
      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load notifications:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (notificationId: string) => {
    try {
      await apiClient.put('/notifications/read', { notificationId });
      fetchNotifications();
    } catch (err: any) {
      console.debug('Failed to mark read:', err.message);
    }
  };

  const handleDelete = async (notificationId: string) => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
      fetchNotifications();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to delete notification.');
    }
  };

  const handleClearAll = async () => {
    try {
      await apiClient.put('/notifications/read');
      fetchNotifications();
      Alert.alert('Cleared', 'All notifications marked as read.');
    } catch (err: any) {
      console.debug('Failed to clear all:', err.message);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return COLORS.emergencyLight;
      case 'high': return COLORS.warning;
      default: return COLORS.textSecondary;
    }
  };

  const renderNotifItem = ({ item }: { item: any }) => (
    <View style={[styles.card, !item.isRead ? styles.unreadCard : null]}>
      <View style={styles.header}>
        <Text style={[styles.title, !item.isRead ? styles.boldText : null]}>
          {item.title}
        </Text>
        <Text style={[styles.priority, { color: getPriorityColor(item.priority) }]}>
          {item.priority.toUpperCase()}
        </Text>
      </View>
      
      <Text style={styles.message}>{item.message}</Text>
      <Text style={styles.date}>{new Date(item.createdAt).toLocaleString()}</Text>

      <View style={styles.actions}>
        {!item.isRead && (
          <TouchableOpacity style={styles.btn} onPress={() => handleMarkRead(item.notificationId)}>
            <Text style={styles.btnText}>Mark Read</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.btn, styles.deleteBtn]} onPress={() => handleDelete(item.notificationId)}>
          <Text style={styles.deleteBtnText}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <Text style={styles.summary}>Unread alerts: {unreadCount}</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={styles.clearAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primaryLight} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.notificationId}
          renderItem={renderNotifItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📯</Text>
              <Text style={styles.emptyText}>No notifications logged. Your workspace is clear.</Text>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.xl,
    paddingBottom: 0,
    alignItems: 'center',
  },
  summary: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  clearAllText: {
    color: COLORS.primaryLight,
    fontWeight: 'bold',
    fontSize: 13,
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
    marginBottom: SPACING.sm,
    ...SHADOWS.small,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primaryLight,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  boldText: {
    fontWeight: 'bold',
  },
  priority: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  message: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 18,
  },
  date: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 0.5,
    borderTopColor: COLORS.border,
  },
  btn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  btnText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: 'bold',
  },
  deleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteBtnText: {
    color: COLORS.emergencyLight,
    fontSize: 11,
    fontWeight: 'bold',
  },
  empty: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyIcon: {
    fontSize: 54,
    marginBottom: 10,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});

export default NotificationCenterScreen;
