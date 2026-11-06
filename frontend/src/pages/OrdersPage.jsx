import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
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
import PageHeader from '../components/PageHeader.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import EmptyRow from '../components/EmptyRow.jsx';
import api, { getErrorMessage } from '../api.js';
import { formatDateTime, toDateTimeInputValue } from '../utils/format.js';

const emptyForm = { uid: '', pid: '', order_date: '' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ uid: '', pid: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState({ open: false, message: '', severity: 'success' });

  const showNotice = (message, severity = 'success') =>
    setNotice({ open: true, message, severity });

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (filters.uid && filters.pid) {
        response = await api.get('/get_orders', {
          params: { uid: filters.uid, pid: filters.pid },
        });
      } else if (filters.uid) {
        response = await api.get(`/get_orders/uid/${filters.uid}`);
      } else if (filters.pid) {
        response = await api.get(`/get_orders/pid/${filters.pid}`);
      } else {
        response = await api.get('/get_orders');
      }
      setOrders(response.data);
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.uid, filters.pid]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  useEffect(() => {
    const loadLookups = async () => {
      try {
        const [usersResponse, productsResponse] = await Promise.all([
          api.get('/get_users'),
          api.get('/get_products'),
        ]);
        setUsers(usersResponse.data);
        setProducts(productsResponse.data);
      } catch (error) {
        showNotice(getErrorMessage(error), 'error');
      }
    };
    loadLookups();
  }, []);

  const openAdd = () => {
    if (users.length === 0 || products.length === 0) {
      showNotice('Add at least one user and one product before creating an order.', 'warning');
      return;
    }
    setEditing(null);
    setForm({
      uid: String(users[0].uid),
      pid: String(products[0].pid),
      order_date: toDateTimeInputValue(new Date()),
    });
    setDialogOpen(true);
  };

  const openEdit = (order) => {
    setEditing(order);
    setForm({
      uid: String(order.uid),
      pid: String(order.pid),
      order_date: toDateTimeInputValue(order.order_date),
    });
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
    if (!form.uid || !form.pid) {
      showNotice('Please choose both a user and a product.', 'warning');
      return;
    }

    const payload = {
      uid: Number(form.uid),
      pid: Number(form.pid),
      order_date: form.order_date ? new Date(form.order_date).toISOString() : undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/update_order/${editing.oid}`, payload);
        showNotice('Order updated.');
      } else {
        await api.post('/add_order', payload);
        showNotice('Order created.');
      }
      setDialogOpen(false);
      await loadOrders();
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
      await api.delete(`/delete_order/${deleteTarget.oid}`);
      showNotice('Order deleted.');
      setDeleteTarget(null);
      await loadOrders();
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  };

  return (
    <Box>
      <PageHeader
        title="Orders"
        subtitle="Link users to products and track order dates."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Order
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <TextField
            select
            size="small"
            label="Filter by user"
            name="uid"
            value={filters.uid}
            onChange={handleFilterChange}
            fullWidth
          >
            <MenuItem value="">All users</MenuItem>
            {users.map((user) => (
              <MenuItem key={user.uid} value={String(user.uid)}>
                {user.uname}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            label="Filter by product"
            name="pid"
            value={filters.pid}
            onChange={handleFilterChange}
            fullWidth
          >
            <MenuItem value="">All products</MenuItem>
            {products.map((product) => (
              <MenuItem key={product.pid} value={String(product.pid)}>
                {product.pname}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell width={80}>ID</TableCell>
              <TableCell>User</TableCell>
              <TableCell>Product</TableCell>
              <TableCell>Order date</TableCell>
              <TableCell align="right" width={120}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.oid} hover>
                <TableCell>{order.oid}</TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography fontWeight={600}>{order.uname}</Typography>
                    <Chip label={`uid ${order.uid}`} size="small" variant="outlined" />
                  </Stack>
                </TableCell>
                <TableCell>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography>{order.pname}</Typography>
                    <Chip label={`pid ${order.pid}`} size="small" variant="outlined" />
                  </Stack>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>
                  {formatDateTime(order.order_date)}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(order)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(order)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && orders.length === 0 && (
              <EmptyRow
                colSpan={5}
                message={
                  filters.uid || filters.pid
                    ? 'No orders match the selected filters.'
                    : 'No orders yet.'
                }
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editing ? `Edit Order #${editing.oid}` : 'Add Order'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                select
                label="User"
                name="uid"
                value={form.uid}
                onChange={handleChange}
                required
                fullWidth
              >
                {users.map((user) => (
                  <MenuItem key={user.uid} value={String(user.uid)}>
                    {user.uname} ({user.email})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Product"
                name="pid"
                value={form.pid}
                onChange={handleChange}
                required
                fullWidth
              >
                {products.map((product) => (
                  <MenuItem key={product.pid} value={String(product.pid)}>
                    {product.pname}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Order date"
                name="order_date"
                type="datetime-local"
                value={form.order_date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create order'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete order #${deleteTarget?.oid}?`}
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
