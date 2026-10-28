import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required in production').default('test-token-placeholder'),
  DISCORD_CLIENT_ID: z.string().min(1, 'DISCORD_CLIENT_ID is required in production').default('123456789012345678'),
  DISCORD_GUILD_ID: z.string().optional(),
  DATABASE_URL: z.string().default('mysql://root:@localhost:3306/discord_bot'),
  REDIS_URL: z.string().optional(),
  DASHBOARD_ENABLED: z.string().transform((v) => v === 'true').default('false'),
  DASHBOARD_PORT: z.coerce.number().default(3000),
  DASHBOARD_BASE_URL: z.string().default('http://localhost:3000'),
  DASHBOARD_SESSION_SECRET: z.string().min(16, 'DASHBOARD_SESSION_SECRET must be at least 16 chars').default('development_secret_must_change_in_prod_123456'),
  DISCORD_CLIENT_SECRET: z.string().optional(),
  WEATHER_API_KEY: z.string().optional(),
  TRANSLATE_API_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Environment validation failed:', JSON.stringify(parsed.error.format(), null, 2));
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}

export const env = parsed.success ? parsed.data : envSchema.parse({});
