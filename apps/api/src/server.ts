import { loadEnvironment, readEnvironment } from './config/env.js';
import { buildApp } from './app.js';

loadEnvironment();
async function main() {
  const env = readEnvironment();
  const app = await buildApp({ env });
  let closing = false;
  async function shutdown(signal: string) {
    if (closing) return;
    closing = true;
    app.log.info({ signal }, 'Graceful shutdown started');
    const deadline = setTimeout(() => {
      app.log.fatal('Shutdown deadline exceeded');
      process.exit(1);
    }, 15000);
    deadline.unref();
    try {
      await app.close();
      process.exitCode = 0;
    } catch (error) {
      app.log.error({ err: error }, 'Shutdown failed');
      process.exitCode = 1;
    } finally {
      clearTimeout(deadline);
    }
  }
  process.once('SIGINT', () => void shutdown('SIGINT'));
  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  try {
    await app.listen({ port: env.API_PORT, host: '127.0.0.1' });
  } catch (error) {
    app.log.fatal({ err: error }, 'Startup failed');
    await app.close();
    process.exitCode = 1;
  }
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Startup failed');
  process.exitCode = 1;
});
