import { Events } from 'discord.js';
import { WelcomeService } from '../services/welcomeService.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.GuildMemberRemove,
  async execute(member) {
    try {
      logger.info(
        {
          tag: member.user?.tag,
          id: member.id,
          guildName: member.guild?.name,
          guildId: member.guild?.id,
          isBot: member.user?.bot,
        },
        '📤 Event GuildMemberRemove diterima: Anggota meninggalkan server (keluar)'
      );
      await WelcomeService.handleMemberLeave(member);
    } catch (err) {
      logger.error({ error: err.message, stack: err.stack, userId: member.id }, 'Error in guildMemberRemove event');
    }
  },
};
