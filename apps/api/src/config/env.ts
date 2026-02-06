import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  HOST: z.string().default('0.0.0.0'),
  
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters').default('development-secret-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters').default('development-refresh-secret-key-change-in-production'),
  
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  
  CORS_ORIGINS: z.string().default('*'),
  
  API_VERSION: z.string().default('1.0.0'),
  SERVICE_NAME: z.string().default('school-erp-api'),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error('❌ Invalid environment variables:');
    console.error(parsed.error.flatten().fieldErrors);
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development';
}

export function isProduction(): boolean {
  return env.NODE_ENV === 'production';
}

export function isTest(): boolean {
  return env.NODE_ENV === 'test';
}
