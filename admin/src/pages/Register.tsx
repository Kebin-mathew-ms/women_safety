import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  InputAdornment, IconButton, Grid
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Person, Phone, Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.fullName || !form.email || !form.phone || !form.password) {
      setError('All fields are required'); return;
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match'); return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setLoading(true);
    try {
      const res = await axios.post(`${API_BASE}/auth/register`, {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      });
      if (res.data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/login'), 2000);
      }
    } catch (err: any) {
      let msg = err.response?.data?.message || 'Registration failed. Please try again.';
      const validationErrs = err.response?.data?.errors;
      if (validationErrs && typeof validationErrs === 'object') {
        const details: string[] = [];
        Object.entries(validationErrs).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            details.push(`${field}: ${msgs.join(', ')}`);
          } else if (typeof msgs === 'string') {
            details.push(`${field}: ${msgs}`);
          }
        });
        if (details.length > 0) {
          msg = `${msg}: ${details.join(' | ')}`;
        }
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{ background: 'radial-gradient(ellipse at 100% 0%, rgba(244,63,94,0.12) 0, transparent 60%), radial-gradient(ellipse at 0% 100%, rgba(99,102,241,0.1) 0, transparent 60%), #0b0f19' }}
    >
      <Card sx={{ width: 480, border: '1px solid #1f2937', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', backgroundColor: '#111827' }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <IconButton onClick={() => navigate('/login')} sx={{ mr: 1, color: 'text.secondary' }}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h5" fontWeight="bold">Create Account</Typography>
              <Typography variant="body2" color="text.secondary">Join Safe Travel — Your Safety Companion</Typography>
            </Box>
          </Box>

          {success && (
            <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
              ✅ Account created! Redirecting to login...
            </Alert>
          )}
          {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField label="Full Name" fullWidth value={form.fullName} onChange={handleChange('fullName')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Person sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Email Address" fullWidth value={form.email} onChange={handleChange('email')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Phone Number" fullWidth value={form.phone} onChange={handleChange('phone')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Phone sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Password" type={showPassword ? 'text' : 'password'} fullWidth
                  value={form.password} onChange={handleChange('password')}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                    endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
                  }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Confirm Password" type="password" fullWidth
                  value={form.confirmPassword} onChange={handleChange('confirmPassword')}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }} />
              </Grid>
            </Grid>

            <Button type="submit" variant="contained" color="secondary" fullWidth size="large"
              disabled={loading || success} sx={{ mt: 3, py: 1.5, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2 }}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <Box mt={2} textAlign="center">
            <Typography variant="body2" color="text.secondary">
              Already have an account?{' '}
              <Typography component="span" variant="body2" color="secondary.light"
                sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                onClick={() => navigate('/login')}>
                Sign In
              </Typography>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;
