import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, CircularProgress, Alert, Button,
  IconButton, Tabs, Tab, Pagination
} from '@mui/material';
import { Block as BlockIcon, VisibilityOff as HideIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CommunityModeration: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [posts, setPosts] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalReports, setTotalReports] = useState(0);
  const [postPage, setPostPage] = useState(1);
  const [reportPage, setReportPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('admin_token') || '';
  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin2/community/posts?page=${postPage}&limit=15`, { headers });
      if (res.data.success) { setPosts(res.data.data.posts); setTotalPosts(res.data.data.total); }
    } catch { setError('Failed to load posts.'); } finally { setLoading(false); }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/admin2/community/reports?page=${reportPage}&limit=15`, { headers });
      if (res.data.success) { setReports(res.data.data.reports); setTotalReports(res.data.data.total); }
    } catch { setError('Failed to load reports.'); } finally { setLoading(false); }
  };

  useEffect(() => { if (tab === 0) fetchPosts(); else fetchReports(); }, [tab, postPage, reportPage]);

  const action = async (url: string, method: 'put' | 'delete', body?: object, msg = 'Done') => {
    try {
      if (method === 'delete') await axios.delete(url, { headers });
      else await axios.put(url, body ?? {}, { headers });
      setSuccess(msg);
      if (tab === 0) fetchPosts(); else fetchReports();
    } catch { setError('Action failed.'); }
  };

  const CATEGORY_COLORS: Record<string, string> = {
    safety_alert: '#ef4444', travel_experience: '#10b981', safe_hotel: '#4f46e5',
    unsafe_area: '#f97316', emergency_help: '#ef4444', travel_partner: '#06b6d4',
    question: '#8b5cf6', general: '#6b7280',
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">🛡️ Community Moderation</Typography>
        <Typography variant="body2" color="text.secondary">Review, hide, delete posts and resolve user reports.</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
          <Tab label={`Posts (${totalPosts})`} />
          <Tab label={`Reported Posts (${totalReports})`} />
        </Tabs>
      </Paper>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : tab === 0 ? (
        <>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Title</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Author</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Engagement</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reports</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {posts.length === 0 ? (
                  <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>No posts found.</TableCell></TableRow>
                ) : posts.map((p) => (
                  <TableRow key={p.postId} hover>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" fontWeight="bold" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {p.anonymous ? '🔒 Anonymous' : p.title}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{p.user?.fullName ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={p.category?.replace('_', ' ') ?? '—'} size="small"
                        sx={{ fontSize: 9, bgcolor: `${CATEGORY_COLORS[p.category] || '#6b7280'}20`, color: CATEGORY_COLORS[p.category] || '#6b7280' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>
                      ❤️ {p._count?.postLikes ?? 0} 💬 {p._count?.postComments ?? 0} 👁️ {p.views ?? 0}
                    </TableCell>
                    <TableCell>
                      {(p._count?.reports ?? 0) > 0 && (
                        <Chip label={`${p._count.reports} reports`} size="small" color="error" sx={{ fontSize: 9 }} />
                      )}
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{new Date(p.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <IconButton size="small" title="Hide Post"
                        onClick={() => action(`${API_BASE}/admin2/community/posts/${p.postId}/hide`, 'put', {}, 'Post hidden')}>
                        <HideIcon fontSize="small" sx={{ color: '#f97316' }} />
                      </IconButton>
                      <IconButton size="small" color="error" title="Delete Post"
                        onClick={() => action(`${API_BASE}/admin2/community/posts/${p.postId}`, 'delete', undefined, 'Post deleted')}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                      <IconButton size="small" title="Ban User"
                        onClick={() => action(`${API_BASE}/admin2/community/users/${p.user?.userId || ''}/ban`, 'put', { reason: 'Admin action' }, 'User banned')}>
                        <BlockIcon fontSize="small" sx={{ color: '#ef4444' }} />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={Math.ceil(totalPosts / 15)} page={postPage} onChange={(_e, p) => setPostPage(p)} color="primary" />
          </Box>
        </>
      ) : (
        <>
          <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'action.hover' }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Post</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reported By</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Reason</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>No reports.</TableCell></TableRow>
                ) : reports.map((r) => (
                  <TableRow key={r.reportId} hover>
                    <TableCell>
                      <Typography variant="caption" fontWeight="bold">{r.post?.title ?? '—'}</Typography>
                    </TableCell>
                    <TableCell><Typography variant="caption">{r.reporter?.fullName ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{r.reason}</Typography></TableCell>
                    <TableCell>
                      <Chip label={r.status} size="small"
                        sx={{ fontSize: 9, bgcolor: r.status === 'pending' ? '#f59e0b20' : '#10b98120', color: r.status === 'pending' ? '#f59e0b' : '#10b981' }} />
                    </TableCell>
                    <TableCell sx={{ fontSize: 11 }}>{new Date(r.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" sx={{ fontSize: 10, mr: 0.5 }}
                        onClick={() => action(`${API_BASE}/admin2/community/reports/${r.reportId}`, 'put', { action: 'dismiss' }, 'Report dismissed')}>
                        Dismiss
                      </Button>
                      <Button size="small" variant="contained" color="error" sx={{ fontSize: 10 }}
                        onClick={() => action(`${API_BASE}/admin2/community/reports/${r.reportId}`, 'put', { action: 'delete_post' }, 'Post deleted')}>
                        Delete Post
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination count={Math.ceil(totalReports / 15)} page={reportPage} onChange={(_e, p) => setReportPage(p)} color="primary" />
          </Box>
        </>
      )}
    </Box>
  );
};

export default CommunityModeration;
