import { dirname } from 'node:path';
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { watch } from 'node:fs';

process.env.PATH = `${dirname(process.execPath)}:${process.env.PATH}`;

let server: ChildProcess | undefined;
let rebuilding = false;
let queued = false;
let stopping = false;

async function rebuild(): Promise<void> {
  if (rebuilding) {
    queued = true;
    return;
  }
  rebuilding = true;
  if (server && server.exitCode === null && server.signalCode === null) {
    const stopped = new Promise<void>((resolve) =>
      server!.once('exit', () => resolve()),
    );
    server.kill('SIGTERM');
    await stopped;
  }
  server = undefined;
  const result = spawnSync('npm', ['run', 'build'], { stdio: 'inherit' });
  const migration =
    result.status === 0
      ? spawnSync('node', ['dist/backend/migrate.js'], { stdio: 'inherit' })
      : undefined;
  if (migration?.status === 0 && !stopping)
    server = spawn('node', ['dist/backend/main.js'], {
      stdio: 'inherit',
      env: { ...process.env, SEED_DEMO: process.env.SEED_DEMO ?? 'true' },
    });
  rebuilding = false;
  if (queued && !stopping) {
    queued = false;
    await rebuild();
  }
}

let timer: ReturnType<typeof setTimeout>;
const watchers = ['backend', 'frontend', 'shared'].map((path) =>
  watch(path, { recursive: true }, () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      void rebuild();
    }, 150);
  }),
);

function shutdown(): void {
  stopping = true;
  clearTimeout(timer);
  for (const watcher of watchers) watcher.close();
  server?.kill('SIGTERM');
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
void rebuild();
