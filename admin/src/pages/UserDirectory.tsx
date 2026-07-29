import React, { useState, useEffect } from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem, Button, Typography, Chip, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Search as SearchIcon, Block as BlockIcon, Phone as PhoneIcon } from '@mui/icons-material';
import apiClient from '../services/api';

export const UserDirectory: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (statusFilter === 'active') params.isActive = true;
      if (statusFilter === 'blocked') params.isBlocked = true;

      const response = await apiClient.get('/admin/users', { params });
      if (response.data.success) {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      console.warn('Failed to load user directory:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, statusFilter]);

  const handleToggleBlock = async (userId: string, currentBlockedState: boolean) => {
    try {
      const response = await apiClient.put(`/admin/users/${userId}/block`, {
        isBlocked: !currentBlockedState,
      });
      if (response.data.success) {
        setUsers((prev) =>
          prev.map((user) =>
            user.userId === userId ? { ...user, isBlocked: !currentBlockedState } : user
          )
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user block status');
    }
  };

  const handleOpenContacts = (user: any) => {
    setSelectedUser(user);
    setOpenDialog(true);
  };

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          User Directory
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Monitor registered users, inspect safe contact networks, or suspend accounts.
        </Typography>
      </Box>

      {/* Filters & Search */}
      <Paper sx={{ p: 2, mb: 3, display: 'flex', gap: 2, alignItems: 'center', border: '1px solid #1f2937' }}>
        <TextField
          size="small"
          label="Search users"
          variant="outlined"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ flexGrow: 1 }}
          InputProps={{
            startAdornment: <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />,
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ width: 180 }}
        >
          <MenuItem value="all">All Users</MenuItem>
          <MenuItem value="active">Active Only</MenuItem>
          <MenuItem value="blocked">Suspended Only</MenuItem>
        </TextField>
        <Button variant="contained" onClick={fetchUsers}>
          Refresh
        </Button>
      </Paper>

      {/* Users Table */}
      <TableContainer component={Paper} sx={{ border: '1px solid #1f2937', borderRadius: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Full Name</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Email Address</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Phone Number</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Joined Date</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="center">Emergency Contacts</TableCell>
              <TableCell sx={{ fontWeight: 600 }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  Loading user accounts...
                </TableCell>
              </TableRow>
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No matching user accounts found.
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell sx={{ fontWeight: 'medium' }}>{user.fullName}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{user.phone}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Chip label="Suspended" color="error" size="small" />
                    ) : user.isActive ? (
                      <Chip label="Active" color="success" size="small" />
                    ) : (
                      <Chip label="Inactive" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell align="center">
                    <Button size="small" variant="outlined" onClick={() => handleOpenContacts(user)}>
                      View ({user.emergencyContacts?.length || 0})
                    </Button>
                  </TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      color={user.isBlocked ? 'success' : 'error'}
                      startIcon={<BlockIcon />}
                      onClick={() => handleToggleBlock(user.userId, user.isBlocked)}
                    >
                      {user.isBlocked ? 'Unsuspend' : 'Suspend'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Emergency Contacts Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          Emergency Circle: {selectedUser?.fullName}
        </DialogTitle>
        <DialogContent dividers sx={{ backgroundColor: '#111827' }}>
          {!selectedUser?.emergencyContacts || selectedUser.emergencyContacts.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              This user has not configured any emergency contacts.
            </Typography>
          ) : (
            selectedUser.emergencyContacts.map((contact: any) => (
              <Box
                key={contact.contactId}
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                p={2}
                mb={1.5}
                sx={{
                  border: '1px solid #1f2937',
                  borderRadius: 2,
                  backgroundColor: '#0b0f19',
                }}
              >
                <Box>
                  <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {contact.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      ({contact.relationship})
                    </Typography>
                    {contact.isPrimary && (
                      <Chip label="Primary" color="primary" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary" display="flex" alignItems="center" gap={0.5}>
                    <PhoneIcon fontSize="inherit" /> {contact.phone}
                  </Typography>
                </Box>
                <Chip label={`Priority: ${contact.priority}`} size="small" variant="outlined" color="warning" />
              </Box>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserDirectory;
