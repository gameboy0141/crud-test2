import { Router } from 'express';
import { query } from '../db.js';
import { httpError, parseId, requireFields } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

const baseSelect = `
  SELECT o.oid, o.uid, u.uname, o.pid, p.pname, o.order_date
  FROM orders o
  JOIN users u ON u.uid = o.uid
  JOIN products p ON p.pid = o.pid
`;

async function findOrder(id) {
  const { rows } = await query(`${baseSelect} WHERE o.oid = $1`, [id]);
  return rows[0] ?? null;
}

function normalizeDate(value) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) throw httpError(400, 'order_date is not a valid date');
  return date.toISOString();
}

async function assertRelations(uid, pid) {
  const [userResult, productResult] = await Promise.all([
    query('SELECT uid FROM users WHERE uid = $1', [uid]),
    query('SELECT pid FROM products WHERE pid = $1', [pid]),
  ]);

  if (userResult.rows.length === 0) throw httpError(404, `User ${uid} not found`);
  if (productResult.rows.length === 0) throw httpError(404, `Product ${pid} not found`);
}

router.get(
  '/get_orders',
  asyncHandler(async (req, res) => {
    const conditions = [];
    const values = [];

    if (req.query.uid !== undefined) {
      values.push(parseId(req.query.uid, 'uid'));
      conditions.push(`o.uid = $${values.length}`);
    }
    if (req.query.pid !== undefined) {
      values.push(parseId(req.query.pid, 'pid'));
      conditions.push(`o.pid = $${values.length}`);
    }

    const where = conditions.length ? ` WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await query(`${baseSelect}${where} ORDER BY o.oid DESC`, values);
    res.json(rows);
  })
);

router.get(
  '/get_order/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'oid');
    const order = await findOrder(id);
    if (!order) throw httpError(404, `Order ${id} not found`);
    res.json(order);
  })
);

router.get(
  '/get_orders/uid/:uid',
  asyncHandler(async (req, res) => {
    const uid = parseId(req.params.uid, 'uid');
    const { rows: users } = await query('SELECT uid FROM users WHERE uid = $1', [uid]);
    if (users.length === 0) throw httpError(404, `User ${uid} not found`);

    const { rows } = await query(`${baseSelect} WHERE o.uid = $1 ORDER BY o.oid DESC`, [uid]);
    res.json(rows);
  })
);

router.get(
  '/get_orders/pid/:pid',
  asyncHandler(async (req, res) => {
    const pid = parseId(req.params.pid, 'pid');
    const { rows: products } = await query('SELECT pid FROM products WHERE pid = $1', [pid]);
    if (products.length === 0) throw httpError(404, `Product ${pid} not found`);

    const { rows } = await query(`${baseSelect} WHERE o.pid = $1 ORDER BY o.oid DESC`, [pid]);
    res.json(rows);
  })
);

router.post(
  '/add_order',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    requireFields(body, ['uid', 'pid']);

    const uid = parseId(body.uid, 'uid');
    const pid = parseId(body.pid, 'pid');
    await assertRelations(uid, pid);

    const { rows } = await query(
      'INSERT INTO orders (uid, pid, order_date) VALUES ($1, $2, $3) RETURNING oid',
      [uid, pid, normalizeDate(body.order_date)]
    );

    res.status(201).json(await findOrder(rows[0].oid));
  })
);

router.delete(
  '/delete_order/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'oid');
    const { rows } = await query('DELETE FROM orders WHERE oid = $1 RETURNING oid', [id]);
    if (rows.length === 0) throw httpError(404, `Order ${id} not found`);
    res.json({ message: `Order ${id} deleted` });
  })
);

const updateOrder = asyncHandler(async (req, res) => {
  const id = parseId(req.params.id, 'oid');
  const { rows: existingRows } = await query(
    'SELECT oid, uid, pid, order_date FROM orders WHERE oid = $1',
    [id]
  );
  const existing = existingRows[0];
  if (!existing) throw httpError(404, `Order ${id} not found`);

  const body = req.body ?? {};
  const uid = body.uid === undefined ? existing.uid : parseId(body.uid, 'uid');
  const pid = body.pid === undefined ? existing.pid : parseId(body.pid, 'pid');
  await assertRelations(uid, pid);

  const orderDate =
    body.order_date === undefined ? existing.order_date : normalizeDate(body.order_date);

  await query('UPDATE orders SET uid = $1, pid = $2, order_date = $3 WHERE oid = $4', [
    uid,
    pid,
    orderDate,
    id,
  ]);

  res.json(await findOrder(id));
});

router.put('/update_order/:id', updateOrder);
router.patch('/update_order/:id', updateOrder);

export default router;
