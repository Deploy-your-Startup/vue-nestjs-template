import { test, expect } from '@playwright/test';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { once } from 'node:events';
import { isolatedSchema, dropSchema } from './support-database';
import type { Task } from '../shared/contracts';

test('GIVEN saved tasks WHEN the entire Nest process restarts THEN changes survive and deleted seed tasks stay deleted', async ({
  playwright,
}) => {
  const schema = isolatedSchema();
  const environment = {
    ...process.env,
    PORT: '3198',
    HOST: '127.0.0.1',
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    DATABASE_SCHEMA: schema,
    SEED_DEMO: 'true',
  };
  const api = await playwright.request.newContext({
    baseURL: 'http://127.0.0.1:3198',
  });
  let server: ChildProcess | undefined;

  async function start(): Promise<void> {
    expect(
      spawnSync(process.execPath, ['dist/backend/migrate.js'], {
        env: environment,
        stdio: 'inherit',
      }).status,
    ).toBe(0);
    server = spawn(process.execPath, ['dist/backend/main.js'], {
      env: environment,
      stdio: 'ignore',
    });
    await expect
      .poll(async () => {
        if (server?.exitCode !== null) return false;
        return (await api.get('/api/health').catch(() => null))?.ok() ?? false;
      })
      .toBeTruthy();
  }

  async function stop(): Promise<void> {
    if (server && server.exitCode === null) {
      const exited = once(server, 'exit');
      server.kill('SIGTERM');
      await exited;
    }
  }

  try {
    await start();
    const examples = (await (await api.get('/api/tasks')).json()) as Task[];
    const response = await api.post('/api/tasks', {
      data: {
        title: 'Survives restart',
        description: '',
        category: 'Engineering',
      },
    });
    const created = (await response.json()) as Task;
    await api.patch(`/api/tasks/${created.id}/status`, {
      data: { status: 'shipped' },
    });
    for (const task of examples)
      expect((await api.delete(`/api/tasks/${task.id}`)).status()).toBe(204);
    await stop();
    await start();
    const tasks = (await (await api.get('/api/tasks')).json()) as Task[];
    expect(tasks).toHaveLength(1);
    expect(tasks[0]).toMatchObject({
      id: created.id,
      status: 'shipped',
      title: 'Survives restart',
    });
    expect((await api.delete(`/api/tasks/${created.id}`)).status()).toBe(204);
    await stop();
    await start();
    expect(await (await api.get('/api/tasks')).json()).toEqual([]);
  } finally {
    await stop();
    await api.dispose();
    await dropSchema(schema);
  }
});
