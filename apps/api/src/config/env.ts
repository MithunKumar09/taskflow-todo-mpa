import { config } from 'dotenv';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

export function loadEnvironment() {
  config({ path: fileURLToPath(new URL('../../../../.env', import.meta.url)), quiet: true });
}

const databaseUrl = z
  .url()
  .refine(
    (value) =>
      URL.canParse(value) && ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
    'Expected a PostgreSQL connection URL.',
  );
export const environmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  WEB_ORIGIN: z.url().refine((value) => {
    if (!URL.canParse(value)) return false;
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol) && url.origin === value;
  }, 'WEB_ORIGIN must be an HTTP(S) origin without a trailing slash or path.'),
  DATABASE_URL: databaseUrl,
});
export type Environment = z.infer<typeof environmentSchema>;

export function readEnvironment(input: NodeJS.ProcessEnv = process.env): Environment {
  const result = environmentSchema.safeParse(input);
  if (!result.success) {
    const fields = [...new Set(result.error.issues.map((issue) => issue.path.join('.')))];
    throw new Error(`Invalid startup configuration: ${fields.join(', ')}. Check .env.example.`);
  }
  return result.data;
}
