import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import productsRouter, { updateProduct } from './routes/products.js';
import usersRouter, { updateUser } from './routes/users.js';
import ordersRouter from './routes/orders.js';
import { asyncHandler } from './utils/asyncHandler.js';

const app = express();
const PORT = Number(process.env.PORT) || 5000;

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const frontendDist = path.resolve(currentDir, '..', '..', 'frontend', 'dist');

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', productsRouter);
app.use('/api', usersRouter);
app.use('/api', ordersRouter);

// Compatibility alias for the spec's `PUT /api/update/:id`. It infers the
// entity from the payload; prefer the explicit /update_product or /update_user.
app.put(
  '/api/update/:id',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    const userKeys = ['uname', 'email', 'password'];
    const productKeys = ['pname', 'description', 'price', 'qty'];
    const looksLikeUser = userKeys.some((key) => key in body);
    const looksLikeProduct = productKeys.some((key) => key in body);

    if (looksLikeUser && !looksLikeProduct) {
      req.params.uid = req.params.id;
      return updateUser(req, res);
    }
    if (looksLikeProduct && !looksLikeUser) {
      return updateProduct(req, res);
    }
    return res.status(400).json({
      message:
        'Cannot infer entity from payload. Use /api/update_product/:id or /api/update_user/:id.',
    });
  })
);

if (fs.existsSync(path.join(frontendDist, 'index.html'))) {
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'), (error) => {
      if (error) next(error);
    });
  });
} else {
  console.warn(
    `Frontend build not found at ${frontendDist}. Run "npm run build" inside the frontend folder.`
  );
}

app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found` });
});

app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);

  let status = error.status || 500;
  let message = error.message || 'Internal server error';

  if (error.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  } else if (error.code === '23505' || String(message).includes('duplicate key value')) {
    status = 409;
    message = 'A record with the same unique value already exists';
  } else if (error.code === '23503') {
    status = 400;
    message = 'Related record does not exist';
  } else if (error.code === '22P02') {
    status = 400;
    message = 'Invalid identifier or value';
  }

  if (status >= 500) console.error(error);
  res.status(status).json({ message });
});

app.listen(PORT, () => {
  console.log(`App running at http://localhost:${PORT}`);
  console.log(`API available at http://localhost:${PORT}/api`);
});
