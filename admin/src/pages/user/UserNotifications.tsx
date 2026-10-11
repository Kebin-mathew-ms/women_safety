import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Button,
  IconButton,
  Chip,
  Divider,
  Tooltip,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Sos as SosIcon,
  Place as PlaceIcon,
  Campaign as CampaignIcon,
  Forum as ForumIcon,
  MarkEmailRead as MarkEmailReadIcon,
  DoneAll as DoneAllIcon,
  DeleteOutline as DeleteOutlineIcon,
  BatteryAlert as BatteryAlertIcon,
  NightsStay as NightsStayIcon,
  CloudQueue as CloudQueueIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApi';

interface Notification {
  id: string;
  notificationId: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
  priority?: string;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  sos: { icon: <SosIcon />, color: '#ef4444', label: 'SOS Alert' },
  sos_alert: { icon: <SosIcon />, color: '#ef4444', label: 'SOS Alert' },
  sos_triggered: { icon: <SosIcon />, color: '#ef4444', label: 'SOS Alert' },
  trip: { icon: <PlaceIcon />, color: '#6366f1', label: 'Trip Update' },
  trip_started: { icon: <PlaceIcon />, color: '#6366f1', label: 'Trip Started' },
  trip_completed: { icon: <PlaceIcon />, color: '#10b981', label: 'Trip Completed' },
  trip_alert: { icon: <PlaceIcon />, color: '#6366f1', label: 'Trip Alert' },
  announcement: { icon: <CampaignIcon />, color: '#f59e0b', label: 'Announcement' },
  admin_announcement: { icon: <CampaignIcon />, color: '#f59e0b', label: 'Admin Announcement' },
  community: { icon: <ForumIcon />, color: '#10b981', label: 'Community' },
  battery_warning: { icon: <BatteryAlertIcon />, color: '#f43f5e', label: 'Battery Warning' },
  night_alert: { icon: <NightsStayIcon />, color: '#8b5cf6', label: 'Night Travel' },
  weather_warning: { icon: <CloudQueueIcon />, color: '#06b6d4', label: 'Weather Alert' },
};

const getConfig = (type: string) => {
  const normalized = (type || '').toLowerCase();
  for (const [key, val] of Object.entries(typeConfig)) {
    if (normalized.includes(key)) return val;
  }
  return { icon: <NotificationsIcon />, color: '#9ca3af', label: type || 'Alert' };
};

const timeAgo = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

export const UserNotifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'broadcasts' | 'sos'>('all');

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get('/notifications');
      const rawList = res.data?.data ?? [];
      const normalized: Notification[] = rawList.map((n: any) => ({
        id: n.notificationId || n.id,
        notificationId: n.notificationId || n.id,
        type: n.type || 'announcement',
        title: n.title || 'Notification',
        body: n.message || n.body || '',
        createdAt: n.createdAt,
        isRead: Boolean(n.isRead),
        priority: n.priority,
      }));
      setNotifications(normalized);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setMarkingId(id);
    try {
      await userApiClient.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id || n.notificationId === id ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to mark as read.');
    } finally {
      setMarkingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setActionLoading(true);
    try {
      await userApiClient.put('/notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to mark all notifications as read.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDeletingId(id);
    try {
      await userApiClient.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id && n.notificationId !== id));
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to delete notification.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to delete all notifications?')) return;
    setActionLoading(true);
    try {
      await userApiClient.delete('/notifications');
      setNotifications([]);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to clear notifications.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleNotificationClick = (n: Notification) => {
    if (!n.isRead) {
      handleMarkRead(n.id);
    }
    const t = (n.type || '').toLowerCase();
    if (t.includes('sos')) {
      navigate('/user/sos');
    } else if (t.includes('trip')) {
      navigate('/user/trips');
    } else if (t.includes('community')) {
      navigate('/user/community');
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const broadcastNotifications = notifications.filter(
    (n) => n.type.includes('announcement') || n.type.includes('broadcast') || n.type.includes('weather') || n.type.includes('traffic')
  );
  const sosNotifications = notifications.filter((n) => n.type.includes('sos'));

  const filteredNotifications =
    activeTab === 'broadcasts'
      ? broadcastNotifications
      : activeTab === 'sos'
      ? sosNotifications
      : notifications;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #6366f1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            Notification Center
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            Stay informed about safety alerts, official broadcasts, and emergency logs.
          </Typography>
        </Box>

        {/* Action Toolbar */}
        <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
          {unreadCount > 0 && (
            <Chip
              label={`${unreadCount} unread`}
              sx={{ backgroundColor: '#f43f5e', color: '#fff', fontWeight: 700, fontSize: 13 }}
            />
          )}

          {unreadCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              sx={{
                color: '#6366f1',
                borderColor: 'rgba(99,102,241,0.4)',
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                '&:hover': { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.08)' },
              }}
            >
              Mark all as read
            </Button>
          )}

          {notifications.length > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              onClick={handleClearAll}
              disabled={actionLoading}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderRadius: 2,
                borderColor: 'rgba(239,68,68,0.4)',
                '&:hover': { borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,0.08)' },
              }}
            >
              Clear all
            </Button>
          )}
        </Box>
      </Box>

      {/* Filter Tabs */}
      <Box display="flex" gap={1} mb={3} flexWrap="wrap">
        {[
          { key: 'all', label: `All Alerts (${notifications.length})` },
          { key: 'broadcasts', label: `📢 Admin Broadcasts (${broadcastNotifications.length})`, color: '#f59e0b' },
          { key: 'sos', label: `🚨 SOS Alerts (${sosNotifications.length})`, color: '#ef4444' },
        ].map((tab) => (
          <Button
            key={tab.key}
            size="small"
            variant={activeTab === tab.key ? 'contained' : 'outlined'}
            onClick={() => setActiveTab(tab.key as any)}
            sx={{
              borderRadius: 2,
              fontWeight: 600,
              textTransform: 'none',
              fontSize: 13,
              backgroundColor: activeTab === tab.key ? (tab.color || '#6366f1') : 'transparent',
              borderColor: activeTab === tab.key ? (tab.color || '#6366f1') : 'rgba(255,255,255,0.15)',
              color: activeTab === tab.key ? '#fff' : '#9ca3af',
              '&:hover': {
                backgroundColor: activeTab === tab.key ? (tab.color || '#6366f1') : 'rgba(255,255,255,0.05)',
                borderColor: tab.color || '#6366f1',
              },
            }}
          >
            {tab.label}
          </Button>
        ))}
      </Box>

      {/* Pinned Official Admin Announcement banner if broadcasts exist */}
      {broadcastNotifications.length > 0 && activeTab !== 'sos' && (
        <Card
          sx={{
            mb: 3,
            background: 'linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.04))',
            border: '1px solid rgba(245,158,11,0.35)',
            borderRadius: 3,
            boxShadow: '0 4px 20px rgba(245,158,11,0.08)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1} flexWrap="wrap" gap={1}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 2,
                    background: 'rgba(245,158,11,0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#f59e0b',
                  }}
                >
                  <CampaignIcon fontSize="small" />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#fbbf24">
                    📢 Latest Admin Announcement: {broadcastNotifications[0].title}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Broadcasted to all travelers • {timeAgo(broadcastNotifications[0].createdAt)}
                  </Typography>
                </Box>
              </Box>

              <Chip
                label="OFFICIAL BROADCAST"
                size="small"
                sx={{
                  backgroundColor: 'rgba(245,158,11,0.2)',
                  color: '#fbbf24',
                  border: '1px solid #f59e0b',
                  fontWeight: 700,
                  fontSize: 10,
                }}
              />
            </Box>

            <Typography variant="body2" sx={{ color: '#e5e7eb', pl: 6, lineHeight: 1.6, fontSize: 14 }}>
              {broadcastNotifications[0].body || '(No message body provided)'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : filteredNotifications.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 56, mb: 2 }}>🔔</Typography>
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No notifications found</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>
              {activeTab === 'broadcasts'
                ? 'No admin broadcasts found.'
                : activeTab === 'sos'
                ? 'No SOS alerts logged.'
                : 'You are all caught up!'}
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {filteredNotifications.map((notification, index) => {
              const config = getConfig(notification.type);
              const isBroadcast = notification.type.includes('announcement') || notification.type.includes('broadcast');

              return (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      px: 2.5,
                      py: 2,
                      cursor: 'pointer',
                      backgroundColor: isBroadcast
                        ? 'rgba(245,158,11,0.04)'
                        : notification.isRead
                        ? 'transparent'
                        : 'rgba(99,102,241,0.06)',
                      borderLeft: isBroadcast
                        ? '4px solid #f59e0b'
                        : notification.isRead
                        ? '4px solid transparent'
                        : '4px solid #6366f1',
                      transition: 'background-color 0.2s',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          backgroundColor: config.color + '22',
                          border: `1.5px solid ${config.color}55`,
                          color: config.color,
                          width: 44,
                          height: 44,
                        }}
                      >
                        {config.icon}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap', gap: 1 }}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f9fafb', fontSize: 15 }}>
                              {notification.title}
                            </Typography>
                            <Chip
                              label={config.label}
                              size="small"
                              sx={{
                                backgroundColor: config.color + '22',
                                color: config.color,
                                border: `1px solid ${config.color}44`,
                                fontWeight: 600,
                                fontSize: 10,
                                height: 20,
                              }}
                            />
                            {!notification.isRead && (
                              <Chip
                                label="NEW"
                                size="small"
                                sx={{
                                  backgroundColor: 'rgba(244,63,94,0.2)',
                                  color: '#f43f5e',
                                  border: '1px solid rgba(244,63,94,0.4)',
                                  fontWeight: 800,
                                  fontSize: 9,
                                  height: 18,
                                }}
                              />
                            )}
                          </Box>

                          <Typography variant="caption" sx={{ color: '#6b7280' }}>
                            {timeAgo(notification.createdAt)}
                          </Typography>
                        </Box>
                      }
                      secondary={
                        <Box>
                          {notification.body && (
                            <Typography variant="body2" sx={{ color: isBroadcast ? '#fef3c7' : '#d1d5db', mb: 1, lineHeight: 1.5, fontSize: 13 }}>
                              {notification.body}
                            </Typography>
                          )}
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, mt: 0.5 }}>
                            {!notification.isRead && (
                              <Button
                                size="small"
                                startIcon={
                                  markingId === notification.id ? (
                                    <CircularProgress size={12} />
                                  ) : (
                                    <MarkEmailReadIcon sx={{ fontSize: 14 }} />
                                  )
                                }
                                onClick={(e) => handleMarkRead(notification.id, e)}
                                disabled={markingId === notification.id}
                                sx={{
                                  color: '#818cf8',
                                  textTransform: 'none',
                                  fontSize: 12,
                                  py: 0.3,
                                  px: 1.2,
                                  borderRadius: 1.5,
                                  backgroundColor: 'rgba(99,102,241,0.08)',
                                  '&:hover': { backgroundColor: 'rgba(99,102,241,0.18)' },
                                }}
                              >
                                Mark as read
                              </Button>
                            )}

                            <Tooltip title="Delete notification">
                              <IconButton
                                size="small"
                                onClick={(e) => handleDelete(notification.id, e)}
                                disabled={deletingId === notification.id}
                                sx={{
                                  color: '#6b7280',
                                  p: 0.5,
                                  '&:hover': { color: '#ef4444', backgroundColor: 'rgba(239,68,68,0.1)' },
                                }}
                              >
                                {deletingId === notification.id ? (
                                  <CircularProgress size={14} sx={{ color: '#ef4444' }} />
                                ) : (
                                  <DeleteOutlineIcon sx={{ fontSize: 17 }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < filteredNotifications.length - 1 && (
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
                  )}
                </React.Fragment>
              );
            })}
          </List>
        </Card>
      )}
    </Box>
  );
};

export default UserNotifications;
