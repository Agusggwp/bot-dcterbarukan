import net from 'net';
import { DiscordBotClient } from './bot.js';
import { startDashboard } from './dashboard/server.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function isPortAvailable(port, retries = 4, delay = 500) {
  for (let i = 0; i < retries; i++) {
    const available = await new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve(false);
        else resolve(true);
      });
      server.once('listening', () => {
        server.close(() => resolve(true));
      });
      server.listen(port);
    });

    if (available) return true;
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  return false;
}

async function bootstrap() {
  logger.info({ nodeEnv: env.NODE_ENV }, 'Starting Enterprise Discord Bot Application...');

  try {
    if (env.DASHBOARD_ENABLED) {
      const available = await isPortAvailable(env.DASHBOARD_PORT);
      if (!available) {
        logger.error(
          { port: env.DASHBOARD_PORT },
          '⚠️ Instans Bot Discord lain sudah berjalan di sistem ini (Port Dashboard sedang aktif). Menolak peluncuran instans ganda untuk mencegah pesan duplikat ("double chat")!'
        );
        process.exit(0);
      }
    }

    // 1. Initialize Bot Client
    const bot = new DiscordBotClient();
    await bot.start();

    // 2. Initialize Optional Web Admin Dashboard
    if (env.DASHBOARD_ENABLED) {
      startDashboard(bot.client);
    }
  } catch (error) {
    logger.fatal({ error: error.message, stack: error.stack }, 'Fatal bootstrap failure');
    process.exit(1);
  }
}

bootstrap();
