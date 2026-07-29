import React, { useState, useEffect } from 'react';
import { Box, Paper, Grid, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import { Warning as AlertIcon, CheckCircle as StatusIcon, FlashOn as TriggerIcon, Info as InfoIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const LiveAlertsDashboard: React.FC = () => {
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [resolvedAlerts, setResolvedAlerts] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>({
    totalSOS: 0,
    activeSOS: 0,
    resolvedSOS: 0,
    cancelledSOS: 0,
  });
  const [selectedAlert, setSelectedAlert] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [resolveName, setResolveName] = useState('');
  const [resolving, setResolving] = useState(false);

  // Wait! To feed real data into this dashboard, let's first check if we need an administration endpoint for alerts.
  // Yes! Let's write GET `/api/admin/alerts` returning all SOSAlerts! This is incredibly robust!
  // Let's do that right after. For now, let's write the frontend component assuming the REST endpoints exist.
  
  const fetchRealAlerts = async () => {
    try {
      const response = await apiClient.get('/admin/alerts');
      if (response.data.success) {
        const list = response.data.data;
        const active = list.filter((item: any) => item.status === 'active');
        const resolved = list.filter((item: any) => item.status === 'resolved' || item.status === 'cancelled');
        setActiveAlerts(active);
        setResolvedAlerts(resolved);

        setAnalytics({
          totalSOS: list.length,
          activeSOS: active.length,
          resolvedSOS: list.filter((item: any) => item.status === 'resolved').length,
          cancelledSOS: list.filter((item: any) => item.status === 'cancelled').length,
        });
      }
    } catch (err: any) {
      console.warn('Failed to load real alerts list:', err.message);
    }
  };

  useEffect(() => {
    fetchRealAlerts();
    const interval = setInterval(fetchRealAlerts, 3000); // Poll every 3 seconds for active emergencies!
    return () => clearInterval(interval);
  }, []);

  const handleResolveAlert = async () => {
    if (!resolveName.trim() || !selectedAlert) return;
    setResolving(true);
    try {
      const response = await apiClient.post(`/sos/${selectedAlert.sosId}/resolve`, {
        resolvedBy: resolveName,
      });
      if (response.data.success) {
        setOpenDialog(false);
        setResolveName('');
        fetchRealAlerts();
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to resolve emergency alert');
    } finally {
      setResolving(false);
    }
  };

  const getMapIframeSrcDoc = (alertItem: any) => {
    if (!alertItem) return '';
    const lat = alertItem.latitude;
    const lon = alertItem.longitude;
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          html, body, #map { height: 100%; margin: 0; padding: 0; background: #0b0f19; }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          var map = L.map('map').setView([${lat}, ${lon}], 14);
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '© OpenStreetMap contributors'
          }).addTo(map);

          L.marker([${lat}, ${lon}]).addTo(map)
            .bindPopup("<b>Traveler: ${alertItem.user?.fullName}</b><br/>Type: ${alertItem.emergencyType.toUpperCase()}")
            .openPopup();
        </script>
      </body>
      </html>
    `;
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom color="error">
          🚨 Active Safety Alarms
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor real-time SOS broadcasts, inspect tracker telemetry, and coordinate dispatch responses.
        </Typography>
      </Box>

      {/* Analytics Summary */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 2 }}>
                <AlertIcon color="error" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Active Alarms</Typography>
                <Typography variant="h5" fontWeight="bold" color="error">{analytics.activeSOS}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 2 }}>
                <StatusIcon color="success" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Resolved Cases</Typography>
                <Typography variant="h5" fontWeight="bold" color="success">{analytics.resolvedSOS}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', borderRadius: 2 }}>
                <TriggerIcon color="warning" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Cancelled Alerts</Typography>
                <Typography variant="h5" fontWeight="bold" color="warning">{analytics.cancelledSOS}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ border: '1px solid #1f2937', borderRadius: 3, backgroundColor: '#111827' }}>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box p={1.5} sx={{ backgroundColor: 'rgba(99, 102, 241, 0.1)', borderRadius: 2 }}>
                <InfoIcon color="primary" />
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Total SOS Alarms</Typography>
                <Typography variant="h5" fontWeight="bold">{analytics.totalSOS}</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Active Emergencies Table */}
      <Typography variant="h5" fontWeight="bold" mb={2} color="error">
        ⚠️ Active Dispatch Queue
      </Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid #ef4444', borderRadius: 3, mb: 4, backgroundColor: '#0f0b0b' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Traveler</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Emergency Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger Channel</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger Time</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {activeAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No active emergency alarms. System is secure.
                </TableCell>
              </TableRow>
            ) : (
              activeAlerts.map((item) => (
                <TableRow key={item.sosId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{item.user?.fullName}</TableCell>
                  <TableCell>
                    <Chip label={item.emergencyType.toUpperCase()} color="error" size="small" />
                  </TableCell>
                  <TableCell>{item.triggeredBy.toUpperCase()}</TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleTimeString()}</TableCell>
                  <TableCell>{item.address.split(',')[0]}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => {
                        setSelectedAlert(item);
                        setOpenDialog(true);
                      }}
                    >
                      Resolve Alarm
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resolved Alarms Table */}
      <Typography variant="h5" fontWeight="bold" mb={2}>
        📁 Safety Resolution Logs
      </Typography>
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Traveler</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Alarm Type</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Resolved By / Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {resolvedAlerts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No resolved emergency entries.
                </TableCell>
              </TableRow>
            ) : (
              resolvedAlerts.map((item) => (
                <TableRow key={item.sosId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{item.user?.fullName}</TableCell>
                  <TableCell>{item.emergencyType.toUpperCase()}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.status.toUpperCase()}
                      color={item.status === 'resolved' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {item.status === 'resolved'
                      ? `Resolved by: ${item.resolvedBy}`
                      : `Cancelled: "${item.cancelledReason || 'No details'}"`}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Resolve Dialog Modal with Leaflet tracker map */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', color: '#ef4444' }}>
          🚨 Dispatch Center: Inspect Emergency Details
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#111827', p: 0 }}>
          {selectedAlert && (
            <Box>
              <Box p={3} display="flex" justifyContent="space-between" sx={{ borderBottom: '1px solid #1f2937', backgroundColor: '#0b0f19' }}>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">Traveler: {selectedAlert.user?.fullName}</Typography>
                  <Typography variant="body2" color="text.secondary">Contact Number: {selectedAlert.user?.phone}</Typography>
                  <Typography variant="body2" color="text.secondary">Blood Group: {selectedAlert.user?.bloodGroup || 'Not Provided'}</Typography>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="subtitle1" fontWeight="bold">Trigger Type: {selectedAlert.emergencyType.toUpperCase()}</Typography>
                  <Typography variant="body2" color="text.secondary">Source: {selectedAlert.triggeredBy.toUpperCase()}</Typography>
                </Box>
              </Box>

              {/* Leaflet IFrame Map */}
              <Box style={{ height: 350, width: '100%' }}>
                <iframe
                  title="SOS Interactive Tracker Map"
                  srcDoc={getMapIframeSrcDoc(selectedAlert)}
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              </Box>

              <Box p={3}>
                <Typography variant="subtitle2" color="text.secondary" mb={1}>
                  Operator Resolution Action Note (Officer Name or Dispatch ID)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  label="Resolving Agent Name"
                  value={resolveName}
                  onChange={(e) => setResolveName(e.target.value)}
                  placeholder="e.g. Officer Davis, Unit 4 Dispatched"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel Inspect</Button>
          <Button
            variant="contained"
            color="success"
            onClick={handleResolveAlert}
            disabled={resolving || !resolveName.trim()}
          >
            {resolving ? <CircularProgress size={20} color="inherit" /> : 'Mark Resolved'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LiveAlertsDashboard;
