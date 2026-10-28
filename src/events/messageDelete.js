import { Events } from 'discord.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageDelete,
  async execute(message) {
    if (!message.guild || message.author?.bot) return;

    try {
      const config = await guildRepository.getGuildConfig(message.guild.id);
      if (!config.modLogChannelId) return;

      const logChannel = await message.guild.channels.fetch(config.modLogChannelId).catch(() => null);
      if (!logChannel || !logChannel.isTextBased()) return;

      const content = message.cleanContent || '*(Pesan tidak memiliki teks, lampiran atau embed)*';
      const truncated = content.length > 800 ? `${content.slice(0, 800)}...` : content;

      const embed = AppEmbed.warning(
        'Pesan Dihapus 🗑️',
        `**Penulis:** <@${message.author?.id || 'Unknown'}> (${message.author?.tag || 'N/A'})\n` +
        `**Saluran:** <#${message.channel.id}>\n\n` +
        `**Konten:**\n${truncated}`
      );

      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } catch (err) {
      logger.error({ error: err.message }, 'Error in messageDelete event');
    }
  },
};
