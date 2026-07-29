import React, { useState } from 'react';
import { AppBar, Toolbar, Typography, IconButton, Badge, Box, Avatar, Tooltip } from '@mui/material';
import { Notifications as NotificationsIcon, CloudDone as DbConnectedIcon } from '@mui/icons-material';

const drawerWidth = 240;

export const Topbar: React.FC = () => {
  const [notificationsCount] = useState(3);

  return (
    <AppBar
      position="fixed"
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
        backgroundColor: 'rgba(11, 15, 25, 0.8)',
        backdropFilter: 'blur(8px)',
        borderBottom: '1px solid #1f2937',
        boxShadow: 'none',
      }}
    >
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#f9fafb', fontWeight: 600 }}>
          Admin Dashboard
        </Typography>

        <Box display="flex" alignItems="center" gap={2}>
          {/* Server Connection Status */}
          <Tooltip title="Secure Connection to Backend Verified">
            <Box display="flex" alignItems="center" gap={0.5} sx={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', px: 1.5, py: 0.5, borderRadius: 2 }}>
              <DbConnectedIcon sx={{ color: '#10b981', fontSize: 16 }} />
              <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                API Connected
              </Typography>
            </Box>
          </Tooltip>

          {/* Notifications */}
          <IconButton sx={{ color: '#9ca3af' }}>
            <Badge badgeContent={notificationsCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {/* Admin Avatar */}
          <Tooltip title="Settings">
            <IconButton size="small">
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: '#6366f1',
                  color: '#ffffff',
                  fontSize: '0.85rem',
                  fontWeight: 'bold',
                }}
              >
                AD
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
