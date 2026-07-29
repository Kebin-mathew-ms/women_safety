import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Alert,
  CircularProgress, IconButton, Grid, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const ROLE_COLORS: Record<string, string> = {
  superadmin: '#ef4444', admin: '#4f46e5', moderator: '#f59e0b',
  support: '#10b981', analytics: '#06b6d4', readonly: '#6b7280',
};

const RolesPermissions: React.FC = () => {
  const [roles, setRoles] = useState<any[]>([]);
  const [permissions, setPermissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Role dialog
  const [roleDialog, setRoleDialog] = useState(false);
  const [editRole, setEditRole] = useState<any | null>(null);
  const [roleForm, setRoleForm] = useState({ roleName: '', description: '' });

  // Permissions dialog
  const [permDialog, setPermDialog] = useState(false);
  const [permRole, setPermRole] = useState<any | null>(null);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const getToken = () => localStorage.getItem('admin_token') || '';
  const headers = { Authorization: `Bearer ${getToken()}` };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        axios.get(`${API_BASE}/admin2/roles`, { headers }),
        axios.get(`${API_BASE}/admin2/permissions`, { headers }),
      ]);
      if (rolesRes.data.success) setRoles(rolesRes.data.data);
      if (permsRes.data.success) setPermissions(permsRes.data.data);
    } catch {
      setError('Failed to load roles and permissions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const openRoleCreate = () => { setEditRole(null); setRoleForm({ roleName: '', description: '' }); setRoleDialog(true); };
  const openRoleEdit = (r: any) => { setEditRole(r); setRoleForm({ roleName: r.roleName, description: r.description ?? '' }); setRoleDialog(true); };

  const saveRole = async () => {
    setSubmitting(true);
    try {
      if (editRole) {
        await axios.put(`${API_BASE}/admin2/roles/${editRole.roleId}`, roleForm, { headers });
        setSuccess('Role updated.');
      } else {
        await axios.post(`${API_BASE}/admin2/roles`, roleForm, { headers });
        setSuccess('Role created.');
      }
      setRoleDialog(false);
      fetchAll();
    } catch {
      setError('Failed to save role.');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteRole = async (roleId: string) => {
    if (!window.confirm('Delete this role?')) return;
    try {
      await axios.delete(`${API_BASE}/admin2/roles/${roleId}`, { headers });
      setSuccess('Role deleted.');
      fetchAll();
    } catch {
      setError('Failed to delete role.');
    }
  };

  const openPermDialog = (r: any) => {
    setPermRole(r);
    setSelectedPerms(r.rolePermissions?.map((rp: any) => rp.permissionId) ?? []);
    setPermDialog(true);
  };

  const savePerms = async () => {
    setSubmitting(true);
    try {
      await axios.post(`${API_BASE}/admin2/roles/${permRole.roleId}/permissions`, { permissionIds: selectedPerms }, { headers });
      setSuccess('Permissions updated.');
      setPermDialog(false);
      fetchAll();
    } catch {
      setError('Failed to update permissions.');
    } finally {
      setSubmitting(false);
    }
  };

  const groupedPerms = permissions.reduce((acc: Record<string, any[]>, p: any) => {
    if (!acc[p.module]) acc[p.module] = [];
    acc[p.module].push(p);
    return acc;
  }, {});

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">🔐 Roles & Permissions</Typography>
          <Typography variant="body2" color="text.secondary">Manage RBAC roles and their permission grants.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openRoleCreate} sx={{ bgcolor: '#4f46e5' }}>New Role</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>{success}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : (
        <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Permissions</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.roleId} hover>
                  <TableCell>
                    <Chip label={r.roleName} size="small"
                      sx={{ bgcolor: `${ROLE_COLORS[r.roleName] || '#4f46e5'}20`, color: ROLE_COLORS[r.roleName] || '#4f46e5', fontWeight: 'bold' }} />
                  </TableCell>
                  <TableCell>{r.description ?? '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      {r.rolePermissions?.slice(0, 4).map((rp: any) => (
                        <Chip key={rp.rolePermissionId} label={rp.permission?.permissionName ?? '?'} size="small"
                          sx={{ fontSize: 9, bgcolor: '#4f46e510', color: '#818cf8' }} />
                      ))}
                      {r.rolePermissions?.length > 4 && (
                        <Chip label={`+${r.rolePermissions.length - 4} more`} size="small" sx={{ fontSize: 9 }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => openPermDialog(r)} title="Manage Permissions">🔑</IconButton>
                    <IconButton size="small" onClick={() => openRoleEdit(r)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => deleteRole(r.roleId)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}

      {/* Role Dialog */}
      <Dialog open={roleDialog} onClose={() => setRoleDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight="bold">{editRole ? '✏️ Edit Role' : '➕ Create Role'}</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField label="Role Name" value={roleForm.roleName} onChange={(e) => setRoleForm({ ...roleForm, roleName: e.target.value })} fullWidth size="small" />
          <TextField label="Description" value={roleForm.description} onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })} fullWidth size="small" multiline rows={2} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRoleDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveRole} disabled={submitting || !roleForm.roleName} sx={{ bgcolor: '#4f46e5' }}>
            {submitting ? <CircularProgress size={18} /> : editRole ? 'Save' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Permissions Dialog */}
      <Dialog open={permDialog} onClose={() => setPermDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle fontWeight="bold">🔑 Permissions for <em>{permRole?.roleName}</em></DialogTitle>
        <DialogContent>
          {Object.entries(groupedPerms).map(([module, perms]) => (
            <Box key={module} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" fontWeight="bold" color="text.secondary" sx={{ mb: 1 }}>{module.toUpperCase()}</Typography>
              <Divider sx={{ mb: 1 }} />
              <Grid container spacing={1}>
                {(perms as any[]).map((p: any) => (
                  <Grid item xs={12} sm={6} key={p.permissionId}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={selectedPerms.includes(p.permissionId)}
                          onChange={(e) => setSelectedPerms(e.target.checked
                            ? [...selectedPerms, p.permissionId]
                            : selectedPerms.filter((id) => id !== p.permissionId)
                          )}
                          sx={{ color: '#4f46e5', '&.Mui-checked': { color: '#4f46e5' } }}
                        />
                      }
                      label={<Typography variant="body2" fontFamily="monospace">{p.permissionName}</Typography>}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPermDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={savePerms} disabled={submitting} sx={{ bgcolor: '#4f46e5' }}>
            {submitting ? <CircularProgress size={18} /> : 'Save Permissions'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RolesPermissions;
