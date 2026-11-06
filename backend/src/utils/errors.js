export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function parseId(value, name = 'id') {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw httpError(400, `${name} must be a positive integer`);
  }
  return id;
}

export function requireFields(body, fields) {
  const missing = fields.filter(
    (field) => body[field] === undefined || body[field] === null || String(body[field]).trim() === ''
  );
  if (missing.length > 0) {
    throw httpError(400, `Missing required field(s): ${missing.join(', ')}`);
  }
}
