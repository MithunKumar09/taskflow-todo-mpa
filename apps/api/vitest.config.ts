import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['apps/api/tests/unit/**/*.test.ts', 'apps/web/src/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['apps/api/tests/integration/**/*.test.ts'],
          fileParallelism: false,
          testTimeout: 15000,
          hookTimeout: 15000,
        },
      },
    ],
  },
});
