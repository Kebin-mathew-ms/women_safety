import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Stack,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StraightenIcon from '@mui/icons-material/Straighten';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import userApiClient from '../../services/userApi';

interface Trip {
  id?: string;
  tripId?: string;
  tripName: string;
  destinationAddress: string;
  sourceAddress: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  estimatedDistance: number;
}


export const UserTrips: React.FC = () => {
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ tripName: '', sourceAddress: '', destinationAddress: '' });

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get('/trips');
      setTrips(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch trips.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleCreate = async () => {
    if (!form.tripName || !form.destinationAddress) return;
    setCreating(true);
    setError('');
    setSuccess('');

    let srcLat = 8.5241;
    let srcLon = 76.9366;
    let srcAddr = form.sourceAddress.trim();

    if (!srcAddr && navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        srcLat = pos.coords.latitude;
        srcLon = pos.coords.longitude;
        srcAddr = `Live GPS: ${srcLat.toFixed(4)}, ${srcLon.toFixed(4)}`;
      } catch {
        srcAddr = 'Trivandrum';
      }
    }
    if (!srcAddr) srcAddr = 'Trivandrum';

    try {
      await userApiClient.post('/trips', {
        tripName: form.tripName,
        sourceAddress: srcAddr,
        destinationAddress: form.destinationAddress,
        sourceLatitude: srcLat,
        sourceLongitude: srcLon,
        destinationLatitude: 0,
        destinationLongitude: 0,
        estimatedDistance: 0,
      });
      setSuccess('Trip created successfully!');
      setForm({ tripName: '', sourceAddress: '', destinationAddress: '' });
      fetchTrips();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create trip.');
    } finally {
      setCreating(false);
    }
  };

  const getStatusChipSx = (status: string) => {
    if (status === 'active') return { backgroundColor: '#10b981', color: '#fff' };
    if (status === 'completed') return { backgroundColor: '#6366f1', color: '#fff' };
    if (status === 'cancelled') return { backgroundColor: '#ef4444', color: '#fff' };
    return {};
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #f43f5e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          My Trips & Journeys
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Track and manage all your travel journeys in one place.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Create Trip Form */}
      <Card
        sx={{
          backgroundColor: '#111827',
          border: '1px solid rgba(99,102,241,0.25)',
          borderRadius: 3,
          mb: 4,
          boxShadow: '0 4px 24px rgba(99,102,241,0.08)',
        }}
      >
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2 }}>
            ✈️  Plan a New Trip
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Trip Name"
                value={form.tripName}
                onChange={(e) => setForm((f) => ({ ...f, tripName: e.target.value }))}
                variant="outlined"
                InputLabelProps={{ style: { color: '#9ca3af' } }}
                InputProps={{ style: { color: '#f9fafb' } }}
                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Starting Location"
                placeholder="Leave blank for live GPS location"
                value={form.sourceAddress}
                onChange={(e) => setForm((f) => ({ ...f, sourceAddress: e.target.value }))}
                variant="outlined"
                InputLabelProps={{ style: { color: '#9ca3af' } }}
                InputProps={{ style: { color: '#f9fafb' } }}
                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Destination Address"
                value={form.destinationAddress}
                onChange={(e) => setForm((f) => ({ ...f, destinationAddress: e.target.value }))}
                variant="outlined"
                InputLabelProps={{ style: { color: '#9ca3af' } }}
                InputProps={{ style: { color: '#f9fafb' } }}
                sx={{ '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' }, '&:hover fieldset': { borderColor: '#6366f1' }, '&.Mui-focused fieldset': { borderColor: '#6366f1' } } }}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={creating ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                onClick={handleCreate}
                disabled={creating || !form.tripName || !form.destinationAddress}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {creating ? 'Creating...' : 'Create Trip'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Trips List */}
      <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2 }}>
        My Trips
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : trips.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <FlightTakeoffIcon sx={{ fontSize: 56, color: '#6366f1', mb: 2, opacity: 0.5 }} />
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No trips yet</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Create your first trip above to get started.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {trips.map((trip) => (
            <Grid item xs={12} sm={6} md={4} key={trip.id}>
              <Card
                onClick={() => navigate(`/user/trips/${trip.tripId || trip.id}`)}
                sx={{
                  backgroundColor: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 3,
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(99,102,241,0.2)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f9fafb', flex: 1 }}>
                      {trip.tripName}
                    </Typography>
                    <Chip
                      label={trip.status}
                      size="small"
                      sx={{ ...getStatusChipSx(trip.status), fontWeight: 600, textTransform: 'capitalize', ml: 1 }}
                    />
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ fontSize: 16, color: '#f43f5e' }} />
                      <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>
                        {trip.destinationAddress}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StraightenIcon sx={{ fontSize: 16, color: '#6366f1' }} />
                      <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>
                        {Math.round((trip.estimatedDistance || 0) * 10) / 10} km
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CalendarTodayIcon sx={{ fontSize: 14, color: '#9ca3af' }} />
                      <Typography variant="body2" sx={{ color: '#6b7280', fontSize: 12 }}>
                        {new Date(trip.createdAt).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UserTrips;
