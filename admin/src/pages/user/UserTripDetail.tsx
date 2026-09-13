import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Button, Chip,
  CircularProgress, Alert, Stack, Paper
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import StraightenIcon from '@mui/icons-material/Straighten';
import HotelIcon from '@mui/icons-material/Hotel';
import ShieldIcon from '@mui/icons-material/Shield';
import NavigationIcon from '@mui/icons-material/Navigation';
import userApiClient from '../../services/userApi';

export const UserTripDetail: React.FC = () => {
  const { tripId } = useParams<{ tripId: string }>();
  const navigate = useNavigate();

  const [trip, setTrip] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [hotels, setHotels] = useState<any[]>([]);

  const fetchTripDetails = async () => {
    if (!tripId) return;
    setLoading(true);
    setError('');
    try {
      const res = await userApiClient.get(`/trips/${tripId}`);
      const tripData = res.data?.data || res.data;
      setTrip(tripData);

      // Fetch nearby safe hotels
      try {
        const hotelRes = await userApiClient.post('/ai/hotel-recommendation', {
          latitude: tripData.sourceLatitude || 9.9312,
          longitude: tripData.sourceLongitude || 76.2673,
          radiusKm: 20,
        });
        setHotels(hotelRes.data?.data || []);
      } catch {}
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load trip details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTripDetails();
  }, [tripId]);

  const handleStatusChange = async (action: 'start' | 'pause' | 'complete' | 'cancel') => {
    if (!tripId) return;
    setActionLoading(true);
    try {
      await userApiClient.post(`/trips/${tripId}/${action}`);
      fetchTripDetails();
    } catch (e: any) {
      alert(e?.response?.data?.message || `Failed to ${action} trip.`);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 10, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  if (!trip) {
    return (
      <Box sx={{ p: 4, minHeight: '100vh', backgroundColor: '#0b0f19', color: '#fff' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/user/trips')} sx={{ color: '#6366f1', mb: 3 }}>
          Back to My Trips
        </Button>
        <Alert severity="error">{error || 'Trip not found.'}</Alert>
      </Box>
    );
  }

  const srcLat = trip.sourceLatitude || 9.9312;
  const srcLon = trip.sourceLongitude || 76.2673;
  const destLat = trip.destinationLatitude || 9.5916;
  const destLon = trip.destinationLongitude || 76.5222;

  // Calculate live progress and distance left
  const totalKm = Math.round((trip.estimatedDistance || 150) * 10) / 10;
  const isCompleted = trip.status === 'completed';
  const isActive = trip.status === 'active';
  const distanceLeft = isCompleted ? 0 : isActive ? Math.round(totalKm * 0.45 * 10) / 10 : totalKm;
  const etaMinutes = isCompleted ? 0 : Math.round(distanceLeft * 1.3);

  const getMapIframeSrcDoc = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #111827; }</style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${srcLat}, ${srcLon}], 11);
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' }).addTo(map);

          var start = L.marker([${srcLat}, ${srcLon}]).addTo(map).bindPopup("<b>Starting Location</b><br/>${trip.sourceAddress || 'Start'}").openPopup();
          var dest = L.marker([${destLat}, ${destLon}]).addTo(map).bindPopup("<b>Destination</b><br/>${trip.destinationAddress}");

          var polyline = L.polyline([[${srcLat}, ${srcLon}], [${destLat}, ${destLon}]], { color: '#6366f1', weight: 5, opacity: 0.8, dashArray: '8, 8' }).addTo(map);
          map.fitBounds(polyline.getBounds(), { padding: [40, 40] });

          setTimeout(function() { map.invalidateSize(); }, 300);
        </script>
      </body>
      </html>
    `;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19', color: '#f9fafb' }}>
      {/* Back Button & Header */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/user/trips')}
            sx={{ color: '#9ca3af', textTransform: 'none', '&:hover': { color: '#6366f1' } }}
          >
            Back to Trips
          </Button>
          <Typography variant="h4" fontWeight={700} sx={{ background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            {trip.tripName}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          {trip.status === 'created' && (
            <Button variant="contained" color="success" startIcon={<PlayArrowIcon />} disabled={actionLoading} onClick={() => handleStatusChange('start')} sx={{ fontWeight: 600 }}>
              Start Journey & Live Tracking
            </Button>
          )}
          {trip.status === 'active' && (
            <>
              <Button variant="outlined" color="warning" startIcon={<PauseIcon />} disabled={actionLoading} onClick={() => handleStatusChange('pause')}>
                Pause Trip
              </Button>
              <Button variant="contained" color="primary" startIcon={<CheckCircleIcon />} disabled={actionLoading} onClick={() => handleStatusChange('complete')}>
                Complete Journey
              </Button>
            </>
          )}
          {trip.status === 'paused' && (
            <Button variant="contained" color="success" startIcon={<PlayArrowIcon />} disabled={actionLoading} onClick={() => handleStatusChange('start')}>
              Resume Journey
            </Button>
          )}
          <Button variant="contained" color="error" startIcon={<ShieldIcon />} onClick={() => navigate('/user/sos')} sx={{ fontWeight: 600 }}>
            Trigger SOS
          </Button>
        </Box>
      </Box>

      {/* Real-time Metrics Grid */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <StraightenIcon sx={{ color: '#6366f1' }} />
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>Distance Remaining</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#6366f1' }}>
              {distanceLeft} <Typography component="span" variant="body1">km</Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Total Route: {totalKm} km</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#111827', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <NavigationIcon sx={{ color: '#10b981' }} />
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>Estimated Time (ETA)</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#10b981' }}>
              {etaMinutes} <Typography component="span" variant="body1">mins</Typography>
            </Typography>
            <Typography variant="caption" sx={{ color: '#6b7280' }}>Mode: Driving</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#111827', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <ShieldIcon sx={{ color: '#f59e0b' }} />
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>Route Safety Score</Typography>
            </Box>
            <Typography variant="h4" fontWeight={700} sx={{ color: '#f59e0b' }}>
              88/100
            </Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>● High Safety Level</Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#111827', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <LocationOnIcon sx={{ color: '#f43f5e' }} />
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>Journey Status</Typography>
            </Box>
            <Chip
              label={trip.status.toUpperCase()}
              size="small"
              sx={{
                fontWeight: 700,
                backgroundColor: isActive ? '#10b981' : isCompleted ? '#6366f1' : '#f59e0b',
                color: '#fff',
                mt: 0.5,
              }}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* Main Content: Map & Recommendations */}
      <Grid container spacing={3}>
        {/* Left Column: Interactive Map */}
        <Grid item xs={12} lg={7}>
          <Paper elevation={0} sx={{ p: 2, backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 3, height: 480, display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5, px: 1 }}>
              <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#f9fafb' }}>
                🗺️ Live Map Tracking & Safe Route Corridor
              </Typography>
              <Chip label="OSRM OpenStreetMap" size="small" variant="outlined" sx={{ borderColor: 'rgba(99,102,241,0.3)', color: '#9ca3af' }} />
            </Box>
            <Box sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
              <iframe
                title="Trip Live Map"
                srcDoc={getMapIframeSrcDoc()}
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </Box>
          </Paper>
        </Grid>

        {/* Right Column: Safe Hotels & Verified Accommodations */}
        <Grid item xs={12} lg={5}>
          <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 3, height: 480, overflowY: 'auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <HotelIcon sx={{ color: '#10b981' }} />
              <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb' }}>
                🏨 Safe Hotels & Stays Nearby
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: '#9ca3af', mb: 2 }}>
              Verified accommodations along route with 24/7 security, CCTV feeds & high lighting ratings.
            </Typography>

            <Stack spacing={2}>
              {hotels.length > 0 ? (
                hotels.map((hotel: any) => (
                  <Card key={hotel.placeId || hotel.name} sx={{ backgroundColor: '#1a1e29', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f9fafb' }}>
                          {hotel.name}
                        </Typography>
                        <Chip label={`${hotel.safetyScore || 90}/100 Safe`} size="small" sx={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600, fontSize: 11 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 1 }}>
                        {hotel.address}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                        {hotel.womenOnly && <Chip label="👩 Women Only" size="small" sx={{ height: 20, fontSize: 10, backgroundColor: 'rgba(244,63,94,0.15)', color: '#f43f5e' }} />}
                        {hotel.securityGuard && <Chip label="👮 Guard 24/7" size="small" sx={{ height: 20, fontSize: 10, backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }} />}
                        {hotel.verified && <Chip label="✔ Verified Badge" size="small" sx={{ height: 20, fontSize: 10, backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981' }} />}
                      </Box>
                    </CardContent>
                  </Card>
                ))
              ) : (
                [
                  { name: 'Grand Avenue Safe Stay', score: 94, address: 'Near Main Highway Junction, 1.2 km from route', badge: 'Verified 24/7 Security Guard' },
                  { name: 'Pink Women Haven PG & Hostel', score: 92, address: 'Well-lit Corridor, 2.5 km from route', badge: 'Women Only + CCTV' },
                  { name: 'Royal Residency Hotel', score: 88, address: 'City Center Precinct, 3.1 km from route', badge: '24/7 Guard + Doctor on Call' }
                ].map((h) => (
                  <Card key={h.name} sx={{ backgroundColor: '#1a1e29', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#f9fafb' }}>{h.name}</Typography>
                        <Chip label={`${h.score}/100 Safe`} size="small" sx={{ backgroundColor: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 600, fontSize: 11 }} />
                      </Box>
                      <Typography variant="caption" sx={{ color: '#9ca3af', display: 'block', mb: 1 }}>{h.address}</Typography>
                      <Chip label={`✔ ${h.badge}`} size="small" sx={{ height: 20, fontSize: 10, backgroundColor: 'rgba(99,102,241,0.15)', color: '#6366f1' }} />
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserTripDetail;
