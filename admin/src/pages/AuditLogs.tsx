import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Alert, TextField, Select, MenuItem, FormControl,
  InputLabel, Button, Tooltip, IconButton, Pagination
} from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MODULE_COLORS: Record<string, string> = {
  auth: '#4f46e5', users: '#06b6d4', trips: '#10b981', sos: '#ef4444',
  places: '#f59e0b', community: '#f97316', notifications: '#8b5cf6',
  ai: '#a78bfa', settings: '#6b7280', roles: '#ec4899', admins: '#14b8a6',
  crime: '#d97706', announcements: '#0ea5e9',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: '#10b981', LOGOUT: '#6b7280', CREATE: '#4f46e5', UPDATE: '#f59e0b',
  DELETE: '#ef4444', APPROVE: '#10b981', REJECT: '#ef4444', BAN: '#ef4444',
  MUTE: '#f97316', BROADCAST: '#8b5cf6', RESOLVE: '#10b981', CANCEL: '#ef4444',
  RESET_PASSWORD: '#f59e0b', HIDE: '#f97316',
};

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({ module: '', action: '', from: '', to: '' });

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '25' });
      if (filters.module) params.set('module', filters.module);
      if (filters.action) params.set('action', filters.action);
      if (filters.from) params.set('from', filters.from);
      if (filters.to) params.set('to', filters.to);

      const res = await axios.get(`${API_BASE}/admin2/audit-logs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        setLogs(res.data.data.logs);
        setTotal(res.data.data.total);
      }
    } catch {
      setError('Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [page, filters]);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">📋 Audit Logs</Typography>
          <Typography variant="body2" color="text.secondary">Every admin action is recorded here for security and compliance.</Typography>
        </Box>
        <IconButton onClick={fetchLogs}><RefreshIcon /></IconButton>
      </Box>

      {/* Filters */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Module</InputLabel>
            <Select value={filters.module} label="Module" onChange={(e) => setFilters({ ...filters, module: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {Object.keys(MODULE_COLORS).map((m) => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Action</InputLabel>
            <Select value={filters.action} label="Action" onChange={(e) => setFilters({ ...filters, action: e.target.value })}>
              <MenuItem value="">All</MenuItem>
              {Object.keys(ACTION_COLORS).map((a) => <MenuItem key={a} value={a}>{a}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }}
            value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} />
          <TextField size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }}
            value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} />
          <Button variant="outlined" onClick={() => setFilters({ module: '', action: '', from: '', to: '' })}>
            Reset
          </Button>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Time</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Admin</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Entity</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>IP Address</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Changes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>No audit logs found.</TableCell>
                </TableRow>
              ) : logs.map((log) => (
                <TableRow key={log.auditId} hover>
                  <TableCell sx={{ whiteSpace: 'nowrap', fontSize: 11, color: 'text.secondary' }}>
                    {new Date(log.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{log.admin?.name ?? '—'}</Typography>
                    <Typography variant="caption" color="text.secondary">{log.admin?.role}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={log.module} size="small"
                      sx={{ bgcolor: `${MODULE_COLORS[log.module] || '#4f46e5'}20`, color: MODULE_COLORS[log.module] || '#4f46e5', fontWeight: 'bold', fontSize: 10 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={log.action} size="small"
                      sx={{ bgcolor: `${ACTION_COLORS[log.action] || '#6b7280'}20`, color: ACTION_COLORS[log.action] || '#6b7280', fontWeight: 'bold', fontSize: 10 }} />
                  </TableCell>
                  <TableCell>
                    {log.entityType && (
                      <Tooltip title={log.entityId ?? ''}>
                        <Typography variant="caption">{log.entityType}</Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontSize: 11 }}>{log.ipAddress ?? '—'}</TableCell>
                  <TableCell sx={{ maxWidth: 180 }}>
                    {log.newValuesJson && (
                      <Tooltip title={log.newValuesJson}>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {log.newValuesJson}
                        </Typography>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
        <Pagination count={Math.ceil(total / 25)} page={page} onChange={(_e, p) => setPage(p)} color="primary" />
      </Box>
    </Box>
  );
};

export default AuditLogs;
