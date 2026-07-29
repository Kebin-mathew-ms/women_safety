import React, { useState } from 'react';
import {
  Box, Typography, Paper, Button, TextField,
  Alert, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
  Tabs, Tab
} from '@mui/material';
import { Download as DownloadIcon, Assessment as ReportIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const REPORT_TYPES = [
  { key: 'users',       label: '👤 Users',           color: '#4f46e5' },
  { key: 'trips',       label: '🗺️ Trips',            color: '#06b6d4' },
  { key: 'sos',         label: '🚨 SOS Alerts',       color: '#ef4444' },
  { key: 'community',   label: '💬 Community Posts',  color: '#f59e0b' },
  { key: 'crime',       label: '⚠️ Crime Reports',    color: '#f97316' },
  { key: 'safe-places', label: '🛡️ Safe Places',      color: '#10b981' },
  { key: 'notifications', label: '📯 Notifications', color: '#8b5cf6' },
  { key: 'ai',          label: '🤖 AI Usage',         color: '#a78bfa' },
];

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';
  const currentType = REPORT_TYPES[activeTab];

  const fetchReport = async () => {
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const params = new URLSearchParams({ format: 'json' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await axios.get(`${API_BASE}/admin2/reports/${currentType.key}?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        const raw = res.data.data;
        setData(Array.isArray(raw) ? raw : raw?.conversations ?? Object.values(raw)[0] ?? []);
        setSuccess(`Report generated: ${(Array.isArray(raw) ? raw : []).length} records`);
      }
    } catch {
      setError('Failed to generate report. Check your permissions and date range.');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = async () => {
    try {
      const params = new URLSearchParams({ format: 'csv' });
      if (from) params.set('from', from);
      if (to) params.set('to', to);

      const res = await axios.get(`${API_BASE}/admin2/reports/${currentType.key}?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        responseType: 'blob',
      });

      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentType.key}-report-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed.');
    }
  };

  const renderTable = () => {
    if (!data || data.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 6, color: 'text.secondary' }}>
          <ReportIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
          <Typography>No data for this period. Try a wider date range.</Typography>
        </Box>
      );
    }

    const keys = Object.keys(data[0]).filter(
      (k) => !['passwordHash', 'refreshToken', 'password'].includes(k)
    ).slice(0, 8);

    return (
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: 'action.hover' }}>
              {keys.map((k) => (
                <TableCell key={k} sx={{ fontWeight: 'bold', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>
                  {k.replace(/([A-Z])/g, ' $1').trim()}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.slice(0, 50).map((row, i) => (
              <TableRow key={i} hover>
                {keys.map((k) => (
                  <TableCell key={k} sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 12 }}>
                    {row[k] === null || row[k] === undefined ? '—'
                      : typeof row[k] === 'boolean' ? (row[k] ? '✅' : '❌')
                      : typeof row[k] === 'object' ? JSON.stringify(row[k]).slice(0, 60)
                      : String(row[k]).slice(0, 80)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data.length > 50 && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Showing 50 of {data.length} records. Download CSV for full export.
            </Typography>
          </Box>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">📊 Reports</Typography>
        <Typography variant="body2" color="text.secondary">Generate data reports for every module with CSV export.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {/* Report Type Tabs */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <Tabs value={activeTab} onChange={(_e, v) => { setActiveTab(v); setData(null); }}
          variant="scrollable" scrollButtons="auto"
          sx={{ '& .MuiTab-root': { fontSize: 12, minWidth: 100 } }}>
          {REPORT_TYPES.map((rt) => (
            <Tab key={rt.key} label={rt.label} />
          ))}
        </Tabs>
      </Paper>

      {/* Filters + Actions */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: currentType.color }} />
            <Typography fontWeight="bold">{currentType.label}</Typography>
          </Box>
          <TextField size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }}
            value={from} onChange={(e) => setFrom(e.target.value)} sx={{ minWidth: 150 }} />
          <TextField size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }}
            value={to} onChange={(e) => setTo(e.target.value)} sx={{ minWidth: 150 }} />
          <Button variant="contained" onClick={fetchReport} disabled={loading}
            sx={{ bgcolor: currentType.color, '&:hover': { bgcolor: currentType.color } }}>
            {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Generate Report'}
          </Button>
          {data && data.length > 0 && (
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={downloadCSV}>
              Export CSV
            </Button>
          )}
        </Box>
      </Paper>

      {/* Results */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflow: 'hidden' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : data !== null ? renderTable() : (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <ReportIcon sx={{ fontSize: 64, opacity: 0.2, mb: 2 }} />
            <Typography>Select a date range and click Generate Report</Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Reports;
