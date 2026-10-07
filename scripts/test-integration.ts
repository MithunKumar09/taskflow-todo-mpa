import { getTestDatabaseUrl, migrateTestDatabase, runTool } from './test-database.js';
getTestDatabaseUrl();
migrateTestDatabase();
runTool('node_modules/vitest/vitest.mjs', [
  'run',
  '--config',
  'apps/api/vitest.config.ts',
  '--project',
  'integration',
]);
