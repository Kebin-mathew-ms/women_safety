import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, TextField, Button,
  Alert, CircularProgress,
  Chip, IconButton, Accordion, AccordionSummary, AccordionDetails
} from '@mui/material';
import { ExpandMore as ExpandMoreIcon, Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CATEGORY_COLORS: Record<string, string> = {
  general: '#4f46e5', safety: '#ef4444', ai: '#a78bfa',
  notification: '#f59e0b', map: '#10b981', socket: '#06b6d4', weather: '#0ea5e9',
};

interface Setting {
  settingId: string;
  settingKey: string;
  settingValue: string;
  category: string;
  description: string | null;
}

const SystemSettings: React.FC = () => {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, string>>({});

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin2/settings`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        setSettings(res.data.data);
        const initial: Record<string, string> = {};
        res.data.data.forEach((s: Setting) => { initial[s.settingKey] = s.settingValue; });
        setEdits(initial);
      }
    } catch {
      setError('Failed to load settings. Make sure you seed the admin first at /api/admin2/auth/seed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const payload = settings.map((s) => ({
        key: s.settingKey,
        value: edits[s.settingKey] ?? s.settingValue,
        category: s.category,
        description: s.description ?? undefined,
      }));
      await axios.put(`${API_BASE}/admin2/settings`, { settings: payload }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuccess('Settings saved successfully.');
      fetchSettings();
    } catch {
      setError('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const grouped = settings.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, Setting[]>);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">⚙️ System Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure platform-wide settings. Changes take effect immediately.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <IconButton onClick={fetchSettings}><RefreshIcon /></IconButton>
          <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving} sx={{ bgcolor: '#4f46e5' }}>
            {saving ? <CircularProgress size={20} /> : 'Save All'}
          </Button>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : settings.length === 0 ? (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">No settings found.</Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            Run POST /api/admin2/auth/seed to initialize default settings.
          </Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={async () => {
            await axios.post(`${API_BASE}/admin2/auth/seed`);
            fetchSettings();
          }}>Seed Defaults</Button>
        </Paper>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <Accordion key={category} defaultExpanded elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: '8px !important', mb: 1, '&:before': { display: 'none' } }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip label={category.toUpperCase()} size="small"
                  sx={{ bgcolor: `${CATEGORY_COLORS[category] || '#4f46e5'}20`, color: CATEGORY_COLORS[category] || '#4f46e5', fontWeight: 'bold' }} />
                <Typography fontWeight="bold">{items.length} settings</Typography>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                {items.map((s) => (
                  <Grid item xs={12} sm={6} md={4} key={s.settingKey}>
                    <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                      <CardContent sx={{ pb: '12px !important' }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>{s.settingKey}</Typography>
                        {s.description && <Typography variant="caption" display="block" color="text.secondary" sx={{ mb: 1 }}>{s.description}</Typography>}
                        <TextField
                          fullWidth size="small"
                          value={edits[s.settingKey] ?? s.settingValue}
                          onChange={(e) => setEdits({ ...edits, [s.settingKey]: e.target.value })}
                          sx={{ mt: 0.5 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </AccordionDetails>
          </Accordion>
        ))
      )}
    </Box>
  );
};

export default SystemSettings;
