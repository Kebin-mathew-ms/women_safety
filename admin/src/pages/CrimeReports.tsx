import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { CheckCircle as ApproveIcon, DoneAll as ResolveIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const CrimeReports: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/crime-reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load crime reports:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleUpdateStatus = async (reportId: string, newStatus: string) => {
    try {
      await apiClient.put(`/crime-reports/${reportId}`, {
        status: newStatus,
      });
      fetchReports();
    } catch (err: any) {
      alert('Failed to update report status');
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          ⚠️ Community Hazards Audit
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Audit reported broken street lights, harassment hot zones, and unsafe locations reported by the community.
        </Typography>
      </Box>

      {/* Reports Directory */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Category</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Location Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Severity</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Moderation Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading community hazard warning files...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No hazard alerts currently reported.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((item) => (
                <TableRow key={item.reportId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>
                    {item.anonymous ? 'Anonymous Traveler' : item.user?.fullName}
                  </TableCell>
                  <TableCell>
                    <Chip label={item.category.toUpperCase().replace('_', ' ')} size="small" />
                  </TableCell>
                  <TableCell>{item.address}</TableCell>
                  <TableCell>
                    <Chip label={item.severity.toUpperCase()} color={getSeverityColor(item.severity)} size="small" />
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description || 'No comment.'}
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      {item.status === 'pending' && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleUpdateStatus(item.reportId, 'approved')}
                        >
                          Approve
                        </Button>
                      )}
                      {item.status !== 'resolved' && (
                        <Button
                          size="small"
                          variant="outlined"
                          color="primary"
                          startIcon={<ResolveIcon />}
                          onClick={() => handleUpdateStatus(item.reportId, 'resolved')}
                        >
                          Resolve
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default CrimeReports;
