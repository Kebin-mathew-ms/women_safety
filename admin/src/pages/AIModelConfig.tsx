import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Grid, Card, CardContent, Switch, FormControlLabel,
  TextField, Select, MenuItem, FormControl, InputLabel, Button,
  Divider, Chip, Alert, CircularProgress, Slider
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Speed as SpeedIcon,
  Memory as MemoryIcon,
  Tune as TuneIcon
} from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface ModelConfig {
  modelName: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  enableFallback: boolean;
  fallbackMode: string;
  ollamaBaseUrl: string;
  systemPromptCategory: string;
}

const AIModelConfig: React.FC = () => {
  const [config, setConfig] = useState<ModelConfig>({
    modelName: 'phi3',
    temperature: 0.7,
    maxTokens: 512,
    timeoutMs: 10000,
    enableFallback: true,
    fallbackMode: 'rules_engine',
    ollamaBaseUrl: 'http://localhost:11434',
    systemPromptCategory: 'safety',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [stats, setStats] = useState<any>({
    totalRequests: 0,
    successfulRequests: 0,
    fallbackUsed: 0,
    avgResponseMs: 0,
  });

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchConfig = async () => {
    try {
      const res = await axios.get(`${API_BASE}/ai/model-config`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.data.success) {
        setConfig(res.data.data.config || config);
        setStats(res.data.data.stats || stats);
      }
    } catch {
      // fallback: keep defaults
    }
  };

  const checkOllamaStatus = async () => {
    setOllamaStatus('checking');
    try {
      await axios.get(`${config.ollamaBaseUrl}/api/version`, { timeout: 3000 });
      setOllamaStatus('online');
    } catch {
      setOllamaStatus('offline');
    }
  };

  useEffect(() => {
    fetchConfig();
    checkOllamaStatus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await axios.put(`${API_BASE}/ai/model-config`, config, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setSuccess('AI model configuration saved successfully.');
    } catch {
      setError('Failed to save configuration. The backend API endpoint may not be implemented yet.');
    } finally {
      setSaving(false);
    }
  };

  const statusColor = ollamaStatus === 'online' ? '#10b981' : ollamaStatus === 'offline' ? '#ef4444' : '#f59e0b';
  const statusLabel = ollamaStatus === 'checking' ? 'Checking...' : ollamaStatus === 'online' ? 'Online' : 'Offline';

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">⚙️ AI Model Configuration</Typography>
        <Typography variant="body2" color="text.secondary">
          Configure the Ollama LLM model parameters, timeouts, and fallback policies for the AI Safety Intelligence module.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Grid container spacing={3}>
        {/* Ollama Status Card */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: statusColor }} />
              <Typography fontWeight="bold">Ollama LLM Status: <span style={{ color: statusColor }}>{statusLabel}</span></Typography>
              <Button size="small" variant="outlined" onClick={checkOllamaStatus} sx={{ ml: 'auto' }}>
                Refresh Status
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Stats Cards */}
        {[
          { label: 'Total AI Requests', value: stats.totalRequests.toLocaleString(), icon: <PsychologyIcon />, color: '#4f46e5' },
          { label: 'Successful', value: stats.successfulRequests.toLocaleString(), icon: <SpeedIcon />, color: '#10b981' },
          { label: 'Fallback Used', value: stats.fallbackUsed.toLocaleString(), icon: <MemoryIcon />, color: '#f59e0b' },
          { label: 'Avg Response', value: `${stats.avgResponseMs}ms`, icon: <TuneIcon />, color: '#06b6d4' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ color: s.color }}>{s.icon}</Box>
                  <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        {/* Configuration Form */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Model Settings</Typography>
            <Divider sx={{ mb: 3 }} />

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Model Name"
                  value={config.modelName}
                  onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
                  fullWidth
                  size="small"
                  helperText="Ollama model identifier (e.g. phi3, llama3, mistral)"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Ollama Base URL"
                  value={config.ollamaBaseUrl}
                  onChange={(e) => setConfig({ ...config, ollamaBaseUrl: e.target.value })}
                  fullWidth
                  size="small"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  label="Max Tokens"
                  type="number"
                  value={config.maxTokens}
                  onChange={(e) => setConfig({ ...config, maxTokens: +e.target.value })}
                  fullWidth
                  size="small"
                  inputProps={{ min: 64, max: 4096 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Timeout (ms)"
                  type="number"
                  value={config.timeoutMs}
                  onChange={(e) => setConfig({ ...config, timeoutMs: +e.target.value })}
                  fullWidth
                  size="small"
                  inputProps={{ min: 1000, step: 500 }}
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="body2" gutterBottom>
                  Temperature: <strong>{config.temperature.toFixed(1)}</strong>
                </Typography>
                <Slider
                  value={config.temperature}
                  min={0}
                  max={2}
                  step={0.1}
                  onChange={(_e, val) => setConfig({ ...config, temperature: val as number })}
                  sx={{ color: '#4f46e5' }}
                  marks={[
                    { value: 0, label: 'Precise' },
                    { value: 1, label: 'Balanced' },
                    { value: 2, label: 'Creative' },
                  ]}
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Default Prompt Category</InputLabel>
                  <Select
                    value={config.systemPromptCategory}
                    label="Default Prompt Category"
                    onChange={(e) => setConfig({ ...config, systemPromptCategory: e.target.value })}
                  >
                    <MenuItem value="safety">Safety</MenuItem>
                    <MenuItem value="emergency">Emergency</MenuItem>
                    <MenuItem value="travel">Travel</MenuItem>
                    <MenuItem value="general">General</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl size="small" fullWidth>
                  <InputLabel>Fallback Mode</InputLabel>
                  <Select
                    value={config.fallbackMode}
                    label="Fallback Mode"
                    onChange={(e) => setConfig({ ...config, fallbackMode: e.target.value })}
                  >
                    <MenuItem value="rules_engine">Rules Engine (Recommended)</MenuItem>
                    <MenuItem value="static">Static Hardcoded Response</MenuItem>
                    <MenuItem value="error">Return Error</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enableFallback}
                      onChange={(e) => setConfig({ ...config, enableFallback: e.target.checked })}
                      sx={{ '& .MuiSwitch-thumb': { bgcolor: config.enableFallback ? '#10b981' : '#6b7280' } }}
                    />
                  }
                  label="Enable Fallback when Ollama is Unreachable"
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={saving}
                sx={{ bgcolor: '#4f46e5' }}
              >
                {saving ? <CircularProgress size={20} /> : 'Save Configuration'}
              </Button>
              <Button variant="outlined" onClick={fetchConfig}>Reset to Saved</Button>
            </Box>
          </Paper>
        </Grid>

        {/* Available Models Guide */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Recommended Models</Typography>
            <Divider sx={{ mb: 2 }} />
            {[
              { name: 'phi3', size: '3.8B', desc: 'Fast, lightweight, good for safety advice' },
              { name: 'llama3.2', size: '3.2B', desc: 'Balanced quality-speed trade off' },
              { name: 'mistral', size: '7B', desc: 'High quality reasoning and analysis' },
              { name: 'gemma2', size: '9B', desc: 'Excellent for structured responses' },
            ].map((m) => (
              <Box
                key={m.name}
                onClick={() => setConfig({ ...config, modelName: m.name })}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  mb: 1,
                  borderRadius: 1,
                  border: '1px solid',
                  borderColor: config.modelName === m.name ? '#4f46e5' : 'divider',
                  bgcolor: config.modelName === m.name ? '#4f46e510' : 'transparent',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: '#4f46e510' },
                }}
              >
                <Box>
                  <Typography variant="body2" fontWeight="bold" fontFamily="monospace">{m.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{m.desc}</Typography>
                </Box>
                <Chip label={m.size} size="small" sx={{ bgcolor: '#4f46e520', color: '#4f46e5' }} />
              </Box>
            ))}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIModelConfig;
