import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, LinearProgress } from '@mui/material';
import apiClient from '../services/api';

export const WearablesDashboard: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchWearableLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/wearable-telemetry');
      if (response.data.success) {
        setDevices(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load wearable telemetries:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWearableLogs();
  }, []);

  const getLogActionChip = (action: string) => {
    switch (action) {
      case 'fall_detected': return <Chip label="FALL DETECTED" color="error" size="small" />;
      case 'double_tap': return <Chip label="DOUBLE TAP SOS" color="warning" size="small" />;
      case 'connect': return <Chip label="CONNECT" color="success" size="small" />;
      case 'disconnect': return <Chip label="DISCONNECT" color="default" size="small" />;
      default: return <Chip label={action.toUpperCase()} size="small" />;
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ⌚ Smartwatch Diagnostics & Telemetry Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor paired smartwatches (WearOS / Custom Accessories), watch battery alerts, fall detections, and heartbeat sync logs.
        </Typography>
      </Box>

      {/* Wearable Diagnostics listing */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Device Accessory</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>MAC Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Owner Traveler</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Diagnostic State</TableCell>
              <TableCell sx={{ fontWeight: 600 }} width="15%">Accessory Battery</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Last Logged Event</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Loading watch telemetries...
                </TableCell>
              </TableRow>
            ) : devices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No smartwatches currently paired by active travelers.
                </TableCell>
              </TableRow>
            ) : (
              devices.map((item) => {
                const lastLog = item.logs?.[0];
                return (
                  <TableRow key={item.deviceId}>
                    <TableCell sx={{ fontWeight: 'medium' }}>
                      {item.deviceName} ({item.deviceType})
                    </TableCell>
                    <TableCell>{item.macAddress}</TableCell>
                    <TableCell>{item.user?.fullName}</TableCell>
                    <TableCell>
                      <Chip
                        label={item.connected ? 'ONLINE' : 'OFFLINE'}
                        color={item.connected ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LinearProgress
                          variant="determinate"
                          value={item.batteryLevel}
                          color={item.batteryLevel <= 20 ? 'error' : item.batteryLevel <= 50 ? 'warning' : 'success'}
                          sx={{ flexGrow: 1, height: 6, borderRadius: 3 }}
                        />
                        <Typography variant="caption" fontWeight="bold">
                          {item.batteryLevel.toFixed(0)}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {lastLog ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          {getLogActionChip(lastLog.action)}
                          <Typography variant="caption" color="text.secondary">
                            ({new Date(lastLog.triggeredAt).toLocaleTimeString()})
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          No alerts synced.
                        </Typography>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WearablesDashboard;
