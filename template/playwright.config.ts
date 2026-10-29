import { defineConfig } from '@playwright/test';
import { isolatedSchema } from './tests/support-database';

const schema = isolatedSchema();
export default defineConfig({
  testDir: './tests',
  outputDir: process.env.E2E_CONTAINER
    ? '/reports/test-results'
    : 'test-results',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  metadata: { schema },
  globalTeardown: './tests/cleanup.ts',
  use: {
    baseURL: 'http://127.0.0.1:3199',
    browserName: 'chromium',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3199/api/health',
    reuseExistingServer: false,
    env: {
      PORT: '3199',
      HOST: '127.0.0.1',
      DATABASE_URL: process.env.TEST_DATABASE_URL!,
      DATABASE_SCHEMA: schema,
      SEED_DEMO: 'true',
    },
  },
});
