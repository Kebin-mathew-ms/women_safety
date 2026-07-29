import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Switch, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, Grid, Select, MenuItem, InputLabel, FormControl } from '@mui/material';
import { Add as AddIcon, CheckCircle as VerifiedIcon, Cancel as UnverifiedIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const ManagePlaces: React.FC = () => {
  const [places, setPlaces] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('hotel');
  const [latitude, setLatitude] = useState('40.7128');
  const [longitude, setLongitude] = useState('-74.0060');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('New York');
  const [state, setState] = useState('NY');
  const [country, setCountry] = useState('USA');
  const [description, setDescription] = useState('');
  const [womenOnly, setWomenOnly] = useState(false);
  const [cctv, setCctv] = useState(false);
  const [securityGuard, setSecurityGuard] = useState(false);
  const [reception24x7, setReception24x7] = useState(false);
  const [parking, setParking] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchPlaces = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/safe-places');
      if (response.data.success) {
        setPlaces(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load places:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlaces();
  }, []);

  const handleToggleVerify = async (placeId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/safe-places/${placeId}`, {
        verified: !currentStatus,
      });
      fetchPlaces();
    } catch (err: any) {
      alert('Failed to update place verify status');
    }
  };

  const handleCreatePlace = async () => {
    if (!name.trim() || !address.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post('/safe-places', {
        name,
        category,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address,
        city,
        state,
        country,
        description,
        womenOnly,
        cctv,
        securityGuard,
        reception24x7,
        parking,
      });
      setOpen(false);
      setName('');
      setAddress('');
      fetchPlaces();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create safe place');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box mb={4} display="flex" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            🗺️ Safe Places Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage hostel verified flags, cctv states, and safety directory indexes.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)}>
          Add Safe Place
        </Button>
      </Box>

      {/* Directory Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Verified</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>CCTV</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Guards</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Verify Control</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading directory list...
                </TableCell>
              </TableRow>
            ) : places.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No safe places in directory. Add one above.
                </TableCell>
              </TableRow>
            ) : (
              places.map((item) => (
                <TableRow key={item.placeId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{item.name}</TableCell>
                  <TableCell>
                    <Chip label={item.category.toUpperCase().replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>
                    <Chip
                      icon={item.verified ? <VerifiedIcon /> : <UnverifiedIcon />}
                      label={item.verified ? 'VERIFIED' : 'UNVERIFIED'}
                      color={item.verified ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>{item.cctv ? 'Yes' : 'No'}</TableCell>
                  <TableCell>{item.securityGuard ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Switch
                      checked={item.verified}
                      color="success"
                      onChange={() => handleToggleVerify(item.placeId, item.verified)}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Place Dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Add Safe Place Node</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Place Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Safe Haven Hostel" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={category} label="Category" onChange={(e) => setCategory(e.target.value)}>
                  <MenuItem value="women_hostel">Women Hostel</MenuItem>
                  <MenuItem value="women_pg">Women PG</MenuItem>
                  <MenuItem value="hotel">Hotel</MenuItem>
                  <MenuItem value="police_station">Police Station</MenuItem>
                  <MenuItem value="hospital">Hospital</MenuItem>
                  <MenuItem value="safe_zone">Safe Zone</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Latitude" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Longitude" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Address" value={address} onChange={(e) => setAddress(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" value={city} onChange={(e) => setCity(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={state} onChange={(e) => setState(e.target.value)} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth multiline rows={3} label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
            </Grid>

            {/* Checkboxes */}
            <Grid item xs={12}>
              <FormControlLabel control={<Checkbox checked={womenOnly} onChange={(e) => setWomenOnly(e.target.checked)} />} label="Women Only Listing" />
              <FormControlLabel control={<Checkbox checked={cctv} onChange={(e) => setCctv(e.target.checked)} />} label="CCTV Surveillance Camera" />
              <FormControlLabel control={<Checkbox checked={securityGuard} onChange={(e) => setSecurityGuard(e.target.checked)} />} label="Security Guard Active" />
              <FormControlLabel control={<Checkbox checked={reception24x7} onChange={(e) => setReception24x7(e.target.checked)} />} label="24/7 Reception desk" />
              <FormControlLabel control={<Checkbox checked={parking} onChange={(e) => setParking(e.target.checked)} />} label="Parking Lot Available" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePlace} disabled={submitting || !name.trim()}>
            Create Node
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ManagePlaces;
