import React, { useState, useEffect } from 'react';
import { Box, Paper, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, TextField, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, CircularProgress } from '@mui/material';
import { Map as TripIcon, Speed as SpeedIcon, AccessTime as TimeIcon, Navigation as DistanceIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const TripsDashboard: React.FC = () => {
  const [stats, setStats] = useState<any>({
    totalTrips: 0,
    totalDistance: 0,
    averageDuration: 0,
    averageSpeed: 38.5,
  });

  const [trips, setTrips] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [tripDetails, setTripDetails] = useState<any | null>(null);

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/admin/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load admin stats:', err.message);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await apiClient.get('/admin/trips', { params });
      if (response.data.success) {
        setTrips(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load trips:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const handleInspectTrip = async (tripId: string) => {
    setOpenDialog(true);
    setLoadingDetails(true);
    setTripDetails(null);
    try {
      const response = await apiClient.get(`/admin/trips/${tripId}`);
      if (response.data.success) {
        setTripDetails(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load trip details:', err.message);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Generate dynamic Leaflet HTML embed showing OpenStreetMap with polyline paths
  const getMapIframeSrcDoc = (trip: any) => {
    if (!trip) return '';
    const srcLat = trip.sourceLatitude;
    const srcLon = trip.sourceLongitude;
    const destLat = trip.destinationLatitude;
    const destLon = trip.destinationLongitude;
    
    // Map database locations array to lat/lng leaflet objects
    const pathCoordinates = trip.locations && trip.locations.length > 0
      ? trip.locations.map((loc: any) => [loc.latitude, loc.longitude])
      : [[srcLat, srcLon], [destLat, destLon]];

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #0b0f19; }
          .leaflet-container { font-family: sans-serif; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${srcLat}, ${srcLon}], 13);
          
          L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; OpenStreetMap contributors'
          }).addTo(map);

          setTimeout(function() { map.invalidateSize(); }, 250);

          // Add Start and End markers
          var startMarker = L.marker([${srcLat}, ${srcLon}]).addTo(map).bindPopup("<b>Start Point</b><br/>${trip.sourceAddress}");
          var endMarker = L.marker([${destLat}, ${destLon}]).addTo(map).bindPopup("<b>Destination</b><br/>${trip.destinationAddress}");

          // Draw the tracking polyline route
          var coordinates = ${JSON.stringify(pathCoordinates)};
          if (coordinates && coordinates.length > 0) {
            var polyline = L.polyline(coordinates, {
              color: '#6366f1', 
              weight: 5,
              opacity: 0.8
            }).addTo(map);
            map.fitBounds(polyline.getBounds());
          }
        </script>
      </body>
      </html>
    `;
  };

  const getStatusChipColor = (status: string) => {
    switch (status) {
      case 'active': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'paused': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Trips & Route Audits
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor live active journeys, audit historical commutes, and track distance analytics.
        </Typography>
      </Box>

      {/* Analytics Summary Grid */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>
                <TripIcon color="primary" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Trips</Typography>
                <Typography variant="h5" fontWeight="bold">{stats.totalTrips}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
                <DistanceIcon color="success" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total Distance</Typography>
                <Typography variant="h5" fontWeight="bold">{stats.totalDistance.toFixed(1)} km</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2 }}>
                <TimeIcon color="warning" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Avg Duration</Typography>
                <Typography variant="h5" fontWeight="bold">{Math.ceil(stats.averageDuration)} mins</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
                <SpeedIcon color="error" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Avg Speed</Typography>
                <Typography variant="h5" fontWeight="bold">{stats.averageSpeed.toFixed(0)} km/h</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter Toolbar */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #1f2937' }}>
        <TextField
          select
          size="small"
          label="Trip Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="all">All Trips</MenuItem>
          <MenuItem value="active">Active Trackers</MenuItem>
          <MenuItem value="paused">Paused Trackers</MenuItem>
          <MenuItem value="completed">Completed Trips</MenuItem>
          <MenuItem value="cancelled">Cancelled Trips</MenuItem>
        </TextField>
        <Button variant="contained" onClick={() => { fetchStats(); fetchTrips(); }}>
          Refresh
        </Button>
      </Paper>

      {/* Trips Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>User Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trip Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Destination</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Est. Distance</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Est. Duration</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading journeys logs...
                </TableCell>
              </TableRow>
            ) : trips.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No matching user journeys found.
                </TableCell>
              </TableRow>
            ) : (
              trips.map((trip) => (
                <TableRow key={trip.tripId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{trip.user?.fullName}</TableCell>
                  <TableCell>{trip.tripName}</TableCell>
                  <TableCell>{trip.destinationAddress.split(',')[0]}</TableCell>
                  <TableCell>{trip.estimatedDistance.toFixed(1)} km</TableCell>
                  <TableCell>{Math.ceil(trip.estimatedDuration)} mins</TableCell>
                  <TableCell>
                    <Chip label={trip.status.toUpperCase()} color={getStatusChipColor(trip.status)} size="small" />
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" variant="outlined" onClick={() => handleInspectTrip(trip.tripId)}>
                      Inspect Route
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Inspect Route Dialog with dynamic Leaflet IFrame Map */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Safe Travel Path Audit: {tripDetails?.tripName}
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#111827', p: 0 }}>
          {loadingDetails ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
              <CircularProgress />
            </Box>
          ) : !tripDetails ? (
            <Box p={3}>
              <Typography color="error">Failed to retrieve trip route logs.</Typography>
            </Box>
          ) : (
            <Box>
              {/* Telemetry info row */}
              <Box p={2.5} sx={{ borderBottom: '1px solid #1f2937', backgroundColor: '#0b0f19', display: 'flex', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Traveler: {tripDetails.user?.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">Contact: {tripDetails.user?.phone}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary">{tripDetails.estimatedDistance.toFixed(1)} km</Typography>
                  <Typography variant="body2" color="text.secondary">Est. Duration: {Math.ceil(tripDetails.estimatedDuration)} min</Typography>
                </Box>
              </Box>

              {/* Dynamic Leaflet Map IFrame */}
              <Box style={{ height: 400, width: '100%' }}>
                <iframe
                  title="OpenStreetMap Router"
                  srcDoc={getMapIframeSrcDoc(tripDetails)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close Audit</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TripsDashboard;
