import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Typography, Box, Chip, IconButton, Avatar, Tooltip } from '@mui/material';
import { WifiOff, Wifi, Logout } from '@mui/icons-material';

interface UserTopbarProps { onLogout: () => void; }

const UserTopbar: React.FC<UserTopbarProps> = ({ onLogout }) => {
  const [connected] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    try {
      const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
      setUserName(profile.fullName || profile.name || 'User');
    } catch {}
  }, []);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        width: `calc(100% - 250px)`,
        ml: '250px',
        backgroundColor: 'rgba(13,17,23,0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #1f2937',
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Typography variant="h6" fontWeight="bold" color="text.primary">
          🛡️ Safe Travel — User Dashboard
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          <Chip
            icon={connected ? <Wifi sx={{ fontSize: 14 }} /> : <WifiOff sx={{ fontSize: 14 }} />}
            label={connected ? 'Live Connected' : 'Offline'}
            size="small"
            sx={{
              backgroundColor: connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
              color: connected ? '#10b981' : '#ef4444',
              border: `1px solid ${connected ? '#10b981' : '#ef4444'}`,
              fontWeight: 600,
              fontSize: 11,
            }}
          />
          <Tooltip title={`Logged in as ${userName}`}>
            <Avatar sx={{ width: 34, height: 34, background: 'linear-gradient(135deg,#f43f5e,#6366f1)', fontSize: 14, fontWeight: 'bold', cursor: 'pointer' }}>
              {userName.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </Tooltip>
          <Tooltip title="Logout">
            <IconButton onClick={onLogout} size="small" sx={{ color: '#ef4444' }}>
              <Logout fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default UserTopbar;
