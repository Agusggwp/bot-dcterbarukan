import { SlashCommandBuilder } from 'discord.js';
import { AppEmbed } from '../../utils/embedBuilder.js';
import { formatSecondsToHuman } from '../../utils/timeParser.js';

export default {
  data: new SlashCommandBuilder()
    .setName('uptime')
    .setDescription('Menampilkan lama waktu bot aktif berjalan tanpa henti.'),
  category: 'Utility',
  async execute(interaction) {
    const uptimeSec = Math.floor(process.uptime());
    const startedAt = new Date(Date.now() - uptimeSec * 1000);

    const embed = AppEmbed.success(
      'Waktu Aktif Bot (Uptime)',
      `Bot telah aktif selama **${formatSecondsToHuman(uptimeSec)}**.\n\nMulai beroperasi: <t:${Math.floor(startedAt.getTime() / 1000)}:F>`
    );

    await interaction.reply({ embeds: [embed] });
  },
};
