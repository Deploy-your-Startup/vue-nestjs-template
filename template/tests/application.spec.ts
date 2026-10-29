import { test, expect } from '@playwright/test';
import type { Task } from '../shared/contracts';

test('GIVEN one Nest server WHEN requesting API, frontend, assets and client routes THEN each is served with the correct content type', async ({
  request,
}) => {
  const health = await request.get('/api/health');
  expect(await health.json()).toEqual({ status: 'ok' });
  const home = await request.get('/');
  expect(home.headers()['content-type']).toContain('text/html');
  const html = await home.text();
  const asset = html.match(/src="([^"]+\.js)"/)?.[1];
  expect(asset).toBeTruthy();
  const javascript = await request.get(asset!);
  expect(javascript.ok()).toBeTruthy();
  expect(javascript.headers()['content-type']).toMatch(/javascript/);
  const deepLink = await request.get('/shipped');
  expect(await deepLink.text()).toBe(html);
  for (const missing of ['/api', '/api/missing']) {
    const response = await request.get(missing);
    expect(response.status()).toBe(404);
    expect(response.headers()['content-type']).toContain('application/json');
  }
  const missingAsset = await request.get('/assets/missing.js');
  expect(missingAsset.status()).toBe(404);
  expect(await missingAsset.text()).not.toBe(html);
});

test('GIVEN task API WHEN creating, changing and deleting a task THEN real persisted state follows each request', async ({
  request,
}) => {
  const response = await request.post('/api/tasks', {
    data: {
      title: 'Integration task',
      description: 'Real HTTP and PostgreSQL',
      category: 'Product',
    },
  });
  expect(response.status()).toBe(201);
  const task = (await response.json()) as Task;
  expect(task.status).toBe('backlog');
  expect(
    ((await (await request.get('/api/tasks')).json()) as Task[]).some(
      (item) => item.id === task.id,
    ),
  ).toBeTruthy();
  const changed = await request.patch(`/api/tasks/${task.id}/status`, {
    data: { status: 'shipped' },
  });
  expect(changed.status()).toBe(200);
  expect((await changed.json()).status).toBe('shipped');
  expect(
    ((await (await request.get('/api/tasks')).json()) as Task[]).find(
      (item) => item.id === task.id,
    )?.status,
  ).toBe('shipped');
  expect((await request.delete(`/api/tasks/${task.id}`)).status()).toBe(204);
  expect((await request.delete(`/api/tasks/${task.id}`)).status()).toBe(404);
  expect(
    (
      await request.patch(`/api/tasks/${task.id}/status`, {
        data: { status: 'backlog' },
      })
    ).status(),
  ).toBe(404);
});

test('GIVEN invalid input WHEN writing tasks THEN validation rejects it without altering data', async ({
  request,
}) => {
  const before = await (await request.get('/api/tasks')).json();
  for (const data of [
    { title: '   ', description: '', category: 'Product' },
    { title: 'a'.repeat(121), description: '', category: 'Product' },
    { title: 'Bad category', description: '', category: 'Unknown' },
    {
      title: 'Bad field',
      description: '',
      category: 'Product',
      status: 'shipped',
    },
    { title: 'Missing fields' },
  ])
    expect((await request.post('/api/tasks', { data })).status()).toBe(400);
  expect(
    (
      await request.patch(`/api/tasks/${before[0].id}/status`, {
        data: { status: 'unknown' },
      })
    ).status(),
  ).toBe(400);
  expect((await request.delete('/api/tasks/not-a-uuid')).status()).toBe(400);
  expect(
    (
      await request.patch('/api/tasks/not-a-uuid/status', {
        data: { status: 'shipped' },
      })
    ).status(),
  ).toBe(400);
  expect(await (await request.get('/api/tasks')).json()).toEqual(before);
});

test('GIVEN the workspace WHEN adding, filtering, shipping, reloading and deleting work THEN the full browser flow persists', async ({
  page,
}) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Small steps. Real progress.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByLabel('Task name').fill('My first customer interview');
  await page.getByLabel('A little more detail').fill('Find out what matters.');
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  const card = page.getByRole('article', {
    name: 'My first customer interview',
    exact: true,
  });
  await expect(card).toBeVisible();
  await page.getByLabel('Find a task').fill('no such task exists');
  await expect(card).toHaveCount(0);
  await page.getByLabel('Find a task').fill('customer interview');
  await expect(card).toBeVisible();
  await page.getByLabel('Filter category').selectOption('Design');
  await expect(card).toHaveCount(0);
  await page.getByLabel('Filter category').selectOption('All categories');
  await card
    .getByLabel('Status for My first customer interview')
    .selectOption('shipped');
  await expect(
    page
      .getByRole('region', { name: 'Shipped', exact: true })
      .getByRole('article', { name: 'My first customer interview' }),
  ).toBeVisible();
  await page
    .getByRole('navigation')
    .getByRole('link', { name: 'Shipped' })
    .click();
  await page.reload();
  await expect(card).toBeVisible();
  await card
    .getByRole('button', { name: 'Delete My first customer interview' })
    .click();
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(card).toHaveCount(0);
});

test('GIVEN a phone screen WHEN opening the board and cancelling a task THEN layout fits and no task is created', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(
    page.getByRole('heading', { name: 'Small steps. Real progress.' }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole('button', { name: 'New task', exact: true }).click();
  await page.getByRole('button', { name: 'Add task', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Task name').fill('Cancelled task');
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Cancelled task' }),
  ).toHaveCount(0);
});

test('GIVEN an API failure WHEN the board loads THEN an actionable error is visible', async ({
  page,
}) => {
  // This browser-only boundary scenario supplements the real HTTP tests above.
  await page.route('**/api/tasks', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({
        message: 'Workspace unavailable. Please reload.',
      }),
    }),
  );
  await page.goto('/');
  await expect(page.getByRole('alert')).toContainText(
    'Workspace unavailable. Please reload.',
  );
});
