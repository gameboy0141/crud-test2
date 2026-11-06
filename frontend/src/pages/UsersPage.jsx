import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SearchIcon from '@mui/icons-material/Search';
import PageHeader from '../components/PageHeader.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyRow from '../components/EmptyRow.jsx';
import api, { getErrorMessage } from '../api.js';

const emptyForm = { uname: '', email: '', password: '' };

const avatarColors = ['#1565c0', '#00897b', '#6a1b9a', '#ef6c00', '#2e7d32', '#c62828'];

function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  const showNotice = (message, severity = 'success') =>
    setNotice({ open: true, message, severity });

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/get_users');
      setUsers(data);
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.uname.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [users, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (user) => {
    setEditing(user);
    setForm({ uname: user.uname, email: user.email, password: '' });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (saving) return;
    setDialogOpen(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.uname.trim() || !form.email.trim()) {
      showNotice('Name and email are required.', 'warning');
      return;
    }
    if (!editing && !form.password) {
      showNotice('Password is required for a new user.', 'warning');
      return;
    }

    const payload = {
      uname: form.uname.trim(),
      email: form.email.trim(),
    };
    if (form.password) payload.password = form.password;

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/update_user/${editing.uid}`, payload);
        showNotice('User updated.');
      } else {
        await api.post('/add_user', payload);
        showNotice('User created.');
      }
      setDialogOpen(false);
      await loadUsers();
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/delete_user/${deleteTarget.uid}`);
      showNotice('User deleted.');
      setDeleteTarget(null);
      await loadUsers();
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Users"
        subtitle="Manage customer accounts. Passwords are stored hashed."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add User
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search by name or email…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          fullWidth
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Email</TableCell>
              <TableCell align="right" width={120}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.uid} hover>
                <TableCell>{user.uid}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Avatar
                      sx={{
                        width: 34,
                        height: 34,
                        fontSize: 14,
                        bgcolor: avatarColors[user.uid % avatarColors.length],
                      }}
                    >
                      {initials(user.uname)}
                    </Avatar>
                    <Typography fontWeight={600}>{user.uname}</Typography>
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{user.email}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(user)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(user)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredUsers.length === 0 && (
              <EmptyRow
                colSpan={4}
                message={search ? 'No users match your search.' : 'No users yet.'}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editing ? `Edit User #${editing.uid}` : 'Add User'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Full name"
                name="uname"
                value={form.uname}
                onChange={handleChange}
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                fullWidth
              />
              <TextField
                label={editing ? 'New password' : 'Password'}
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                required={!editing}
                helperText={editing ? 'Leave blank to keep the current password.' : ''}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete "${deleteTarget?.uname}"? Their orders will also be removed.`}
        loading={deleting}
        onClose={() => !deleting && setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      <Snackbar
        open={notice.open}
        autoHideDuration={3500}
        onClose={() => setNotice((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={notice.severity}
          variant="filled"
          onClose={() => setNotice((current) => ({ ...current, open: false }))}
        >
          {notice.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
