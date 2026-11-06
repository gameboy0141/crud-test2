import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
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
import { formatCurrency } from '../utils/format.js';

const emptyForm = { pname: '', description: '', price: '', qty: '' };

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
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

  const loadProducts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/get_products');
      setProducts(data);
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter(
      (product) =>
        product.pname.toLowerCase().includes(query) ||
        (product.description || '').toLowerCase().includes(query)
    );
  }, [products, search]);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product) => {
    setEditing(product);
    setForm({
      pname: product.pname,
      description: product.description || '',
      price: String(product.price),
      qty: String(product.qty),
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
    if (!form.pname.trim()) {
      showNotice('Product name is required.', 'warning');
      return;
    }

    const payload = {
      pname: form.pname.trim(),
      description: form.description.trim(),
      price: Number(form.price) || 0,
      qty: Number(form.qty) || 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.put(`/update_product/${editing.pid}`, payload);
        showNotice('Product updated.');
      } else {
        await api.post('/add_product', payload);
        showNotice('Product created.');
      }
      setDialogOpen(false);
      await loadProducts();
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
      await api.delete(`/delete_product/${deleteTarget.pid}`);
      showNotice('Product deleted.');
      setDeleteTarget(null);
      await loadProducts();
    } catch (error) {
      showNotice(getErrorMessage(error), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title="Products"
        subtitle="Manage catalog items, pricing and stock."
        action={
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>
            Add Product
          </Button>
        }
      />

      <Paper sx={{ p: 2, mb: 2 }}>
        <TextField
          size="small"
          placeholder="Search products…"
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
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Price</TableCell>
              <TableCell align="right">Qty</TableCell>
              <TableCell align="right" width={120}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredProducts.map((product) => (
              <TableRow key={product.pid} hover>
                <TableCell>{product.pid}</TableCell>
                <TableCell>
                  <Typography fontWeight={600}>{product.pname}</Typography>
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{product.description || '—'}</TableCell>
                <TableCell align="right">{formatCurrency(product.price)}</TableCell>
                <TableCell align="right">{product.qty}</TableCell>
                <TableCell align="right">
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(product)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => setDeleteTarget(product)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredProducts.length === 0 && (
              <EmptyRow
                colSpan={6}
                message={search ? 'No products match your search.' : 'No products yet.'}
              />
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <Box component="form" onSubmit={handleSubmit}>
          <DialogTitle>{editing ? `Edit Product #${editing.pid}` : 'Add Product'}</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ mt: 1 }}>
              <TextField
                label="Product name"
                name="pname"
                value={form.pname}
                onChange={handleChange}
                required
                autoFocus
                fullWidth
              />
              <TextField
                label="Description"
                name="description"
                value={form.description}
                onChange={handleChange}
                multiline
                minRows={2}
                fullWidth
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <TextField
                  label="Price"
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: '0.01' }}
                  fullWidth
                />
                <TextField
                  label="Quantity"
                  name="qty"
                  type="number"
                  value={form.qty}
                  onChange={handleChange}
                  inputProps={{ min: 0, step: 1 }}
                  fullWidth
                />
              </Stack>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={closeDialog} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? 'Saving…' : editing ? 'Save changes' : 'Create product'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Delete "${deleteTarget?.pname}"? Related orders will also be removed.`}
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
