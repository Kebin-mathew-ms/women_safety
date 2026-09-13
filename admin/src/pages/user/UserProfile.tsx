import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Avatar,
  Divider,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import userApiClient from '../../services/userApi';

interface Profile {
  fullName: string;
  email: string;
  phone: string;
  bloodGroup: string;
  city: string;
  state: string;
  country: string;
}

export const UserProfile: React.FC = () => {
  const [profile, setProfile] = useState<Profile>({
    fullName: '',
    email: '',
    phone: '',
    bloodGroup: '',
    city: '',
    state: '',
    country: '',
  });
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await userApiClient.get('/profile');
        const data = res.data?.data ?? res.data;
        setProfile({
          fullName: data.fullName ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          bloodGroup: data.bloodGroup ?? '',
          city: data.city ?? '',
          state: data.state ?? '',
          country: data.country ?? '',
        });
      } catch (e: any) {
        setProfileError(e?.response?.data?.message ?? 'Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError('');
    setProfileSuccess('');
    try {
      await userApiClient.put('/profile', profile);
      setProfileSuccess('Profile updated successfully!');
    } catch (e: any) {
      setProfileError(e?.response?.data?.message ?? 'Failed to update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (passwords.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters.');
      return;
    }
    setSavingPassword(true);
    setPasswordError('');
    setPasswordSuccess('');
    try {
      await userApiClient.post('/auth/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (e: any) {
      setPasswordError(e?.response?.data?.message ?? 'Failed to change password.');
    } finally {
      setSavingPassword(false);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', backgroundColor: '#0b0f19' }}>
        <CircularProgress sx={{ color: '#6366f1' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
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
          My Profile
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Manage your account details and security settings.
        </Typography>
      </Box>

      {/* Profile Info Card */}
      <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 3, mb: 3, boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          {/* Avatar Section */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
            <Avatar
              sx={{
                width: 72,
                height: 72,
                background: 'linear-gradient(135deg, #6366f1, #f43f5e)',
                fontSize: 28,
                fontWeight: 700,
              }}
            >
              {profile.fullName?.charAt(0)?.toUpperCase() || <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#f9fafb' }}>{profile.fullName || 'Your Name'}</Typography>
              <Typography variant="body2" sx={{ color: '#9ca3af' }}>{profile.email}</Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)', mb: 3 }} />

          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#f9fafb', mb: 2.5 }}>
            <PersonIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle', color: '#6366f1' }} />
            Personal Information
          </Typography>

          {profileError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setProfileError('')}>{profileError}</Alert>}
          {profileSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setProfileSuccess('')}>{profileSuccess}</Alert>}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name" value={profile.fullName} onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email Address" value={profile.email} onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Blood Group" value={profile.bloodGroup} onChange={(e) => setProfile((p) => ({ ...p, bloodGroup: e.target.value }))} sx={inputSx} placeholder="e.g. O+" />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" value={profile.city} onChange={(e) => setProfile((p) => ({ ...p, city: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" value={profile.state} onChange={(e) => setProfile((p) => ({ ...p, state: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Country" value={profile.country} onChange={(e) => setProfile((p) => ({ ...p, country: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={savingProfile ? <CircularProgress size={18} color="inherit" /> : <SaveIcon />}
                onClick={handleSaveProfile}
                disabled={savingProfile}
                sx={{
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {savingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(244,63,94,0.2)', borderRadius: 3, boxShadow: '0 4px 24px rgba(244,63,94,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="subtitle1" fontWeight={600} sx={{ color: '#f9fafb', mb: 2.5 }}>
            <LockIcon sx={{ fontSize: 18, mr: 1, verticalAlign: 'middle', color: '#f43f5e' }} />
            Change Password
          </Typography>

          {passwordError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setPasswordError('')}>{passwordError}</Alert>}
          {passwordSuccess && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setPasswordSuccess('')}>{passwordSuccess}</Alert>}

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="password"
                label="Current Password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, currentPassword: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="password"
                label="New Password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, newPassword: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="password"
                label="Confirm New Password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords((p) => ({ ...p, confirmPassword: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={savingPassword ? <CircularProgress size={18} color="inherit" /> : <LockIcon />}
                onClick={handleChangePassword}
                disabled={savingPassword || !passwords.currentPassword || !passwords.newPassword || !passwords.confirmPassword}
                sx={{
                  background: 'linear-gradient(135deg, #f43f5e, #e11d48)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {savingPassword ? 'Changing...' : 'Change Password'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
};

export default UserProfile;
