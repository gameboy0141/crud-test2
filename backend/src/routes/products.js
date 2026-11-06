import { Router } from 'express';
import { query } from '../db.js';
import { httpError, parseId, requireFields } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

async function findProduct(id) {
  const { rows } = await query('SELECT * FROM products WHERE pid = $1', [id]);
  return rows[0] ?? null;
}

function readProductBody(body, { partial = false } = {}) {
  const data = {};
  const allowed = ['pname', 'description', 'price', 'qty'];

  for (const key of allowed) {
    if (body[key] === undefined) continue;
    data[key] = body[key];
  }

  if (!partial) {
    requireFields(body, ['pname']);
    data.pname = String(body.pname).trim();
    data.description = body.description === undefined ? '' : String(body.description).trim();
    data.price = body.price === undefined ? 0 : Number(body.price);
    data.qty = body.qty === undefined ? 0 : Number(body.qty);
  } else {
    if (data.pname !== undefined) {
      if (String(data.pname).trim() === '') throw httpError(400, 'pname cannot be empty');
      data.pname = String(data.pname).trim();
    }
    if (data.description !== undefined) data.description = String(data.description).trim();
    if (data.price !== undefined) data.price = Number(data.price);
    if (data.qty !== undefined) data.qty = Number(data.qty);
  }

  if (data.price !== undefined && (!Number.isFinite(data.price) || data.price < 0)) {
    throw httpError(400, 'price must be a non-negative number');
  }
  if (data.qty !== undefined && (!Number.isInteger(data.qty) || data.qty < 0)) {
    throw httpError(400, 'qty must be a non-negative integer');
  }

  return data;
}

export async function updateProduct(req, res) {
  const id = parseId(req.params.id, 'pid');
  const existing = await findProduct(id);
  if (!existing) throw httpError(404, `Product ${id} not found`);

  const data = readProductBody(req.body ?? {}, { partial: true });
  const keys = Object.keys(data);
  if (keys.length === 0) throw httpError(400, 'No fields provided to update');

  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map((key) => data[key]);
  const { rows } = await query(
    `UPDATE products SET ${assignments} WHERE pid = $${keys.length + 1} RETURNING *`,
    [...values, id]
  );

  if (rows.length === 0) throw httpError(404, `Product ${id} not found`);
  res.json(rows[0]);
}

router.get(
  '/get_products',
  asyncHandler(async (req, res) => {
    const search = req.query.search;

    if (search) {
      const { rows } = await query(
        'SELECT * FROM products WHERE pname ILIKE $1 OR description ILIKE $2 ORDER BY pid DESC',
        [`%${search}%`, `%${search}%`]
      );
      return res.json(rows);
    }

    const { rows } = await query('SELECT * FROM products ORDER BY pid DESC');
    return res.json(rows);
  })
);

router.get(
  '/get_product/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'pid');
    const product = await findProduct(id);
    if (!product) throw httpError(404, `Product ${id} not found`);
    res.json(product);
  })
);

router.post(
  '/add_product',
  asyncHandler(async (req, res) => {
    const data = readProductBody(req.body ?? {});
    const { rows } = await query(
      'INSERT INTO products (pname, description, price, qty) VALUES ($1, $2, $3, $4) RETURNING *',
      [data.pname, data.description, data.price, data.qty]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  '/delete_product/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'pid');
    const { rows } = await query('DELETE FROM products WHERE pid = $1 RETURNING pid', [id]);
    if (rows.length === 0) throw httpError(404, `Product ${id} not found`);
    res.json({ message: `Product ${id} deleted` });
  })
);

router.put('/update_product/:id', asyncHandler(updateProduct));
router.patch('/update_product/:id', asyncHandler(updateProduct));

export default router;
