import { randomBytes, scryptSync } from 'node:crypto';

export function hashPassword(plain) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(String(plain), salt, 64).toString('hex');
  return `${salt}:${hash}`;
}
