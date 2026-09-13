import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Card, CardContent, Typography, Button, Chip, Alert,
  CircularProgress, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Table, TableBody, TableCell, TableHead, TableRow
} from '@mui/material';
import { Cancel } from '@mui/icons-material';
import userApiClient from '../../services/userApi';

export const UserSOS: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; sosId: string }>({ open: false, sosId: '' });
  const [cancelReason, setCancelReason] = useState('');
  const countdownRef = useRef<any>(null);

  const fetchHistory = async () => {
    try {
      const res = await userApiClient.get('/sos/history');
      if (res.data.success) setHistory(res.data.data || []);
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchHistory(); }, []);

  const startSOS = () => {
    setCountdown(5);
    setError(null);
    let count = 5;
    countdownRef.current = setInterval(() => {
      count--;
      setCountdown(count);
      if (count === 0) {
        clearInterval(countdownRef.current);
        setCountdown(null);
        triggerSOS();
      }
    }, 1000);
  };

  const cancelCountdown = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
  };

  const triggerSOS = async () => {
    setTriggering(true);
    setError(null);

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
      setSuccess(true);
      fetchHistory();
      setTimeout(() => setSuccess(false), 8000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to trigger SOS. Please call emergency services directly.');
    } finally { setTriggering(false); }
  };

  const handleCancel = async () => {
    try {
      await userApiClient.post('/sos/cancel', { sosId: cancelDialog.sosId, cancelledReason: cancelReason });
      setCancelDialog({ open: false, sosId: '' });
      setCancelReason('');
      fetchHistory();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to cancel SOS');
    }
  };

  const activeSOS = history.find(s => s.status === 'active');

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" mb={0.5}>🚨 Emergency SOS</Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Press the SOS button to instantly alert your guardians and safety operators.
      </Typography>

      {success && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>🚨 SOS triggered! Emergency contacts and operators have been notified with your location.</Alert>}
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {activeSOS && (
        <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }} action={
          <Button color="warning" size="small" onClick={() => setCancelDialog({ open: true, sosId: activeSOS.sosId })}>Cancel Alert</Button>
        }>
          🔴 Active SOS alert is running since {new Date(activeSOS.createdAt).toLocaleTimeString()}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        {/* SOS Button Card */}
        <Card sx={{ flex: 1, minWidth: 280, background: 'linear-gradient(135deg, rgba(244,63,94,0.12), rgba(220,38,38,0.05))', border: '1px solid rgba(244,63,94,0.3)', borderRadius: 3 }}>
          <CardContent sx={{ p: 4, textAlign: 'center' }}>
            {countdown !== null ? (
              <Box>
                <Typography variant="h2" fontWeight="bold" color="#f43f5e">{countdown}</Typography>
                <Typography variant="body1" color="text.secondary" mb={3}>SOS triggers in {countdown} seconds...</Typography>
                <Button variant="outlined" color="error" size="large" onClick={cancelCountdown} startIcon={<Cancel />}>
                  Cancel
                </Button>
              </Box>
            ) : (
              <Box>
                <Box
                  component="button"
                  onClick={startSOS}
                  disabled={triggering || !!activeSOS}
                  sx={{
                    width: 180, height: 180, borderRadius: '50%',
                    background: activeSOS ? '#374151' : 'radial-gradient(circle, #f43f5e, #dc2626)',
                    border: '10px solid rgba(244,63,94,0.2)',
                    cursor: activeSOS ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto',
                    transition: 'all 0.2s',
                    boxShadow: activeSOS ? 'none' : '0 0 50px rgba(244,63,94,0.5)',
                    animation: activeSOS ? 'none' : 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(244,63,94,0.4)' },
                      '70%': { boxShadow: '0 0 0 20px rgba(244,63,94,0)' },
                      '100%': { boxShadow: '0 0 0 0 rgba(244,63,94,0)' },
                    },
                    '&:hover:not(:disabled)': { transform: 'scale(1.04)' },
                  }}
                >
                  {triggering ? <CircularProgress sx={{ color: '#fff' }} size={48} /> : (
                    <>
                      <Typography sx={{ fontSize: 52, fontWeight: 900, color: '#fff', letterSpacing: 3 }}>SOS</Typography>
                      <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>HOLD TO TRIGGER</Typography>
                    </>
                  )}
                </Box>
                {activeSOS && <Typography variant="caption" color="error" display="block" mt={2}>Cancel current active SOS first</Typography>}
                <Typography variant="caption" color="text.secondary" display="block" mt={2}>
                  Will start a 5-second countdown before sending
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card sx={{ flex: 1, minWidth: 280, borderRadius: 3, border: '1px solid #1f2937' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" mb={2}>What happens when you trigger SOS?</Typography>
            {[
              { icon: '📍', text: 'Your GPS location is captured and sent to operators' },
              { icon: '📱', text: 'All your emergency contacts (guardians) are notified instantly' },
              { icon: '🖥️', text: 'A red alert appears on the admin monitoring dashboard' },
              { icon: '🔴', text: 'The alert stays active until resolved by an operator' },
              { icon: '⌚', text: 'If you have a wearable, fall detection also triggers this automatically' },
            ].map((item, i) => (
              <Box key={i} display="flex" alignItems="flex-start" gap={1.5} mb={1.5}>
                <Typography sx={{ fontSize: 18 }}>{item.icon}</Typography>
                <Typography variant="body2" color="text.secondary">{item.text}</Typography>
              </Box>
            ))}
          </CardContent>
        </Card>
      </Box>

      {/* History */}
      <Typography variant="h6" fontWeight="bold" mb={2}>SOS Alert History</Typography>
      <Card sx={{ borderRadius: 3, border: '1px solid #1f2937' }}>
        {loading ? <Box p={4} textAlign="center"><CircularProgress /></Box> : history.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography sx={{ fontSize: 40, mb: 1 }}>✅</Typography>
            <Typography color="text.secondary">No SOS alerts triggered. Stay safe!</Typography>
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>DATE & TIME</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>TYPE</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>TRIGGERED BY</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ color: '#6b7280', fontSize: 11, fontWeight: 700 }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.map((s) => (
                <TableRow key={s.sosId} hover>
                  <TableCell>
                    <Typography variant="caption">{new Date(s.createdAt).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.emergencyType || 'general'} size="small" sx={{ fontSize: 10, backgroundColor: 'rgba(244,63,94,0.1)', color: '#f43f5e' }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">{s.triggeredBy} {s.wearableActivated ? '⌚' : ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={s.status} size="small" sx={{
                      fontSize: 10, fontWeight: 700,
                      backgroundColor: s.status === 'active' ? 'rgba(244,63,94,0.12)' : s.status === 'resolved' ? 'rgba(16,185,129,0.12)' : 'rgba(107,114,128,0.12)',
                      color: s.status === 'active' ? '#f43f5e' : s.status === 'resolved' ? '#10b981' : '#9ca3af',
                    }} />
                  </TableCell>
                  <TableCell>
                    {s.status === 'active' && (
                      <Button size="small" color="error" variant="outlined" onClick={() => setCancelDialog({ open: true, sosId: s.sosId })}>
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Cancel Dialog */}
      <Dialog open={cancelDialog.open} onClose={() => setCancelDialog({ open: false, sosId: '' })} PaperProps={{ sx: { backgroundColor: '#111827', borderRadius: 3 } }}>
        <DialogTitle>Cancel SOS Alert</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={2}>
            Please provide a reason for cancelling this SOS alert so operators are informed.
          </Typography>
          <TextField fullWidth multiline rows={3} label="Reason for cancellation" value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)} placeholder="e.g. False alarm, I am safe now" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialog({ open: false, sosId: '' })}>Keep Alert</Button>
          <Button onClick={handleCancel} color="error" variant="contained">Cancel SOS</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserSOS;
