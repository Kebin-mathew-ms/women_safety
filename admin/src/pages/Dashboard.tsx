import React, { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, Chip, CircularProgress,
  Paper, Select, MenuItem, FormControl, InputLabel, Alert,
  LinearProgress, Divider
} from '@mui/material';
import {
  People as UsersIcon, DirectionsCar as TripsIcon, Warning as SosIcon,
  LocationOn as PlacesIcon, SmartToy as AiIcon, Campaign as NotifIcon,
  Forum as CommunityIcon, ReportProblem as CrimeIcon
} from '@mui/icons-material';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface DashboardStats {
  totalUsers: number; activeUsers: number; tripsToday: number; activeTrips: number;
  sosToday: number; activeSos: number; safePlaces: number; communityPosts: number;
  crimeReports: number; notificationsSent: number; aiRequests: number; adminCount: number;
}

const StatCard: React.FC<{
  label: string; value: number; icon: React.ReactNode; color: string; sub?: string;
}> = ({ label, value, icon, color, sub }) => (
  <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, height: '100%' }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ bgcolor: `${color}20`, p: 1, borderRadius: 2, color }}>{icon}</Box>
        <Typography variant="h4" fontWeight="bold">{value.toLocaleString()}</Typography>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>{label}</Typography>
      {sub && <Chip label={sub} size="small" sx={{ mt: 0.5, bgcolor: `${color}15`, color, fontWeight: 'bold', fontSize: 10 }} />}
    </CardContent>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [analytics, setAnalytics] = useState<Record<string, { date: string; count: number }[]>>({});
  const [period, setPeriod] = useState('week');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsRes, analyticsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin2/dashboard`, { headers: { Authorization: `Bearer ${getToken()}` } }),
        axios.get(`${API_BASE}/admin2/analytics/overview?period=${period}`, { headers: { Authorization: `Bearer ${getToken()}` } }),
      ]);

      if (statsRes.data.success) setStats(statsRes.data.data);
      if (analyticsRes.data.success) setAnalytics(analyticsRes.data.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [period]);

  // Merge analytics time series into single chart data
  const chartData = React.useMemo(() => {
    if (!analytics.users) return [];
    return analytics.users.map((u, i) => ({
      date: u.date.slice(5), // MM-DD
      users: u.count,
      trips: analytics.trips?.[i]?.count ?? 0,
      sos: analytics.sos?.[i]?.count ?? 0,
      community: analytics.community?.[i]?.count ?? 0,
      ai: analytics.ai?.[i]?.count ?? 0,
    }));
  }, [analytics]);

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">🛡️ Admin Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">Real-time platform overview</Typography>
        </Box>
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Period</InputLabel>
          <Select value={period} label="Period" onChange={(e) => setPeriod(e.target.value)}>
            <MenuItem value="today">Today</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Stats Grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {stats && [
          { label: 'Total Users', value: stats.totalUsers, icon: <UsersIcon />, color: '#4f46e5', sub: `${stats.activeUsers} active` },
          { label: 'Trips Today', value: stats.tripsToday, icon: <TripsIcon />, color: '#06b6d4', sub: `${stats.activeTrips} live` },
          { label: 'SOS Today', value: stats.sosToday, icon: <SosIcon />, color: '#ef4444', sub: `${stats.activeSos} active 🚨` },
          { label: 'Safe Places', value: stats.safePlaces, icon: <PlacesIcon />, color: '#10b981' },
          { label: 'Community Posts', value: stats.communityPosts, icon: <CommunityIcon />, color: '#f59e0b' },
          { label: 'Crime Reports', value: stats.crimeReports, icon: <CrimeIcon />, color: '#f97316' },
          { label: 'Notifications Sent', value: stats.notificationsSent, icon: <NotifIcon />, color: '#8b5cf6' },
          { label: 'AI Requests', value: stats.aiRequests, icon: <AiIcon />, color: '#a78bfa' },
        ].map((s) => (
          <Grid item xs={12} sm={6} md={3} key={s.label}>
            <StatCard {...s} />
          </Grid>
        ))}
      </Grid>

      {/* Active Alerts Banner */}
      {stats && stats.activeSos > 0 && (
        <Alert severity="error" sx={{ mb: 3, fontWeight: 'bold' }}>
          🚨 {stats.activeSos} ACTIVE SOS ALERT{stats.activeSos > 1 ? 'S' : ''} — Immediate attention required
        </Alert>
      )}

      {/* Charts */}
      <Grid container spacing={3}>
        {/* Main area chart */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>📊 Platform Activity</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  {[
                    { id: 'users', color: '#4f46e5' },
                    { id: 'trips', color: '#06b6d4' },
                    { id: 'sos', color: '#ef4444' },
                    { id: 'ai', color: '#a78bfa' },
                  ].map(({ id, color }) => (
                    <linearGradient key={id} id={`grad-${id}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                <Legend />
                <Area type="monotone" dataKey="users" stroke="#4f46e5" fill="url(#grad-users)" name="Users" strokeWidth={2} />
                <Area type="monotone" dataKey="trips" stroke="#06b6d4" fill="url(#grad-trips)" name="Trips" strokeWidth={2} />
                <Area type="monotone" dataKey="sos" stroke="#ef4444" fill="url(#grad-sos)" name="SOS" strokeWidth={2} />
                <Area type="monotone" dataKey="ai" stroke="#a78bfa" fill="url(#grad-ai)" name="AI" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Bar chart: community */}
        <Grid item xs={12} lg={4}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>💬 Community Activity</Typography>
            <Divider sx={{ mb: 2 }} />
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                <XAxis dataKey="date" tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <YAxis tick={{ fill: '#9ca3af', fontSize: 10 }} />
                <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: 8 }} />
                <Bar dataKey="community" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Posts" />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Module health indicators */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>⚡ System Health</Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {[
                { label: 'User Activation Rate', value: stats ? Math.round((stats.activeUsers / Math.max(stats.totalUsers, 1)) * 100) : 0, color: '#10b981' },
                { label: 'SOS Resolution Rate', value: stats && stats.sosToday > 0 ? Math.round(((stats.sosToday - stats.activeSos) / stats.sosToday) * 100) : 100, color: '#4f46e5' },
                { label: 'AI Usage Today', value: Math.min(stats?.aiRequests ? Math.round((stats.aiRequests / 100) * 100) : 0, 100), color: '#a78bfa' },
                { label: 'Platform Uptime', value: 99, color: '#06b6d4' },
              ].map((m) => (
                <Grid item xs={12} sm={6} md={3} key={m.label}>
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">{m.label}</Typography>
                      <Typography variant="body2" fontWeight="bold" color={m.color}>{m.value}%</Typography>
                    </Box>
                    <LinearProgress variant="determinate" value={m.value} sx={{ height: 6, borderRadius: 3, bgcolor: `${m.color}20`, '& .MuiLinearProgress-bar': { bgcolor: m.color, borderRadius: 3 } }} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
