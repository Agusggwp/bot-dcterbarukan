import { SlashCommandBuilder } from 'discord.js';
import { guildRepository } from '../../repositories/guildRepository.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('report')
    .setDescription('Melaporkan masalah teknis atau pelanggaran pengguna ke staf.')
    .addStringOption((opt) =>
      opt.setName('laporan').setDescription('Jelaskan detail laporan Anda secara rinci').setRequired(true)
    ),
  category: 'Utility',
  cooldown: 30,
  async execute(interaction) {
    const reportText = interaction.options.getString('laporan');
    const config = await guildRepository.getGuildConfig(interaction.guild.id);

    if (config.modLogChannelId) {
      const channel = await interaction.guild.channels.fetch(config.modLogChannelId).catch(() => null);
      if (channel && channel.isTextBased()) {
        const staffEmbed = AppEmbed.warning(
          'Laporan Pengguna Baru',
          `**Pelapor:** <@${interaction.user.id}> (${interaction.user.tag})\n` +
          `**Saluran:** <#${interaction.channel.id}>\n\n` +
          `**Isi Laporan:**\n${reportText}`
        );
        await channel.send({ embeds: [staffEmbed] }).catch(() => null);
      }
    }

    const replyEmbed = AppEmbed.success(
      'Laporan Diterima',
      'Terima kasih! Laporan Anda telah diteruskan secara rahasia kepada staf server untuk ditinjau.'
    );

    await interaction.reply({ embeds: [replyEmbed], ephemeral: true });
  },
};
