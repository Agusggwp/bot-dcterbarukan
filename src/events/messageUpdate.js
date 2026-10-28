import { Events } from 'discord.js';
import { guildRepository } from '../repositories/guildRepository.js';
import { AppEmbed } from '../utils/embedBuilder.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.MessageUpdate,
  async execute(oldMessage, newMessage) {
    if (!newMessage.guild || newMessage.author?.bot) return;
    if (oldMessage.content === newMessage.content) return; // Ignore embed updates/pins

    try {
      const config = await guildRepository.getGuildConfig(newMessage.guild.id);
      if (!config.modLogChannelId) return;

      const logChannel = await newMessage.guild.channels.fetch(config.modLogChannelId).catch(() => null);
      if (!logChannel || !logChannel.isTextBased()) return;

      const oldContent = oldMessage.cleanContent || '*(Tidak diketahui)*';
      const newContent = newMessage.cleanContent || '*(Kosong)*';

      const embed = AppEmbed.info(
        'Pesan Diedit ✏️',
        `**Penulis:** <@${newMessage.author.id}> (${newMessage.author.tag})\n` +
        `**Saluran:** <#${newMessage.channel.id}>\n` +
        `**Tautan:** [Buka Pesan](${newMessage.url})\n\n` +
        `**Sebelum:**\n${oldContent.slice(0, 400)}\n\n` +
        `**Sesudah:**\n${newContent.slice(0, 400)}`
      );

      await logChannel.send({ embeds: [embed] }).catch(() => null);
    } catch (err) {
      logger.error({ error: err.message }, 'Error in messageUpdate event');
    }
  },
};
