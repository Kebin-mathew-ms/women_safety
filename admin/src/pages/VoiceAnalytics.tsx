import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip } from '@mui/material';
import apiClient from '../services/api';

export const VoiceAnalytics: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/voice-analytics');
      if (response.data.success) {
        setLogs(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load voice analytics logs:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes('sos')) return 'error';
    if (action.includes('navigate')) return 'info';
    if (action.includes('trip')) return 'success';
    return 'default';
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🎙️ Voice Command Analytics logs
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Audit safety command phrase recognition rates, trigger history stats, and client query volumes.
        </Typography>
      </Box>

      {/* Analytics logs list */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Traveler</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Spoken Query String</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Parsed Action</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trigger Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3 }}>
                  Loading voice analytics history logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No voice commands registered by travelers yet.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((item) => (
                <TableRow key={item.commandId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{item.user?.fullName}</TableCell>
                  <TableCell>"{item.command}"</TableCell>
                  <TableCell>
                    <Chip label={item.action.toUpperCase()} color={getActionColor(item.action)} size="small" />
                  </TableCell>
                  <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default VoiceAnalytics;
