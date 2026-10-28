import { SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';

export default {
  data: new SlashCommandBuilder()
    .setName('slowmode')
    .setDescription('Mengatur jeda waktu pengiriman pesan (slowmode) pada saluran ini.')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .addIntegerOption((opt) =>
      opt
        .setName('detik')
        .setDescription('Durasi jeda dalam detik (0 untuk mematikan, maks 21600 / 6 jam)')
        .setMinValue(0)
        .setMaxValue(21600)
        .setRequired(true)
    ),
  category: 'Moderation',
  async execute(interaction) {
    const seconds = interaction.options.getInteger('detik');

    await interaction.channel.setRateLimitPerUser(seconds);

    const embed = seconds === 0
      ? AppEmbed.success('Slowmode Dimatikan', 'Anggota kini dapat mengirim pesan tanpa jeda waktu.')
      : AppEmbed.warning('Slowmode Diaktifkan', `Jeda waktu pengiriman pesan diatur menjadi **${seconds} detik**.`);

    await interaction.reply({ embeds: [embed] });
  },
};
