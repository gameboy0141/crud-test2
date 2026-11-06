import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PageHeader from '../components/PageHeader.jsx';
import api from '../api.js';

const cards = [
  {
    key: 'products',
    label: 'Products',
    icon: <Inventory2Icon fontSize="large" />,
    color: '#1565c0',
    path: '/products',
  },
  {
    key: 'users',
    label: 'Users',
    icon: <PeopleIcon fontSize="large" />,
    color: '#00897b',
    path: '/users',
  },
  {
    key: 'orders',
    label: 'Orders',
    icon: <ReceiptLongIcon fontSize="large" />,
    color: '#ef6c00',
    path: '/orders',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({ products: null, users: null, orders: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const [products, users, orders] = await Promise.all([
          api.get('/get_products'),
          api.get('/get_users'),
          api.get('/get_orders'),
        ]);
        setCounts({
          products: products.data.length,
          users: users.data.length,
          orders: orders.data.length,
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    loadCounts();
  }, []);

  return (
    <Box>
      <PageHeader
        title="Dashboard"
        subtitle="A quick overview of your store data."
      />

      {error && (
        <Paper sx={{ p: 2, mb: 2, color: 'error.main' }}>
          Could not reach the API. Make sure the backend is running on port 5000.
        </Paper>
      )}

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
          gap: 2,
          mb: 3,
        }}
      >
        {cards.map((card) => (
          <Card
            key={card.key}
            sx={{
              cursor: 'pointer',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              '&:hover': { transform: 'translateY(-3px)', boxShadow: 4 },
            }}
            onClick={() => navigate(card.path)}
          >
            <CardContent>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {card.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {loading ? <CircularProgress size={24} /> : counts[card.key] ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ color: card.color }}>{card.icon}</Box>
              </Stack>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Getting started
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This app demonstrates full CRUD over products, users and orders. Orders reference an
          existing user and product through foreign keys.
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/products')}
          >
            Manage products
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/users')}
          >
            Manage users
          </Button>
          <Button
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            onClick={() => navigate('/orders')}
          >
            Manage orders
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
