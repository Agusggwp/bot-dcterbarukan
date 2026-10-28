import { SlashCommandBuilder } from 'discord.js';
import { musicService } from '../../services/musicService.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('stop')
    .setDescription('Menghentikan pemutaran musik, mengosongkan antrean, dan keluar dari saluran suara.'),
  category: 'Music',
  async execute(interaction) {
    const sub = musicService.getSubscription(interaction.guild.id);
    if (!sub) {
      return await interaction.reply({
        embeds: [AppEmbed.warning('Tidak Ada Musik', 'Bot saat ini tidak sedang memutar musik di saluran suara.')],
        ephemeral: true,
      });
    }

    sub.stop();

    await interaction.reply({
      embeds: [AppEmbed.success('⏹️ Musik Dihentikan', 'Pemutaran musik telah dihentikan dan bot telah keluar dari saluran suara.')],
    });
  },
};
