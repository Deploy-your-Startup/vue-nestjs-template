import dataSource, { schema } from './data-source';

async function migrate(): Promise<void> {
  await dataSource.initialize();
  const lock = dataSource.createQueryRunner();
  await lock.connect();
  try {
    await lock.query('SELECT pg_advisory_lock(hashtext($1))', [
      `${schema}:migrations`,
    ]);
    await lock.query(`CREATE SCHEMA IF NOT EXISTS "${schema}"`);
    await dataSource.runMigrations({ transaction: 'all' });
  } finally {
    await lock.query('SELECT pg_advisory_unlock(hashtext($1))', [
      `${schema}:migrations`,
    ]);
    await lock.release();
    await dataSource.destroy();
  }
}

void migrate().catch(() => {
  console.error(
    'Database migration failed. Check PostgreSQL availability and configuration.',
  );
  process.exitCode = 1;
});
