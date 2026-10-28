import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('pause')
    .setDescription('Menjeda lagu yang sedang diputar.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub || !sub.currentSong) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Tidak Ada Musik', 'Saat ini tidak ada musik yang sedang diputar.')],
        ephemeral: true,
      });
    }

    sub.pause();
    await interaction.reply({
      embeds: [AppEmbed.info('⏸️ Musik Dijeda', `Pemutaran lagu **${sub.currentSong.title}** dijeda. Gunakan \`/resume\` untuk melanjutkan.`)],
    });
  },
};
