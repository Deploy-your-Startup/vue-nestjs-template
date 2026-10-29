import { randomUUID } from 'node:crypto';
import pg from 'pg';

export function isolatedSchema(): string {
  return `test_${randomUUID().replaceAll('-', '')}`;
}

export async function dropSchema(schema: string): Promise<void> {
  if (!/^test_[a-f0-9]{32}$/.test(schema))
    throw new Error('Refusing to drop a non-test schema.');
  const client = new pg.Client({
    connectionString: process.env.TEST_DATABASE_URL,
  });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA IF EXISTS "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
}
