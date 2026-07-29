import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, Chip } from '@mui/material';
import { Delete as DeleteIcon, ThumbUp as DismissIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const ReportedPosts: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/reports');
      if (response.data.success) {
        setReports(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load reported posts:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleModerate = async (reportId: string, action: 'dismiss' | 'delete_post') => {
    try {
      await apiClient.put(`/admin/reports/${reportId}`, { action });
      fetchReports();
    } catch (err: any) {
      alert('Failed to moderate post');
    }
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          🛡️ Flagged Content Audit
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Audit reported posts, clean inappropriate spam, and uphold safety guidelines inside community forums.
        </Typography>
      </Box>

      {/* Flagged table */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Reporter</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Post Title</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Author</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Report Description</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Audit Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading flagged community warning logs...
                </TableCell>
              </TableRow>
            ) : reports.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No reported posts. Forum is clean.
                </TableCell>
              </TableRow>
            ) : (
              reports.map((item) => (
                <TableRow key={item.reportId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{item.reporter?.fullName}</TableCell>
                  <TableCell>
                    <Chip label={item.reason.toUpperCase()} color="error" size="small" />
                  </TableCell>
                  <TableCell>{item.post?.title}</TableCell>
                  <TableCell>{item.post?.user?.fullName}</TableCell>
                  <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.description || 'No comment.'}
                  </TableCell>
                  <TableCell>
                    <Chip label={item.status.toUpperCase()} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <Box display="flex" justifyContent="flex-end" gap={1}>
                      {item.status === 'pending' && (
                        <>
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            startIcon={<DismissIcon />}
                            onClick={() => handleModerate(item.reportId, 'dismiss')}
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="small"
                            variant="contained"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleModerate(item.reportId, 'delete_post')}
                          >
                            Delete Post
                          </Button>
                        </>
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

export default ReportedPosts;
