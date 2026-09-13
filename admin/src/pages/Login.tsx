import React, { useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert,
  InputAdornment, IconButton, Tabs, Tab, Divider
} from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff, Shield, Person } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

interface LoginProps {
  onAdminLoginSuccess: (token: string) => void;
  onUserLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onAdminLoginSuccess, onUserLoginSuccess }) => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0); // 0=User, 1=Admin
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) { setError('Please fill in all fields'); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      if (tab === 1) {
        // Admin login
        const res = await axios.post(`${API_BASE}/admin2/auth/login`, { email, password });
        if (res.data.success) {
          const token = res.data.data?.token || res.data.data?.accessToken;
          if (token) { localStorage.setItem('admin_token', token); onAdminLoginSuccess(token); }
        }
      } else {
        // User login
        const res = await axios.post(`${API_BASE}/auth/login`, { email, password });
        if (res.data.success) {
          const token = res.data.data?.accessToken || res.data.data?.token;
          const user = res.data.data?.user;
          if (token) {
            localStorage.setItem('user_token', token);
            if (user) localStorage.setItem('user_profile', JSON.stringify(user));
            onUserLoginSuccess(token);
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      display="flex" justifyContent="center" alignItems="center" minHeight="100vh"
      sx={{
        background: 'radial-gradient(ellipse at 0% 0%, rgba(99,102,241,0.15) 0, transparent 60%), radial-gradient(ellipse at 100% 100%, rgba(244,63,94,0.1) 0, transparent 60%), #0b0f19',
      }}
    >
      <Card sx={{ width: 440, border: '1px solid #1f2937', borderRadius: 4, boxShadow: '0 24px 64px rgba(0,0,0,0.5)', backgroundColor: '#111827' }}>
        <CardContent sx={{ p: 4 }}>
          {/* Logo */}
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Box sx={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#f43f5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1.5, fontSize: 28 }}>
              🛡️
            </Box>
            <Typography variant="h5" fontWeight="bold" color="text.primary">Safe Travel</Typography>
            <Typography variant="body2" color="text.secondary">Women Safety Companion Platform</Typography>
          </Box>

          {/* Role Tabs */}
          <Tabs
            value={tab} onChange={(_, v) => { setTab(v); setError(null); }}
            variant="fullWidth"
            sx={{ mb: 3, '& .MuiTab-root': { fontWeight: 600 }, '& .MuiTabs-indicator': { height: 3, borderRadius: 2 } }}
          >
            <Tab icon={<Person fontSize="small" />} iconPosition="start" label="User Login" />
            <Tab icon={<Shield fontSize="small" />} iconPosition="start" label="Admin Login" />
          </Tabs>

          {error && <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address" variant="outlined" fullWidth value={email}
              onChange={(e) => setEmail(e.target.value)} sx={{ mb: 2 }}
              InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: 'text.secondary' }} /></InputAdornment> }}
            />
            <TextField
              label="Password" type={showPassword ? 'text' : 'password'} variant="outlined" fullWidth
              value={password} onChange={(e) => setPassword(e.target.value)} sx={{ mb: 3 }}
              InputProps={{
                startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: 'text.secondary' }} /></InputAdornment>,
                endAdornment: <InputAdornment position="end"><IconButton onClick={() => setShowPassword(!showPassword)} edge="end">{showPassword ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment>,
              }}
            />
            <Button type="submit" variant="contained" color={tab === 0 ? 'secondary' : 'primary'} fullWidth size="large"
              disabled={loading} sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold', borderRadius: 2 }}>
              {loading ? 'Signing in...' : `Sign In as ${tab === 0 ? 'User' : 'Admin'}`}
            </Button>
          </form>

          {tab === 0 && (
            <>
              <Divider sx={{ my: 2.5, color: 'text.secondary', fontSize: 12 }}>or</Divider>
              <Button variant="outlined" color="secondary" fullWidth size="large"
                onClick={() => navigate('/register')}
                sx={{ borderRadius: 2, fontWeight: 600 }}>
                Create New Account
              </Button>
            </>
          )}

          <Box mt={3} p={1.5} sx={{ borderRadius: 2, background: 'rgba(255,255,255,0.03)', border: '1px solid #1f2937' }}>
            <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
              {tab === 0
                ? '👤 Demo User: user@safetravel.com / Password@123'
                : '🛡️ Operator: admin@safetravel.app / Admin@123'}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
