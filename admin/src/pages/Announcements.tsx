import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Select, MenuItem, FormControl, InputLabel, Alert,
  CircularProgress, IconButton, Switch, FormControlLabel
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444', high: '#f97316', normal: '#4f46e5', low: '#6b7280',
};

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '', message: '', priority: 'normal', targetAudience: 'all',
    startDate: '', endDate: '', active: true,
  });

  const getToken = () => localStorage.getItem('admin_token') || '';
  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin2/announcements`, { headers });
      if (res.data.success) {
        setAnnouncements(res.data.data.announcements);
      }
    } catch {
      setError('Failed to load announcements.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ title: '', message: '', priority: 'normal', targetAudience: 'all', startDate: '', endDate: '', active: true });
    setDialogOpen(true);
  };

  const openEdit = (a: any) => {
    setEditTarget(a);
    setForm({
      title: a.title, message: a.message, priority: a.priority,
      targetAudience: a.targetAudience, active: a.active,
      startDate: a.startDate?.split('T')[0] ?? '',
      endDate: a.endDate?.split('T')[0] ?? '',
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (editTarget) {
        await axios.put(`${API_BASE}/admin2/announcements/${editTarget.announcementId}`, form, { headers });
        setSuccess('Announcement updated.');
      } else {
        await axios.post(`${API_BASE}/admin2/announcements`, form, { headers });
        setSuccess('Announcement created.');
      }
      setDialogOpen(false);
      fetchAnnouncements();
    } catch {
      setError('Failed to save announcement.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      await axios.delete(`${API_BASE}/admin2/announcements/${id}`, { headers });
      setSuccess('Deleted.');
      fetchAnnouncements();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">📢 Announcements</Typography>
          <Typography variant="body2" color="text.secondary">Manage platform announcements shown to users and admins.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#4f46e5' }}>
          New Announcement
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
        ) : (
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Priority</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Audience</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Start → End</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Created By</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {announcements.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No announcements yet.
                  </TableCell>
                </TableRow>
              ) : announcements.map((a) => (
                <TableRow key={a.announcementId} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{a.title}</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{
                      display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden'
                    }}>
                      {a.message}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={a.priority.toUpperCase()} size="small"
                      sx={{ bgcolor: `${PRIORITY_COLORS[a.priority]}20`, color: PRIORITY_COLORS[a.priority], fontWeight: 'bold', fontSize: 10 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={a.targetAudience} size="small" variant="outlined" sx={{ fontSize: 10 }} />
                  </TableCell>
                  <TableCell>
                    <Chip label={a.active ? 'Active' : 'Inactive'} size="small"
                      sx={{ bgcolor: a.active ? '#10b98120' : '#6b728020', color: a.active ? '#10b981' : '#6b7280', fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell sx={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                    {new Date(a.startDate).toLocaleDateString()} → {new Date(a.endDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption">{a.creator?.name ?? '—'}</Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openEdit(a)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(a.announcementId)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">{editTarget ? '✏️ Edit Announcement' : '➕ New Announcement'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} fullWidth size="small" />
          <TextField label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} fullWidth size="small" multiline rows={4} />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={form.priority} label="Priority" onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                <MenuItem value="critical">🔴 Critical</MenuItem>
                <MenuItem value="high">🟠 High</MenuItem>
                <MenuItem value="normal">🔵 Normal</MenuItem>
                <MenuItem value="low">⚪ Low</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Audience</InputLabel>
              <Select value={form.targetAudience} label="Audience" onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="users">Users Only</MenuItem>
                <MenuItem value="admins">Admins Only</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField label="Start Date" type="date" InputLabelProps={{ shrink: true }} value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })} fullWidth size="small" />
            <TextField label="End Date" type="date" InputLabelProps={{ shrink: true }} value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })} fullWidth size="small" />
          </Box>
          <FormControlLabel
            control={<Switch checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />}
            label="Active" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}
            disabled={submitting || !form.title || !form.message || !form.startDate || !form.endDate}
            sx={{ bgcolor: '#4f46e5' }}>
            {submitting ? <CircularProgress size={18} /> : editTarget ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Announcements;
