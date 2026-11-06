import { pool } from './db.js';
import { orders, products, users } from './seedData.js';
import { hashPassword } from './utils/password.js';

async function seed() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('TRUNCATE TABLE orders, users, products RESTART IDENTITY CASCADE');

    const pidByName = new Map();
    for (const product of products) {
      const { rows } = await client.query(
        'INSERT INTO products (pname, description, price, qty) VALUES ($1, $2, $3, $4) RETURNING pid',
        [product.pname, product.description, product.price, product.qty]
      );
      pidByName.set(product.pname, rows[0].pid);
    }

    const uidByEmail = new Map();
    for (const user of users) {
      const { rows } = await client.query(
        'INSERT INTO users (uname, email, password) VALUES ($1, $2, $3) RETURNING uid',
        [user.uname, user.email, hashPassword(user.password)]
      );
      uidByEmail.set(user.email, rows[0].uid);
    }

    for (const order of orders) {
      const uid = uidByEmail.get(order.userEmail);
      const pid = pidByName.get(order.productName);
      if (!uid || !pid) {
        throw new Error(
          `Could not resolve seed order for ${order.userEmail} / ${order.productName}`
        );
      }
      await client.query(
        'INSERT INTO orders (uid, pid, order_date) VALUES ($1, $2, $3)',
        [uid, pid, order.orderDate]
      );
    }

    await client.query('COMMIT');
    console.log(
      `Seeded ${products.length} products, ${users.length} users and ${orders.length} orders.`
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((error) => {
  console.error('Seeding failed:', error.message ?? error);
  process.exitCode = 1;
});
