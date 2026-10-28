import { Events } from 'discord.js';
import { WelcomeService } from '../services/welcomeService.js';
import { antiSpamService } from '../services/antiSpamService.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.GuildMemberAdd,
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
        '📥 Event GuildMemberAdd diterima: Anggota baru bergabung'
      );

      // 1. Check anti-raid join spikes
      await antiSpamService.checkJoinRaid(member);

      // 2. Run welcome onboarding, auto-roles, and embeds
      await WelcomeService.handleMemberJoin(member);
    } catch (err) {
      logger.error({ error: err.message, stack: err.stack, userId: member.id }, 'Error in guildMemberAdd event');
    }
  },
};
