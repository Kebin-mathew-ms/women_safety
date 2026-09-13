import React from 'react';
import {
  Drawer, List, ListItemButton, ListItemIcon, ListItemText,
  Box, Typography, Divider, Tooltip
} from '@mui/material';
import {
  Home, Warning, Map, Shield, Report, Watch, People,
  Forum, SmartToy, Person, Notifications, Logout, ChevronRight
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const DRAWER_WIDTH = 250;

const navItems = [
  { section: 'Main', items: [
    { label: 'Home', icon: <Home />, path: '/user' },
    { label: 'SOS Emergency', icon: <Warning sx={{ color: '#f43f5e' }} />, path: '/user/sos' },
  ]},
  { section: 'Safety', items: [
    { label: 'My Trips', icon: <Map />, path: '/user/trips' },
    { label: 'Safe Places', icon: <Shield />, path: '/user/safe-places' },
    { label: 'Report Hazard', icon: <Report />, path: '/user/report' },
  ]},
  { section: 'Device', items: [
    { label: 'Wearable Device', icon: <Watch />, path: '/user/wearable' },
  ]},
  { section: 'Community', items: [
    { label: 'Community Feed', icon: <Forum />, path: '/user/community' },
    { label: 'AI Safety Chat', icon: <SmartToy />, path: '/user/ai' },
  ]},
  { section: 'Account', items: [
    { label: 'Emergency Contacts', icon: <People />, path: '/user/contacts' },
    { label: 'Notifications', icon: <Notifications />, path: '/user/notifications' },
    { label: 'My Profile', icon: <Person />, path: '/user/profile' },
  ]},
];

interface UserSidebarProps { onLogout: () => void; }

const UserSidebar: React.FC<UserSidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          backgroundColor: '#0d1117',
          borderRight: '1px solid #1f2937',
          pt: 1,
        },
      }}
    >
      {/* Logo */}
      <Box sx={{ px: 2.5, py: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#f43f5e,#6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
          🛡️
        </Box>
        <Box>
          <Typography variant="subtitle2" fontWeight="bold" color="text.primary">Safe Travel</Typography>
          <Typography variant="caption" color="success.main" sx={{ fontSize: 10 }}>● User Portal</Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: '#1f2937', mb: 1 }} />

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1 }}>
        {navItems.map((section) => (
          <Box key={section.section} sx={{ mb: 1 }}>
            <Typography variant="caption" sx={{ px: 1.5, color: '#4b5563', fontWeight: 700, fontSize: 10, textTransform: 'uppercase', letterSpacing: 1 }}>
              {section.section}
            </Typography>
            <List dense disablePadding>
              {section.items.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <ListItemButton
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      borderRadius: 2, mb: 0.5, px: 1.5,
                      backgroundColor: active ? 'rgba(244,63,94,0.12)' : 'transparent',
                      '&:hover': { backgroundColor: 'rgba(244,63,94,0.08)' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: active ? '#f43f5e' : '#6b7280' }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? '#f9fafb' : '#9ca3af' }}
                    />
                    {active && <ChevronRight sx={{ color: '#f43f5e', fontSize: 16 }} />}
                  </ListItemButton>
                );
              })}
            </List>
          </Box>
        ))}
      </Box>

      {/* Logout */}
      <Box sx={{ p: 1.5, borderTop: '1px solid #1f2937' }}>
        <Tooltip title="Sign out of your account">
          <ListItemButton onClick={onLogout} sx={{ borderRadius: 2, color: '#ef4444', '&:hover': { backgroundColor: 'rgba(239,68,68,0.08)' } }}>
            <ListItemIcon sx={{ minWidth: 36, color: '#ef4444' }}><Logout /></ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }} />
          </ListItemButton>
        </Tooltip>
      </Box>
    </Drawer>
  );
};

export default UserSidebar;
