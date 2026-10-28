import { Client, GatewayIntentBits, Partials, Collection } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { JobManager } from './schedulers/jobManager.js';
import { disconnectPrisma } from './database/client.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class DiscordBotClient {
  constructor() {
    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers, // Privileged Intent
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Privileged Intent
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
      ],
      partials: [Partials.Message, Partials.Channel, Partials.Reaction, Partials.User],
    });

    this.client.commands = new Collection();
    this.jobManager = new JobManager(this.client);
  }

  async loadCommands(dir = path.join(__dirname, 'commands')) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await this.loadCommands(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('Items')) {
        const fileUrl = pathToFileURL(fullPath).href;
        const module = await import(fileUrl);
        const command = module.default;

        if (command?.data?.name && typeof command.execute === 'function') {
          this.client.commands.set(command.data.name, command);
          logger.debug(`Loaded command: /${command.data.name}`);
        } else {
          logger.warn(`Skipping invalid command file: ${entry.name}`);
        }
      }
    }
  }

  async loadEvents(dir = path.join(__dirname, 'events')) {
    const files = fs.readdirSync(dir).filter((file) => file.endsWith('.js'));

    for (const file of files) {
      const fullPath = path.join(dir, file);
      const fileUrl = pathToFileURL(fullPath).href;
      const module = await import(fileUrl);
      const event = module.default;

      if (!event?.name || typeof event.execute !== 'function') {
        logger.warn(`Skipping invalid event file: ${file}`);
        continue;
      }

      if (event.once) {
        this.client.once(event.name, (...args) => event.execute(...args));
      } else {
        this.client.on(event.name, (...args) => event.execute(...args));
      }

      logger.debug(`Registered event: ${event.name}`);
    }
  }

  async start() {
    logger.info('Initializing Discord Enterprise Bot...');

    await this.loadCommands();
    logger.info(`✅ Loaded ${this.client.commands.size} slash commands.`);

    await this.loadEvents();
    logger.info('✅ Registered event listeners.');

    await this.client.login(env.DISCORD_TOKEN);
    this.jobManager.start();

    this.setupGracefulShutdown();
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Starting graceful shutdown...`);
      try {
        this.jobManager.stop();
        if (this.client.isReady()) {
          this.client.destroy();
          logger.info('Discord Gateway connection terminated.');
        }
        await disconnectPrisma();
        logger.info('Prisma disconnected.');
      } catch (err) {
        logger.error({ error: err.message }, 'Error during shutdown');
      } finally {
        process.exit(0);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

    process.on('unhandledRejection', (reason, promise) => {
      logger.error({ reason, promise }, 'Unhandled Promise Rejection caught');
    });

    process.on('uncaughtException', (err) => {
      logger.fatal({ error: err.message, stack: err.stack }, 'Uncaught Exception caught! Initiating emergency shutdown');
      shutdown('UNCAUGHT_EXCEPTION');
    });
  }
}
