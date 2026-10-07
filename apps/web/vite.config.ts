import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

export default defineConfig(({ command }) => {
  // Backend NODE_ENV must not turn the production browser build into a development build.
  if (command === 'build') process.env.NODE_ENV = 'production';
  const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
  const env = existsSync(envFile) ? parse(readFileSync(envFile)) : {};
  const target = `http://127.0.0.1:${process.env.API_PORT ?? env.API_PORT ?? '3000'}`;
  const proxy = { '/api': { target }, '/health': { target } };
  return {
    plugins: [react()],
    envDir: false,
    define: {
      'import.meta.env.VITE_API_BASE_URL': JSON.stringify(
        process.env.VITE_API_BASE_URL ?? env.VITE_API_BASE_URL ?? '',
      ),
    },
    server: { proxy },
    preview: { proxy },
    build: {
      rolldownOptions: {
        input: {
          list: fileURLToPath(new URL('index.html', import.meta.url)),
          detail: fileURLToPath(new URL('todo/index.html', import.meta.url)),
        },
      },
    },
  };
});
