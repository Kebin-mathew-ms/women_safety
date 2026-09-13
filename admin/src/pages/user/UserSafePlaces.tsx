import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  CircularProgress,
  Alert,
  InputAdornment,
  Stack,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SecurityIcon from '@mui/icons-material/Security';
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import userApiClient from '../../services/userApi';

interface SafePlace {
  id: string;
  name: string;
  category: string;
  city: string;
  phone?: string;
  womenOnly: boolean;
  hasCctv: boolean;
  hasSecurity: boolean;
}

const categoryColors: Record<string, string> = {
  hospital: '#10b981',
  police: '#6366f1',
  shelter: '#f43f5e',
  pharmacy: '#f59e0b',
  default: '#9ca3af',
};

export const UserSafePlaces: React.FC = () => {
  const [places, setPlaces] = useState<SafePlace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchPlaces = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userApiClient.get('/safe-places');
        const rawData = res.data?.data ?? [];
        const mapped = rawData.map((p: any) => ({
          id: p.placeId || p.id,
          name: p.name,
          category: p.category,
          city: p.city,
          phone: p.phone,
          womenOnly: p.womenOnly ?? false,
          hasCctv: p.cctv ?? p.hasCctv ?? false,
          hasSecurity: p.securityGuard ?? p.hasSecurity ?? false,
        }));
        setPlaces(mapped);
      } catch (e: any) {
        setError(e?.response?.data?.message ?? 'Failed to fetch safe places.');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaces();
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return places;
    return places.filter(
      (p) => p.name.toLowerCase().includes(q) || p.city.toLowerCase().includes(q)
    );
  }, [places, search]);

  const getCategoryColor = (cat: string) =>
    categoryColors[cat?.toLowerCase()] ?? categoryColors.default;

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(135deg, #6366f1 0%, #f43f5e 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Safe Places Directory
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Discover verified safe places near you — hospitals, shelters, police stations & more.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {/* Search */}
      <TextField
        fullWidth
        placeholder="Search by name or city..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        variant="outlined"
        sx={{
          mb: 4,
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#111827',
            color: '#f9fafb',
            borderRadius: 2,
            '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
            '&:hover fieldset': { borderColor: '#6366f1' },
            '&.Mui-focused fieldset': { borderColor: '#6366f1' },
          },
          '& .MuiInputLabel-root': { color: '#9ca3af' },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ color: '#6366f1' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 56, mb: 2 }}>🛡️</Typography>
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No safe places found</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Try adjusting your search query.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {filtered.map((place) => (
            <Grid item xs={12} sm={6} md={4} key={place.id}>
              <Card
                sx={{
                  backgroundColor: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 3,
                  height: '100%',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-4px)', boxShadow: '0 12px 40px rgba(99,102,241,0.2)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f9fafb', flex: 1, mr: 1 }}>
                      {place.name}
                    </Typography>
                    <Chip
                      label={place.category}
                      size="small"
                      sx={{
                        backgroundColor: getCategoryColor(place.category),
                        color: '#fff',
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        fontSize: 11,
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                    <LocationCityIcon sx={{ fontSize: 15, color: '#9ca3af' }} />
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>
                      {place.city}
                    </Typography>
                  </Box>

                  {place.phone && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 1 }}>
                      <LocalPhoneIcon sx={{ fontSize: 15, color: '#10b981' }} />
                      <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>
                        {place.phone}
                      </Typography>
                    </Box>
                  )}

                  <Stack direction="row" spacing={1} sx={{ mt: 1.5, flexWrap: 'wrap', gap: 0.5 }}>
                    {place.womenOnly && (
                      <Chip
                        label="Women Only"
                        size="small"
                        sx={{ backgroundColor: '#f43f5e22', color: '#f43f5e', border: '1px solid #f43f5e55', fontWeight: 600, fontSize: 11 }}
                      />
                    )}
                    {place.hasCctv && (
                      <Tooltip title="CCTV Surveillance">
                        <Chip
                          icon={<CameraAltIcon sx={{ fontSize: '14px !important', color: '#6366f1 !important' }} />}
                          label="CCTV"
                          size="small"
                          sx={{ backgroundColor: '#6366f122', color: '#6366f1', border: '1px solid #6366f155', fontSize: 11 }}
                        />
                      </Tooltip>
                    )}
                    {place.hasSecurity && (
                      <Tooltip title="Security Present">
                        <Chip
                          icon={<SecurityIcon sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
                          label="Security"
                          size="small"
                          sx={{ backgroundColor: '#10b98122', color: '#10b981', border: '1px solid #10b98155', fontSize: 11 }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UserSafePlaces;
