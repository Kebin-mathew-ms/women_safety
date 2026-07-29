import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions,
  IconButton, Chip, Select, MenuItem, FormControl, InputLabel, CircularProgress, Alert
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PromptTemplate {
  templateId: string;
  name: string;
  category: string;
  promptText: string;
  isActive: boolean;
  lastUsed: string | null;
  usageCount: number;
  createdAt: string;
}

const AIPromptTemplates: React.FC = () => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<PromptTemplate | null>(null);
  const [form, setForm] = useState({ name: '', category: 'safety', promptText: '', isActive: true });
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`${API_BASE}/ai/prompt-templates`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) setTemplates(res.data.data);
    } catch (err: any) {
      setError('Failed to load prompt templates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const openCreate = () => {
    setEditTarget(null);
    setForm({ name: '', category: 'safety', promptText: '', isActive: true });
    setDialogOpen(true);
  };

  const openEdit = (t: PromptTemplate) => {
    setEditTarget(t);
    setForm({ name: t.name, category: t.category, promptText: t.promptText, isActive: t.isActive });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSubmitting(true);
    try {
      if (editTarget) {
        await axios.put(`${API_BASE}/ai/prompt-templates/${editTarget.templateId}`, form, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setSuccess('Template updated successfully.');
      } else {
        await axios.post(`${API_BASE}/ai/prompt-templates`, form, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        setSuccess('Template created successfully.');
      }
      setDialogOpen(false);
      fetchTemplates();
    } catch {
      setError('Failed to save template.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this prompt template?')) return;
    try {
      await axios.delete(`${API_BASE}/ai/prompt-templates/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuccess('Template deleted.');
      fetchTemplates();
    } catch {
      setError('Delete failed.');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">🧠 AI Prompt Templates</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage system prompts injected into the Ollama LLM context for safety guidance and emergency reasoning.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate} sx={{ bgcolor: '#4f46e5' }}>
          New Template
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Usage</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Last Used</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {templates.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No prompt templates configured.
                  </TableCell>
                </TableRow>
              ) : (
                templates.map((t) => (
                  <TableRow key={t.templateId} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{t.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {t.promptText.slice(0, 80)}…
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={t.category} size="small" sx={{ bgcolor: '#4f46e520', color: '#4f46e5', fontWeight: 'bold' }} />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={t.isActive ? 'Active' : 'Disabled'}
                        size="small"
                        sx={{
                          bgcolor: t.isActive ? '#10b98120' : '#ef444420',
                          color: t.isActive ? '#10b981' : '#ef4444',
                          fontWeight: 'bold',
                        }}
                      />
                    </TableCell>
                    <TableCell>{t.usageCount.toLocaleString()}</TableCell>
                    <TableCell>
                      {t.lastUsed ? new Date(t.lastUsed).toLocaleString() : '—'}
                    </TableCell>
                    <TableCell>
                      <IconButton size="small" onClick={() => openEdit(t)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" color="error" onClick={() => handleDelete(t.templateId)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editTarget ? '✏️ Edit Prompt Template' : '➕ New Prompt Template'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Template Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            fullWidth
            size="small"
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Category</InputLabel>
            <Select value={form.category} label="Category" onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <MenuItem value="safety">Safety</MenuItem>
              <MenuItem value="emergency">Emergency</MenuItem>
              <MenuItem value="travel">Travel</MenuItem>
              <MenuItem value="crime">Crime</MenuItem>
              <MenuItem value="weather">Weather</MenuItem>
              <MenuItem value="routing">Routing</MenuItem>
              <MenuItem value="hotel">Hotel</MenuItem>
              <MenuItem value="general">General</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="System Prompt Text"
            value={form.promptText}
            onChange={(e) => setForm({ ...form, promptText: e.target.value })}
            multiline
            rows={8}
            fullWidth
            placeholder="You are a women's safety AI assistant. Your role is to provide concise, actionable advice..."
            sx={{ fontFamily: 'monospace' }}
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={form.isActive ? 'active' : 'disabled'}
              label="Status"
              onChange={(e) => setForm({ ...form, isActive: e.target.value === 'active' })}
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="disabled">Disabled</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={submitting || !form.name || !form.promptText} onClick={handleSave} sx={{ bgcolor: '#4f46e5' }}>
            {submitting ? <CircularProgress size={18} /> : editTarget ? 'Save Changes' : 'Create Template'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AIPromptTemplates;
