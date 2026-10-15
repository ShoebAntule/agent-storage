import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env');
}

export const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
  ssl: 'require',
  connect_timeout: 15,
  idle_timeout: 20
});

// PostgreSQL BIGINT timestamps arrive as strings.
// Convert only the fields used as numbers by the application.
export function normalizeRow(row) {
  if (!row) return undefined;

  const result = { ...row };

  for (const field of [
    'created',
    'started',
    'deadline',
    'expires',
    'version',
    'revision',
    'ai_count'
  ]) {
    if (result[field] !== undefined && result[field] !== null) {
      const value = Number(result[field]);

      if (!Number.isSafeInteger(value)) {
        throw new Error(`Invalid numeric database field: ${field}`);
      }

      result[field] = value;
    }
  }

  return result;
}