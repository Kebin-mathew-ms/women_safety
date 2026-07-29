import React, { useState } from 'react';
import {
  Box, Typography, Paper, TextField, InputAdornment, Button,
  Chip, Alert, CircularProgress, Divider, Grid,
  List, ListItem, ListItemText
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MODULE_CONFIG = [
  { key: 'users',   label: '👤 Users',        color: '#4f46e5' },
  { key: 'trips',   label: '🗺️ Trips',         color: '#06b6d4' },
  { key: 'posts',   label: '💬 Posts',         color: '#f59e0b' },
  { key: 'places',  label: '🛡️ Safe Places',   color: '#10b981' },
  { key: 'crime',   label: '⚠️ Crime Reports', color: '#f97316' },
];

interface SearchResult {
  users?: any[];
  trips?: any[];
  posts?: any[];
  places?: any[];
  crime?: any[];
}

const GlobalSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModules, setActiveModules] = useState<string[]>(MODULE_CONFIG.map((m) => m.key));

  const getToken = () => localStorage.getItem('admin_token') || '';

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim().length < 2) return;
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(
        `${API_BASE}/admin2/search?q=${encodeURIComponent(query)}&modules=${activeModules.join(',')}`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      if (res.data.success) setResults(res.data.data);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleModule = (key: string) => {
    setActiveModules((prev) =>
      prev.includes(key) ? prev.filter((m) => m !== key) : [...prev, key]
    );
  };

  const totalCount = results
    ? Object.values(results).reduce((acc, arr) => acc + (Array.isArray(arr) ? arr.length : 0), 0)
    : 0;

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">🔍 Global Search</Typography>
        <Typography variant="body2" color="text.secondary">Search across all modules simultaneously.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Search Form */}
      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 3 }}>
        <form onSubmit={handleSearch}>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField
              fullWidth
              placeholder="Search users, trips, posts, places, crime reports..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
              }}
              size="small"
            />
            <Button type="submit" variant="contained" disabled={loading || query.trim().length < 2}
              sx={{ minWidth: 120, bgcolor: '#4f46e5' }}>
              {loading ? <CircularProgress size={20} sx={{ color: 'white' }} /> : 'Search'}
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, mr: 1 }}>Search in:</Typography>
            {MODULE_CONFIG.map((m) => (
              <Chip key={m.key} label={m.label} size="small" clickable
                onClick={() => toggleModule(m.key)}
                sx={{
                  bgcolor: activeModules.includes(m.key) ? `${m.color}20` : 'transparent',
                  color: activeModules.includes(m.key) ? m.color : 'text.secondary',
                  border: `1px solid ${activeModules.includes(m.key) ? m.color : '#374151'}`,
                  fontWeight: activeModules.includes(m.key) ? 'bold' : 'normal',
                }} />
            ))}
          </Box>
        </form>
      </Paper>

      {/* Results */}
      {results && (
        <>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Found <strong>{totalCount}</strong> result{totalCount !== 1 ? 's' : ''} for "{query}"
          </Typography>

          <Grid container spacing={2}>
            {MODULE_CONFIG.map((m) => {
              const items: any[] = (results as any)[m.key] ?? [];
              if (items.length === 0) return null;
              return (
                <Grid item xs={12} md={6} key={m.key}>
                  <Paper elevation={0} sx={{ border: `1px solid ${m.color}40`, borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.5, bgcolor: `${m.color}10`, borderBottom: `1px solid ${m.color}30`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2" fontWeight="bold" color={m.color}>{m.label}</Typography>
                      <Chip label={items.length} size="small" sx={{ bgcolor: `${m.color}20`, color: m.color, fontWeight: 'bold', fontSize: 10 }} />
                    </Box>
                    <List dense sx={{ py: 0 }}>
                      {items.map((item: any, i: number) => {
                        const primary = item.fullName ?? item.tripName ?? item.title ?? item.name ?? item.category ?? item.reportId;
                        const secondary = item.email ?? item.destinationAddress ?? item.address ?? item.status ?? '';
                        return (
                          <React.Fragment key={i}>
                            {i > 0 && <Divider />}
                            <ListItem>
                              <ListItemText
                                primary={<Typography variant="body2" fontWeight="bold">{primary}</Typography>}
                                secondary={<Typography variant="caption" color="text.secondary">{secondary}</Typography>}
                              />
                              {item.status && (
                                <Chip label={item.status} size="small"
                                  sx={{ fontSize: 9, bgcolor: '#4f46e520', color: '#818cf8', ml: 1 }} />
                              )}
                            </ListItem>
                          </React.Fragment>
                        );
                      })}
                    </List>
                  </Paper>
                </Grid>
              );
            })}

            {totalCount === 0 && (
              <Grid item xs={12}>
                <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 6, textAlign: 'center' }}>
                  <SearchIcon sx={{ fontSize: 56, opacity: 0.2, mb: 1 }} />
                  <Typography color="text.secondary">No results found for "{query}"</Typography>
                  <Typography variant="caption" color="text.secondary">Try a different search term or expand the modules.</Typography>
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}

      {/* Help when no search yet */}
      {!results && !loading && (
        <Paper elevation={0} sx={{ border: '1px dashed', borderColor: 'divider', borderRadius: 2, p: 6, textAlign: 'center' }}>
          <SearchIcon sx={{ fontSize: 64, opacity: 0.15, mb: 2 }} />
          <Typography color="text.secondary" gutterBottom>Enter at least 2 characters to search</Typography>
          <Typography variant="caption" color="text.secondary">
            Search across users, trips, community posts, safe places, and crime reports simultaneously.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default GlobalSearch;
