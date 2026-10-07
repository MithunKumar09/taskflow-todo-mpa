import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { loadEnvironment } from '../apps/api/src/config/env.js';

export function getTestDatabaseUrl(input?: NodeJS.ProcessEnv) {
  if (!input) loadEnvironment();
  const source = input ?? process.env;
  const value = source.TEST_DATABASE_URL;
  if (!value)
    throw new Error('TEST_DATABASE_URL is required. Refusing to use the development database.');
  const url = new URL(value);
  if (
    !['postgres:', 'postgresql:'].includes(url.protocol) ||
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    !decodeURIComponent(url.pathname).endsWith('_test') ||
    url.pathname === (source.DATABASE_URL ? new URL(source.DATABASE_URL).pathname : '')
  )
    throw new Error('Test database must use loopback, end in _test, and differ from development.');
  return value;
}
export function runTool(script: string, args: string[], env: NodeJS.ProcessEnv = process.env) {
  const result = spawnSync(process.execPath, [resolve(script), ...args], { stdio: 'inherit', env });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`Command failed with exit ${result.status ?? 'signal'}: ${script}`);
}
export function migrateTestDatabase() {
  runTool('node_modules/prisma/build/index.js', ['migrate', 'deploy'], {
    ...process.env,
    DATABASE_URL: getTestDatabaseUrl(),
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  migrateTestDatabase();
