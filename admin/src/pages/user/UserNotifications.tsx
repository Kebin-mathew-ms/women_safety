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
  Chip,
  Divider,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SosIcon from '@mui/icons-material/Sos';
import PlaceIcon from '@mui/icons-material/Place';
import CampaignIcon from '@mui/icons-material/Campaign';
import ForumIcon from '@mui/icons-material/Forum';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import userApiClient from '../../services/userApi';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  createdAt: string;
  isRead: boolean;
}

const typeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  sos: { icon: <SosIcon />, color: '#ef4444', label: 'SOS Alert' },
  trip: { icon: <PlaceIcon />, color: '#6366f1', label: 'Trip Update' },
  announcement: { icon: <CampaignIcon />, color: '#f59e0b', label: 'Announcement' },
  community: { icon: <ForumIcon />, color: '#10b981', label: 'Community' },
};

const getConfig = (type: string) =>
  typeConfig[type] ?? { icon: <NotificationsIcon />, color: '#9ca3af', label: type };

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
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [markingId, setMarkingId] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get('/notifications');
      setNotifications(res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch notifications.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: string) => {
    setMarkingId(id);
    try {
      await userApiClient.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => n.id === id ? { ...n, isRead: true } : n)
      );
    } catch (e) {
      // silent
    } finally {
      setMarkingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
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
            Stay informed about safety alerts and updates.
          </Typography>
        </Box>
        {unreadCount > 0 && (
          <Chip
            label={`${unreadCount} unread`}
            sx={{ backgroundColor: '#f43f5e', color: '#fff', fontWeight: 700, fontSize: 13 }}
          />
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : notifications.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 56, mb: 2 }}>🔔</Typography>
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No notifications</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>You are all caught up!</Typography>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 3, overflow: 'hidden' }}>
          <List disablePadding>
            {notifications.map((notification, index) => {
              const config = getConfig(notification.type);
              return (
                <React.Fragment key={notification.id}>
                  <ListItem
                    alignItems="flex-start"
                    sx={{
                      px: 2.5,
                      py: 2,
                      backgroundColor: notification.isRead ? 'transparent' : 'rgba(99,102,241,0.05)',
                      borderLeft: notification.isRead ? 'none' : '3px solid #6366f1',
                      transition: 'background-color 0.2s',
                      '&:hover': { backgroundColor: 'rgba(255,255,255,0.03)' },
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
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.3 }}>
                          <Typography variant="subtitle2" fontWeight={600} sx={{ color: '#f9fafb' }}>
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
                              height: 18,
                            }}
                          />
                        </Box>
                      }
                      secondary={
                        <Box>
                          <Typography variant="body2" sx={{ color: '#9ca3af', mb: 0.8, lineHeight: 1.5 }}>
                            {notification.body}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="caption" sx={{ color: '#6b7280' }}>
                              {timeAgo(notification.createdAt)}
                            </Typography>
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
                                onClick={() => handleMarkRead(notification.id)}
                                disabled={markingId === notification.id}
                                sx={{
                                  color: '#6366f1',
                                  textTransform: 'none',
                                  fontSize: 12,
                                  py: 0.3,
                                  px: 1,
                                  '&:hover': { backgroundColor: 'rgba(99,102,241,0.1)' },
                                }}
                              >
                                Mark as read
                              </Button>
                            )}
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                  {index < notifications.length - 1 && (
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
