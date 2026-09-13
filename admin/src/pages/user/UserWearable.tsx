import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Alert,
  CircularProgress, TextField, Grid, IconButton, Divider, Tooltip
} from '@mui/material';
import { WifiOff, Wifi, Add, Delete, Refresh } from '@mui/icons-material';
import userApiClient from '../../services/userApi';

const getBatteryColor = (level: number) => {
  if (level > 50) return '#10b981';
  if (level > 20) return '#f59e0b';
  return '#ef4444';
};

const getActionColor = (action: string) => {
  if (action === 'fall_detected') return '#ef4444';
  if (action === 'double_tap') return '#f59e0b';
  if (action === 'connect') return '#10b981';
  return '#6b7280';
};

const getActionLabel = (action: string) => {
  const map: Record<string, string> = {
    fall_detected: '🔴 FALL DETECTED',
    double_tap: '🟡 DOUBLE TAP',
    connect: '🟢 CONNECTED',
    disconnect: '⚫ DISCONNECTED',
  };
  return map[action] || action.toUpperCase();
};

export const UserWearable: React.FC = () => {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pairing, setPairing] = useState(false);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [deviceName, setDeviceName] = useState('');
  const [macAddress, setMacAddress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sosTriggers, setSosTriggers] = useState<string[]>([]);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await userApiClient.get('/wearable/status');
      if (res.data.success) setDevices(res.data.data || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load devices');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchStatus(); }, []);

  const handlePair = async () => {
    if (!deviceName.trim() || !macAddress.trim()) { setError('Please enter device name and MAC address'); return; }
    const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
    if (!macRegex.test(macAddress)) { setError('Invalid MAC address format (e.g. AA:BB:CC:DD:EE:FF)'); return; }
    setPairing(true);
    setError(null);
    try {
      await userApiClient.post('/wearable', { deviceName, deviceType: 'WearOS', macAddress });
      setSuccess('✅ Smartwatch paired successfully!');
      setDeviceName(''); setMacAddress('');
      fetchStatus();
      setTimeout(() => setSuccess(null), 4000);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to pair device');
    } finally { setPairing(false); }
  };

  const handleUnpair = async (deviceId: string) => {
    if (!window.confirm('Are you sure you want to unpair this device?')) return;
    try {
      await userApiClient.delete(`/wearable/${deviceId}`);
      fetchStatus();
    } catch { setError('Failed to unpair device'); }
  };

  const handleSimulate = async (macAddr: string, action: string, deviceId: string) => {
    setSimulating(`${deviceId}-${action}`);
    setError(null);
    try {
      await userApiClient.post('/wearable/telemetry', {
        macAddress: macAddr,
        action,
        batteryLevel: Math.floor(Math.random() * 30) + 65,
      });
      if (action === 'fall_detected' || action === 'double_tap') {
        setSosTriggers(prev => [...prev, `${getActionLabel(action)} at ${new Date().toLocaleTimeString()} — Auto-SOS triggered!`]);
      }
      await fetchStatus();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Simulation failed');
    } finally { setSimulating(null); }
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold">⌚ Wearable Device</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Pair your smartwatch to enable automatic SOS on fall detection or double-tap.
          </Typography>
        </Box>
        <IconButton onClick={fetchStatus} color="primary"><Refresh /></IconButton>
      </Box>

      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2, borderRadius: 2 }}>{success}</Alert>}

      {sosTriggers.length > 0 && (
        <Alert severity="warning" onClose={() => setSosTriggers([])} sx={{ mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle2" fontWeight="bold" mb={0.5}>🚨 Automatic SOS Events Triggered:</Typography>
          {sosTriggers.map((t, i) => <Typography key={i} variant="body2">• {t}</Typography>)}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Pair Form */}
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #1f2937', position: 'sticky', top: 80 }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                <Box sx={{ width: 40, height: 40, borderRadius: 2, background: 'linear-gradient(135deg,#f43f5e,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Add sx={{ color: '#fff' }} />
                </Box>
                <Typography variant="h6" fontWeight="bold">Pair New Device</Typography>
              </Box>

              <TextField label="Device Name" fullWidth value={deviceName} onChange={e => setDeviceName(e.target.value)}
                placeholder="e.g. My Galaxy Watch 5" sx={{ mb: 2 }} />
              <TextField label="Bluetooth MAC Address" fullWidth value={macAddress} onChange={e => setMacAddress(e.target.value)}
                placeholder="AB:CD:EF:12:34:56" sx={{ mb: 2.5 }} />
              <Button variant="contained" color="secondary" fullWidth size="large" onClick={handlePair} disabled={pairing}
                sx={{ fontWeight: 700, borderRadius: 2 }}>
                {pairing ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : '⌚ Pair Smartwatch'}
              </Button>

              <Box mt={3} p={2} sx={{ borderRadius: 2, background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Typography variant="caption" color="primary.light" fontWeight={700} display="block" mb={1}>How to find MAC Address:</Typography>
                <Typography variant="caption" color="text.secondary" display="block">• Android: Settings → About Phone → Status → Bluetooth Address</Typography>
                <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>• WearOS: Settings → System → About → Regulatory Info</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Devices List */}
        <Grid item xs={12} md={8}>
          <Typography variant="h6" fontWeight="bold" mb={2}>
            Paired Devices {devices.length > 0 && <Chip label={devices.length} size="small" sx={{ ml: 1, fontSize: 11, backgroundColor: 'rgba(99,102,241,0.12)', color: '#818cf8' }} />}
          </Typography>

          {loading ? <Box textAlign="center" py={6}><CircularProgress /></Box> : devices.length === 0 ? (
            <Card sx={{ borderRadius: 3, border: '1px dashed #374151', textAlign: 'center', py: 6 }}>
              <Typography sx={{ fontSize: 56 }}>⌚</Typography>
              <Typography color="text.secondary" mt={1}>No wearable devices paired yet.</Typography>
              <Typography variant="caption" color="text.secondary">Pair your smartwatch using the form on the left.</Typography>
            </Card>
          ) : (
            devices.map(device => (
              <Card key={device.deviceId} sx={{ borderRadius: 3, border: `1px solid ${device.connected ? 'rgba(16,185,129,0.3)' : '#1f2937'}`, mb: 2, transition: 'border 0.3s' }}>
                <CardContent sx={{ p: 3 }}>
                  {/* Device Header */}
                  <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, background: device.connected ? 'rgba(16,185,129,0.12)' : 'rgba(55,65,81,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                        ⌚
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight="bold" color="text.primary">{device.deviceName}</Typography>
                        <Typography variant="caption" color="text.secondary">MAC: {device.macAddress}</Typography>
                      </Box>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1.5}>
                      <Chip
                        icon={device.connected ? <Wifi sx={{ fontSize: 14 }} /> : <WifiOff sx={{ fontSize: 14 }} />}
                        label={device.connected ? 'CONNECTED' : 'DISCONNECTED'}
                        size="small"
                        sx={{
                          fontWeight: 700, fontSize: 10,
                          backgroundColor: device.connected ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                          color: device.connected ? '#10b981' : '#6b7280',
                          border: `1px solid ${device.connected ? '#10b981' : '#374151'}`,
                        }}
                      />
                      <Chip
                        label={`${Math.round(device.batteryLevel)}%`}
                        size="small"
                        sx={{ fontWeight: 700, fontSize: 10, backgroundColor: `${getBatteryColor(device.batteryLevel)}20`, color: getBatteryColor(device.batteryLevel) }}
                      />
                      <Tooltip title="Unpair device">
                        <IconButton size="small" onClick={() => handleUnpair(device.deviceId)} sx={{ color: '#ef4444' }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>

                  <Divider sx={{ borderColor: '#1f2937', mb: 2 }} />

                  {/* Test Simulator */}
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>
                      🧪 SIMULATE TELEMETRY EVENT
                    </Typography>
                    <Box display="flex" gap={1} flexWrap="wrap">
                      {[
                        { action: 'connect', label: '🟢 Connect', color: '#10b981' },
                        { action: 'double_tap', label: '🟡 Double Tap', color: '#f59e0b' },
                        { action: 'fall_detected', label: '🔴 Fall Detected', color: '#ef4444' },
                        { action: 'disconnect', label: '⚫ Disconnect', color: '#6b7280' },
                      ].map(({ action, label, color }) => (
                        <Button
                          key={action}
                          size="small"
                          variant="outlined"
                          onClick={() => handleSimulate(device.macAddress, action, device.deviceId)}
                          disabled={simulating === `${device.deviceId}-${action}`}
                          sx={{ borderColor: `${color}40`, color, fontSize: 11, fontWeight: 600, '&:hover': { borderColor: color, background: `${color}10` } }}
                        >
                          {simulating === `${device.deviceId}-${action}` ? <CircularProgress size={14} /> : label}
                        </Button>
                      ))}
                    </Box>
                    <Typography variant="caption" color="warning.main" display="block" mt={1}>
                      ⚠️ Fall Detected and Double Tap will automatically create a live SOS alert!
                    </Typography>
                  </Box>

                  {/* Telemetry Logs */}
                  {device.logs && device.logs.length > 0 && (
                    <>
                      <Typography variant="caption" color="text.secondary" fontWeight={700} display="block" mb={1}>RECENT TELEMETRY LOGS</Typography>
                      <Box sx={{ maxHeight: 160, overflowY: 'auto', borderRadius: 1, background: 'rgba(0,0,0,0.2)', p: 1 }}>
                        {device.logs.map((log: any) => (
                          <Box key={log.logId} display="flex" justifyContent="space-between" alignItems="center"
                            sx={{ py: 0.75, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                            <Typography variant="caption" fontWeight={700} sx={{ color: getActionColor(log.action) }}>
                              {getActionLabel(log.action)}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{log.batteryLevel}%</Typography>
                            <Typography variant="caption" color="#4b5563">
                              {new Date(log.triggeredAt).toLocaleTimeString()}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserWearable;
