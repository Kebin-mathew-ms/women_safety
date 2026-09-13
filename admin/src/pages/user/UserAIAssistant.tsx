import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  CircularProgress,
  Alert,
  Avatar,
  IconButton,
  Paper,
  Tabs,
  Tab,
  Button,
  Grid,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import PersonIcon from '@mui/icons-material/Person';
import NavigationIcon from '@mui/icons-material/Navigation';
import ShieldIcon from '@mui/icons-material/Shield';
import userApiClient from '../../services/userApi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const UserAIAssistant: React.FC = () => {
  const [tab, setTab] = useState(0); // 0 = Chat Assistant, 1 = Route Safety Recommendation
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your AI Safety Assistant. Ask me anything about travel safety, emergency procedures, or request specific 3-Layer Route Safety Analysis.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Route Safety Form state
  const [routeForm, setRouteForm] = useState({
    origin: '',
    destination: 'Kottayam',
    departureTime: '2026-09-13T00:30',
    modeOfTransport: 'car',
    numberOfTravellers: 1,
    preferences: ['prefer_highways', 'avoid_isolated_roads', 'prefer_well_lit_roads'],
    priority: 'safest',
  });
  const [routeAnalysisResult, setRouteAnalysisResult] = useState<any>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (tab === 0) scrollToBottom();
  }, [messages, tab]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setError('');

    let userLoc = '';
    if (navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 2500 });
        });
        userLoc = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
      } catch {}
    }

    try {
      const res = await userApiClient.post('/ai/ask', {
        question: text,
        context: 'safety',
        userLocation: userLoc || 'Trivandrum',
      });
      const answer = res.data?.data?.answer ?? res.data?.answer ?? 'I could not generate a response. Please try again.';
      const assistantMessage: Message = { role: 'assistant', content: answer, timestamp: new Date() };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to get a response.');
    } finally {
      setLoading(false);
    }
  };

  const handleRouteAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setRouteLoading(true);
    setError('');
    setRouteAnalysisResult(null);

    let originLoc = routeForm.origin.trim();
    if (!originLoc && navigator.geolocation) {
      try {
        const pos: GeolocationPosition = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 });
        });
        originLoc = `Live GPS (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`;
      } catch {}
    }
    if (!originLoc) originLoc = 'Trivandrum';

    const payload = {
      ...routeForm,
      origin: originLoc,
    };

    try {
      const res = await userApiClient.post('/routes/safety-recommendation', payload);
      if (res.data?.success) {
        setRouteAnalysisResult(res.data.data);
      }
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to analyze route safety.');
    } finally {
      setRouteLoading(false);
    }
  };

  const togglePreference = (pref: string) => {
    setRouteForm((prev) => {
      const exists = prev.preferences.includes(pref);
      return {
        ...prev,
        preferences: exists ? prev.preferences.filter((p) => p !== pref) : [...prev.preferences, pref],
      };
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography
            variant="h4"
            fontWeight={700}
            sx={{
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            AI Safety & Route Intelligence
          </Typography>
          <Typography variant="body2" sx={{ color: '#9ca3af' }}>
            3-Layer Routing Engine + Time-Aware Safety Scoring + Anti-Hallucination AI
          </Typography>
        </Box>

        <Tabs
          value={tab}
          onChange={(_, val) => setTab(val)}
          sx={{
            '& .MuiTabs-indicator': { backgroundColor: '#6366f1' },
            '& .MuiTab-root': { color: '#9ca3af', '&.Mui-selected': { color: '#818cf8', fontWeight: 'bold' } },
          }}
        >
          <Tab icon={<SmartToyIcon fontSize="small" />} iconPosition="start" label="Safety Chat Assistant" />
          <Tab icon={<NavigationIcon fontSize="small" />} iconPosition="start" label="Route Safety Recommender" />
        </Tabs>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {tab === 0 ? (
        /* Chat View */
        <Card
          sx={{
            backgroundColor: '#111827',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: 3,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            boxShadow: '0 4px 32px rgba(99,102,241,0.1)',
            minHeight: 'calc(100vh - 200px)',
          }}
        >
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((msg, idx) => (
              <Box
                key={idx}
                sx={{
                  display: 'flex',
                  justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  gap: 1,
                  alignItems: 'flex-start',
                }}
              >
                {msg.role === 'assistant' && (
                  <Avatar sx={{ backgroundColor: '#6366f1', width: 34, height: 34, mt: 0.5, flexShrink: 0 }}>
                    <SmartToyIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
                <Box sx={{ maxWidth: '75%' }}>
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2,
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background:
                        msg.role === 'user'
                          ? 'linear-gradient(135deg, #f43f5e, #e11d48)'
                          : 'linear-gradient(135deg, #1e1b4b, #312e81)',
                      border: msg.role === 'user' ? 'none' : '1px solid rgba(99,102,241,0.3)',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#f9fafb',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {msg.content}
                    </Typography>
                  </Paper>
                </Box>
                {msg.role === 'user' && (
                  <Avatar sx={{ backgroundColor: '#f43f5e', width: 34, height: 34, mt: 0.5, flexShrink: 0 }}>
                    <PersonIcon sx={{ fontSize: 18 }} />
                  </Avatar>
                )}
              </Box>
            ))}
            {loading && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={18} sx={{ color: '#6366f1' }} />
                <Typography variant="body2" sx={{ color: '#9ca3af' }}>Evaluating safety intelligence...</Typography>
              </Box>
            )}
            <div ref={messagesEndRef} />
          </Box>

          <Box
            sx={{
              p: 2.5,
              borderTop: '1px solid rgba(255,255,255,0.06)',
              backgroundColor: '#0d1526',
              display: 'flex',
              gap: 1.5,
            }}
          >
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask about travel safety, safest routes to Kottayam, emergency tips..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  backgroundColor: '#111827',
                  color: '#f9fafb',
                  borderRadius: 2.5,
                  '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={loading || !input.trim()}
              sx={{
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                width: 48,
                height: 48,
                borderRadius: 2,
              }}
            >
              <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Card>
      ) : (
        /* Route Safety Recommendation View */
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3, p: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#f3f4f6', mb: 2 }}>
                🚗 Route Input Parameters
              </Typography>
              <form onSubmit={handleRouteAnalysis}>
                <TextField
                  label="Starting Location"
                  placeholder="Leave blank for live GPS location"
                  helperText="If specified, AI uses your entered source; otherwise uses live GPS location."
                  FormHelperTextProps={{ sx: { color: '#9ca3af', fontSize: '0.75rem' } }}
                  fullWidth
                  value={routeForm.origin}
                  onChange={(e) => setRouteForm({ ...routeForm, origin: e.target.value })}
                  sx={{ mb: 2, '& input': { color: '#fff' } }}
                />
                <TextField
                  label="Destination"
                  fullWidth
                  value={routeForm.destination}
                  onChange={(e) => setRouteForm({ ...routeForm, destination: e.target.value })}
                  sx={{ mb: 2, '& input': { color: '#fff' } }}
                />
                <TextField
                  label="Departure Date & Time"
                  type="datetime-local"
                  fullWidth
                  value={routeForm.departureTime}
                  onChange={(e) => setRouteForm({ ...routeForm, departureTime: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mb: 2, '& input': { color: '#fff' } }}
                />
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel sx={{ color: '#9ca3af' }}>Mode of Transport</InputLabel>
                  <Select
                    value={routeForm.modeOfTransport}
                    onChange={(e) => setRouteForm({ ...routeForm, modeOfTransport: e.target.value })}
                    sx={{ color: '#fff', '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(99,102,241,0.3)' } }}
                  >
                    <MenuItem value="car">Car</MenuItem>
                    <MenuItem value="bike">Bike</MenuItem>
                    <MenuItem value="public_transport">Public Transport</MenuItem>
                    <MenuItem value="walking">Walking</MenuItem>
                  </Select>
                </FormControl>

                <Typography variant="subtitle2" sx={{ color: '#9ca3af', mb: 1 }}>
                  Safety Preferences
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                  {[
                    { id: 'prefer_highways', label: 'Prefer Highways' },
                    { id: 'avoid_isolated_roads', label: 'Avoid Isolated Roads' },
                    { id: 'avoid_toll_roads', label: 'Avoid Tolls' },
                    { id: 'prefer_well_lit_roads', label: 'Prefer Well-Lit' },
                  ].map((pref) => (
                    <Chip
                      key={pref.id}
                      label={pref.label}
                      clickable
                      onClick={() => togglePreference(pref.id)}
                      color={routeForm.preferences.includes(pref.id) ? 'primary' : 'default'}
                      variant={routeForm.preferences.includes(pref.id) ? 'filled' : 'outlined'}
                      sx={{ borderRadius: 1.5 }}
                    />
                  ))}
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  fullWidth
                  disabled={routeLoading}
                  sx={{
                    py: 1.5,
                    background: 'linear-gradient(135deg, #6366f1, #10b981)',
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    borderRadius: 2,
                  }}
                >
                  {routeLoading ? <CircularProgress size={24} color="inherit" /> : 'Run 3-Layer Route Analysis'}
                </Button>
              </form>
            </Card>
          </Grid>

          <Grid item xs={12} md={8}>
            {routeAnalysisResult ? (
              <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                  <Typography variant="h5" fontWeight={700} sx={{ color: '#10b981' }}>
                    Recommended: {routeAnalysisResult.recommendedRoute.name}
                  </Typography>
                  <Chip
                    label={`Safety Score: ${routeAnalysisResult.recommendedRoute.safetyScore}/100 (${routeAnalysisResult.recommendedRoute.suitabilityLabel})`}
                    color={routeAnalysisResult.recommendedRoute.safetyScore >= 80 ? 'success' : 'warning'}
                    sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}
                  />
                </Box>

                <Typography variant="body1" sx={{ color: '#818cf8', fontWeight: 600, mb: 3 }}>
                  Flow: {routeAnalysisResult.recommendedRoute.waypointsFlow}
                </Typography>

                <Paper elevation={0} sx={{ p: 2.5, backgroundColor: '#0d1526', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 2, mb: 3 }}>
                  <Typography variant="body2" sx={{ color: '#f3f4f6', whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                    {routeAnalysisResult.aiExplanation}
                  </Typography>
                </Paper>

                {routeAnalysisResult.alternativeRoutes.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: '#f3f4f6', mb: 1.5 }}>
                      🔄 Alternative Candidate Routes Comparison
                    </Typography>
                    <TableContainer component={Paper} sx={{ backgroundColor: '#0d1526', border: '1px solid #1f2937' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow sx={{ '& th': { color: '#9ca3af', fontWeight: 'bold' } }}>
                            <TableCell>Route Name</TableCell>
                            <TableCell>Distance</TableCell>
                            <TableCell>Time</TableCell>
                            <TableCell>Safety Score</TableCell>
                            <TableCell>Main Concern</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {routeAnalysisResult.alternativeRoutes.map((alt: any) => (
                            <TableRow key={alt.routeId} sx={{ '& td': { color: '#e5e7eb' } }}>
                              <TableCell sx={{ fontWeight: 'bold' }}>{alt.name}</TableCell>
                              <TableCell>{alt.distanceKm} km</TableCell>
                              <TableCell>{alt.durationMinutes} mins</TableCell>
                              <TableCell>{alt.safetyScore}/100 ({alt.suitabilityLabel})</TableCell>
                              <TableCell>{alt.mainConcern}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                )}
              </Card>
            ) : (
              <Card sx={{ backgroundColor: '#111827', border: '1px border-dashed rgba(99,102,241,0.3)', borderRadius: 3, p: 6, textAlign: 'center' }}>
                <ShieldIcon sx={{ fontSize: 64, color: '#6366f1', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} sx={{ color: '#f3f4f6', mb: 1 }}>
                  3-Layer Specific Route Safety Engine Ready
                </Typography>
                <Typography variant="body2" sx={{ color: '#9ca3af', maxWidth: 480, mx: 'auto' }}>
                  Select your origin, destination, departure time (e.g. 12:30 AM), and safety preferences to generate data-backed candidate route comparisons.
                </Typography>
              </Card>
            )}
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

export default UserAIAssistant;
