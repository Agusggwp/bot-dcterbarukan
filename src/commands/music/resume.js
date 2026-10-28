import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('resume')
    .setDescription('Melanjutkan pemutaran musik yang sedang dijeda.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub || !sub.currentSong) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Tidak Ada Musik', 'Saat ini tidak ada musik yang sedang diputar atau dijeda.')],
        ephemeral: true,
      });
    }

    sub.resume();
    await interaction.reply({
      embeds: [AppEmbed.success('▶️ Musik Dilanjutkan', `Melanjutkan pemutaran: **${sub.currentSong.title}**`)],
    });
  },
};
