import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, CssBaseline, Box, Toolbar } from '@mui/material';
import theme from './theme/theme';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import UserSidebar from './components/UserSidebar';
import UserTopbar from './components/UserTopbar';

// Admin pages
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
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
import AuditLogs from './pages/AuditLogs';
import SystemSettings from './pages/SystemSettings';
import RolesPermissions from './pages/RolesPermissions';
import Announcements from './pages/Announcements';
import Reports from './pages/Reports';
import CommunityModeration from './pages/CommunityModeration';
import GlobalSearch from './pages/GlobalSearch';

// User dashboard pages
import UserHome from './pages/user/UserHome';
import UserSOS from './pages/user/UserSOS';
import UserTrips from './pages/user/UserTrips';
import UserTripDetail from './pages/user/UserTripDetail';
import UserSafePlaces from './pages/user/UserSafePlaces';
import UserCrimeReport from './pages/user/UserCrimeReport';
import UserWearable from './pages/user/UserWearable';
import UserContacts from './pages/user/UserContacts';
import UserCommunity from './pages/user/UserCommunity';
import UserAIAssistant from './pages/user/UserAIAssistant';
import UserProfile from './pages/user/UserProfile';
import UserNotifications from './pages/user/UserNotifications';

const DRAWER_WIDTH = 250;

export const App: React.FC = () => {
  const [adminToken, setAdminToken] = useState<string | null>(localStorage.getItem('admin_token'));
  const [userToken, setUserToken] = useState<string | null>(localStorage.getItem('user_token'));

  useEffect(() => {
    setAdminToken(localStorage.getItem('admin_token'));
    setUserToken(localStorage.getItem('user_token'));
  }, []);

  const handleAdminLoginSuccess = (token: string) => setAdminToken(token);
  const handleUserLoginSuccess = (token: string) => setUserToken(token);
  const handleAdminLogout = () => { localStorage.removeItem('admin_token'); setAdminToken(null); };
  const handleUserLogout = () => { localStorage.removeItem('user_token'); localStorage.removeItem('user_profile'); setUserToken(null); };

  // No session — show Login/Register
  if (!adminToken && !userToken) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Routes>
            <Route path="/login" element={<Login onAdminLoginSuccess={handleAdminLoginSuccess} onUserLoginSuccess={handleUserLoginSuccess} />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </ThemeProvider>
    );
  }

  // Admin session
  if (adminToken) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Router>
          <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
            <Topbar />
            <Sidebar onLogout={handleAdminLogout} />
            <Box component="main" sx={{ flexGrow: 1, p: 4, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
              <Toolbar sx={{ mb: 2 }} />
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/search" element={<GlobalSearch />} />
                <Route path="/alerts" element={<LiveAlertsDashboard />} />
                <Route path="/places" element={<ManagePlaces />} />
                <Route path="/hazards" element={<CrimeReports />} />
                <Route path="/users" element={<UserDirectory />} />
                <Route path="/community" element={<CommunityModeration />} />
                <Route path="/reports-mod" element={<ReportedPosts />} />
                <Route path="/map" element={<TripsDashboard />} />
                <Route path="/notifications" element={<NotificationsDashboard />} />
                <Route path="/announcements" element={<Announcements />} />
                <Route path="/ai-prompts" element={<AIPromptTemplates />} />
                <Route path="/ai-config" element={<AIModelConfig />} />
                <Route path="/voice-analytics" element={<VoiceAnalytics />} />
                <Route path="/wearables" element={<WearablesDashboard />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/roles" element={<RolesPermissions />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/settings" element={<SystemSettings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Box>
          </Box>
        </Router>
      </ThemeProvider>
    );
  }

  // User session
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: 'background.default' }}>
          <UserTopbar onLogout={handleUserLogout} />
          <UserSidebar onLogout={handleUserLogout} />
          <Box component="main" sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` }, minHeight: '100vh' }}>
            <Toolbar sx={{ mb: 1 }} />
            <Routes>
              <Route path="/" element={<Navigate to="/user" replace />} />
              <Route path="/user" element={<UserHome />} />
              <Route path="/user/sos" element={<UserSOS />} />
              <Route path="/user/trips" element={<UserTrips />} />
              <Route path="/user/trips/:tripId" element={<UserTripDetail />} />
              <Route path="/user/safe-places" element={<UserSafePlaces />} />
              <Route path="/user/report" element={<UserCrimeReport />} />
              <Route path="/user/wearable" element={<UserWearable />} />
              <Route path="/user/contacts" element={<UserContacts />} />
              <Route path="/user/community" element={<UserCommunity />} />
              <Route path="/user/ai" element={<UserAIAssistant />} />
              <Route path="/user/profile" element={<UserProfile />} />
              <Route path="/user/notifications" element={<UserNotifications />} />
              <Route path="*" element={<Navigate to="/user" replace />} />
            </Routes>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
};

export default App;
