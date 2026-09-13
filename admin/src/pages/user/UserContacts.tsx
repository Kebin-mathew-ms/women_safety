import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  FormControlLabel,
  Switch,
  IconButton,
  Avatar,
  Stack,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import StarIcon from '@mui/icons-material/Star';
import PhoneIcon from '@mui/icons-material/Phone';
import userApiClient from '../../services/userApi';

interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  isPrimary: boolean;
}

const relationships = ['family', 'friend', 'colleague', 'guardian'];

const relColors: Record<string, string> = {
  family: '#6366f1',
  friend: '#10b981',
  colleague: '#f59e0b',
  guardian: '#f43f5e',
};

export const UserContacts: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    relationship: 'family',
    isPrimary: false,
  });

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const res = await userApiClient.get('/contacts');
      setContacts(res.data?.data ?? res.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch contacts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchContacts(); }, []);

  const handleAdd = async () => {
    if (!form.name || !form.phone) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await userApiClient.post('/contacts', {
        name: form.name,
        phone: form.phone,
        relationship: form.relationship,
        isPrimary: form.isPrimary,
      });
      setSuccess(`${form.name} added to your emergency contacts.`);
      setForm({ name: '', phone: '', relationship: 'family', isPrimary: false });
      fetchContacts();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to add contact.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await userApiClient.delete(`/contacts/${id}`);
      setContacts((prev) => prev.filter((c) => c.id !== id));
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to delete contact.');
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: '#f9fafb',
      '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
      '&:hover fieldset': { borderColor: '#6366f1' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: '#9ca3af' },
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      <Box sx={{ mb: 1 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(135deg, #f43f5e 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Emergency Contacts
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af', mb: 3 }}>
          These people will be notified when you trigger an SOS alert.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Add Contact Form */}
      <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(244,63,94,0.25)', borderRadius: 3, mb: 4, boxShadow: '0 4px 24px rgba(244,63,94,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2.5 }}>➕ Add Emergency Contact</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Relationship"
                value={form.relationship}
                onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value }))}
                sx={inputSx}
                SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1f2937', color: '#f9fafb' } } } }}
              >
                {relationships.map((r) => (
                  <MenuItem key={r} value={r} sx={{ color: '#f9fafb', textTransform: 'capitalize' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.isPrimary}
                    onChange={(e) => setForm((f) => ({ ...f, isPrimary: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#f43f5e' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#f43f5e' },
                    }}
                  />
                }
                label={<Typography sx={{ color: '#9ca3af', fontSize: 14 }}>Set as Primary</Typography>}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <AddIcon />}
                onClick={handleAdd}
                disabled={submitting || !form.name || !form.phone}
                sx={{
                  background: 'linear-gradient(135deg, #f43f5e, #6366f1)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {submitting ? 'Adding...' : 'Add Contact'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Contacts List */}
      <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2 }}>My Contacts</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : contacts.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(244,63,94,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 48, mb: 1 }}>📞</Typography>
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No contacts yet</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Add your first emergency contact above.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {contacts.map((contact) => (
            <Grid item xs={12} sm={6} md={4} key={contact.id}>
              <Card
                sx={{
                  backgroundColor: '#111827',
                  border: contact.isPrimary ? '1px solid rgba(244,63,94,0.5)' : '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 32px rgba(99,102,241,0.15)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ backgroundColor: relColors[contact.relationship] ?? '#6366f1', width: 40, height: 40, fontWeight: 700 }}>
                        {contact.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f9fafb' }}>
                            {contact.name}
                          </Typography>
                          {contact.isPrimary && <StarIcon sx={{ fontSize: 16, color: '#f59e0b' }} />}
                        </Box>
                        <Chip
                          label={contact.relationship}
                          size="small"
                          sx={{
                            backgroundColor: (relColors[contact.relationship] ?? '#6366f1') + '22',
                            color: relColors[contact.relationship] ?? '#6366f1',
                            border: `1px solid ${(relColors[contact.relationship] ?? '#6366f1')}55`,
                            textTransform: 'capitalize',
                            fontWeight: 600,
                            fontSize: 11,
                            height: 20,
                          }}
                        />
                      </Box>
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => handleDelete(contact.id)}
                      sx={{ color: '#ef4444', '&:hover': { backgroundColor: '#ef444422' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon sx={{ fontSize: 15, color: '#10b981' }} />
                    <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>{contact.phone}</Typography>
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

export default UserContacts;
