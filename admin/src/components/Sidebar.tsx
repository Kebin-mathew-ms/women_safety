import React from 'react';
import {
  Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Toolbar, Typography, Box, Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Warning as AlertIcon,
  People as UsersIcon,
  Map as MapIcon,
  Settings as SettingsIcon,
  ExitToApp as LogoutIcon,
  LocationOn as LocationIcon,
  ReportProblem as HazardIcon,
  Feedback as FeedbackIcon,
  Campaign as BroadcastIcon,
  RecordVoiceOver as VoiceIcon,
  Watch as WatchIcon,
  Psychology as BrainIcon,
  Tune as TuneIcon,
  Gavel as AuditIcon,
  VerifiedUser as RolesIcon,
  Notifications as AnnouncementsIcon,
  Assessment as ReportsIcon,
  Forum as CommunityIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 250;

interface SidebarProps { onLogout: () => void; }

const MENU_GROUPS = [
  {
    label: '📊 Overview',
    items: [
      { text: 'Dashboard',       icon: <DashboardIcon />,                      path: '/',        color: '#a5b4fc' },
      { text: 'Global Search',   icon: <SearchIcon />,                          path: '/search',  color: '#a5b4fc' },
    ],
  },
  {
    label: '🚨 Safety',
    items: [
      { text: 'Safety Alerts (SOS)', icon: <AlertIcon />,        path: '/alerts',     color: '#fca5a5' },
      { text: 'Manage Places',       icon: <LocationIcon />,     path: '/places',     color: '#6ee7b7' },
      { text: 'Crime Hazards',       icon: <HazardIcon />,       path: '/hazards',    color: '#fcd34d' },
    ],
  },
  {
    label: '👥 Users & Community',
    items: [
      { text: 'User Directory',       icon: <UsersIcon />,         path: '/users',       color: '#93c5fd' },
      { text: 'Community Moderation', icon: <CommunityIcon />,     path: '/community',   color: '#fbbf24' },
      { text: 'Reported Posts',       icon: <FeedbackIcon />,      path: '/reports-mod', color: '#fca5a5' },
    ],
  },
  {
    label: '🗺️ Trips & Tracking',
    items: [
      { text: 'Live Map Tracker',  icon: <MapIcon />,  path: '/map',  color: '#67e8f9' },
    ],
  },
  {
    label: '📣 Notifications',
    items: [
      { text: 'Broadcasts',     icon: <BroadcastIcon />, path: '/notifications', color: '#c4b5fd' },
      { text: 'Announcements',  icon: <AnnouncementsIcon />, path: '/announcements', color: '#c4b5fd' },
    ],
  },
  {
    label: '🤖 AI Intelligence',
    items: [
      { text: 'AI Prompt Templates', icon: <BrainIcon />, path: '/ai-prompts', color: '#d8b4fe' },
      { text: 'AI Model Config',     icon: <TuneIcon />,  path: '/ai-config',  color: '#d8b4fe' },
    ],
  },
  {
    label: '📱 Device Analytics',
    items: [
      { text: 'Voice Analytics',     icon: <VoiceIcon />, path: '/voice-analytics', color: '#fde68a' },
      { text: 'Wearables Telemetry', icon: <WatchIcon />, path: '/wearables',       color: '#67e8f9' },
    ],
  },
  {
    label: '📊 Reports & Data',
    items: [
      { text: 'Reports',    icon: <ReportsIcon />, path: '/reports', color: '#6ee7b7' },
    ],
  },
  {
    label: '🔐 Administration',
    items: [
      { text: 'Roles & Permissions', icon: <RolesIcon />,  path: '/roles',       color: '#f9a8d4' },
      { text: 'Audit Logs',          icon: <AuditIcon />,  path: '/audit-logs',  color: '#fca5a5' },
      { text: 'System Settings',     icon: <SettingsIcon />, path: '/settings',  color: '#94a3b8' },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: {
          width: drawerWidth,
          boxSizing: 'border-box',
          backgroundColor: '#0f172a',
          borderRight: '1px solid #1e293b',
        },
      }}
    >
      <Toolbar>
        <Box display="flex" alignItems="center" py={1}>
          <Typography variant="h6" color="primary" fontWeight="bold" sx={{ letterSpacing: 1, fontSize: 15 }}>
            🛡️ SAFE TRAVEL ADMIN
          </Typography>
        </Box>
      </Toolbar>
      <Divider sx={{ borderColor: '#1e293b' }} />

      <Box sx={{ overflow: 'auto', display: 'flex', flexDirection: 'column', height: '100%', pb: 2 }}>
        <List sx={{ px: 1, py: 1 }}>
          {MENU_GROUPS.map((group) => (
            <React.Fragment key={group.label}>
              <Typography
                variant="caption"
                sx={{ px: 2, py: 1, display: 'block', color: '#475569', fontWeight: 700, letterSpacing: 0.5, mt: 1 }}
              >
                {group.label}
              </Typography>
              {group.items.map((item) => {
                const isSelected = location.pathname === item.path;
                return (
                  <ListItem key={item.text} disablePadding sx={{ mb: 0.25 }}>
                    <ListItemButton
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 1.5,
                        py: 0.75,
                        backgroundColor: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                        borderLeft: isSelected ? '2px solid #6366f1' : '2px solid transparent',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.04)' },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: isSelected ? item.color : '#475569',
                          minWidth: 34,
                          fontSize: 18,
                          '& svg': { fontSize: 18 },
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontSize: '12.5px',
                          fontWeight: isSelected ? 600 : 500,
                          color: isSelected ? item.color : '#94a3b8',
                        }}
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </React.Fragment>
          ))}
        </List>

        <Box sx={{ mt: 'auto', px: 1 }}>
          <Divider sx={{ borderColor: '#1e293b', mb: 1 }} />
          <ListItem disablePadding>
            <ListItemButton
              onClick={onLogout}
              sx={{
                borderRadius: 1.5,
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                '&:hover': { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
              }}
            >
              <ListItemIcon sx={{ color: '#ef4444', minWidth: 34, '& svg': { fontSize: 18 } }}>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ fontSize: '12.5px', fontWeight: 600, color: '#ef4444' }}
              />
            </ListItemButton>
          </ListItem>
        </Box>
      </Box>
    </Drawer>
  );
};

export default Sidebar;
