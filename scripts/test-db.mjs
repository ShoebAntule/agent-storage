import 'dotenv/config';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing from .env');
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, {
  max: 1,
  prepare: false,
  ssl: 'require',
  connect_timeout: 15
});

try {
  await sql`SELECT 1`;

  const tables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'app_private'
    ORDER BY table_name
  `;

  const names = tables.map(row => row.table_name);
  const expected = [
    'attempts',
    'messages',
    'sessions',
    'snapshots',
    'users'
  ];

  const missing = expected.filter(name => !names.includes(name));

  if (missing.length) {
    console.error('Connected, but missing tables:', missing.join(', '));
    process.exitCode = 1;
  } else {
    console.log('Supabase connection successful!');
    console.log('All five application tables are present.');
  }
} catch (error) {
  console.error('Database connection failed.');
  console.error('Error code:', error.code || error.name);
  process.exitCode = 1;
} finally {
  await sql.end({ timeout: 5 });
}