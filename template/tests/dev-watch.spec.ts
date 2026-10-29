import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { isolatedSchema, dropSchema } from './support-database';

test('GIVEN development watch mode WHEN a build fails and the source is fixed THEN the single server recovers', async ({
  playwright,
}) => {
  test.setTimeout(45000);
  const directory = mkdtempSync(join(tmpdir(), 'nest-watch-'));
  const schema = isolatedSchema();
  const excluded = new Set([
    'node_modules',
    'dist',
    'data',
    'test-results',
    'playwright-report',
  ]);
  cpSync(process.cwd(), directory, {
    recursive: true,
    filter: (path) =>
      !excluded.has(relative(process.cwd(), path).split(sep)[0]),
  });
  symlinkSync(
    join(process.cwd(), 'node_modules'),
    join(directory, 'node_modules'),
    'dir',
  );
  const server = spawn(process.execPath, ['scripts/dev.mts'], {
    cwd: directory,
    env: {
      ...process.env,
      PORT: '3197',
      HOST: '127.0.0.1',
      DATABASE_URL: process.env.TEST_DATABASE_URL,
      DATABASE_SCHEMA: schema,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  server.stdout.on('data', (chunk) => {
    output += String(chunk);
  });
  server.stderr.on('data', (chunk) => {
    output += String(chunk);
  });
  const api = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:3197',
  });
  async function healthy(): Promise<boolean> {
    return (await api.get('/api/health').catch(() => null))?.ok() ?? false;
  }
  try {
    await expect.poll(healthy, { timeout: 15000 }).toBeTruthy();
    const file = join(directory, 'shared/contracts.ts');
    const original = readFileSync(file, 'utf8');
    writeFileSync(file, original + '\nconst invalid: string = 42;\n');
    await expect
      .poll(() => output, { timeout: 15000 })
      .toContain('error TS2322');
    expect(await healthy()).toBeFalsy();
    writeFileSync(file, original);
    await expect.poll(healthy, { timeout: 15000 }).toBeTruthy();
  } finally {
    if (server.exitCode === null && server.signalCode === null) {
      const stopped = once(server, 'exit');
      server.kill('SIGTERM');
      await stopped;
    }
    await api.dispose();
    await dropSchema(schema);
    rmSync(directory, { recursive: true, force: true });
  }
});
