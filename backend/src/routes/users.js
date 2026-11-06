import { Router } from 'express';
import { query } from '../db.js';
import { httpError, parseId, requireFields } from '../utils/errors.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { hashPassword } from '../utils/password.js';

const router = Router();
const publicColumns = 'uid, uname, email';

async function findUser(id) {
  const { rows } = await query(`SELECT ${publicColumns} FROM users WHERE uid = $1`, [id]);
  return rows[0] ?? null;
}

async function assertEmailAvailable(email, exceptUid = null) {
  const { rows } = await query('SELECT uid FROM users WHERE email = $1', [email]);
  if (rows[0] && Number(rows[0].uid) !== Number(exceptUid)) {
    throw httpError(409, `Email ${email} is already registered`);
  }
}

export async function updateUser(req, res) {
  const id = parseId(req.params.uid ?? req.params.id, 'uid');
  const existing = await findUser(id);
  if (!existing) throw httpError(404, `User ${id} not found`);

  const body = req.body ?? {};
  const data = {};

  if (body.uname !== undefined) {
    const uname = String(body.uname).trim();
    if (!uname) throw httpError(400, 'uname cannot be empty');
    data.uname = uname;
  }

  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email) throw httpError(400, 'email cannot be empty');
    await assertEmailAvailable(email, id);
    data.email = email;
  }

  if (body.password !== undefined && String(body.password) !== '') {
    data.password = hashPassword(body.password);
  }

  const keys = Object.keys(data);
  if (keys.length === 0) throw httpError(400, 'No fields provided to update');

  const assignments = keys.map((key, index) => `${key} = $${index + 1}`).join(', ');
  const values = keys.map((key) => data[key]);
  const { rows } = await query(
    `UPDATE users SET ${assignments} WHERE uid = $${keys.length + 1} RETURNING ${publicColumns}`,
    [...values, id]
  );

  if (rows.length === 0) throw httpError(404, `User ${id} not found`);
  res.json(rows[0]);
}

router.get(
  '/get_users',
  asyncHandler(async (req, res) => {
    const search = req.query.search;

    if (search) {
      const { rows } = await query(
        `SELECT ${publicColumns} FROM users WHERE uname ILIKE $1 OR email ILIKE $2 ORDER BY uid DESC`,
        [`%${search}%`, `%${search}%`]
      );
      return res.json(rows);
    }

    const { rows } = await query(`SELECT ${publicColumns} FROM users ORDER BY uid DESC`);
    return res.json(rows);
  })
);

router.get(
  '/get_user/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'uid');
    const user = await findUser(id);
    if (!user) throw httpError(404, `User ${id} not found`);
    res.json(user);
  })
);

router.post(
  '/add_user',
  asyncHandler(async (req, res) => {
    const body = req.body ?? {};
    requireFields(body, ['uname', 'email', 'password']);

    const uname = String(body.uname).trim();
    const email = String(body.email).trim().toLowerCase();
    if (!uname) throw httpError(400, 'uname cannot be empty');
    await assertEmailAvailable(email);

    const { rows } = await query(
      `INSERT INTO users (uname, email, password) VALUES ($1, $2, $3) RETURNING ${publicColumns}`,
      [uname, email, hashPassword(body.password)]
    );
    res.status(201).json(rows[0]);
  })
);

router.delete(
  '/delete_user/:id',
  asyncHandler(async (req, res) => {
    const id = parseId(req.params.id, 'uid');
    const { rows } = await query('DELETE FROM users WHERE uid = $1 RETURNING uid', [id]);
    if (rows.length === 0) throw httpError(404, `User ${id} not found`);
    res.json({ message: `User ${id} deleted` });
  })
);

router.put('/update_user/:id', asyncHandler(updateUser));
router.patch('/update_user/:id', asyncHandler(updateUser));

export default router;
