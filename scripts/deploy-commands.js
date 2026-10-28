import { REST, Routes } from 'discord.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { env } from '../src/config/env.js';
import { logger } from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function loadCommandData(dir) {
  const commands = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await loadCommandData(fullPath);
      commands.push(...nested);
    } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.includes('Items')) {
      const fileUrl = pathToFileURL(fullPath).href;
      const module = await import(fileUrl);
      if (module.default?.data) {
        commands.push(module.default.data.toJSON());
      }
    }
  }

  return commands;
}

async function deploy() {
  const isGuildOnly = process.argv.includes('--guild');
  const commandsPath = path.join(__dirname, '..', 'src', 'commands');
  const commands = await loadCommandData(commandsPath);

  logger.info(`🔍 Found ${commands.length} application (slash) commands to deploy.`);

  const rest = new REST({ version: '10' }).setToken(env.DISCORD_TOKEN);

  try {
    if (isGuildOnly) {
      if (!env.DISCORD_GUILD_ID) {
        throw new Error('DISCORD_GUILD_ID is not configured in .env for guild-specific deployment.');
      }
      logger.info(`Deploying ${commands.length} commands to Dev Guild (${env.DISCORD_GUILD_ID})...`);
      await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
        body: commands,
      });
      logger.info('✅ Successfully registered guild slash commands (instant update)!');
    } else {
      logger.info(`Deploying ${commands.length} commands globally...`);
      await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
        body: commands,
      });
      logger.info('✅ Successfully deployed global slash commands!');
    }
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to deploy slash commands');
    process.exit(1);
  }
}

deploy();
