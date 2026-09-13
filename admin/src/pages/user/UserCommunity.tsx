import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  TextField,
  Button,
  Chip,
  CircularProgress,
  Alert,
  MenuItem,
  IconButton,
  Avatar,
  Divider,
} from '@mui/material';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SendIcon from '@mui/icons-material/Send';
import userApiClient from '../../services/userApi';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  likeCount: number;
  author?: { name?: string; fullName?: string };
}

const categories = [
  { value: 'tip', label: 'Safety Tip', color: '#10b981' },
  { value: 'experience', label: 'Experience', color: '#6366f1' },
  { value: 'warning', label: 'Warning', color: '#ef4444' },
  { value: 'question', label: 'Question', color: '#f59e0b' },
];

const getCatColor = (cat: string) =>
  categories.find((c) => c.value === cat)?.color ?? '#9ca3af';
const getCatLabel = (cat: string) =>
  categories.find((c) => c.value === cat)?.label ?? cat;

export const UserCommunity: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({ title: '', content: '', category: 'tip' });
  const [likingId, setLikingId] = useState<string | null>(null);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const res = await userApiClient.get('/community/posts');
      setPosts(res.data?.data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to fetch posts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, []);

  const handleSubmit = async () => {
    if (!form.title || !form.content) return;
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      await userApiClient.post('/community/posts', {
        title: form.title,
        content: form.content,
        category: form.category,
      });
      setSuccess('Post shared with the community!');
      setForm({ title: '', content: '', category: 'tip' });
      fetchPosts();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId: string) => {
    setLikingId(postId);
    try {
      await userApiClient.post(`/community/posts/${postId}/like`);
      setPosts((prev) =>
        prev.map((p) => p.id === postId ? { ...p, likeCount: p.likeCount + 1 } : p)
      );
    } catch (e) {
      // silent fail
    } finally {
      setLikingId(null);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      color: '#f9fafb',
      '& fieldset': { borderColor: 'rgba(99,102,241,0.3)' },
      '&:hover fieldset': { borderColor: '#6366f1' },
      '&.Mui-focused fieldset': { borderColor: '#6366f1' },
    },
    '& .MuiInputLabel-root': { color: '#9ca3af' },
  };

  const getAuthorName = (post: Post) =>
    post.author?.fullName ?? post.author?.name ?? 'Anonymous';

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, minHeight: '100vh', backgroundColor: '#0b0f19' }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          fontWeight={700}
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #6366f1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
          }}
        >
          Community Safety Feed
        </Typography>
        <Typography variant="body2" sx={{ color: '#9ca3af' }}>
          Share tips, experiences, and warnings with your community.
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Card sx={{ backgroundColor: '#111827', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 3, mb: 4, boxShadow: '0 4px 24px rgba(99,102,241,0.08)' }}>
        <CardContent sx={{ p: 3 }}>
          <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2.5 }}>Create a Post</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <TextField fullWidth label="Post Title" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} sx={inputSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                select
                label="Category"
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                sx={inputSx}
                SelectProps={{ MenuProps: { PaperProps: { sx: { backgroundColor: '#1f2937', color: '#f9fafb' } } } }}
              >
                {categories.map((c) => (<MenuItem key={c.value} value={c.value} sx={{ color: '#f9fafb' }}>{c.label}</MenuItem>))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Share your thoughts..."
                multiline
                rows={3}
                value={form.content}
                onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
                sx={inputSx}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <SendIcon />}
                onClick={handleSubmit}
                disabled={submitting || !form.title || !form.content}
                sx={{
                  background: 'linear-gradient(135deg, #10b981, #6366f1)',
                  fontWeight: 600,
                  px: 4,
                  py: 1.2,
                  borderRadius: 2,
                  textTransform: 'none',
                  '&:hover': { opacity: 0.9 },
                }}
              >
                {submitting ? 'Posting...' : 'Post to Community'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Typography variant="h6" fontWeight={600} sx={{ color: '#f9fafb', mb: 2 }}>Community Posts</Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress sx={{ color: '#6366f1' }} />
        </Box>
      ) : posts.length === 0 ? (
        <Card sx={{ backgroundColor: '#111827', borderRadius: 3, border: '1px dashed rgba(99,102,241,0.3)' }}>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontSize: 56, mb: 2 }}>💬</Typography>
            <Typography variant="h6" sx={{ color: '#9ca3af' }}>No posts yet</Typography>
            <Typography variant="body2" sx={{ color: '#6b7280' }}>Be the first to share something with the community!</Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {posts.map((post) => (
            <Grid item xs={12} md={6} key={post.id}>
              <Card
                sx={{
                  backgroundColor: '#111827',
                  border: '1px solid rgba(99,102,241,0.15)',
                  borderRadius: 3,
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 32px rgba(99,102,241,0.18)' },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Box sx={{ flex: 1, mr: 1 }}>
                      <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#f9fafb', mb: 0.5 }}>
                        {post.title}
                      </Typography>
                      <Chip
                        label={getCatLabel(post.category)}
                        size="small"
                        sx={{
                          backgroundColor: getCatColor(post.category) + '22',
                          color: getCatColor(post.category),
                          border: `1px solid ${getCatColor(post.category)}55`,
                          fontWeight: 600,
                          fontSize: 11,
                        }}
                      />
                    </Box>
                  </Box>

                  <Typography
                    variant="body2"
                    sx={{
                      color: '#9ca3af',
                      mb: 2,
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.6,
                    }}
                  >
                    {post.content}
                  </Typography>

                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.06)', mb: 1.5 }} />

                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar sx={{ width: 28, height: 28, backgroundColor: '#6366f1', fontSize: 13, fontWeight: 700 }}>
                        {getAuthorName(post).charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 12 }}>
                        {getAuthorName(post)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#6b7280', fontSize: 12 }}>
                        · {timeAgo(post.createdAt)}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconButton
                        size="small"
                        onClick={() => handleLike(post.id)}
                        disabled={likingId === post.id}
                        sx={{ color: '#f43f5e', '&:hover': { backgroundColor: '#f43f5e22' } }}
                      >
                        {likingId === post.id ? (
                          <CircularProgress size={16} sx={{ color: '#f43f5e' }} />
                        ) : (
                          <FavoriteBorderIcon fontSize="small" />
                        )}
                      </IconButton>
                      <Typography variant="body2" sx={{ color: '#9ca3af', fontSize: 13 }}>
                        {post.likeCount}
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default UserCommunity;
