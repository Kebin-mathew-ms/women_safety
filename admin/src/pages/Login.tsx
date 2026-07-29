import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, TextField, Button, Alert, InputAdornment, IconButton } from '@mui/material';
import { Email as EmailIcon, Lock as LockIcon, Visibility, VisibilityOff } from '@mui/icons-material';
import apiClient from '../services/api';

interface LoginProps {
  onLoginSuccess: (token: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Form validations
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      // Admin-specific login endpoint (separate from mobile user auth)
      const response = await apiClient.post('/admin2/auth/login', {
        email,
        password,
      });

      setLoading(false);

      if (response.data.success) {
        const token = response.data.data?.token || response.data.data?.accessToken;
        if (token) {
          localStorage.setItem('admin_token', token);
          onLoginSuccess(token);
        } else {
          setError('Login response missing token. Contact system administrator.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      const serverMessage = err.response?.data?.message || 'Authentication failed. Please try again.';
      setError(serverMessage);
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight="100vh"
      sx={{
        backgroundColor: '#0b0f19',
        backgroundImage: 'radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.1) 0, transparent 50%), radial-gradient(at 50% 100%, rgba(244, 63, 94, 0.05) 0, transparent 50%)',
      }}
    >
      <Card sx={{ width: 400, border: '1px solid #1f2937', borderRadius: 4, boxShadow: '0 8px 32px rgba(0,0,0,0.4)', backgroundColor: '#111827' }}>
        <CardContent sx={{ p: 4 }}>
          <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
            <Typography variant="h4" fontWeight="bold" gutterBottom color="primary">
              🛡️ Safe Travel
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center">
              Sign in to the operator console.
            </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <TextField
              label="Email Address"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 3 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: 'text.secondary' }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              disabled={loading}
              sx={{ py: 1.5, fontSize: '1rem', fontWeight: 'bold' }}
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </Button>
          </form>
          <Box mt={3} display="flex" justifyContent="center">
            <Typography variant="caption" color="text.secondary" textAlign="center">
              Operator: <strong>admin@safetravel.app</strong> / <strong>Admin@123</strong>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
