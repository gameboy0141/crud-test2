import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from './db.js';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(currentDir, '..', 'supabase', 'schema.sql');

try {
  const schema = fs.readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
  console.log('Supabase schema applied.');
} catch (error) {
  console.error('Failed to apply schema:', error.message ?? error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
