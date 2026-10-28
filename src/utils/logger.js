import pino from 'pino';
import { env } from '../config/env.js';

const isProduction = env.NODE_ENV === 'production';

const redactOptions = {
  paths: [
    'token',
    '*.token',
    'DISCORD_TOKEN',
    'DISCORD_CLIENT_SECRET',
    'secret',
    '*.secret',
    'password',
    '*.password',
    'authorization',
    'DATABASE_URL',
    'req.headers.authorization',
    'req.headers.cookie',
  ],
  censor: '[REDACTED]',
};

export const logger = pino({
  level: env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  redact: redactOptions,
  transport: !isProduction
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});
