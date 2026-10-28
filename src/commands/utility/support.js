import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('support')
    .setDescription('Mendapatkan link ke server bantuan dan dokumentasi resmi.'),
  category: 'Utility',
  async execute(interaction) {
    const embed = AppEmbed.info(
      'Server Bantuan & Dukungan Komunitas',
      'Jika Anda memerlukan bantuan konfigurasi atau ingin melaporkan bug, silakan hubungi tim administrator atau kunjungi dashboard kami.'
    );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
