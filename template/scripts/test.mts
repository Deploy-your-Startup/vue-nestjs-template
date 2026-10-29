import { dirname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import pg from 'pg';

process.env.PATH = `${dirname(process.execPath)}:${process.env.PATH}`;

const container = `nest-test-${randomUUID()}`;
let ownedContainer = false;
let databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

function docker(args: string[]): string {
  const result = spawnSync('docker', args, { encoding: 'utf8' });
  if (result.status !== 0)
    throw new Error(`Docker ${args[0]} failed: ${result.stderr}`);
  return result.stdout.trim();
}

try {
  if (!databaseUrl) {
    docker([
      'run',
      '--rm',
      '-d',
      '--name',
      container,
      '-p',
      '127.0.0.1::5432',
      '--tmpfs',
      '/var/lib/postgresql',
      '-e',
      'POSTGRES_USER=admin',
      '-e',
      'POSTGRES_PASSWORD=admin',
      '-e',
      'POSTGRES_DB=e2e',
      process.env.POSTGRES_IMAGE ?? 'postgres:18.6',
    ]);
    ownedContainer = true;
    const port = docker(['port', container, '5432/tcp']).split(':').at(-1);
    databaseUrl = `postgres://admin:admin@127.0.0.1:${port}/e2e`;
  }
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    const client = new pg.Client({
      connectionString: databaseUrl,
      connectionTimeoutMillis: 1000,
    });
    try {
      await client.connect();
      ready = true;
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      await client.end().catch(() => undefined);
    }
  }
  if (!ready) throw new Error('PostgreSQL did not become ready.');
  const child = spawn('npx', ['playwright', 'test', ...process.argv.slice(2)], {
    stdio: 'inherit',
    env: { ...process.env, TEST_DATABASE_URL: databaseUrl },
  });
  process.exitCode = await new Promise<number>((resolve) =>
    child.once('exit', (code) => resolve(code ?? 1)),
  );
} finally {
  if (ownedContainer) docker(['stop', container]);
}
