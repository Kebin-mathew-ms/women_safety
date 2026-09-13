import React, { useState, useEffect } from 'react';
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
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ReportIcon from '@mui/icons-material/Report';
import userApiClient from '../../services/userApi';

interface CrimeReport {
  id: string;
  description: string;
  hazardType: string;
  severity: string;
  address: string;
  createdAt: string;
}

const hazardTypes = [
  { value: 'poor_lighting', label: 'Poor Lighting' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'unsafe_area', label: 'Unsafe Area' },
  { value: 'other', label: 'Other' },
];

const severities = [
  { value: 'low', label: 'Low', color: '#f59e0b' },
  { value: 'medium', label: 'Medium', color: '#f97316' },
  { value: 'high', label: 'High', color: '#ef4444' },
];

const getSeverityChipSx = (severity: string) => {
  const s = severities.find((x) => x.value === severity);
  return { backgroundColor: s?.color ?? '#9ca3af', color: '#fff', fontWeight: 600 };
};

const getHazardLabel = (type: string) =>
  hazardTypes.find((x) => x.value === type)?.label ?? type;

export const UserCrimeReport: React.FC = () => {
  const [reports, setReports] = useState<CrimeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    description: '',
    hazardType: 'poor_lighting',
    severity: 'low',
    address: '',
  });

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await userApiClient.get('/crime-reports');
      setReports(res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch reports.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReports(); }, []);

  const handleSubmit = async () => {
    if (!form.description || !form.address) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await userApiClient.post('/crime-reports', {
        description: form.description,
        hazardType: form.hazardType,
        severity: form.severity,
        address: form.address,
        latitude: 0,
        longitude: 0,
      });
      setSuccess('Hazard reported successfully. Thank you for keeping the community safe!');
      setForm({ description: '', hazardType: 'poor_lighting', severity: 'low', address: '' });
      fetchReports();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to submit report.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: '#f9fafb',
      '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
      '&:hover fieldset': { borderColor: '#6366f1' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: '#9ca3af' },
    '& .MuiSelect-icon': { color: '#9ca3af' },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(135deg, #f43f5e 0%, #f59e0b 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Report a Hazard
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Help keep the community safe by reporting unsafe areas or incidents.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Form */}
      <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 3, mb: 4, boxShadow: '0 4px 24px rgba(244,63,94,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2.5 }}>⚠️ Submit New Report</Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Hazard Type"
                value={form.hazardType}
                onChange={(e) => setForm((f) => ({ ...f, hazardType: e.target.value }))}
                sx={inputSx}
                SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1f2937', color: '#f9fafb' } } } }}
              >
                {hazardTypes.map((h) => (<MenuItem key={h.value} value={h.value} sx={{ color: '#f9fafb' }}>{h.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Severity"
                value={form.severity}
                onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))}
                sx={inputSx}
                SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1f2937', color: '#f9fafb' } } } }}
              >
                {severities.map((s) => (<MenuItem key={s.value} value={s.value} sx={{ color: '#f9fafb' }}>{s.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Address / Location"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || !form.description || !form.address}
                sx={{
                  background: 'linear-gradient(135deg, #f43f5e, #f59e0b)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Past Reports */}
      <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2 }}>My Past Reports</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : reports.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(244,63,94,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <ReportIcon sx={{ fontSize: 48, color: '#f43f5e', mb: 1, opacity: 0.4 }} />
            <Typography variant="body1" sx={{ color: '#9ca3af' }}>No reports submitted yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper} sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px solid rgba(99,102,241,0.15)' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ '& th': { borderBottom: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af', fontWeight: 600 } }}>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Severity</TableCell>
                <TableCell>Address</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((r) => (
                <TableRow key={r.id} sx={{ '& td': { borderBottom: '1px solid rgba(255,255,255,0.04)', color: '#f9fafb' } }}>
                  <TableCell sx={{ color: '#9ca3af', fontSize: 13 }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={getHazardLabel(r.hazardType)} size="small" sx={{ backgroundColor: '#6366f122', color: '#6366f1', border: '1px solid #6366f155', fontWeight: 600, textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={r.severity} size="small" sx={getSeverityChipSx(r.severity)} />
                  </TableCell>
                  <TableCell sx={{ color: '#9ca3af', fontSize: 13 }}>{r.address}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default UserCrimeReport;
