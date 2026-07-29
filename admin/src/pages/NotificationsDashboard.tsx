import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, MenuItem, Chip } from '@mui/material';
import { Campaign as BroadcastIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const NotificationsDashboard: React.FC = () => {
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('medium');
  const [type, setType] = useState('admin_announcement');
  const [sending, setSending] = useState(false);

  const [alerts, setAlerts] = useState<any[]>([]);

  const fetchAlertLogs = async () => {
    try {
      const response = await apiClient.get('/admin/alerts');
      if (response.data.success) {
        setAlerts(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load alert logs:', err.message);
    }
  };

  useEffect(() => {
    fetchAlertLogs();
  }, []);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      await apiClient.post('/admin/broadcast', {
        title,
        message,
        type,
        priority,
      });
      alert('Broadcast announcement published successfully to all active travelers!');
      setTitle('');
      setMessage('');
    } catch (err: any) {
      alert('Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          📯 Safety Announcements & System Broadcasts
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Dispatch critical security alerts, weather storms warnings, or system maintenance updates to all registered mobile app users instantly.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, border: '1px solid #1f2937', borderRadius: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>
              Create Broadcast
            </Typography>
            <form onSubmit={handleBroadcast}>
              <TextField
                fullWidth
                label="Alert Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                required
              />
              <TextField
                fullWidth
                label="Alert Message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                margin="normal"
                multiline
                rows={4}
                required
              />
              <TextField
                select
                fullWidth
                label="Notification Type"
                value={type}
                onChange={(e) => setType(e.target.value)}
                margin="normal"
              >
                <MenuItem value="admin_announcement">📣 Admin Announcement</MenuItem>
                <MenuItem value="weather_warning">⛈️ Weather Alert</MenuItem>
                <MenuItem value="traffic_warning">🚗 Traffic Update</MenuItem>
                <MenuItem value="emergency_updates">🆘 Emergency Update</MenuItem>
              </TextField>

              <TextField
                select
                fullWidth
                label="Priority Level"
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                margin="normal"
              >
                <MenuItem value="low">Low</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="critical">🚨 Critical Override</MenuItem>
              </TextField>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                startIcon={<BroadcastIcon />}
                disabled={sending}
                sx={{ mt: 3, py: 1.5 }}
              >
                {sending ? 'Dispatching...' : 'Dispatch Broadcast'}
              </Button>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={7}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            🚨 Triggered SOS Alerts Log History
          </Typography>
          <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 600 }}>Traveler</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Contact Info</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Trigger Mode</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {alerts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                      No active emergency alerts recorded.
                    </TableCell>
                  </TableRow>
                ) : (
                  alerts.map((item) => (
                    <TableRow key={item.sosId}>
                      <TableCell sx={{ fontWeight: 'medium' }}>{item.user?.fullName}</TableCell>
                      <TableCell>{item.user?.phone}</TableCell>
                      <TableCell>
                        <Chip label={item.triggeredBy.toUpperCase()} color="warning" size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip label={item.status.toUpperCase()} color={item.status === 'active' ? 'error' : 'default'} size="small" />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {item.address}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
};

export default NotificationsDashboard;
