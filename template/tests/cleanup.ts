import type { FullConfig } from '@playwright/test';
import { dropSchema } from './support-database';

export default async function cleanup(config: FullConfig): Promise<void> {
  await dropSchema(config.metadata.schema as string);
}
