import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar } from '@mui/material';
import theme from './theme/theme';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';

// Existing pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import UserDirectory from './pages/UserDirectory';
import TripsDashboard from './pages/TripsDashboard';
import LiveAlertsDashboard from './pages/LiveAlertsDashboard';
import ManagePlaces from './pages/ManagePlaces';
import CrimeReports from './pages/CrimeReports';
import ReportedPosts from './pages/ReportedPosts';
import NotificationsDashboard from './pages/NotificationsDashboard';
import VoiceAnalytics from './pages/VoiceAnalytics';
import WearablesDashboard from './pages/WearablesDashboard';
import AIPromptTemplates from './pages/AIPromptTemplates';
import AIModelConfig from './pages/AIModelConfig';

// Prompt 9 — New Admin Module Pages
import AuditLogs from './pages/AuditLogs';
import SystemSettings from './pages/SystemSettings';
import RolesPermissions from './pages/RolesPermissions';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import CommunityModeration from './pages/CommunityModeration';
import GlobalSearch from './pages/GlobalSearch';

const DRAWER_WIDTH = 250;

export const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('admin_token'));

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token');
    if (storedToken) { setToken(storedToken); }
  }, []);

  const handleLoginSuccess = (newToken: string) => { setToken(newToken); };
  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
  };

  if (!token) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Login onLoginSuccess={handleLoginSuccess} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
          <Topbar />
          <Sidebar onLogout={handleLogout} />
          <Box
            component="main"
            sx={{
              flexGrow: 1,
              p: 4,
              width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
              minHeight: '100vh',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <Toolbar sx={{ mb: 2 }} />
            <Routes>
              {/* Core */}
              <Route path="/" element={<Dashboard />} />
              <Route path="/search" element={<GlobalSearch />} />

              {/* Safety */}
              <Route path="/alerts" element={<LiveAlertsDashboard />} />
              <Route path="/places" element={<ManagePlaces />} />
              <Route path="/hazards" element={<CrimeReports />} />

              {/* Users & Community */}
              <Route path="/users" element={<UserDirectory />} />
              <Route path="/community" element={<CommunityModeration />} />
              <Route path="/reports-mod" element={<ReportedPosts />} />

              {/* Trips */}
              <Route path="/map" element={<TripsDashboard />} />

              {/* Notifications */}
              <Route path="/notifications" element={<NotificationsDashboard />} />
              <Route path="/announcements" element={<Announcements />} />

              {/* AI */}
              <Route path="/ai-prompts" element={<AIPromptTemplates />} />
              <Route path="/ai-config" element={<AIModelConfig />} />

              {/* Device Analytics */}
              <Route path="/voice-analytics" element={<VoiceAnalytics />} />
              <Route path="/wearables" element={<WearablesDashboard />} />

              {/* Reports & Data */}
              <Route path="/reports" element={<Reports />} />

              {/* Administration */}
              <Route path="/roles" element={<RolesPermissions />} />
              <Route path="/audit-logs" element={<AuditLogs />} />
              <Route path="/settings" element={<SystemSettings />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
