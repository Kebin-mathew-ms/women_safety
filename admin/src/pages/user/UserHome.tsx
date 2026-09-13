import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, Button,
  CircularProgress, Alert
} from '@mui/material';
import {
  Map, TrendingUp, CheckCircle, Schedule
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import userApiClient from '../../services/userApi';

const statCard = (label: string, value: string | number, icon: React.ReactNode, color: string) => (
  <Card sx={{ background: `rgba(${color},0.08)`, border: `1px solid rgba(${color},0.2)`, borderRadius: 3 }}>
    <CardContent sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
      <Box sx={{ width: 44, height: 44, borderRadius: 2, background: `rgba(${color},0.15)`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: `rgb(${color})` }}>
        {icon}
      </Box>
      <Box>
        <Typography variant="h5" fontWeight="bold" color="text.primary">{value}</Typography>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
      </Box>
    </CardContent>
  </Card>
);

const quickActions = [
  { label: 'My Trips', icon: '🗺️', path: '/user/trips', color: '#6366f1' },
  { label: 'Safe Places', icon: '🛡️', path: '/user/safe-places', color: '#10b981' },
  { label: 'Report Hazard', icon: '⚠️', path: '/user/report', color: '#f59e0b' },
  { label: 'Community Feed', icon: '💬', path: '/user/community', color: '#06b6d4' },
  { label: 'AI Safety Chat', icon: '🤖', path: '/user/ai', color: '#8b5cf6' },
  { label: 'Wearable Device', icon: '⌚', path: '/user/wearable', color: '#f43f5e' },
  { label: 'Guardians', icon: '📞', path: '/user/contacts', color: '#10b981' },
  { label: 'My Profile', icon: '👤', path: '/user/profile', color: '#6366f1' },
];

export const UserHome: React.FC = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sosLoading, setSosLoading] = useState(false);
  const [sosSuccess, setSosSuccess] = useState(false);
  const [sosError, setSosError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      setUserName(profile.fullName?.split(' ')[0] || profile.name || 'User');
    } catch {}
    userApiClient.get('/trips').then(r => {
      if (r.data.success) setTrips(r.data.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const activeTrips = trips.filter(t => t.status === 'active' || t.status === 'paused');
  const completedTrips = trips.filter(t => t.status === 'completed');

  const handleQuickSOS = async () => {
    setSosLoading(true);
    setSosError(null);

    let lat = 9.9312;
    let lon = 76.2673;
    let addressStr = 'Triggered from Web Dashboard';

    if (navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 5000,
          });
        });
        lat = pos.coords.latitude;
        lon = pos.coords.longitude;
        addressStr = `Live GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`;
      } catch (geoErr) {
        console.warn('Geolocation capture fallback:', geoErr);
      }
    }

    try {
      await userApiClient.post('/sos', {
        latitude: lat,
        longitude: lon,
        address: addressStr,
        emergencyType: 'general',
        triggeredBy: 'user',
      });
      setSosSuccess(true);
      setTimeout(() => setSosSuccess(false), 5000);
    } catch (err: any) {
      setSosError(err.response?.data?.message || 'Failed to trigger SOS');
    } finally {
      setSosLoading(false);
    }
  };

  return (
    <Box sx={{ pb: 4 }}>
      {/* Welcome Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" color="text.primary">
            Hello, {userName} 👋
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Your personal safety dashboard — stay protected, stay informed.
          </Typography>
        </Box>
        <Chip label="● Live Protection Active" size="small"
          sx={{ backgroundColor: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid #10b981', fontWeight: 600, fontSize: 12 }} />
      </Box>

      {sosSuccess && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>🚨 SOS Alert sent! Emergency contacts and operators have been notified.</Alert>}
      {sosError && <Alert severity="error" onClose={() => setSosError(null)} sx={{ mb: 2, borderRadius: 2 }}>{sosError}</Alert>}

      {/* Active Trip Banner */}
      {activeTrips.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, borderRadius: 2, cursor: 'pointer' }} onClick={() => navigate('/user/trips')}>
          ⚠️ You have an <strong>active journey</strong>: {activeTrips[0].tripName} — Click to view live tracking.
        </Alert>
      )}

      {/* Stats Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}>
          {statCard('Total Trips', trips.length, <Map fontSize="small" />, '99,102,241')}
        </Grid>
        <Grid item xs={6} md={3}>
          {statCard('Active Journeys', activeTrips.length, <TrendingUp fontSize="small" />, '245,158,11')}
        </Grid>
        <Grid item xs={6} md={3}>
          {statCard('Completed', completedTrips.length, <CheckCircle fontSize="small" />, '16,185,129')}
        </Grid>
        <Grid item xs={6} md={3}>
          {statCard('Pending', trips.filter(t => t.status === 'pending').length, <Schedule fontSize="small" />, '6,182,212')}
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* SOS Button */}
        <Grid item xs={12} md={5}>
          <Card sx={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.15), rgba(244,63,94,0.05))', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 3, height: '100%' }}>
            <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260 }}>
              <Typography variant="h6" fontWeight="bold" mb={1} color="text.primary">🚨 Emergency SOS</Typography>
              <Typography variant="body2" color="text.secondary" textAlign="center" mb={3} maxWidth={220}>
                Instantly alert your guardians and dispatch operators with your location.
              </Typography>
              <Box
                component="button"
                onClick={handleQuickSOS}
                disabled={sosLoading}
                sx={{
                  width: 150, height: 150, borderRadius: '50%',
                  background: 'radial-gradient(circle, #f43f5e, #dc2626)',
                  border: '8px solid rgba(244,63,94,0.25)',
                  cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 0 40px rgba(244,63,94,0.4)',
                  '&:hover': { transform: 'scale(1.05)', boxShadow: '0 0 60px rgba(244,63,94,0.6)' },
                  '&:active': { transform: 'scale(0.97)' },
                  '&:disabled': { opacity: 0.6, cursor: 'not-allowed' },
                }}
              >
                {sosLoading ? <CircularProgress size={36} sx={{ color: '#fff' }} /> : (
                  <>
                    <Typography sx={{ fontSize: 44, fontWeight: 900, color: '#fff', letterSpacing: 2 }}>SOS</Typography>
                    <Typography sx={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>ONE TAP ALERT</Typography>
                  </>
                )}
              </Box>
              <Button variant="text" color="secondary" size="small" onClick={() => navigate('/user/sos')} sx={{ mt: 2, fontSize: 12 }}>
                View SOS History →
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={7}>
          <Typography variant="h6" fontWeight="bold" color="text.primary" mb={1.5}>Safety Center</Typography>
          <Grid container spacing={1.5}>
            {quickActions.map((action) => (
              <Grid item xs={6} sm={3} key={action.path}>
                <Card
                  onClick={() => navigate(action.path)}
                  sx={{
                    cursor: 'pointer', borderRadius: 2, border: '1px solid #1f2937',
                    transition: 'all 0.2s',
                    '&:hover': { border: `1px solid ${action.color}`, transform: 'translateY(-2px)', boxShadow: `0 8px 24px rgba(0,0,0,0.3)` },
                  }}
                >
                  <CardContent sx={{ p: 2, textAlign: 'center' }}>
                    <Typography sx={{ fontSize: 28, mb: 0.5 }}>{action.icon}</Typography>
                    <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{action.label}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Grid>

        {/* Recent Trips */}
        <Grid item xs={12}>
          <Card sx={{ borderRadius: 3, border: '1px solid #1f2937' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Recent Journeys</Typography>
                <Button size="small" color="primary" onClick={() => navigate('/user/trips')}>View All →</Button>
              </Box>
              {loading ? <CircularProgress size={24} /> : trips.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" py={3}>No trips recorded yet. <Button size="small" onClick={() => navigate('/user/trips')}>Plan your first trip →</Button></Typography>
              ) : (
                trips.slice(0, 3).map((trip) => (
                  <Box key={trip.tripId} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', py: 1.5, borderBottom: '1px solid #1f2937' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={600} color="text.primary">{trip.tripName}</Typography>
                      <Typography variant="caption" color="text.secondary">📍 {trip.destinationAddress}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="caption" color="text.muted">{new Date(trip.createdAt).toLocaleDateString()}</Typography>
                      <Chip label={trip.status} size="small" sx={{
                        fontSize: 10, fontWeight: 700,
                        backgroundColor: trip.status === 'active' ? 'rgba(245,158,11,0.12)' : trip.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(99,102,241,0.12)',
                        color: trip.status === 'active' ? '#f59e0b' : trip.status === 'completed' ? '#10b981' : '#6366f1',
                      }} />
                    </Box>
                  </Box>
                ))
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserHome;
