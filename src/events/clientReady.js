import { ActivityType, Events } from 'discord.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    logger.info(`✅ Logged in as ${client.user.tag} (ID: ${client.user.id})`);
    logger.info(`🌐 Serving ${client.guilds.cache.size} guilds and ${client.users.cache.size} users`);

    // Set dynamic rich activity status
    client.user.setPresence({
      activities: [
        {
          name: `/help | Enterprise Edition`,
          type: ActivityType.Playing,
        },
      ],
      status: 'online',
    });
  },
};
